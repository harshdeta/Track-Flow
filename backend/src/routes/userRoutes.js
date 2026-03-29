const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');

/**
 * User Routes
 *
 * All routes require authentication (protect).
 * Role protection applied per route.
 *
 * POST   /api/users          → admin: create user
 * GET    /api/users          → admin: all users | manager: team only
 * GET    /api/users/:id      → admin: any | others: own
 * PATCH  /api/users/:id      → admin: update user
 * DELETE /api/users/:id      → admin: deactivate user
 */

router.use(protect); // All routes below require JWT

router
  .route('/')
  .post(authorize('admin'), validate('createUser'), createUser)
  .get(authorize('admin', 'manager'), getAllUsers);

router
  .route('/:id')
  .get(getUserById)                        // Permission checked inside controller
  .patch(authorize('admin'), updateUser)
  .delete(authorize('admin'), deactivateUser);

module.exports = router;
