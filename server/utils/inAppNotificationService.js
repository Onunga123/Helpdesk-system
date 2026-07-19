const Notification = require('../models/notificationModel');

const createInAppNotification = async ({ userId, type, title, message, link, metadata }) => {
  if (!userId) return null;

  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link: link || '',
    metadata: metadata || {},
  });

  console.log('[InApp] Notification created:', {
    userId: userId.toString(),
    type,
    title,
    id: notification._id.toString(),
  });

  return notification;
};

const notifyTicketCreatedInApp = async (ticket, user) => {
  return createInAppNotification({
    userId: user._id,
    type: 'ticket_created',
    title: 'Ticket Submitted',
    message: `Your ticket ${ticket.ticketNumber} was submitted successfully.`,
    link: `/tickets/${ticket._id}`,
    metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
  });
};

const notifyTicketStatusInApp = async (ticket, userId) => {
  return createInAppNotification({
    userId,
    type: 'ticket_updated',
    title: 'Ticket Status Updated',
    message: `Ticket ${ticket.ticketNumber} is now "${ticket.status}".`,
    link: `/tickets/${ticket._id}`,
    metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
  });
};

const notifyTicketAssignedInApp = async (ticket, officerId) => {
  return createInAppNotification({
    userId: officerId,
    type: 'ticket_assigned',
    title: 'Ticket Assigned',
    message: `Ticket ${ticket.ticketNumber} has been assigned to you.`,
    link: `/tickets/${ticket._id}`,
    metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
  });
};

const notifyCommentInApp = async (ticket, userId, commentByName) => {
  return createInAppNotification({
    userId,
    type: 'ticket_comment',
    title: 'New Ticket Comment',
    message: `${commentByName} commented on ticket ${ticket.ticketNumber}.`,
    link: `/tickets/${ticket._id}`,
    metadata: { ticketId: ticket._id, ticketNumber: ticket.ticketNumber },
  });
};

module.exports = {
  createInAppNotification,
  notifyTicketCreatedInApp,
  notifyTicketStatusInApp,
  notifyTicketAssignedInApp,
  notifyCommentInApp,
};
