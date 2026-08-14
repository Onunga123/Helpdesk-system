const asyncHandler = require("express-async-handler");
const Application = require("../models/applicationModel");
const Applicant = require("../models/applicantModel");
const JobPosting = require("../models/jobPostingModel");
const { toWebPath } = require("../utils/applicantProfileUtils");

const DEFAULT_SCREENING_QUESTIONS = [
  "Why are you interested in this role at Turkana University College?",
  "Are you legally eligible to work in Kenya?",
  "When would you be available to start if selected?",
];

const buildProfileSnapshot = (applicant, profilePayload = {}) => {
  const profile = profilePayload || applicant.profile || {};
  return {
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    email: applicant.email,
    phone: applicant.phone,
    yearsOfExperience: applicant.yearsOfExperience,
    educationLevel: applicant.educationLevel,
    personalDetails: profile.personalDetails || applicant.profile?.personalDetails,
    professionalProfile: profile.professionalProfile || applicant.profile?.professionalProfile,
    education: profile.education || applicant.profile?.education || [],
    workExperience: profile.workExperience || applicant.profile?.workExperience || [],
  };
};

const submitApplication = asyncHandler(async (req, res) => {
  const {
    jobId,
    coverLetter,
    coverLetterPath,
    cvPath,
    applicationQuestions,
    consent,
    profileUpdates,
  } = req.body;

  let applicantId = req.body.applicantId;

  if (req.applicant) {
    applicantId = req.applicant._id;
  }

  if (!jobId || !applicantId) {
    res.status(400);
    throw new Error("jobId and applicantId are required");
  }

  if (req.applicant && String(req.applicant._id) !== String(applicantId)) {
    res.status(403);
    throw new Error("Not authorized to submit for another applicant");
  }

  if (!consent?.privacyConsent || !consent?.accuracyDeclaration || !consent?.verificationAuthorization) {
    res.status(400);
    throw new Error("All consent declarations are required before submitting");
  }

  const jobPosting = await JobPosting.findById(jobId);
  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  if (jobPosting.status !== "Published") {
    res.status(400);
    throw new Error("This job is not accepting applications");
  }

  const existingApplication = await Application.findOne({ jobId, applicantId });
  if (existingApplication) {
    res.status(400);
    throw new Error("You have already applied for this job");
  }

  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (profileUpdates) {
    const {
      firstName,
      lastName,
      email,
      phone,
      yearsOfExperience,
      educationLevel,
      profile,
    } = profileUpdates;

    if (firstName) applicant.firstName = String(firstName).trim();
    if (lastName) applicant.lastName = String(lastName).trim();
    if (phone) applicant.phone = String(phone).trim();
    if (yearsOfExperience !== undefined) applicant.yearsOfExperience = Number(yearsOfExperience) || 0;
    if (educationLevel) applicant.educationLevel = educationLevel;

    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const duplicate = await Applicant.findOne({
        email: normalizedEmail,
        _id: { $ne: applicant._id },
      });
      if (duplicate) {
        res.status(400);
        throw new Error("Another account is already using this email address");
      }
      applicant.email = normalizedEmail;
    }

    if (profile) {
      applicant.profile = {
        ...(applicant.profile?.toObject?.() || applicant.profile || {}),
        ...profile,
        personalDetails: {
          ...(applicant.profile?.personalDetails || {}),
          ...(profile.personalDetails || {}),
          location: {
            ...(applicant.profile?.personalDetails?.location || {}),
            ...(profile.personalDetails?.location || {}),
          },
        },
        professionalProfile: {
          ...(applicant.profile?.professionalProfile || {}),
          ...(profile.professionalProfile || {}),
        },
        education: profile.education ?? applicant.profile?.education,
        workExperience: profile.workExperience ?? applicant.profile?.workExperience,
      };
    }

    await applicant.save();
  }

  const resolvedCvPath =
    toWebPath(cvPath) ||
    toWebPath(applicant.profile?.documents?.cvPath) ||
    toWebPath(applicant.resumePath);

  if (!resolvedCvPath) {
    res.status(400);
    throw new Error("A CV/Resume is required to submit your application");
  }

  const hasCoverLetterText = Boolean(coverLetter?.trim());
  const resolvedCoverLetterPath = toWebPath(coverLetterPath);

  if (!hasCoverLetterText && !resolvedCoverLetterPath) {
    res.status(400);
    throw new Error("Please provide a cover letter by writing one or uploading a document");
  }

  const application = await Application.create({
    jobId,
    applicantId,
    coverLetter: coverLetter?.trim() || "",
    coverLetterPath: resolvedCoverLetterPath,
    cvPath: resolvedCvPath,
    applicationQuestions: Array.isArray(applicationQuestions) ? applicationQuestions : [],
    consent: {
      ...consent,
      consentedAt: new Date(),
    },
    profileSnapshot: buildProfileSnapshot(applicant, profileUpdates?.profile),
  });

  await JobPosting.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

  await Applicant.findByIdAndUpdate(applicantId, {
    $push: {
      appliedJobs: {
        jobId,
        appliedDate: new Date(),
        status: "Submitted",
      },
    },
  });

  res.status(201).json({ success: true, data: application });
});

const getApplications = asyncHandler(async (req, res) => {
  const { jobId, status, applicantId } = req.query;
  const query = {};

  if (jobId) query.jobId = jobId;
  if (status) query.status = status;
  if (applicantId) query.applicantId = applicantId;

  const applications = await Application.find(query)
    .populate("jobId", "jobTitle department")
    .populate("applicantId", "firstName lastName email phone")
    .sort({ applicationDate: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate("jobId", "jobTitle department description salary screeningQuestions")
    .populate("applicantId", "firstName lastName email phone yearsOfExperience educationLevel");

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  res.json({ success: true, data: application });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    res.status(400);
    throw new Error("Status is required");
  }

  const application = await Application.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  application.status = status;
  const updated = await application.save();

  res.json({ success: true, data: updated });
});

const getApplicationsByJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const applications = await Application.find({ jobId })
    .populate("applicantId", "firstName lastName email phone")
    .sort({ applicationDate: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

const getApplicationsByApplicant = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;

  if (req.applicant && String(req.applicant._id) !== String(applicantId)) {
    res.status(403);
    throw new Error("Not authorized to view these applications");
  }

  const applications = await Application.find({ applicantId })
    .populate("jobId", "jobTitle department salary")
    .sort({ applicationDate: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

const getJobApplicationForm = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await JobPosting.findById(jobId);
  if (!job) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  if (job.status !== "Published") {
    res.status(400);
    throw new Error("This job is not accepting applications");
  }

  const questions =
    job.screeningQuestions?.length > 0
      ? job.screeningQuestions.map((item) => ({
          question: item.question,
          required: item.required !== false,
          answer: "",
        }))
      : DEFAULT_SCREENING_QUESTIONS.map((question) => ({
          question,
          required: true,
          answer: "",
        }));

  res.json({
    success: true,
    data: {
      job,
      screeningQuestions: questions,
    },
  });
});

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByJob,
  getApplicationsByApplicant,
  getJobApplicationForm,
};
