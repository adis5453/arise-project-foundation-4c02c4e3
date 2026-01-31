const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize Tables
const initInterviewTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS job_positions (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                department_id UUID REFERENCES departments(id),
                description TEXT,
                requirements TEXT,
                salary_range VARCHAR(100),
                employment_type VARCHAR(50), -- full-time, part-time, contract
                location VARCHAR(200),
                is_remote BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'open', -- open, closed, on-hold
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS candidates (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                job_position_id INTEGER REFERENCES job_positions(id),
                resume_url VARCHAR(500),
                portfolio_url VARCHAR(500),
                linkedin_url VARCHAR(500),
                source VARCHAR(50), -- referral, linkedin, website, agency
                status VARCHAR(30) DEFAULT 'new', -- new, screening, interviewing, offered, hired, rejected
                notes TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS interviews (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
                interviewer_id UUID REFERENCES user_profiles(id),
                interview_type VARCHAR(50), -- phone, video, onsite, technical
                scheduled_at TIMESTAMP NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                location VARCHAR(200),
                meeting_url VARCHAR(500),
                status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, rescheduled
                feedback TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                recommendation VARCHAR(20), -- proceed, hold, reject
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        logger.info('Interview tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize interview tables', error);
    }
};

initInterviewTables();

// Routes

// ==================== Job Positions ====================
router.get('/positions', authenticateToken, async (req, res) => {
    const { status, department_id } = req.query;

    try {
        let query = `
            SELECT p.*, 
                   d.name as department_name,
                   u.first_name || ' ' || u.last_name as created_by_name,
                   (SELECT COUNT(*) FROM candidates WHERE job_position_id = p.id) as candidate_count
            FROM job_positions p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN user_profiles u ON p.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }
        if (department_id) {
            query += ` AND p.department_id = $${paramIndex++}`;
            params.push(department_id);
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching job positions', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/positions', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { title, department_id, description, requirements, salary_range, employment_type, location, is_remote } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO job_positions (
                title, department_id, description, requirements, salary_range, 
                employment_type, location, is_remote, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [title, department_id, description, requirements, salary_range, employment_type, location, is_remote, req.user.id]);

        logger.info('Job position created', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating job position', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ==================== Candidates ====================
router.get('/candidates', authenticateToken, async (req, res) => {
    const { status, job_position_id } = req.query;

    try {
        let query = `
            SELECT c.*, 
                   p.title as position_title,
                   (SELECT COUNT(*) FROM interviews WHERE candidate_id = c.id) as interview_count
            FROM candidates c
            LEFT JOIN job_positions p ON c.job_position_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND c.status = $${paramIndex++}`;
            params.push(status);
        }
        if (job_position_id) {
            query += ` AND c.job_position_id = $${paramIndex++}`;
            params.push(job_position_id);
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching candidates', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/candidates', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager']), async (req, res) => {
    const { first_name, last_name, email, phone, job_position_id, resume_url, portfolio_url, linkedin_url, source, notes } = req.body;

    if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO candidates (
                first_name, last_name, email, phone, job_position_id,
                resume_url, portfolio_url, linkedin_url, source, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [first_name, last_name, email, phone, job_position_id, resume_url, portfolio_url, linkedin_url, source, notes]);

        logger.info('Candidate created', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating candidate', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.put('/candidates/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager']), async (req, res) => {
    const { id } = req.params;
    const { status, rating, notes } = req.body;

    try {
        const result = await pool.query(`
            UPDATE candidates SET
                status = COALESCE($1, status),
                rating = COALESCE($2, rating),
                notes = COALESCE($3, notes),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [status, rating, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating candidate', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ==================== Interviews ====================
router.get('/interviews', authenticateToken, async (req, res) => {
    const { status, interviewer_id, candidate_id, from_date, to_date } = req.query;

    try {
        let query = `
            SELECT i.*, 
                   c.first_name || ' ' || c.last_name as candidate_name,
                   c.email as candidate_email,
                   p.title as position_title,
                   u.first_name || ' ' || u.last_name as interviewer_name
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            LEFT JOIN job_positions p ON c.job_position_id = p.id
            LEFT JOIN user_profiles u ON i.interviewer_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND i.status = $${paramIndex++}`;
            params.push(status);
        }
        if (interviewer_id) {
            query += ` AND i.interviewer_id = $${paramIndex++}`;
            params.push(interviewer_id);
        }
        if (candidate_id) {
            query += ` AND i.candidate_id = $${paramIndex++}`;
            params.push(candidate_id);
        }
        if (from_date) {
            query += ` AND i.scheduled_at >= $${paramIndex++}`;
            params.push(from_date);
        }
        if (to_date) {
            query += ` AND i.scheduled_at <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ' ORDER BY i.scheduled_at ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching interviews', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/interviews', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager']), async (req, res) => {
    const { candidate_id, interviewer_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, notes } = req.body;

    if (!candidate_id || !interviewer_id || !scheduled_at) {
        return res.status(400).json({ error: 'Candidate, interviewer, and scheduled time are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO interviews (
                candidate_id, interviewer_id, interview_type, scheduled_at,
                duration_minutes, location, meeting_url, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [candidate_id, interviewer_id, interview_type, scheduled_at, duration_minutes || 60, location, meeting_url, notes]);

        logger.info('Interview scheduled', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error scheduling interview', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.put('/interviews/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, feedback, rating, recommendation, notes } = req.body;

    try {
        const result = await pool.query(`
            UPDATE interviews SET
                status = COALESCE($1, status),
                feedback = COALESCE($2, feedback),
                rating = COALESCE($3, rating),
                recommendation = COALESCE($4, recommendation),
                notes = COALESCE($5, notes),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `, [status, feedback, rating, recommendation, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating interview', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get interview statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM job_positions WHERE status = 'open') as open_positions,
                (SELECT COUNT(*) FROM candidates WHERE status NOT IN ('hired', 'rejected')) as active_candidates,
                (SELECT COUNT(*) FROM interviews WHERE status = 'scheduled' AND scheduled_at > NOW()) as upcoming_interviews,
                (SELECT COUNT(*) FROM candidates WHERE status = 'hired' AND created_at > NOW() - INTERVAL '30 days') as recent_hires
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching interview stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
