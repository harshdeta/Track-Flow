const Company = require('../models/Company');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendTokenResponse } = require('../utils/jwt');

/**
 * Auth Controller
 * Handles: signup (create company + admin), login
 */

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
/**
 * signup
 * Creates a new company and the first admin user in one transaction.
 * No existing authentication required — this is the entry point.
 */
const signup = async (req, res, next) => {
  try {
    const {
      // Company fields
      companyName,
      country,
      baseCurrency,
      // Admin user fields
      name,
      email,
      password,
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!companyName || !country || !baseCurrency || !name || !email || !password) {
      throw new AppError('All fields are required for signup.', 400);
    }

    // ── Check if email already registered ────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // ── Create the Company ────────────────────────────────────────────────
    const company = await Company.create({
      name: companyName,
      country,
      baseCurrency: baseCurrency.toUpperCase(),
    });

    // ── Create the Admin User ─────────────────────────────────────────────
    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin',
      company: company._id,
    });

    // ── Return JWT ────────────────────────────────────────────────────────
    sendTokenResponse(adminUser, 201, res, 'Company and admin account created successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * login
 * Authenticates user with email + password and returns JWT.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    // Must explicitly select password since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('company', 'name baseCurrency');

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Contact your admin.', 401);
    }

    // Compare provided password with hashed one
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * getMe
 * Returns the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('company', 'name baseCurrency country')
      .populate('manager', 'name email');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, getMe };
