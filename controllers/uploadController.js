const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');

const uploadTicketAttachments = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (ticket.status === 'Closed') {
    res.status(400);
    throw new Error('Cannot upload files to a closed ticket');
  }

  const submittedById =
    ticket.submittedBy?._id?.toString?.() || ticket.submittedBy?.toString?.();
  const createdById =
    ticket.createdBy?._id?.toString?.() || ticket.createdBy?.toString?.();
  const userId = req.user?._id?.toString?.();
  const isOwner = !!userId && (submittedById === userId || createdById === userId);
  const isStaff = ['admin', 'ict_officer'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error('Not authorized to upload files to this ticket');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files were uploaded. Please select at least one file.');
  }

  const attachments = req.files.map((file) => ({
    filename: file.originalname,
    path: `/uploads/tickets/${file.filename}`,
    uploadedBy: req.user._id,
  }));

  ticket.attachments.push(...attachments);
  await ticket.save();

  res.status(201).json({
    success: true,
    message: `${attachments.length} file(s) uploaded successfully`,
    data: attachments,
  });
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image was uploaded');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.profileImage) {
    const oldImagePath = path.join(
      __dirname,
      '..',
      user.profileImage.replace('/uploads/', 'uploads/')
    );
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  }

  const imagePath = `/uploads/avatars/${req.file.filename}`;
  user.profileImage = imagePath;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Profile image uploaded successfully',
    data: { profileImage: imagePath },
  });
});

const deleteTicketAttachment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId);

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const attachment = ticket.attachments.id(req.params.attachmentId);

  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  const submittedById =
    ticket.submittedBy?._id?.toString?.() || ticket.submittedBy?.toString?.();
  const createdById =
    ticket.createdBy?._id?.toString?.() || ticket.createdBy?.toString?.();
  const userId = req.user?._id?.toString?.();
  const isOwner = !!userId && (submittedById === userId || createdById === userId);
  const isPrivileged = ['admin', 'ict_officer'].includes(req.user.role);

  if (!isOwner && !isPrivileged) {
    res.status(403);
    throw new Error('Not authorized to delete this attachment');
  }

  const filePath = path.join(
    __dirname,
    '..',
    (attachment.filePath || attachment.path || '').replace('/uploads/', 'uploads/')
  );
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  ticket.attachments.pull(req.params.attachmentId);
  await ticket.save();

  res.json({
    success: true,
    message: 'Attachment deleted successfully',
  });
});

module.exports = {
  uploadTicketAttachments,
  uploadProfileImage,
  deleteTicketAttachment,
};
