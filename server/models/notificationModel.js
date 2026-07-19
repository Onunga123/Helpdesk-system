const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ticket_created', 'ticket_updated', 'ticket_assigned', 'ticket_comment'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    metadata: {
      ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
      ticketNumber: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
