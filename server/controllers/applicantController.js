const asyncHandler = require("express-async-handler");
const Applicant = require("../models/applicantModel");
const generateToken = require("../utils/generateToken");

const createApplicant = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, yearsOfExperience, educationLevel } = req.body;

  if (!firstName || !lastName || !email || !phone || yearsOfExperience === undefined || !educationLevel) {
    res.status(400);
    throw new Error("All required fields must be provided");
  }

  const existingApplicant = await Applicant.findOne({ email });
  if (existingApplicant) {
    res.status(400);
    throw new Error("Applicant with this email already exists");
  }

  const applicant = await Applicant.create({
    firstName,
    lastName,
    email,
    phone,
    yearsOfExperience,
    educationLevel,
    resumePath: "",
  });

  res.status(201).json({ success: true, data: applicant, applicantId: applicant._id });
});

const loginApplicant = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const applicant = await Applicant.findOne({ email: email.toLowerCase().trim() });

  if (!applicant) {
    res.status(404);
    throw new Error("No account found with this email. Please register first.");
  }

  res.json({
    success: true,
    token: generateToken(applicant._id, "applicant"),
    applicantId: applicant._id,
  });
});

const getApplicants = asyncHandler(async (req, res) => {
  const { status, educationLevel, search } = req.query;
  const query = {};

  if (status) query.status = status;
  if (educationLevel) query.educationLevel = educationLevel;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const applicants = await Applicant.find(query).sort({ createdAt: -1 });

  res.json({ success: true, count: applicants.length, data: applicants });
});

const getApplicantById = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id).populate("appliedJobs.jobId", "jobTitle department");

  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  res.json({ success: true, data: applicant });
});

const updateApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id);

  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  const { firstName, lastName, phone, yearsOfExperience, educationLevel, status } = req.body;

  if (firstName) applicant.firstName = firstName;
  if (lastName) applicant.lastName = lastName;
  if (phone) applicant.phone = phone;
  if (yearsOfExperience !== undefined) applicant.yearsOfExperience = yearsOfExperience;
  if (educationLevel) applicant.educationLevel = educationLevel;
  if (status) applicant.status = status;

  const updated = await applicant.save();
  res.json({ success: true, data: updated });
});

const deleteApplicant = asyncHandler(async (req, res) => {
  const applicant = await Applicant.findById(req.params.id);

  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  await Applicant.deleteOne({ _id: req.params.id });
  res.json({ success: true, message: "Applicant deleted" });
});

const getApplicantStats = asyncHandler(async (req, res) => {
  const [total, active, shortlisted, rejected, offered, hired] = await Promise.all([
    Applicant.countDocuments(),
    Applicant.countDocuments({ status: "Active" }),
    Applicant.countDocuments({ status: "Shortlisted" }),
    Applicant.countDocuments({ status: "Rejected" }),
    Applicant.countDocuments({ status: "Offered" }),
    Applicant.countDocuments({ status: "Hired" }),
  ]);

  res.json({
    success: true,
    data: { total, active, shortlisted, rejected, offered, hired },
  });
});

const searchApplicants = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error("Search query required");
  }

  const applicants = await Applicant.find({
    $or: [
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ],
  }).limit(20);

  res.json({ success: true, count: applicants.length, data: applicants });
});

module.exports = {
  createApplicant,
  loginApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  getApplicantStats,
  searchApplicants,
};
