/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(error) and returns consistent JSON responses.
 * Handles Mongoose-specific errors, JWT errors, and generic server errors.
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ─── Mongoose CastError (invalid ObjectId) ───────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // ─── Mongoose Validation Error ───────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join('; ');
  }

  // ─── Mongoose Duplicate Key (unique constraint) ───────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ─── JWT Errors ──────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * notFound — 404 handler for undefined routes
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
