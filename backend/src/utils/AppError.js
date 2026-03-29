/**
 * AppError — Custom error class for operational errors.
 * Pass instances of this to next() to trigger the global error handler
 * with a specific HTTP status code and message.
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 *   next(new AppError('Unauthorized', 401));
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to distinguish from unexpected errors
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
