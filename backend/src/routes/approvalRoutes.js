const express = require('express');
const router = express.Router();
const {
  approveExpense,
  rejectExpense,
  getPendingApprovals,
  getApprovalHistory,
  adminOverride,
} = require('../controllers/approvalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

/**
 * Approval Routes
 *
 * GET  /api/approvals/pending                    → get expenses waiting for MY action
 * GET  /api/approvals/:expenseId/history         → full audit trail
 * POST /api/approvals/:expenseId/approve         → approve an expense
 * POST /api/approvals/:expenseId/reject          → reject an expense
 * POST /api/approvals/:expenseId/admin-override  → admin force approve/reject
 */

router.use(protect);

// Pending approvals queue — managers and admins
router.get(
  '/pending',
  authorize('manager', 'admin'),
  getPendingApprovals
);

// Approval history — admin and managers
router.get(
  '/:expenseId/history',
  authorize('admin', 'manager', 'employee'),
  getApprovalHistory
);

// Approve / Reject — managers and admins
router.post(
  '/:expenseId/approve',
  authorize('manager', 'admin'),
  approveExpense
);

router.post(
  '/:expenseId/reject',
  authorize('manager', 'admin'),
  rejectExpense
);

// Admin override — admin only
router.post(
  '/:expenseId/admin-override',
  authorize('admin'),
  adminOverride
);

module.exports = router;
