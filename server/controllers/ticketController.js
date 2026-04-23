const asyncHandler = require('express-async-handler');
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
    category: category || 'general',
    priority: priority || 'medium',
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: ticket });
});

const getTickets = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'student' ? { createdBy: req.user._id } : {};
  const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: tickets });
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
    Ticket.countDocuments({ status: 'open' }),
    Ticket.countDocuments({ status: 'in_progress' }),
    Ticket.countDocuments({ status: 'resolved' }),
    Ticket.countDocuments({ status: 'closed' }),
    Ticket.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: { total, open, inProgress, resolved, closed },
  });
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  ticket.attachments.push({
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
  });

  await ticket.save();
  res.json({ success: true, data: ticket });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addComment,
  deleteTicket,
  getTicketStats,
  uploadAttachment,
};