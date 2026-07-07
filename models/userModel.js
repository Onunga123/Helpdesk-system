const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['student', 'staff', 'ict_officer', 'admin'],
      default: 'student',
    },
    department: { type: String, default: '' },
    phone: { type: String, default: '' },
    staffId: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    username: { type: String, default: '' },
    profileImage: { type: String, default: '' },
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
    themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    tokenVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);