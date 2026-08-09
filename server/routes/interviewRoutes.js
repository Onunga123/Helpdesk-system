const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  completeInterview,
  cancelInterview,
  getInterviewsByApplicant,
} = require("../controllers/interviewController");

router.post("/", protect, authorize("admin", "hr_officer"), scheduleInterview);
router.get("/", protect, authorize("admin", "hr_officer"), getInterviews);
router.get("/:id", protect, authorize("admin", "hr_officer"), getInterviewById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateInterview);
router.put("/:id/complete", protect, authorize("admin", "hr_officer"), completeInterview);
router.put("/:id/cancel", protect, authorize("admin", "hr_officer"), cancelInterview);
router.get("/applicant/:applicationId", protect, authorize("admin", "hr_officer"), getInterviewsByApplicant);

module.exports = router;
