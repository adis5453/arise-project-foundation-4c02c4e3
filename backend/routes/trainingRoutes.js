const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize Tables (Self-Healing Schema)
const initTrainingTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS training_courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructor VARCHAR(100),
                duration_hours DECIMAL(5,2),
                thumbnail_url TEXT,
                status VARCHAR(50) DEFAULT 'active', -- active, archived
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS training_enrollments (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES training_courses(id),
                employee_id UUID REFERENCES user_profiles(id),
                status VARCHAR(50) DEFAULT 'enrolled', -- enrolled, in_progress, completed
                progress_percentage INTEGER DEFAULT 0,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                certificate_url TEXT,
                UNIQUE(course_id, employee_id)
            );
        `);
        logger.info('Training module tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize training tables', error);
    }
};

// Run initialization
initTrainingTables();

// --- Routes ---

// Get All Courses
router.get('/courses', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM training_courses WHERE status = $1 ORDER BY created_at DESC', ['active']);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Create Course
router.post('/courses', authenticateToken, checkRole(['admin', 'hr_manager', 'super_admin']), async (req, res) => {
    const { title, description, instructor, duration_hours, thumbnail_url } = req.body;
    try {
        const result = await pool.query(`
            INSERT INTO training_courses (title, description, instructor, duration_hours, thumbnail_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [title, description, instructor, duration_hours, thumbnail_url]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get My Enrollments
router.get('/my-enrollments', authenticateToken, async (req, res) => {
    try {
        const employeeId = req.user.id; // Assuming user_profiles.id is in token or mapped
        // If token has auth_user_id, we might need to map to user_profiles.id. 
        // Based on authRoutes, req.user contains { id, email, role } where id is user_profiles.id

        const result = await pool.query(`
            SELECT te.*, tc.title, tc.instructor, tc.thumbnail_url, tc.duration_hours
            FROM training_enrollments te
            JOIN training_courses tc ON te.course_id = tc.id
            WHERE te.employee_id = $1
            ORDER BY te.enrolled_at DESC
        `, [employeeId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enroll in Course
router.post('/enroll', authenticateToken, async (req, res) => {
    const { courseId } = req.body;
    const employeeId = req.user.id;
    try {
        const result = await pool.query(`
            INSERT INTO training_enrollments (course_id, employee_id, status, progress_percentage)
            VALUES ($1, $2, 'enrolled', 0)
            ON CONFLICT(course_id, employee_id) DO NOTHING
            RETURNING *
        `, [courseId, employeeId]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Already enrolled' });
        }
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Progress
router.put('/progress/:enrollmentId', authenticateToken, async (req, res) => {
    const { enrollmentId } = req.params;
    const { progress, status } = req.body; // progress 0-100
    try {
        // specific check: employee can only update their own
        const check = await pool.query('SELECT * FROM training_enrollments WHERE id=$1 AND employee_id=$2', [enrollmentId, req.user.id]);
        if (check.rows.length === 0 && !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        let updateQuery = `
            UPDATE training_enrollments
            SET progress_percentage = $1, status = $2, updated_at = NOW()
        `;
        const params = [progress, status];

        if (status === 'completed') {
            updateQuery += `, completed_at = NOW() `;
        }

        updateQuery += ` WHERE id = $3 RETURNING *`;
        params.push(enrollmentId);

        const result = await pool.query(updateQuery, params);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
