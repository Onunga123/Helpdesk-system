const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getRecruitmentDashboard,
  getJobPostingAnalytics,
  getApplicationMetrics,
  getInterviewMetrics,
  getOfferAnalytics,
  getApplicantDemographics,
} = require("../controllers/reportsController");

router.get("/dashboard", protect, authorize("admin", "hr_officer"), getRecruitmentDashboard);
router.get("/jobs", protect, authorize("admin", "hr_officer"), getJobPostingAnalytics);
router.get("/applications", protect, authorize("admin", "hr_officer"), getApplicationMetrics);
router.get("/interviews", protect, authorize("admin", "hr_officer"), getInterviewMetrics);
router.get("/offers", protect, authorize("admin", "hr_officer"), getOfferAnalytics);
router.get("/demographics", protect, authorize("admin", "hr_officer"), getApplicantDemographics);

module.exports = router;
