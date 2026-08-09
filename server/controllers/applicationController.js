const asyncHandler = require("express-async-handler");
const Application = require("../models/applicationModel");
const JobPosting = require("../models/jobPostingModel");

const submitApplication = asyncHandler(async (req, res) => {
  const { jobId, applicantId, coverLetter } = req.body;

  if (!jobId || !applicantId) {
    res.status(400);
    throw new Error("jobId and applicantId are required");
  }

  const jobPosting = await JobPosting.findById(jobId);
  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  const existingApplication = await Application.findOne({ jobId, applicantId });
  if (existingApplication) {
    res.status(400);
    throw new Error("Applicant has already applied for this job");
  }

  const application = await Application.create({
    jobId,
    applicantId,
    coverLetter,
  });

  await JobPosting.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

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
    .populate("jobId", "jobTitle department description salary")
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

  const applications = await Application.find({ applicantId })
    .populate("jobId", "jobTitle department salary")
    .sort({ applicationDate: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByJob,
  getApplicationsByApplicant,
};
