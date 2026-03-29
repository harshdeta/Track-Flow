/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Usage examples:
 *   authorize('admin')           → only admins
 *   authorize('admin', 'manager') → admins and managers
 *   authorize('admin', 'manager', 'employee') → all authenticated users
 */

/**
 * authorize — Factory that returns middleware allowing only specified roles.
 * Must be used AFTER the `protect` middleware.
 *
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not permitted to perform this action.`,
      });
    }

    next();
  };
};

/**
 * sameCompany — Ensures the resource being accessed belongs to the same company.
 * Used as a secondary guard to prevent cross-tenant data access.
 * Assumes the target company ID is in req.params.companyId or body.
 */
const sameCompany = (req, res, next) => {
  const targetCompany =
    req.params.companyId || req.body.company || req.query.company;

  if (targetCompany && targetCompany.toString() !== req.companyId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Cross-company access is not allowed.',
    });
  }

  next();
};

module.exports = { authorize, sameCompany };
