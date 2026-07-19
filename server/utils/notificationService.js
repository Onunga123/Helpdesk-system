const sendEmail = require('./sendEmail');
const {
  ticketCreatedTemplate,
  ticketStatusUpdatedTemplate,
  ticketAssignedTemplate,
  ticketCommentTemplate,
  accountCreatedTemplate,
  welcomeRegistrationTemplate,
  newTicketStaffTemplate,
} = require('./emailTemplates');

const canEmailUser = (user, category = 'update') => {
  if (!user?.email) return false;
  const prefs = user.notificationPreferences || {};
  if (prefs.emailNotifications === false) return false;
  if (category === 'assignment' && prefs.ticketAssignmentNotifications === false) return false;
  if (category === 'update' && prefs.ticketUpdates === false) return false;
  return true;
};

const dispatchEmail = async ({ to, subject, template }) => {
  const { html, text } = template;
  return sendEmail({ to, subject, html, text });
};

const notifyTicketCreated = async (ticket, user) => {
  console.log('notifyTicketCreated called with user email:', user?.email);
  if (!canEmailUser(user, 'update')) {
    console.log('[Email] Skipped notifyTicketCreated — user email notifications disabled or no email');
    return;
  }

  await dispatchEmail({
    to: user.email,
    subject: `Ticket Received: ${ticket.ticketNumber} - ${ticket.title}`,
    template: ticketCreatedTemplate({
      name: user.name,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status || 'Open',
      submittedAt: ticket.createdAt || new Date(),
      ticketId: ticket._id,
    }),
  });

  const staffInbox = process.env.ICT_NOTIFY_EMAIL;
  if (staffInbox) {
    await dispatchEmail({
      to: staffInbox,
      subject: `New Ticket: ${ticket.ticketNumber} - ${ticket.title}`,
      template: newTicketStaffTemplate({
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        submittedBy: user.name,
        department: user.department,
        ticketId: ticket._id,
      }),
    });
  }
};

const notifyTicketStatusUpdated = async (ticket, user, { updatedBy, resolutionNote } = {}) => {
  if (!canEmailUser(user, 'update')) return;

  await dispatchEmail({
    to: user.email,
    subject: `Ticket ${ticket.ticketNumber} Status Updated to: ${ticket.status}`,
    template: ticketStatusUpdatedTemplate({
      name: user.name,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
      resolutionNote: resolutionNote ?? ticket.resolutionNote,
      updatedBy: updatedBy?.name || updatedBy,
      updatedAt: new Date(),
      ticketId: ticket._id,
    }),
  });
};

const notifyTicketAssigned = async (ticket, officer, submittedByUser) => {
  if (!canEmailUser(officer, 'assignment')) return;

  await dispatchEmail({
    to: officer.email,
    subject: `New Ticket Assigned: ${ticket.ticketNumber}`,
    template: ticketAssignedTemplate({
      officerName: officer.name,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      submittedBy: submittedByUser.name,
      department: submittedByUser.department,
      priority: ticket.priority,
      ticketId: ticket._id,
    }),
  });
};

const notifyNewComment = async (ticket, recipient, comment, commentBy) => {
  if (!recipient?._id || !commentBy?._id) return;
  if (recipient._id.toString() === commentBy._id.toString()) return;
  if (!canEmailUser(recipient, 'update')) return;

  await dispatchEmail({
    to: recipient.email,
    subject: `New Update on Ticket ${ticket.ticketNumber}`,
    template: ticketCommentTemplate({
      name: recipient.name,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      commentBy: commentBy.name,
      comment,
      ticketId: ticket._id,
    }),
  });
};

const notifyCommentParticipants = async (ticket, comment, commentBy) => {
  const User = require('../models/userModel');
  const recipientIds = new Set();

  if (ticket.createdBy) recipientIds.add(ticket.createdBy.toString());
  if (ticket.assignedTo) recipientIds.add(ticket.assignedTo.toString());
  recipientIds.delete(commentBy._id.toString());

  if (!recipientIds.size) return;

  const recipients = await User.find({ _id: { $in: [...recipientIds] } }).select(
    'name email notificationPreferences'
  );

  await Promise.all(
    recipients.map((recipient) => notifyNewComment(ticket, recipient, comment, commentBy))
  );
};

const notifyAccountCreated = async (user, createdBy) => {
  if (!canEmailUser(user, 'update')) return;

  await dispatchEmail({
    to: user.email,
    subject: 'Your TUC ICT Help Desk Account Has Been Created',
    template: accountCreatedTemplate({
      name: user.name,
      email: user.email,
      role: user.role,
      createdBy: createdBy?.name,
    }),
  });
};

const notifyWelcomeRegistration = async (user) => {
  if (!canEmailUser(user, 'update')) return;

  await dispatchEmail({
    to: user.email,
    subject: 'Welcome to TUC ICT Help Desk',
    template: welcomeRegistrationTemplate({
      name: user.name,
      email: user.email,
    }),
  });
};

/** Fire-and-forget wrapper — never blocks or throws to callers. */
const queueNotification = (promiseFactory) => {
  Promise.resolve()
    .then(promiseFactory)
    .catch((err) => console.error('[Email] Notification error:', err.message));
};

module.exports = {
  notifyTicketCreated,
  notifyTicketStatusUpdated,
  notifyTicketAssigned,
  notifyNewComment,
  notifyCommentParticipants,
  notifyAccountCreated,
  notifyWelcomeRegistration,
  queueNotification,
};
