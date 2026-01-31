const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { pool } = require('./db');
const logger = require('./utils/logger');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

// Additional Route Imports
const probationRoutes = require('./routes/probationRoutes');
const careerRoutes = require('./routes/careerRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const lmsRoutes = require('./routes/lmsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Validate Environment
const requiredEnvVars = ['JWT_SECRET', 'DB_PASSWORD'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        logger.error(`Missing required environment variable: ${varName}`);
        process.exit(1);
    }
});

// Process Handlers
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION', { error: err.message, stack: err.stack });
    process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
    logger.error('UNHANDLED REJECTION', { reason, promise: p });
});

// --- Middleware ---

app.use(helmet());

// Custom XSS Protection
const xssProtection = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                obj[key] = sanitize(obj[key]);
            });
        }
        return obj;
    };
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
};
app.use(xssProtection);

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked request', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiters - Increased for dashboard with multiple API calls
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased from 100 to handle dashboard concurrent requests
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health';
    }
});
app.use('/api/', limiter);

// --- Routes Mounting ---

app.use('/api/auth', authRoutes);
app.use('/api/auth/mfa', require('./routes/mfaRoutes'));
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes); // Handles /api/leaves/*
// Note: leaveRoutes also exports /types, /balances. 
// If specific paths like /api/leave-types were used, we need to adjust or mount specifically.
// Based on creation:
// /api/leaves/types -> maps to leaveRoutes GET /types
// /api/leaves/requests -> maps to leaveRoutes GET /requests
// However, the original might have been /api/leave-types. 
// To allow seamless transition, we can mount twice or use specific paths.
app.use('/api/leave-types', (req, res, next) => {
    req.url = '/types' + req.url; // Rewrite to match router
    leaveRoutes(req, res, next);
});
app.use('/api/leave-balances', (req, res, next) => {
    req.url = '/balances' + req.url;
    leaveRoutes(req, res, next);
});
// Re-mount /api/leaves mostly for requests
app.use('/api/leaves', leaveRoutes);


app.use('/api/departments', departmentRoutes);
// Department routes also handled /api/teams, /api/positions.
// We should mount them appropriately.
app.use('/api/teams', (req, res, next) => {
    req.url = '/teams' + req.url; // Hacky rewrite or better: 
    departmentRoutes(req, res, next);
});
app.use('/api/positions', (req, res, next) => {
    req.url = '/positions' + req.url;
    departmentRoutes(req, res, next);
});

app.use('/api/attendance', attendanceRoutes);

const trainingRoutes = require('./routes/trainingRoutes');
app.use('/api/training', trainingRoutes);

const documentRoutes = require('./routes/documentRoutes');
app.use('/api/documents', documentRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const announcementRoutes = require('./routes/announcementRoutes');
app.use('/api/announcements', announcementRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const messagingRoutes = require('./routes/messagingRoutes');
app.use('/api/messaging', messagingRoutes);

const expenseRoutes = require('./routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

const complianceRoutes = require('./routes/complianceRoutes');
app.use('/api/compliance', complianceRoutes);

const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interviews', interviewRoutes);

const wfhRoutes = require('./routes/wfhRoutes');
app.use('/api/wfh', wfhRoutes);

// Dashboard Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);

// Project Routes
const projectRoutes = require('./routes/projectRoutes');
app.use('/api/projects', projectRoutes);

// Settings Routes
const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', settingsRoutes); // Also mount for /api/profile/completion

// Performance Routes
const performanceRoutes = require('./routes/performanceRoutes');
app.use('/api/performance', performanceRoutes);

// Payroll Routes
const payrollRoutes = require('./routes/payrollRoutes');
app.use('/api/payroll', payrollRoutes);

// Benefits Routes
const benefitsRoutes = require('./routes/benefitsRoutes');
app.use('/api/benefits', benefitsRoutes);

// Onboarding Routes
const onboardingRoutes = require('./routes/onboardingRoutes');
app.use('/api/onboarding', onboardingRoutes);

// Probation Routes
app.use('/api/probation', probationRoutes);

// Career Routes
app.use('/api/career', careerRoutes);

// Analytics Routes
app.use('/api/analytics', analyticsRoutes);

// LMS Routes
app.use('/api/lms', lmsRoutes);


// Roles Route (Simple enough to keep or move to departments/auth)
app.get('/api/roles', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    logger.error('Global error handler', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        modularized: true
    });
});
