const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getMyExpenseReport,
  getApprovalReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

/**
 * Report Routes
 *
 * GET /api/reports/summary       → Admin/Manager: company-wide dashboard
 * GET /api/reports/my-expenses   → All: own expense summary
 * GET /api/reports/approvals     → Admin/Manager: approver performance stats
 */

router.use(protect);

// Personal expense report — all roles
router.get('/my-expenses', getMyExpenseReport);

// Company-wide dashboard — admin and managers
router.get('/summary', authorize('admin', 'manager'), getDashboardSummary);

// Approval team performance — admin and managers
router.get('/approvals', authorize('admin', 'manager'), getApprovalReport);

module.exports = router;
