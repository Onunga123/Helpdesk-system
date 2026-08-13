const mongoose = require("mongoose");

const jobPostingSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
      required: true,
    },
    salary: {
      min: Number,
      max: Number,
    },
    jobType: {
      type: String,
      enum: ["Academic", "Administrative", "Technical", "Support"],
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Published", "Closed"],
      default: "Draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
    screeningQuestions: [
      {
        question: { type: String, required: true },
        required: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobPosting", jobPostingSchema);
