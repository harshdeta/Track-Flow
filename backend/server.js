require('dotenv').config(); // Load env vars first

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// ─── Route Imports ────────────────────────────────────────────────────────────
const authRoutes        = require('./src/routes/authRoutes');
const userRoutes        = require('./src/routes/userRoutes');
const expenseRoutes     = require('./src/routes/expenseRoutes');
const approvalRoutes    = require('./src/routes/approvalRoutes');
const approvalRuleRoutes= require('./src/routes/approvalRuleRoutes');
const reportRoutes      = require('./src/routes/reportRoutes');
const uploadRoutes      = require('./src/routes/uploadRoutes');

// ─── Initialize App ───────────────────────────────────────────────────────────
const app = express();

// ─── Connect to Database ──────────────────────────────────────────────────────
connectDB();

// ─── Security: Helmet (HTTP headers hardening) ────────────────────────────────
app.use(helmet());

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// General API limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

// Stricter limiter for auth endpoints: 10 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static Files: serve uploaded receipts ────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── HTTP Request Logger ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Root & API Info ──────────────────────────────────────────────────────────
const apiInfo = {
  success: true,
  service: 'Expense Management System API',
  version: '1.0.0',
  status: 'running',
  endpoints: {
    auth:          'POST /api/auth/signup | POST /api/auth/login | GET /api/auth/me',
    users:         'POST /api/users | GET /api/users | GET|PATCH|DELETE /api/users/:id',
    expenses:      'POST /api/expenses | GET /api/expenses | GET|PATCH|DELETE /api/expenses/:id | POST /api/expenses/:id/submit',
    approvals:     'GET /api/approvals/pending | POST /api/approvals/:id/approve | POST /api/approvals/:id/reject | GET /api/approvals/:id/history | POST /api/approvals/:id/admin-override',
    approvalRules: 'POST /api/approval-rules | GET /api/approval-rules | GET|PATCH|DELETE /api/approval-rules/:id',
    reports:       'GET /api/reports/summary | GET /api/reports/my-expenses | GET /api/reports/approvals',
    upload:        'POST /api/upload/receipt/:expenseId | DELETE /api/upload/receipt/:expenseId',
    health:        'GET /health',
  },
};

app.get('/', (req, res) => res.status(200).json(apiInfo));
app.get('/api', (req, res) => res.status(200).json(apiInfo));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Expense Management API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    security: {
      helmet: true,
      rateLimiting: true,
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/expenses',       expenseRoutes);
app.use('/api/approvals',      approvalRoutes);
app.use('/api/approval-rules', approvalRuleRoutes);
app.use('/api/reports',        reportRoutes);
app.use('/api/upload',         uploadRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Expense Management System — API v1.0.0               ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Running on   : http://localhost:${PORT}                     ║
║  🌍 Environment  : ${(process.env.NODE_ENV || 'development').padEnd(38)}║
║  🔐 Security     : Helmet + Rate Limiting enabled             ║
║  📦 API Base     : http://localhost:${PORT}/api                 ║
║  ❤️  Health check : http://localhost:${PORT}/health              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  server.close(() => { console.log('✅ Server closed.'); process.exit(0); });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
