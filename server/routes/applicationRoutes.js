const express = require("express");
const router = express.Router();
const { protect, authorize, protectApplicantOrStaff } = require("../middleware/authMiddleware");
const {
  submitApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  getApplicationsByJob,
  getApplicationsByApplicant,
  getJobApplicationForm,
} = require("../controllers/applicationController");

router.post(
  "/",
  (req, res, next) => {
    console.log("[Application] POST /api/recruitment/applications received", {
      jobId: req.body?.jobId,
      applicantId: req.body?.applicantId,
      hasAuthHeader: Boolean(req.headers.authorization),
    });
    next();
  },
  protectApplicantOrStaff,
  submitApplication
);
router.get("/form/job/:jobId", protectApplicantOrStaff, getJobApplicationForm);
router.get("/", protect, authorize("admin", "hr_officer"), getApplications);
router.get("/:id", protect, getApplicationById);
router.put("/:id/status", protect, authorize("admin", "hr_officer"), updateApplicationStatus);
router.get("/job/:jobId", protect, authorize("admin", "hr_officer"), getApplicationsByJob);
router.get("/applicant/:applicantId", protectApplicantOrStaff, getApplicationsByApplicant);

module.exports = router;
