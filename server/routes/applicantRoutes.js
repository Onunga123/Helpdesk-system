const express = require("express");
const router = express.Router();
const { protect, protectApplicantOrStaff, authorize } = require("../middleware/authMiddleware");
const { handleApplicantDocumentUpload } = require("../middleware/applicantDocumentMiddleware");
const {
  createApplicant,
  loginApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  getApplicantStats,
  searchApplicants,
} = require("../controllers/applicantController");
const {
  getMyApplicantProfile,
  updateMyApplicantProfile,
  uploadApplicantDocument,
  deleteApplicantDocument,
} = require("../controllers/applicantProfileController");

router.post("/login", loginApplicant);
router.post("/", createApplicant);

router.get("/me", protectApplicantOrStaff, getMyApplicantProfile);
router.put("/me", protectApplicantOrStaff, updateMyApplicantProfile);
router.post(
  "/me/documents",
  protectApplicantOrStaff,
  handleApplicantDocumentUpload,
  uploadApplicantDocument
);
router.delete("/me/documents/:documentType", protectApplicantOrStaff, deleteApplicantDocument);

router.get("/", protect, authorize("admin", "hr_officer"), getApplicants);
router.get("/stats", protect, authorize("admin", "hr_officer"), getApplicantStats);
router.get("/search", protect, authorize("admin", "hr_officer"), searchApplicants);
router.get("/:id", protect, getApplicantById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateApplicant);
router.delete("/:id", protect, authorize("admin"), deleteApplicant);

module.exports = router;
