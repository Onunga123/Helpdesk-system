const express = require("express");
const router = express.Router();
const { protectApplicantOrStaff } = require("../middleware/authMiddleware");
const resumeUpload = require("../middleware/resumeUploadMiddleware");
const {
  uploadResume,
  deleteResume,
  downloadResume,
} = require("../controllers/resumeUploadController");

router.post("/:applicantId", protectApplicantOrStaff, resumeUpload.single("resume"), uploadResume);
router.delete("/:applicantId", protectApplicantOrStaff, deleteResume);
router.get("/:applicantId/download", protectApplicantOrStaff, downloadResume);

module.exports = router;
