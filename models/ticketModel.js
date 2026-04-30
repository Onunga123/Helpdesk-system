const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Network Issue',
        'Hardware Repair',
        'Software Installation',
        'Email Issue',
        'Password Reset',
        'Printer Issue',
        'Computer Maintenance',
        'System Access',
        'Other',
      ],
      default: 'Other',
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [commentSchema],
    attachments: [{
      filename: String,
      path: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
