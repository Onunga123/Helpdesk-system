const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  getApplicantStats,
  searchApplicants,
} = require("../controllers/applicantController");

router.post("/", protect, createApplicant);
router.get("/", protect, authorize("admin", "hr_officer"), getApplicants);
router.get("/stats", protect, authorize("admin", "hr_officer"), getApplicantStats);
router.get("/search", protect, authorize("admin", "hr_officer"), searchApplicants);
router.get("/:id", protect, getApplicantById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateApplicant);
router.delete("/:id", protect, authorize("admin"), deleteApplicant);

module.exports = router;
