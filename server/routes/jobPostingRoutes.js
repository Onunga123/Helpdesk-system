const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createJobPosting,
  getJobPostings,
  getJobPostingStats,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  publishJobPosting,
  closeJobPosting,
  reopenJobPosting,
} = require("../controllers/jobPostingController");

router.post("/", protect, authorize("admin", "hr_officer"), createJobPosting);
router.get("/stats", protect, authorize("admin", "hr_officer"), getJobPostingStats);
router.get("/", getJobPostings);
router.get("/:id", getJobPostingById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateJobPosting);
router.delete("/:id", protect, authorize("admin"), deleteJobPosting);
router.put("/:id/publish", protect, authorize("admin", "hr_officer"), publishJobPosting);
router.put("/:id/close", protect, authorize("admin", "hr_officer"), closeJobPosting);
router.put("/:id/reopen", protect, authorize("admin", "hr_officer"), reopenJobPosting);

module.exports = router;
