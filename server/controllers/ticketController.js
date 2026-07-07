const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Ticket = require('../models/ticketModel');

const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  const ticket = await Ticket.create({
    title,
    description,
    category: category || 'Other',
    priority: priority || 'Medium',
    createdBy: req.user._id,
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

  const fields = ['title', 'description', 'category', 'priority', 'status', 'assignedTo'];
  for (const key of fields) {
    if (req.body[key] !== undefined) ticket[key] = req.body[key];
  }

  const updated = await ticket.save();
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