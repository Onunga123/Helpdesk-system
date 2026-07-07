const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const sanitizeUser = (user, req) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || '',
  phone: user.phone || '',
  staffId: user.staffId || '',
  jobTitle: user.jobTitle || '',
  username: user.username || user.email?.split('@')?.[0] || '',
  profileImage: user.profileImage || '',
  notificationPreferences: user.notificationPreferences || {},
  appearancePreferences: user.appearancePreferences || {},
  themePreference: user.themePreference || user.appearancePreferences?.theme || 'system',
  isActive: user.isActive,
  lastLogin: user.lastLogin || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  activeSession: {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || 'Unknown',
  },
});

// ─────────────────────────────────────────────────────────────
// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
  if (req.query.department) filter.department = req.query.department;

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    data: users,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get a single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Create a new user (by Admin)
// @route   POST /api/users
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  // Validate role before hitting the model for a clean error message
  const validRoles = ['student', 'staff', 'ict_officer', 'admin'];
  if (role && !validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('A user with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    department: department || '',
    phone: phone || '',
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update a user (role, department, active status)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // FIX 3: Prevent admin from changing their own role
  if (
    user._id.toString() === req.user._id.toString() &&
    req.body.role &&
    req.body.role !== req.user.role
  ) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  // FIX 2: Check email uniqueness before updating
  if (req.body.email && req.body.email !== user.email) {
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }
    user.email = req.body.email;
  }

  user.name = req.body.name || user.name;
  user.role = req.body.role || user.role;
  user.department = req.body.department || user.department;
  user.phone = req.body.phone || user.phone;

  // Handle isActive separately (it is a boolean)
  if (typeof req.body.isActive === 'boolean') {
    user.isActive = req.body.isActive;
  }

  // Only update password if provided
  if (req.body.password) {
    user.password = req.body.password; // pre-save hook will hash it
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
      isActive: updatedUser.isActive,
    },
  });
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: sanitizeUser(user, req) });
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, email, phone, department, jobTitle, username } = req.body;
  if (email && email !== user.email) {
    const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (exists) {
      res.status(400);
      throw new Error('A user with this email already exists');
    }
    user.email = String(email).trim().toLowerCase();
  }

  if (name !== undefined) user.name = String(name).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (department !== undefined) user.department = String(department).trim();
  if (jobTitle !== undefined) user.jobTitle = String(jobTitle).trim();
  if (username !== undefined) user.username = String(username).trim();

  const updated = await user.save();
  const safeUser = await User.findById(updated._id).select('-password');
  res.json({ success: true, message: 'Profile updated successfully', data: sanitizeUser(safeUser, req) });
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Current password, new password and confirm password are required');
  }
  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New password and confirm password do not match');
  }
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPassword.test(newPassword)) {
    res.status(400);
    throw new Error('Password must be at least 8 characters and include uppercase, lowercase and a number');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isCurrentValid = await user.matchPassword(currentPassword);
  if (!isCurrentValid) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
});

const updateCurrentUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const nextNotificationPreferences = req.body.notificationPreferences || {};
  const nextAppearancePreferences = req.body.appearancePreferences || {};
  const requestedTheme = req.body.themePreference || nextAppearancePreferences.theme;

  user.notificationPreferences = {
    emailNotifications: nextNotificationPreferences.emailNotifications ?? user.notificationPreferences?.emailNotifications ?? true,
    ticketAssignmentNotifications:
      nextNotificationPreferences.ticketAssignmentNotifications ?? user.notificationPreferences?.ticketAssignmentNotifications ?? true,
    ticketUpdates: nextNotificationPreferences.ticketUpdates ?? user.notificationPreferences?.ticketUpdates ?? true,
    maintenanceAnnouncements:
      nextNotificationPreferences.maintenanceAnnouncements ?? user.notificationPreferences?.maintenanceAnnouncements ?? true,
    systemNotifications: nextNotificationPreferences.systemNotifications ?? user.notificationPreferences?.systemNotifications ?? true,
  };

  user.appearancePreferences = {
    theme: ['light', 'dark', 'system'].includes(requestedTheme)
      ? requestedTheme
      : user.appearancePreferences?.theme || 'system',
  };
  user.themePreference = user.appearancePreferences.theme;

  const updated = await user.save();
  const safeUser = await User.findById(updated._id).select('-password');
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: sanitizeUser(safeUser, req),
  });
});

const uploadCurrentUserProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.profileImage = `/uploads/avatars/${req.file.filename}`;
  const updated = await user.save();
  const safeUser = await User.findById(updated._id).select('-password');
  res.status(201).json({
    success: true,
    message: 'Profile image uploaded successfully',
    data: sanitizeUser(safeUser, req),
  });
});

const logoutAllSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save({ validateBeforeSave: false });
  res.json({
    success: true,
    message: 'All sessions have been logged out. Please sign in again.',
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  // FIX 4: Block deletion if user has open or in-progress tickets
  const Ticket = require('../models/ticketModel');
  const openTickets = await Ticket.countDocuments({
    submittedBy: user._id,
    status: { $in: ['Open', 'In Progress'] },
  });

  if (openTickets > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete user. They have ${openTickets} open or in-progress ticket(s). Resolve all tickets first.`
    );
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: `User ${user.name} deleted successfully`,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin only)
// ─────────────────────────────────────────────────────────────
const getUserStats = asyncHandler(async (req, res) => {
  // Count users grouped by role
  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // Count active vs inactive with readable labels
  const activeStats = await User.aggregate([
    {
      $group: {
        _id: '$isActive',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        status: { $cond: ['$_id', 'Active', 'Inactive'] },
        count: 1,
        _id: 0,
      },
    },
  ]);

  // Total user count
  const totalUsers = await User.countDocuments();

  res.json({
    success: true,
    data: {
      total: totalUsers,
      byRole: roleStats,
      byStatus: activeStats,
    },
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  changeCurrentUserPassword,
  updateCurrentUserPreferences,
  uploadCurrentUserProfileImage,
  logoutAllSessions,
};