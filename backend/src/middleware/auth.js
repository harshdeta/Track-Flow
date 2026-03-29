const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Verifies JWT and attaches user to req.user
 * Must be applied before any route that requires authentication.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header (Bearer <token>) or cookie
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Access denied. No token provided.' });
    }

    // 2. Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user — ensures user still exists and isn't deactivated
    const user = await User.findById(decoded.id).select('-password').populate('company', 'name baseCurrency');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Token is invalid. User not found.' });
    }

    if (!user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Your account has been deactivated.' });
    }

    // 4. Attach user + company to request for downstream use
    req.user = user;
    req.companyId = user.company._id ?? user.company;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    next(error);
  }
};

module.exports = { protect };
