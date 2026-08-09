const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createOffer,
  getOffers,
  getOfferById,
  respondToOffer,
  updateOffer,
  getOffersByApplicant,
  expireOffer,
} = require("../controllers/offerController");

router.post("/", protect, authorize("admin", "hr_officer"), createOffer);
router.get("/", protect, authorize("admin", "hr_officer"), getOffers);
router.get("/:id", protect, getOfferById);
router.put("/:id", protect, authorize("admin", "hr_officer"), updateOffer);
router.put("/:id/respond", protect, respondToOffer);
router.put("/:id/expire", protect, authorize("admin", "hr_officer"), expireOffer);
router.get("/applicant/:applicationId", protect, authorize("admin", "hr_officer"), getOffersByApplicant);

module.exports = router;
