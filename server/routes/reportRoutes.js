const express = require("express");
const router = express.Router();
const { getTicketReport, getPerformanceReport, getAssetReport, getUserReport, getDashboardOverview } = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/dashboard", authorize("admin", "ict_officer"), getDashboardOverview);
router.get("/tickets", authorize("admin", "ict_officer"), getTicketReport);
router.get("/performance", authorize("admin"), getPerformanceReport);
router.get("/assets", authorize("admin", "ict_officer"), getAssetReport);
router.get("/users", authorize("admin"), getUserReport);

module.exports = router;
