const asyncHandler = require("express-async-handler");
const Applicant = require("../models/applicantModel");
const fs = require("fs");
const path = require("path");

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const { applicantId } = req.params;

  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    fs.unlinkSync(req.file.path);
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (applicant.resumePath && fs.existsSync(applicant.resumePath)) {
    fs.unlinkSync(applicant.resumePath);
  }

  applicant.resumePath = req.file.path;
  await applicant.save();

  res.json({
    success: true,
    message: "Resume uploaded successfully",
    data: {
      applicantId: applicant._id,
      resumePath: applicant.resumePath,
      fileName: req.file.originalname,
    },
  });
});

const deleteResume = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;

  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  if (applicant.resumePath && fs.existsSync(applicant.resumePath)) {
    fs.unlinkSync(applicant.resumePath);
    applicant.resumePath = "";
    await applicant.save();
  }

  res.json({ success: true, message: "Resume deleted successfully" });
});

const downloadResume = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;

  const applicant = await Applicant.findById(applicantId);
  if (!applicant || !applicant.resumePath) {
    res.status(404);
    throw new Error("Resume not found");
  }

  if (!fs.existsSync(applicant.resumePath)) {
    res.status(404);
    throw new Error("Resume file not found on server");
  }

  res.download(applicant.resumePath);
});

module.exports = {
  uploadResume,
  deleteResume,
  downloadResume,
};
