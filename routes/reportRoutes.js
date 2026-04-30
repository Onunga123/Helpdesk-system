const express = require('express');
const router = express.Router();
const {
  getTicketReport,
  getPerformanceReport,
  getAssetReport,
  getUserReport,
  getDashboardOverview,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public test route for production reachability checks
router.get('/test', (req, res) => {
  res.json({ message: 'reports route is working' });
});

// All report routes require login
router.use(protect);

// Dashboard overview — admin and ict_officer
router.get(
  '/dashboard',
  authorize('admin', 'ict_officer'),
  getDashboardOverview
);

// Ticket report — admin and ict_officer
router.get(
  '/tickets',
  authorize('admin', 'ict_officer'),
  getTicketReport
);

// Officer performance — admin only
router.get(
  '/performance',
  authorize('admin'),
  getPerformanceReport
);

// Asset report — admin and ict_officer
router.get(
  '/assets',
  authorize('admin', 'ict_officer'),
  getAssetReport
);

// User report — admin only
router.get(
  '/users',
  authorize('admin'),
  getUserReport
);

module.exports = router;