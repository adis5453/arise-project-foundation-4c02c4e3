const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching notifications', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false',
            [req.user.id]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        logger.error('Error fetching unread count', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Mark as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        // If ID is 'all', mark all as read
        if (req.params.id === 'all') {
            await pool.query(
                'UPDATE notifications SET is_read = true, read_at = NOW() WHERE recipient_id = $1',
                [req.user.id]
            );
            return res.json({ success: true, message: 'All marked as read' });
        }

        const result = await pool.query(
            'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error marking notification read', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// Create notification (internal use or admin)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { recipient_id, type, title, message, link } = req.body;
        const result = await pool.query(
            `INSERT INTO notifications (recipient_id, type, title, message, link) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [recipient_id, type, title, message, link]
        );
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating notification', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ success: true });
    } catch (error) {
        logger.error('Error deleting notification', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;

