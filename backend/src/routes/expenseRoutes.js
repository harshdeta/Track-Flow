const express = require('express');
const router = express.Router();
const {
  createExpense,
  submitExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  cancelExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

/**
 * Expense Routes
 *
 * POST   /api/expenses              → employee: create expense
 * GET    /api/expenses              → role-filtered list
 * GET    /api/expenses/:id          → expense detail + approval history
 * PATCH  /api/expenses/:id          → employee: update draft | admin: update any
 * DELETE /api/expenses/:id          → cancel expense
 * POST   /api/expenses/:id/submit   → employee: submit draft for approval
 */

router.use(protect);

router
  .route('/')
  .post(authorize('employee', 'manager', 'admin'), validate('createExpense'), createExpense)
  .get(getExpenses);

router
  .route('/:id')
  .get(getExpenseById)
  .patch(updateExpense)
  .delete(cancelExpense);

// Submit for approval (employee action)
router.post(
  '/:id/submit',
  authorize('employee', 'manager', 'admin'),
  submitExpense
);

module.exports = router;
