const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { assertInstitutionalEmail } = require('../utils/institutionalEmail');
const { notifyWelcomeRegistration, queueNotification } = require('../utils/notificationService');

// ─────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  // Check all required fields are provided
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const normalizedEmail = assertInstitutionalEmail(email, res);

  // Check if user already exists with this email
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  // Only student and staff can self-register
// admin and ict_officer must be created by an admin
const allowedPublicRoles = ['student', 'staff'];
const assignedRole = role && allowedPublicRoles.includes(role) ? role : 'student';

const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: assignedRole,
    department: department || '',
    phone: phone || '',
  });

  queueNotification(() => notifyWelcomeRegistration(user));

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        token: generateToken(user._id, user.role, user.tokenVersion),
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// ─────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const normalizedEmail = assertInstitutionalEmail(email, res);

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });
   // Check if account is deactivated BEFORE checking password
   if (user && !user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Please contact the administrator.');
  }


  // Check user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    // Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        token: generateToken(user._id, user.role, user.tokenVersion),
      },
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// ─────────────────────────────────────────────────────────────
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private (requires token)
// ─────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by our protect middleware
  const user = await User.findById(req.user._id).select('-password');
  res.json({
    success: true,
    data: user,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private (requires token)
// ─────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update only the fields that were sent
  user.name = req.body.name || user.name;
  user.department = req.body.department || user.department;
  user.phone = req.body.phone || user.phone;

  // If user wants to change password
  if (req.body.password) {
    user.password = req.body.password; // will be re-hashed by pre-save hook
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.department,
      phone: updatedUser.phone,
      token: generateToken(updatedUser._id, updatedUser.role, updatedUser.tokenVersion),
    },
  });
});

module.exports = { registerUser, loginUser, getMe, updateProfile };