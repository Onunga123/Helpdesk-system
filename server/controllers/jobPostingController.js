const asyncHandler = require("express-async-handler");
const JobPosting = require("../models/jobPostingModel");
const { notifyJobPosted } = require("../utils/recruitmentNotificationService");


const createJobPosting = asyncHandler(async (req, res) => {
  const { jobTitle, department, description, requirements, salary, jobType, deadline } = req.body;

  if (!jobTitle || !department || !description || !requirements || !jobType || !deadline) {
    res.status(400);
    throw new Error("All required fields must be provided");
  }

  const jobPosting = await JobPosting.create({
    jobTitle,
    department,
    description,
    requirements,
    salary,
    jobType,
    deadline,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: jobPosting });
});

const getJobPostings = asyncHandler(async (req, res) => {
  const { status, department, jobType } = req.query;
  const query = {};

  if (status) query.status = status;
  if (department) query.department = department;
  if (jobType) query.jobType = jobType;

  const jobPostings = await JobPosting.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: jobPostings.length, data: jobPostings });
});

const getJobPostingById = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id).populate("createdBy", "name email");

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  res.json({ success: true, data: jobPosting });
});

const updateJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id);

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  const { jobTitle, department, description, requirements, salary, jobType, deadline } = req.body;

  if (jobTitle) jobPosting.jobTitle = jobTitle;
  if (department) jobPosting.department = department;
  if (description) jobPosting.description = description;
  if (requirements) jobPosting.requirements = requirements;
  if (salary) jobPosting.salary = salary;
  if (jobType) jobPosting.jobType = jobType;
  if (deadline) jobPosting.deadline = deadline;

  const updated = await jobPosting.save();
  res.json({ success: true, data: updated });
});

const deleteJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id);

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  await JobPosting.deleteOne({ _id: req.params.id });
  res.json({ success: true, message: "Job posting deleted" });
});

const publishJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id);

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  jobPosting.status = "Published";
  const updated = await jobPosting.save();

  try {
    await notifyJobPosted(updated.jobTitle, updated._id, "admin@tuc.ac.ke");
  } catch (err) {
    console.error("Notification error:", err.message);
  }

  res.json({ success: true, message: "Job posting published", data: updated });
});

const closeJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id);

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  jobPosting.status = "Closed";
  const updated = await jobPosting.save();

  res.json({ success: true, message: "Job posting closed", data: updated });
});

module.exports = {
  createJobPosting,
  getJobPostings,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  publishJobPosting,
  closeJobPosting,
};




