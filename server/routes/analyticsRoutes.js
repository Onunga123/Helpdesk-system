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
  getRecruitmentTrends,
  getRecruitmentInsights,
  getAnalyticsFilterOptions,
} = require("../controllers/reportsController");

router.get("/dashboard", protect, authorize("admin", "hr_officer"), getRecruitmentDashboard);
router.get("/jobs", protect, authorize("admin", "hr_officer"), getJobPostingAnalytics);
router.get("/applications", protect, authorize("admin", "hr_officer"), getApplicationMetrics);
router.get("/interviews", protect, authorize("admin", "hr_officer"), getInterviewMetrics);
router.get("/offers", protect, authorize("admin", "hr_officer"), getOfferAnalytics);
router.get("/demographics", protect, authorize("admin", "hr_officer"), getApplicantDemographics);
router.get("/trends", protect, authorize("admin", "hr_officer"), getRecruitmentTrends);
router.get("/insights", protect, authorize("admin", "hr_officer"), getRecruitmentInsights);
router.get("/filters", protect, authorize("admin", "hr_officer"), getAnalyticsFilterOptions);

module.exports = router;
