const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const resumeUpload = require("../middleware/resumeUploadMiddleware");
const {
  uploadResume,
  deleteResume,
  downloadResume,
} = require("../controllers/resumeUploadController");

router.post("/:applicantId", protect, resumeUpload.single("resume"), uploadResume);
router.delete("/:applicantId", protect, deleteResume);
router.get("/:applicantId/download", protect, downloadResume);

module.exports = router;
