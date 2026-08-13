const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    interviewDate: {
      type: Date,
      required: true,
    },
    interviewTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      enum: ["Physical", "Online"],
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["Phone", "In-Person", "Video"],
      required: true,
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interviewNotes: {
      type: String,
    },
    recommendation: {
      type: String,
      enum: ["Proceed", "Reject", "On Hold"],
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    meetingLink: {
      type: String,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
