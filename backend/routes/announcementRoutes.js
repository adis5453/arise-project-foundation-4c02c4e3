const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize Table
const initAnnouncementsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'general', -- general, urgent, event, policy
                priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
                target_audience VARCHAR(50) DEFAULT 'all', -- all, department, role
                target_ids UUID[], -- department_ids or role_ids based on target_audience
                is_pinned BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT FALSE,
                publish_date TIMESTAMP,
                expire_date TIMESTAMP,
                author_id UUID REFERENCES user_profiles(id),
                views_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS announcement_reads (
                id SERIAL PRIMARY KEY,
                announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
                user_id UUID REFERENCES user_profiles(id),
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(announcement_id, user_id)
            );
        `);
        logger.info('Announcements tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize announcements table', error);
    }
};

initAnnouncementsTable();

// Routes

// Get all announcements (with filtering)
router.get('/', authenticateToken, async (req, res) => {
    const { type, priority, published_only } = req.query;

    try {
        let query = `
            SELECT a.*, 
                   u.first_name || ' ' || u.last_name as author_name,
                   (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id) as read_count,
                   EXISTS(SELECT 1 FROM announcement_reads WHERE announcement_id = a.id AND user_id = $1) as is_read
            FROM announcements a
            LEFT JOIN user_profiles u ON a.author_id = u.id
            WHERE 1=1
        `;
        const params = [req.user.id];
        let paramIndex = 2;

        if (type) {
            query += ` AND a.type = $${paramIndex++}`;
            params.push(type);
        }
        if (priority) {
            query += ` AND a.priority = $${paramIndex++}`;
            params.push(priority);
        }
        if (published_only === 'true') {
            query += ` AND a.is_published = true AND (a.expire_date IS NULL OR a.expire_date > NOW())`;
        }

        query += ` ORDER BY a.is_pinned DESC, a.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching announcements', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get announcement by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT a.*, 
                   u.first_name || ' ' || u.last_name as author_name
            FROM announcements a
            LEFT JOIN user_profiles u ON a.author_id = u.id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        // Increment view count
        await pool.query('UPDATE announcements SET views_count = views_count + 1 WHERE id = $1', [id]);

        // Mark as read
        await pool.query(`
            INSERT INTO announcement_reads (announcement_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (announcement_id, user_id) DO NOTHING
        `, [id, req.user.id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching announcement', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create announcement
router.post('/', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { title, content, type, priority, target_audience, target_ids, is_pinned, is_published, publish_date, expire_date } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO announcements (
                title, content, type, priority, target_audience, target_ids,
                is_pinned, is_published, publish_date, expire_date, author_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            title, content, type || 'general', priority || 'normal',
            target_audience || 'all', target_ids || null,
            is_pinned || false, is_published || false,
            publish_date || null, expire_date || null, req.user.id
        ]);

        logger.info('Announcement created', { id: result.rows[0].id, author: req.user.id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating announcement', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update announcement
router.put('/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { id } = req.params;
    const { title, content, type, priority, target_audience, target_ids, is_pinned, is_published, publish_date, expire_date } = req.body;

    try {
        const result = await pool.query(`
            UPDATE announcements SET
                title = COALESCE($1, title),
                content = COALESCE($2, content),
                type = COALESCE($3, type),
                priority = COALESCE($4, priority),
                target_audience = COALESCE($5, target_audience),
                target_ids = COALESCE($6, target_ids),
                is_pinned = COALESCE($7, is_pinned),
                is_published = COALESCE($8, is_published),
                publish_date = COALESCE($9, publish_date),
                expire_date = COALESCE($10, expire_date),
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
        `, [title, content, type, priority, target_audience, target_ids, is_pinned, is_published, publish_date, expire_date, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        logger.info('Announcement updated', { id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating announcement', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete announcement
router.delete('/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        logger.info('Announcement deleted', { id });
        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        logger.error('Error deleting announcement', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get announcement statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM announcements WHERE is_published = true) as published_count,
                (SELECT COUNT(*) FROM announcements WHERE is_published = true AND expire_date > NOW()) as active_count,
                (SELECT COUNT(*) FROM announcements WHERE created_at > NOW() - INTERVAL '7 days') as recent_count,
                (SELECT COUNT(*) FROM announcement_reads WHERE user_id = $1) as read_by_user
        `, [req.user.id]);

        res.json(stats.rows[0]);
    } catch (error) {
        logger.error('Error fetching announcement stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
