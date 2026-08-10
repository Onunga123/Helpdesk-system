const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createJobPosting,
  getJobPostings,
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
  publishJobPosting,
  closeJobPosting,
} = require("../controllers/jobPostingController");

router.post("/", protect, authorize("admin", "hr_officer"), createJobPosting);
router.get("/", getJobPostings);
router.get("/:id", getJobPostingById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateJobPosting);
router.delete("/:id", protect, authorize("admin"), deleteJobPosting);
router.put("/:id/publish", protect, authorize("admin", "hr_officer"), publishJobPosting);
router.put("/:id/close", protect, authorize("admin", "hr_officer"), closeJobPosting);

module.exports = router;
