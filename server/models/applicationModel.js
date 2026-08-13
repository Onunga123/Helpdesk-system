const mongoose = require("mongoose");

const applicationQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const consentSchema = new mongoose.Schema(
  {
    privacyConsent: { type: Boolean, default: false },
    accuracyDeclaration: { type: Boolean, default: false },
    verificationAuthorization: { type: Boolean, default: false },
    consentedAt: { type: Date },
  },
  { _id: false }
);

const profileSnapshotSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    yearsOfExperience: Number,
    educationLevel: String,
    personalDetails: mongoose.Schema.Types.Mixed,
    professionalProfile: mongoose.Schema.Types.Mixed,
    education: [mongoose.Schema.Types.Mixed],
    workExperience: [mongoose.Schema.Types.Mixed],
  },
  { _id: false }
);

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
      default: "",
    },
    coverLetterPath: {
      type: String,
      default: "",
    },
    cvPath: {
      type: String,
      default: "",
    },
    applicationQuestions: {
      type: [applicationQuestionSchema],
      default: [],
    },
    consent: {
      type: consentSchema,
      default: () => ({}),
    },
    profileSnapshot: {
      type: profileSnapshotSchema,
      default: () => ({}),
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
