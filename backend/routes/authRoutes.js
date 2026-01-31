const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const logger = require('../utils/logger');
const { validateRequest } = require('../middleware/requestValidator');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || SECRET_KEY + '_refresh';

// ========================================
// PASSWORD POLICY CONFIGURATION
// ========================================
const PASSWORD_POLICY = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Validate password complexity
const validatePasswordComplexity = (password) => {
    const errors = [];

    if (password.length < PASSWORD_POLICY.minLength) {
        errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
    }
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    return errors;
};

// Generate password strength score (0-100)
const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score += 10;
    return Math.min(score, 100);
};

// ========================================
// TOKEN MANAGEMENT
// ========================================

// Generate access token (short-lived: 15 minutes)
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role_name, type: 'access' },
        SECRET_KEY,
        { expiresIn: '15m' }
    );
};

// Generate refresh token (long-lived: 7 days)
const generateRefreshToken = (user) => {
    const tokenId = crypto.randomUUID();
    return {
        token: jwt.sign(
            { id: user.id, email: user.email, tokenId, type: 'refresh' },
            REFRESH_SECRET,
            { expiresIn: '7d' }
        ),
        tokenId
    };
};

// Store refresh token in database
const storeRefreshToken = async (userId, tokenId, expiresAt) => {
    try {
        // First, check if refresh_tokens table exists, if not create it
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                token_id VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked BOOLEAN DEFAULT FALSE,
                revoked_at TIMESTAMP,
                user_agent VARCHAR(500),
                ip_address VARCHAR(50)
            )
        `);

        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token_id, expires_at) VALUES ($1, $2, $3)',
            [userId, tokenId, expiresAt]
        );
    } catch (error) {
        logger.error('Failed to store refresh token', { error: error.message, userId });
        throw error;
    }
};

// Revoke refresh token
const revokeRefreshToken = async (tokenId) => {
    try {
        await pool.query(
            'UPDATE refresh_tokens SET revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE token_id = $1',
            [tokenId]
        );
    } catch (error) {
        logger.error('Failed to revoke refresh token', { error: error.message, tokenId });
    }
};

// Revoke all user's refresh tokens (for logout all devices)
const revokeAllUserTokens = async (userId) => {
    try {
        await pool.query(
            'UPDATE refresh_tokens SET revoked = true, revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked = false',
            [userId]
        );
    } catch (error) {
        logger.error('Failed to revoke all user tokens', { error: error.message, userId });
    }
};

// Verify refresh token is valid and not revoked
const verifyRefreshToken = async (tokenId) => {
    try {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token_id = $1 AND revoked = false AND expires_at > CURRENT_TIMESTAMP',
            [tokenId]
        );
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        logger.error('Failed to verify refresh token', { error: error.message, tokenId });
        return null;
    }
};

// ========================================
// RATE LIMITERS
// ========================================

// Auth Rate Limiter (login attempts)
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 login attempts per 5 minutes
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            email: req.body?.email,
            message: 'User exceeded 10 login attempts in 5 minutes'
        });
        res.status(429).json({
            error: 'Too many login attempts, please try again in 5 minutes.',
            retryAfter: 300
        });
    }
});

// Refresh token rate limiter
const refreshLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 refresh attempts per minute
    message: 'Too many token refresh attempts'
});

// ========================================
// ROUTES
// ========================================

// Login endpoint
router.post('/login',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        validateRequest
    ],
    async (req, res) => {
        const { email, password, mfaToken } = req.body;
        logger.info('Login attempt', { email });

        try {
            const result = await pool.query(`
                SELECT u.*, r.name as role_name 
                FROM user_profiles u 
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.email = $1
            `, [email]);

            if (result.rows.length === 0) {
                logger.warn('Login failed: User not found', { email });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Check if account is locked
            if (user.account_locked) {
                logger.warn('Login failed: Account locked', { email });
                return res.status(403).json({
                    error: 'Account is locked. Please contact administrator.',
                    locked: true
                });
            }

            // Check if account is active
            if (user.is_active === false) {
                logger.warn('Login failed: Account inactive', { email });
                return res.status(403).json({
                    error: 'Account is inactive. Please contact administrator.',
                    inactive: true
                });
            }

            if (!user.password_hash) {
                logger.warn('Login failed: No password set', { email });
                return res.status(401).json({ error: 'Password not set. Please contact admin.' });
            }

            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                // Increment failed login attempts
                await pool.query(
                    'UPDATE user_profiles SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1 WHERE id = $1',
                    [user.id]
                );

                // Check if should lock account (5 failed attempts)
                if ((user.failed_login_attempts || 0) >= 4) {
                    await pool.query(
                        'UPDATE user_profiles SET account_locked = true WHERE id = $1',
                        [user.id]
                    );
                    logger.warn('Account locked due to failed attempts', { email });
                }

                logger.warn('Login failed: Invalid password', { email });
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // MFA Check
            if (user.mfa_enabled) {
                if (!mfaToken) {
                    return res.json({
                        mfaRequired: true,
                        message: 'MFA token required'
                    });
                }

                const verified = speakeasy.totp.verify({
                    secret: user.mfa_secret,
                    encoding: 'base32',
                    token: mfaToken
                });

                if (!verified) {
                    logger.warn('Login failed: Invalid MFA token', { email });
                    return res.status(401).json({ error: 'Invalid MFA code' });
                }
            }

            // Reset failed login attempts on successful login
            await pool.query(
                'UPDATE user_profiles SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [user.id]
            );

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const { token: refreshToken, tokenId } = generateRefreshToken(user);

            // Store refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            await storeRefreshToken(user.id, tokenId, expiresAt);

            // Remove sensitive data
            delete user.password_hash;
            delete user.mfa_secret;
            delete user.mfa_backup_codes;

            logger.info('Login successful', { email, userId: user.id });

            res.json({
                token: accessToken,
                refreshToken,
                expiresIn: 900, // 15 minutes in seconds
                user
            });
        } catch (error) {
            logger.error('Login error', { error: error.message, email });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Refresh token endpoint
router.post('/refresh',
    refreshLimiter,
    async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        try {
            // Verify the refresh token
            const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

            if (decoded.type !== 'refresh') {
                return res.status(401).json({ error: 'Invalid token type' });
            }

            // Check if token exists and is not revoked
            const storedToken = await verifyRefreshToken(decoded.tokenId);
            if (!storedToken) {
                return res.status(401).json({ error: 'Token revoked or expired' });
            }

            // Get current user data
            const result = await pool.query(`
                SELECT u.*, r.name as role_name 
                FROM user_profiles u 
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.id = $1
            `, [decoded.id]);

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const user = result.rows[0];

            // Check if account is still active
            if (user.account_locked || user.is_active === false) {
                await revokeRefreshToken(decoded.tokenId);
                return res.status(403).json({ error: 'Account is locked or inactive' });
            }

            // Rotate refresh token (revoke old, issue new)
            await revokeRefreshToken(decoded.tokenId);

            const newAccessToken = generateAccessToken(user);
            const { token: newRefreshToken, tokenId: newTokenId } = generateRefreshToken(user);

            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await storeRefreshToken(user.id, newTokenId, expiresAt);

            delete user.password_hash;

            logger.info('Token refreshed', { userId: user.id });

            res.json({
                token: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 900,
                user
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Refresh token expired' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Invalid refresh token' });
            }
            logger.error('Token refresh error', { error: error.message });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Logout endpoint
router.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { refreshToken, logoutAll } = req.body;

    try {
        // Revoke refresh token if provided
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
            if (logoutAll) {
                await revokeAllUserTokens(decoded.id);
                logger.info('All sessions logged out', { userId: decoded.id });
            } else {
                await revokeRefreshToken(decoded.tokenId);
                logger.info('Session logged out', { userId: decoded.id });
            }
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        // Even if token verification fails, consider it logged out
        res.json({ message: 'Logged out successfully' });
    }
});

// Get current user info
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        const result = await pool.query(`
            SELECT u.*, r.name as role_name, r.permissions as role_permissions
            FROM user_profiles u 
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        delete user.password_hash;

        res.json({ user });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        logger.error('Get user error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Validate password strength endpoint
router.post('/validate-password', (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    const errors = validatePasswordComplexity(password);
    const strength = getPasswordStrength(password);

    res.json({
        valid: errors.length === 0,
        strength,
        errors,
        policy: PASSWORD_POLICY
    });
});

// Get password policy
router.get('/password-policy', (req, res) => {
    res.json({ policy: PASSWORD_POLICY });
});

// ========================================
// PASSWORD CHANGE ENDPOINTS
// ========================================

// Change password (authenticated user changing their own password)
router.post('/change-password',
    [
        body('currentPassword').notEmpty().withMessage('Current password required'),
        body('newPassword').isLength({ min: 12 }).withMessage('New password must be at least 12 characters'),
        validateRequest
    ],
    async (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            const { currentPassword, newPassword } = req.body;

            // Validate new password complexity
            const passwordErrors = validatePasswordComplexity(newPassword);
            if (passwordErrors.length > 0) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    details: passwordErrors
                });
            }

            // Get user with current password
            const result = await pool.query(
                'SELECT id, password_hash, email FROM user_profiles WHERE id = $1',
                [decoded.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = result.rows[0];

            // Verify current password
            const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!validPassword) {
                logger.warn('Password change failed: Invalid current password', { userId: decoded.id });
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Check new password is different from current
            const samePassword = await bcrypt.compare(newPassword, user.password_hash);
            if (samePassword) {
                return res.status(400).json({ error: 'New password must be different from current password' });
            }

            // Hash new password
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await pool.query(
                'UPDATE user_profiles SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newPasswordHash, decoded.id]
            );

            // Revoke all refresh tokens (force re-login on all devices)
            await revokeAllUserTokens(decoded.id);

            logger.info('Password changed successfully', { userId: decoded.id, email: user.email });

            res.json({
                message: 'Password changed successfully',
                note: 'You have been logged out of all devices. Please log in again.'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            logger.error('Password change error', { error: error.message });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// ========================================
// ADMIN ACCOUNT MANAGEMENT ENDPOINTS
// ========================================

// Unlock user account (admin only)
router.post('/admin/unlock-account',
    async (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, SECRET_KEY);

            // Check if admin
            const adminRoles = ['admin', 'super_admin', 'hr_manager'];
            if (!adminRoles.includes(decoded.role?.toLowerCase())) {
                return res.status(403).json({ error: 'Admin access required' });
            }

            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }

            // Unlock the account and reset failed attempts
            const result = await pool.query(
                `UPDATE user_profiles 
                 SET account_locked = false, failed_login_attempts = 0 
                 WHERE id = $1
                 RETURNING id, email, first_name, last_name`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const unlockedUser = result.rows[0];

            logger.info('Account unlocked by admin', {
                adminId: decoded.id,
                unlockedUserId: userId,
                unlockedEmail: unlockedUser.email
            });

            res.json({
                message: 'Account unlocked successfully',
                user: {
                    id: unlockedUser.id,
                    email: unlockedUser.email,
                    name: `${unlockedUser.first_name} ${unlockedUser.last_name}`
                }
            });
        } catch (error) {
            logger.error('Account unlock error', { error: error.message });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Reset user password (admin only)
router.post('/admin/reset-password',
    [
        body('userId').notEmpty().withMessage('User ID required'),
        body('newPassword').isLength({ min: 12 }).withMessage('Password must be at least 12 characters'),
        validateRequest
    ],
    async (req, res) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, SECRET_KEY);

            // Check if admin
            const adminRoles = ['admin', 'super_admin'];
            if (!adminRoles.includes(decoded.role?.toLowerCase())) {
                return res.status(403).json({ error: 'Admin access required' });
            }

            const { userId, newPassword, forceChangeOnLogin } = req.body;

            // Validate new password complexity
            const passwordErrors = validatePasswordComplexity(newPassword);
            if (passwordErrors.length > 0) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    details: passwordErrors
                });
            }

            // Hash new password
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Update password and optionally set force change flag
            const result = await pool.query(
                `UPDATE user_profiles 
                 SET password_hash = $1, 
                     password_changed_at = CURRENT_TIMESTAMP,
                     force_password_change = $2,
                     account_locked = false,
                     failed_login_attempts = 0
                 WHERE id = $3
                 RETURNING id, email, first_name, last_name`,
                [newPasswordHash, forceChangeOnLogin || false, userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updatedUser = result.rows[0];

            // Revoke all refresh tokens for the user
            await revokeAllUserTokens(userId);

            logger.info('Password reset by admin', {
                adminId: decoded.id,
                targetUserId: userId,
                targetEmail: updatedUser.email,
                forceChange: forceChangeOnLogin || false
            });

            res.json({
                message: 'Password reset successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: `${updatedUser.first_name} ${updatedUser.last_name}`
                },
                forceChangeOnLogin: forceChangeOnLogin || false
            });
        } catch (error) {
            logger.error('Password reset error', { error: error.message });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Get active sessions for user (admin can view any, user can view their own)
router.get('/sessions', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        let targetUserId = decoded.id;

        // Admin can view sessions for any user
        if (req.query.userId) {
            const adminRoles = ['admin', 'super_admin', 'hr_manager'];
            if (!adminRoles.includes(decoded.role?.toLowerCase())) {
                return res.status(403).json({ error: 'Cannot view other users sessions' });
            }
            targetUserId = req.query.userId;
        }

        const result = await pool.query(
            `SELECT id, created_at, expires_at, user_agent, ip_address
             FROM refresh_tokens 
             WHERE user_id = $1 AND revoked = false AND expires_at > CURRENT_TIMESTAMP
             ORDER BY created_at DESC`,
            [targetUserId]
        );

        res.json({
            sessions: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        logger.error('Get sessions error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Terminate specific session
router.delete('/sessions/:tokenId', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { tokenId } = req.params;

        // Verify the session belongs to the user (or user is admin)
        const sessionResult = await pool.query(
            'SELECT user_id FROM refresh_tokens WHERE token_id = $1',
            [tokenId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const sessionUserId = sessionResult.rows[0].user_id;
        const adminRoles = ['admin', 'super_admin'];

        if (sessionUserId !== decoded.id && !adminRoles.includes(decoded.role?.toLowerCase())) {
            return res.status(403).json({ error: 'Cannot terminate other users sessions' });
        }

        await revokeRefreshToken(tokenId);

        logger.info('Session terminated', {
            userId: decoded.id,
            terminatedTokenId: tokenId,
            targetUserId: sessionUserId
        });

        res.json({ message: 'Session terminated successfully' });
    } catch (error) {
        logger.error('Terminate session error', { error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
