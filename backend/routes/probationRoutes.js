const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// PROBATION MANAGEMENT ROUTES
// ========================================

// Get all probation records
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, employee_id } = req.query;
        const userRole = req.user.role?.toLowerCase();

        let query = `
            SELECT p.*,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   u.email,
                   d.name as department_name,
                   s.first_name || ' ' || s.last_name as supervisor_name
            FROM employee_probation p
            JOIN user_profiles u ON p.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN user_profiles s ON p.supervisor_id = s.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see their own or their team's probation
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND (p.employee_id = $${params.length + 1} OR p.supervisor_id = $${params.length + 1})`;
            params.push(req.user.id);
        }

        if (status) {
            query += ` AND p.status = $${params.length + 1}`;
            params.push(status);
        }

        if (employee_id) {
            query += ` AND p.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        query += ' ORDER BY p.start_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching probation records', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get probation by employee ID
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;

        const result = await pool.query(`
            SELECT p.*,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   s.first_name || ' ' || s.last_name as supervisor_name
            FROM employee_probation p
            JOIN user_profiles u ON p.employee_id = u.id
            LEFT JOIN user_profiles s ON p.supervisor_id = s.id
            WHERE p.employee_id = $1
            ORDER BY p.start_date DESC
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching employee probation', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Start probation for employee
router.post('/start', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { employee_id, supervisor_id, probation_type, start_date, end_date, goals } = req.body;

        const result = await pool.query(`
            INSERT INTO employee_probation
            (employee_id, supervisor_id, probation_type, start_date, end_date, goals)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [employee_id, supervisor_id, probation_type || 'standard', start_date, end_date, goals || {}]);

        logger.info('Probation started', { employeeId: employee_id, probationId: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error starting probation', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update probation record
router.put('/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { supervisor_id, probation_type, start_date, end_date, goals, status, review_date, final_rating, notes } = req.body;

        const result = await pool.query(`
            UPDATE employee_probation
            SET supervisor_id = COALESCE($1, supervisor_id),
                probation_type = COALESCE($2, probation_type),
                start_date = COALESCE($3, start_date),
                end_date = COALESCE($4, end_date),
                goals = COALESCE($5, goals),
                status = COALESCE($6, status),
                review_date = COALESCE($7, review_date),
                final_rating = COALESCE($8, final_rating),
                notes = COALESCE($9, notes),
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [supervisor_id, probation_type, start_date, end_date, goals, status, review_date, final_rating, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Probation record not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating probation', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Extend probation
router.post('/:id/extend', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { new_end_date, reason } = req.body;

        const result = await pool.query(`
            UPDATE employee_probation
            SET end_date = $1,
                probation_type = 'extended',
                notes = COALESCE(notes, '{}') || jsonb_build_object('extension_reason', $2, 'extended_on', NOW()),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [new_end_date, reason, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Probation record not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error extending probation', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Complete probation review
router.post('/:id/complete', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { final_rating, review_notes, decision } = req.body; // decision: 'confirmed', 'extended', 'terminated'

        const result = await pool.query(`
            UPDATE employee_probation
            SET status = 'completed',
                final_rating = $1,
                review_date = CURRENT_DATE,
                notes = COALESCE(notes, '{}') || jsonb_build_object('review_notes', $2, 'decision', $3, 'completed_on', NOW()),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        `, [final_rating, review_notes, decision, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Probation record not found' });
        }

        // Update employee status based on decision
        if (decision === 'confirmed') {
            await pool.query(
                'UPDATE user_profiles SET status = $1, updated_at = NOW() WHERE id = (SELECT employee_id FROM employee_probation WHERE id = $2)',
                ['active', id]
            );
        } else if (decision === 'terminated') {
            await pool.query(
                'UPDATE user_profiles SET status = $1, is_active = false, updated_at = NOW() WHERE id = (SELECT employee_id FROM employee_probation WHERE id = $2)',
                ['terminated', id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error completing probation review', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get probation statistics
router.get('/stats/summary', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM employee_probation WHERE status = 'active') as active_probation,
                (SELECT COUNT(*) FROM employee_probation WHERE status = 'completed' AND final_rating >= 4.0) as successful_completions,
                (SELECT COUNT(*) FROM employee_probation WHERE status = 'completed' AND final_rating < 3.0) as unsuccessful_completions,
                (SELECT COUNT(*) FROM employee_probation WHERE probation_type = 'extended') as extended_probation,
                (SELECT ROUND(AVG(final_rating), 2) FROM employee_probation WHERE status = 'completed' AND final_rating IS NOT NULL) as avg_rating,
                (SELECT COUNT(*) FROM employee_probation WHERE end_date < CURRENT_DATE AND status = 'active') as overdue_reviews
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching probation stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
