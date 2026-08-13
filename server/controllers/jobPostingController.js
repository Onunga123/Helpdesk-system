const asyncHandler = require("express-async-handler");
const JobPosting = require("../models/jobPostingModel");
const { notifyJobPosted } = require("../utils/recruitmentNotificationService");
const { enrichJobPostingsWithMetrics } = require("../utils/jobPostingMetrics");

const buildJobQuery = (queryParams) => {
  const { status, department, jobType, search, deadlineFilter } = queryParams;
  const query = {};

  if (status) query.status = status;
  if (jobType) query.jobType = jobType;
  if (department) query.department = { $regex: department, $options: "i" };

  if (search) {
    query.$or = [
      { jobTitle: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (deadlineFilter) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in7Days = new Date(startOfToday);
    in7Days.setDate(in7Days.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    if (deadlineFilter === "active") {
      query.deadline = { $gte: startOfToday };
    } else if (deadlineFilter === "expired") {
      query.deadline = { $lt: startOfToday };
    } else if (deadlineFilter === "closing_soon") {
      query.deadline = { $gte: startOfToday, $lte: in7Days };
    }
  }

  return query;
};

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
  const query = buildJobQuery(req.query);
  const includeMetrics = req.query.metrics === "true";

  const jobPostings = await JobPosting.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  const data = includeMetrics
    ? await enrichJobPostingsWithMetrics(jobPostings)
    : jobPostings;

  res.json({ success: true, count: data.length, data });
});

const getJobPostingStats = asyncHandler(async (req, res) => {
  const [total, published, drafts, closed, departments] = await Promise.all([
    JobPosting.countDocuments(),
    JobPosting.countDocuments({ status: "Published" }),
    JobPosting.countDocuments({ status: "Draft" }),
    JobPosting.countDocuments({ status: "Closed" }),
    JobPosting.distinct("department"),
  ]);

  res.json({
    success: true,
    data: {
      total,
      published,
      drafts,
      closed,
      departments: departments.filter(Boolean).sort((a, b) => a.localeCompare(b)),
    },
  });
});

const getJobPostingById = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id).populate("createdBy", "name email");

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  const includeMetrics = req.query.metrics === "true";
  const data = includeMetrics
    ? (await enrichJobPostingsWithMetrics([jobPosting]))[0]
    : jobPosting;

  res.json({ success: true, data });
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

const reopenJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findById(req.params.id);

  if (!jobPosting) {
    res.status(404);
    throw new Error("Job posting not found");
  }

  if (jobPosting.status !== "Closed") {
    res.status(400);
    throw new Error("Only closed job postings can be reopened");
  }

  jobPosting.status = "Published";
  const updated = await jobPosting.save();

  res.json({ success: true, message: "Job posting reopened", data: updated });
});

module.exports = {
  createJobPosting,
  getJobPostings,
  getJobPostingStats,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  publishJobPosting,
  closeJobPosting,
  reopenJobPosting,
};
