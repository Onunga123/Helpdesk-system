const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    resumePath: { type: String, default: '' },
    yearsOfExperience: {
      type: Number,
      required: true,
    },
    educationLevel: {
      type: String,
      enum: ["High School", "Diploma", "Bachelor", "Master", "PhD"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Shortlisted", "Rejected", "Offered", "Hired"],
      default: "Active",
    },
    appliedJobs: [
      {
        jobId: mongoose.Schema.Types.ObjectId,
        appliedDate: Date,
        status: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Applicant", applicantSchema);

