const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * Auth Routes
 * POST /api/auth/signup  — Create company + admin
 * POST /api/auth/login   — Authenticate and get JWT
 * GET  /api/auth/me      — Get current user profile (protected)
 */

router.post('/signup', validate('signup'), signup);
router.post('/login', validate('login'), login);
router.get('/me', protect, getMe);

module.exports = router;
