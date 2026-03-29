const express = require('express');
const router = express.Router();
const {
  createRule,
  getAllRules,
  getRuleById,
  updateRule,
  deleteRule,
} = require('../controllers/approvalRuleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

/**
 * Approval Rule Routes — Admin only
 *
 * POST   /api/approval-rules        → create rule
 * GET    /api/approval-rules        → list all rules
 * GET    /api/approval-rules/:id    → get single rule
 * PATCH  /api/approval-rules/:id    → update rule
 * DELETE /api/approval-rules/:id    → deactivate rule
 */

router.use(protect, authorize('admin'));

router.route('/').post(createRule).get(getAllRules);
router.route('/:id').get(getRuleById).patch(updateRule).delete(deleteRule);

module.exports = router;
