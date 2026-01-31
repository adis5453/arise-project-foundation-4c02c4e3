const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Middleware to restrict to admin (or specific permissions)
const requireAdmin = authorize(['admin.users.manage']);

// List all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, r.name as role_name 
            FROM user_profiles u 
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        // Remove sensitive data
        const users = result.rows.map(user => {
            delete user.password_hash;
            delete user.mfa_secret;
            delete user.mfa_backup_codes;
            return user;
        });
        res.json(users);
    } catch (error) {
        logger.error('Error fetching users', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create user
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    const { email, password, first_name, last_name, role_id } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO user_profiles (email, password_hash, first_name, last_name, role_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
            [email, passwordHash, first_name, last_name, role_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating user', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user details
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email } = req.body;
    try {
        const result = await pool.query(
            `UPDATE user_profiles SET first_name = $1, last_name = $2, email = $3 WHERE id = $4 RETURNING id`,
            [first_name, last_name, email, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating user', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Update role
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { role_id } = req.body;
    try {
        await pool.query('UPDATE user_profiles SET role_id = $1 WHERE id = $2', [role_id, id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error updating role', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Update status (active/inactive)
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    try {
        await pool.query('UPDATE user_profiles SET is_active = $1 WHERE id = $2', [is_active, id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error updating status', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Reset password
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE user_profiles SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error resetting password', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM user_profiles WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting user', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
