const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an article title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide article content'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Network & Wi-Fi',
        'Password & Account',
        'Hardware',
        'Software',
        'Email',
        'Printing',
        'General ICT',
        'Security',
      ],
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['published', 'draft'],
      default: 'draft',
    },
    views: { type: Number, default: 0 },
    helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notHelpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

knowledgeBaseSchema.virtual('helpfulCount').get(function () {
  return this.helpful.length;
});

knowledgeBaseSchema.virtual('notHelpfulCount').get(function () {
  return this.notHelpful.length;
});

knowledgeBaseSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text',
});

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
