const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
  },
  { _id: false }
);

const salarySchema = new mongoose.Schema(
  {
    amount: { type: Number },
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: "KES" },
    period: { type: String, enum: ["hourly", "monthly", "annual"], default: "monthly" },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  qualification: { type: String, default: "" },
  fieldOfStudy: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  grade: { type: String, default: "" },
  currentlyStudying: { type: Boolean, default: false },
});

const workExperienceSchema = new mongoose.Schema({
  employer: { type: String, default: "" },
  jobTitle: { type: String, default: "" },
  employmentType: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Internship", "Temporary", "Volunteer", "Freelance", "Other", ""],
    default: "",
  },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  currentlyWorking: { type: Boolean, default: false },
  responsibilities: { type: String, default: "" },
  achievements: { type: String, default: "" },
});

const skillSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  category: { type: String, enum: ["technical", "professional", ""], default: "technical" },
  proficiency: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert", ""],
    default: "Intermediate",
  },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  issuingOrganization: { type: String, default: "" },
  issueDate: { type: String, default: "" },
  expiryDate: { type: String, default: "" },
  credentialId: { type: String, default: "" },
  certificatePath: { type: String, default: "" },
});

const languageSchema = new mongoose.Schema({
  language: { type: String, default: "" },
  proficiency: {
    type: String,
    enum: ["Basic", "Conversational", "Professional", "Native", ""],
    default: "Conversational",
  },
});

const supportingDocumentSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  path: { type: String, default: "" },
  uploadedAt: { type: Date, default: Date.now },
});

const linkSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  url: { type: String, default: "" },
});

const referenceSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  title: { type: String, default: "" },
  organization: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  relationship: { type: String, default: "" },
  location: { type: String, default: "" },
});

const applicationQuestionSchema = new mongoose.Schema({
  question: { type: String, default: "" },
  answer: { type: String, default: "" },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "JobPosting" },
});

const applicantProfileSchema = new mongoose.Schema(
  {
    personalDetails: {
      location: { type: locationSchema, default: () => ({}) },
      nationality: { type: String, default: "" },
      profilePhoto: { type: String, default: "" },
      alternateEmail: { type: String, default: "" },
      alternatePhone: { type: String, default: "" },
    },
    professionalProfile: {
      currentJobTitle: { type: String, default: "" },
      currentEmployer: { type: String, default: "" },
      professionalSummary: { type: String, default: "" },
      careerLevel: {
        type: String,
        enum: ["Entry", "Junior", "Mid", "Senior", "Lead", "Executive", ""],
        default: "",
      },
      availability: { type: String, default: "" },
      expectedSalary: { type: salarySchema, default: () => ({}) },
      workPreferences: {
        remote: { type: Boolean, default: false },
        hybrid: { type: Boolean, default: false },
        onsite: { type: Boolean, default: true },
      },
    },
    education: { type: [educationSchema], default: [] },
    workExperience: { type: [workExperienceSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    documents: {
      cvPath: { type: String, default: "" },
      coverLetterPath: { type: String, default: "" },
      profilePhoto: { type: String, default: "" },
      supportingDocuments: { type: [supportingDocumentSchema], default: [] },
    },
    links: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      website: { type: String, default: "" },
      portfolio: { type: String, default: "" },
      other: { type: [linkSchema], default: [] },
    },
    references: { type: [referenceSchema], default: [] },
    jobPreferences: {
      desiredRole: { type: String, default: "" },
      preferredLocations: { type: [String], default: [] },
      workArrangement: {
        type: String,
        enum: ["On-site", "Remote", "Hybrid", "Flexible", ""],
        default: "",
      },
      employmentType: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Internship", "Any", ""],
        default: "",
      },
      salaryExpectations: { type: salarySchema, default: () => ({}) },
      willingToRelocate: { type: Boolean, default: false },
      travelAvailability: { type: String, default: "" },
    },
    applicationQuestions: { type: [applicationQuestionSchema], default: [] },
    consent: {
      privacyConsent: { type: Boolean, default: false },
      accuracyDeclaration: { type: Boolean, default: false },
      verificationAuthorization: { type: Boolean, default: false },
      consentedAt: { type: Date },
    },
  },
  { _id: false }
);

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
    resumePath: { type: String, default: "" },
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
    profile: {
      type: applicantProfileSchema,
      default: () => ({}),
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
