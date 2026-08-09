const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPosting",
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Submitted", "Shortlisted", "Rejected", "Selected", "Offered"],
      default: "Submitted",
    },
    interviewNotes: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
