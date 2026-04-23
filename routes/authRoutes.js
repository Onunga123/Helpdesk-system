const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes — no token needed
router.get('/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Use POST /api/auth/register to create an account.',
  });
});
router.post('/register', registerUser);
router.get('/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Use POST /api/auth/login to sign in.',
  });
});
router.post('/login', loginUser);

// Private routes — token required
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;