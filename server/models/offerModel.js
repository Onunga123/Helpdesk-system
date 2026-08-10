const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    salaryOffered: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Temporary"],
      required: true,
    },
    terms: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Expired"],
      default: "Pending",
    },
    offerLetterPath: {
      type: String,
    },
    sentDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
    response: {
      type: String,
      enum: ["Accepted", "Rejected"],
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
