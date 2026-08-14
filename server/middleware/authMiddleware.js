const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Applicant = require('../models/applicantModel');

// ─── PROTECT MIDDLEWARE ───────────────────────────────────────
// Attach this to any route that requires login
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Tokens are sent in the request header like:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verify user still exists in database
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user no longer exists');
      }

      // Verify user account is still active
      if (!user.isActive) {
        res.status(403);
        throw new Error('Your account has been deactivated');
      }

      if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
        res.status(401);
        throw new Error('Session expired. Please log in again.');
      }

      req.user = user;
      next(); // Token is valid — allow request to continue
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

// ─── APPLICANT OR STAFF MIDDLEWARE ───────────────────────────
const protectApplicantOrStaff = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'applicant') {
      const applicant = await Applicant.findById(decoded.id);
      if (!applicant) {
        res.status(401);
        throw new Error('Not authorized, applicant no longer exists');
      }
      req.applicant = applicant;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated');
    }
    if ((decoded.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      res.status(401);
      throw new Error('Session expired. Please log in again.');
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// ─── ROLE-BASED ACCESS MIDDLEWARE ────────────────────────────
// Use this to restrict routes to specific roles
// Example: authorize('admin') or authorize('admin', 'ict_officer')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `Role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};

module.exports = { protect, protectApplicantOrStaff, authorize };