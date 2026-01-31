const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const logger = require('../utils/logger');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;

/**
 * Enhanced Authentication Middleware
 * Verifies JWT tokens and checks account status
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'No token provided',
            code: 'NO_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);

        // Check if it's an access token (not refresh token)
        if (decoded.type === 'refresh') {
            return res.status(401).json({
                error: 'Invalid token type',
                code: 'INVALID_TOKEN_TYPE'
            });
        }

        // Optionally verify user still exists and is active
        if (decoded.id) {
            const result = await pool.query(
                'SELECT id, is_active, account_locked, role_id FROM user_profiles WHERE id = $1',
                [decoded.id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            const user = result.rows[0];

            if (user.account_locked) {
                return res.status(403).json({
                    error: 'Account is locked',
                    code: 'ACCOUNT_LOCKED'
                });
            }

            if (user.is_active === false) {
                return res.status(403).json({
                    error: 'Account is inactive',
                    code: 'ACCOUNT_INACTIVE'
                });
            }
        }

        req.user = decoded;

        // Log API access for audit trail
        logger.info('API Access', {
            userId: decoded.id,
            email: decoded.email,
            role: decoded.role,
            method: req.method,
            path: req.path,
            ip: req.ip
        });

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        logger.error('Auth middleware error', { error: err.message });
        return res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Optional authentication - doesn't fail if no token, but populates req.user if valid
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
    } catch (err) {
        // Token invalid, but continue without user
    }

    next();
};

/**
 * Require specific role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role?.toLowerCase() || '';
        const allowedRoles = roles.map(r => r.toLowerCase());

        // Super admin always has access
        if (userRole === 'super_admin') {
            return next();
        }

        if (allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'FORBIDDEN',
            requiredRoles: roles
        });
    };
};

/**
 * Require admin role (admin or super_admin)
 */
const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Require HR role (hr_manager, admin, super_admin)
 */
const requireHR = requireRole('hr_manager', 'admin', 'super_admin');

/**
 * Require manager role (manager, department_manager, hr_manager, admin, super_admin)
 */
const requireManager = requireRole('manager', 'department_manager', 'hr_manager', 'admin', 'super_admin');

/**
 * Permission-based authorization middleware
 * Checks if user has required permissions (stored in JWT or DB)
 * @param {string[]} requiredPermissions - Array of permission strings like ['admin.users.manage']
 */
const authorize = (requiredPermissions = []) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role?.toLowerCase() || '';

        // Super admin and admin bypass permission checks
        if (userRole === 'super_admin' || userRole === 'admin') {
            return next();
        }

        // HR manager has access to user management permissions
        if (userRole === 'hr_manager') {
            const hrPermissions = [
                'admin.users.manage',
                'admin.users.view',
                'employees.manage',
                'employees.view'
            ];
            const hasHRPermission = requiredPermissions.some(p => hrPermissions.includes(p));
            if (hasHRPermission) {
                return next();
            }
        }

        // For other roles, check if they have the exact permission
        // This would typically check against permissions stored in the database
        // For now, fall back to role-based checks
        try {
            const result = await pool.query(
                'SELECT permissions FROM roles WHERE name = $1',
                [userRole]
            );

            if (result.rows.length > 0 && result.rows[0].permissions) {
                const userPermissions = result.rows[0].permissions;
                const hasPermission = requiredPermissions.every(perm =>
                    userPermissions.includes(perm)
                );

                if (hasPermission) {
                    return next();
                }
            }
        } catch (error) {
            logger.error('Permission check error', { error: error.message });
        }

        return res.status(403).json({
            error: 'Insufficient permissions',
            code: 'FORBIDDEN',
            requiredPermissions
        });
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireHR,
    requireManager,
    authorize
};
