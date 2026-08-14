const asyncHandler = require("express-async-handler");
const Applicant = require("../models/applicantModel");
const fs = require("fs");
const path = require("path");
const { toWebPath, getAbsoluteUploadPath } = require("../utils/applicantProfileUtils");

const canAccessApplicant = (req, applicantId) => {
  if (req.applicant) {
    return String(req.applicant._id) === String(applicantId);
  }
  if (req.user && ["admin", "hr_officer"].includes(req.user.role)) {
    return true;
  }
  return false;
};

const removeFileIfExists = (filePath) => {
  const absolute = getAbsoluteUploadPath(filePath) || filePath;
  if (absolute && fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }
};

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const { applicantId } = req.params;

  if (!canAccessApplicant(req, applicantId)) {
    fs.unlinkSync(req.file.path);
    res.status(403);
    throw new Error("Not authorized to upload resume for this applicant");
  }

  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    fs.unlinkSync(req.file.path);
    res.status(404);
    throw new Error("Applicant not found");
  }

  removeFileIfExists(applicant.resumePath);
  if (applicant.profile?.documents?.cvPath) {
    removeFileIfExists(applicant.profile.documents.cvPath);
  }

  const webPath = toWebPath(req.file.path);
  applicant.resumePath = webPath;
  if (!applicant.profile) applicant.profile = {};
  if (!applicant.profile.documents) applicant.profile.documents = {};
  applicant.profile.documents.cvPath = webPath;

  await applicant.save();

  res.json({
    success: true,
    message: "Resume uploaded successfully",
    data: {
      applicantId: applicant._id,
      resumePath: webPath,
      fileName: req.file.originalname,
    },
  });
});

const deleteResume = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;

  if (!canAccessApplicant(req, applicantId)) {
    res.status(403);
    throw new Error("Not authorized to delete resume for this applicant");
  }

  const applicant = await Applicant.findById(applicantId);
  if (!applicant) {
    res.status(404);
    throw new Error("Applicant not found");
  }

  removeFileIfExists(applicant.resumePath);
  if (applicant.profile?.documents?.cvPath) {
    removeFileIfExists(applicant.profile.documents.cvPath);
  }

  applicant.resumePath = "";
  if (applicant.profile?.documents) applicant.profile.documents.cvPath = "";
  await applicant.save();

  res.json({ success: true, message: "Resume deleted successfully" });
});

const downloadResume = asyncHandler(async (req, res) => {
  const { applicantId } = req.params;

  if (!canAccessApplicant(req, applicantId)) {
    res.status(403);
    throw new Error("Not authorized to download resume for this applicant");
  }

  const applicant = await Applicant.findById(applicantId);
  const resumePath = applicant?.profile?.documents?.cvPath || applicant?.resumePath;

  if (!applicant || !resumePath) {
    res.status(404);
    throw new Error("Resume not found");
  }

  const absolutePath = getAbsoluteUploadPath(resumePath) || resumePath;
  if (!fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error("Resume file not found on server");
  }

  res.download(absolutePath);
});

module.exports = {
  uploadResume,
  deleteResume,
  downloadResume,
};
