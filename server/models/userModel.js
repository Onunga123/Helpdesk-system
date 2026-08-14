const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'staff', 'ict_officer', 'hr_officer', 'admin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    staffId: {
      type: String,
      trim: true,
      default: '',
    },
    jobTitle: {
      type: String,
      trim: true,
      default: '',
    },
    username: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      ticketAssignmentNotifications: { type: Boolean, default: true },
      ticketUpdates: { type: Boolean, default: true },
      maintenanceAnnouncements: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: true },
    },
    appearancePreferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
  }
);

// ─── HASH PASSWORD BEFORE SAVING ─────────────────────────────
// This runs automatically every time a user is saved
userSchema.pre('save', async function (next) {
  // Only hash if password was changed (not on other updates like name change)
  if (!this.isModified('password')) {
    return next();
  }
  // Generate a salt (random string that makes hashing unique)
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── METHOD TO COMPARE PASSWORDS ON LOGIN ────────────────────
// We'll call this when user logs in to check if password is correct
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ department: 1 });

module.exports = mongoose.model('User', userSchema);