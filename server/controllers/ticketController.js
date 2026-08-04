const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const { generateTicketNumber } = require('../utils/generateTicketNumber');
const {
  notifyTicketCreated,
  notifyTicketStatusUpdated,
  notifyTicketAssigned,
  notifyCommentParticipants,
  notifyStaffNewTicket,
  notifyStaffTicketResolved,
  queueNotification,
} = require('../utils/notificationService');
const {
  createNotification,
  broadcastNotification,
  getAdminAndOfficerIds,
} = require('../services/notificationService');

const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  const ticketNumber = await generateTicketNumber();

  const ticket = await Ticket.create({
    ticketNumber,
    title,
    description,
    category: category || 'Other',
    priority: priority || 'Medium',
    createdBy: req.user._id,
  });

  console.log('[Ticket] Created:', ticket.ticketNumber);

  queueNotification(async () => {
    // In-app: submitter
    await createNotification(
      req.user._id,
      'ticket_created',
      'Your ticket has been created',
      `Ticket ${ticket.ticketNumber} has been successfully created.`,
      ticket._id
    );

    // In-app: all admins & ICT officers
    const staffIds = await getAdminAndOfficerIds(req.user._id);
    await broadcastNotification(
      staffIds,
      'ticket_created',
      'New Ticket Submitted',
      `${ticket.ticketNumber} - ${ticket.title}`,
      ticket._id
    );

    // Email: submitter
    await notifyTicketCreated(ticket, req.user);

    // Email: all admins & ICT officers
    await notifyStaffNewTicket(ticket, req.user);
  });

  res.status(201).json({ success: true, data: ticket });
});

const getTickets = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'student' || req.user.role === 'staff') {
    query.createdBy = req.user._id;
  }

  if (req.user.role === 'ict_officer') {
    const officerId = new mongoose.Types.ObjectId(req.user._id);
    if (req.query.assignedTo === 'me') {
      query.assignedTo = officerId;
    } else {
      query.$or = [{ assignedTo: officerId }, { assignedTo: null }];
    }
  }

  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.category) query.category = req.query.category;

  const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 200);
  const usePagination = page > 0 && limit > 0;

  const baseQuery = Ticket.find(query)
    .select('-comments')
    .populate('createdBy', 'name email department role')
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
    .lean();

  let tickets;
  let total;

  if (usePagination) {
    const skip = (page - 1) * limit;
    [tickets, total] = await Promise.all([
      baseQuery.clone().skip(skip).limit(limit),
      Ticket.countDocuments(query),
    ]);
  } else {
    tickets = await baseQuery;
    total = tickets.length;
  }

  const normalizedTickets = tickets.map((row) => ({
    ...row,
    submittedBy: row.createdBy || null,
  }));

  res.json({
    success: true,
    count: normalizedTickets.length,
    total,
    page: usePagination ? page : 1,
    pages: usePagination ? Math.ceil(total / limit) : 1,
    data: normalizedTickets,
  });
});

const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  res.json({ success: true, data: ticket });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const oldStatus = ticket.status;
  const oldAssignedTo = ticket.assignedTo ? ticket.assignedTo.toString() : null;

  const fields = [
    'title',
    'description',
    'category',
    'priority',
    'status',
    'assignedTo',
    'resolutionNote',
  ];
  for (const key of fields) {
    if (req.body[key] !== undefined) ticket[key] = req.body[key];
  }

  if (req.body.ticketNumber !== undefined && req.body.ticketNumber !== ticket.ticketNumber) {
    res.status(400);
    throw new Error('Ticket number cannot be changed');
  }

  const updated = await ticket.save();

  const statusChanged = oldStatus !== updated.status;
  const becameResolved = statusChanged && updated.status === 'Resolved';
  const newAssignedTo = updated.assignedTo ? updated.assignedTo.toString() : null;
  const assignedChanged = oldAssignedTo !== newAssignedTo;

  queueNotification(async () => {
    if (statusChanged) {
      const owner = await User.findById(updated.createdBy);
      if (owner) {
        if (becameResolved) {
          await createNotification(
            owner._id,
            'resolved',
            'Your ticket has been resolved',
            `Ticket ${updated.ticketNumber} has been resolved.`,
            updated._id
          );

          const staffIds = await getAdminAndOfficerIds();
          await broadcastNotification(
            staffIds,
            'resolved',
            'Ticket Resolved',
            `${updated.ticketNumber} - ${updated.title}`,
            updated._id
          );

          await notifyStaffTicketResolved(updated, owner);
        } else {
          await createNotification(
            owner._id,
            'status_updated',
            'Ticket Status Updated',
            `Ticket ${updated.ticketNumber} is now "${updated.status}".`,
            updated._id
          );
        }

        await notifyTicketStatusUpdated(updated, owner, {
          updatedBy: req.user,
          resolutionNote: req.body.resolutionNote,
        });
      }
    }

    if (assignedChanged && updated.assignedTo) {
      const officer = await User.findById(updated.assignedTo);
      const owner = await User.findById(updated.createdBy);
      if (officer) {
        await createNotification(
          officer._id,
          'assigned',
          'Ticket Assigned',
          `Ticket ${updated.ticketNumber} has been assigned to you.`,
          updated._id
        );
        if (owner) await notifyTicketAssigned(updated, officer, owner);
      }
    }
  });

  res.json({ success: true, data: updated });
});

const addComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!req.body.message) {
    res.status(400);
    throw new Error('Comment message is required');
  }

  ticket.comments.push({ user: req.user._id, message: req.body.message });
  await ticket.save();

  queueNotification(async () => {
    const recipientIds = new Set();
    if (ticket.createdBy) recipientIds.add(ticket.createdBy.toString());
    if (ticket.assignedTo) recipientIds.add(ticket.assignedTo.toString());
    recipientIds.delete(req.user._id.toString());

    await notifyCommentParticipants(ticket, req.body.message, req.user);

    for (const userId of recipientIds) {
      await createNotification(
        userId,
        'commented',
        'New Ticket Comment',
        `${req.user.name} commented on ticket ${ticket.ticketNumber}.`,
        ticket._id
      );
    }
  });

  res.json({ success: true, data: ticket });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  await Ticket.deleteOne({ _id: ticket._id });
  res.json({ success: true, message: 'Ticket deleted' });
});

const getTicketStats = asyncHandler(async (_req, res) => {
  const [open, inProgress, resolved, closed, total] = await Promise.all([
    Ticket.countDocuments({ status: 'Open' }),
    Ticket.countDocuments({ status: 'In Progress' }),
    Ticket.countDocuments({ status: 'Resolved' }),
    Ticket.countDocuments({ status: 'Closed' }),
    Ticket.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: { total, open, inProgress, resolved, closed },
  });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  deleteTicket,
  getTicketStats,
};
