const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByJob,
  getApplicationsByApplicant,
} = require("../controllers/applicationController");

router.post("/", protect, submitApplication);
router.get("/", protect, authorize("admin", "hr_officer"), getApplications);
router.get("/:id", protect, getApplicationById);
router.put("/:id/status", protect, authorize("admin", "hr_officer"), updateApplicationStatus);
router.get("/job/:jobId", protect, authorize("admin", "hr_officer"), getApplicationsByJob);
router.get("/applicant/:applicantId", protect, getApplicationsByApplicant);

module.exports = router;
