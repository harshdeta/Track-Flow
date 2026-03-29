const jwt = require('jsonwebtoken');

/**
 * generateToken — Signs a JWT with user ID and role as payload.
 * @param {Object} user - Mongoose User document
 * @returns {string} - Signed JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      company: user.company,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

/**
 * sendTokenResponse — Generates a JWT and sends it in the response body.
 * Optionally sets an HttpOnly cookie for web clients.
 *
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user);
  const safeUser = user.toSafeObject ? user.toSafeObject() : user.toObject();
  delete safeUser.password;

  // Optional: set cookie for browser-based clients
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: safeUser,
    });
};

module.exports = { generateToken, sendTokenResponse };
