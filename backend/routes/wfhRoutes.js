const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize WFH Tables
const initWFHTables = async () => {
    try {
        await pool.query(`
            -- WFH Requests table
            CREATE TABLE IF NOT EXISTS wfh_requests (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                work_type VARCHAR(20) DEFAULT 'full_day', -- full_day, half_day_morning, half_day_evening
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
                approved_by UUID REFERENCES user_profiles(id),
                approved_at TIMESTAMP,
                rejection_reason TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- WFH Policy table (HR configurable)
            CREATE TABLE IF NOT EXISTS wfh_policies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                max_days_per_week INT DEFAULT 2,
                max_days_per_month INT DEFAULT 8,
                requires_approval BOOLEAN DEFAULT TRUE,
                allowed_roles INTEGER[], -- Array of role_ids that can use this policy
                allowed_departments UUID[], -- Array of department_ids
                min_notice_days INT DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Insert default WFH policy if empty
            INSERT INTO wfh_policies (name, max_days_per_week, max_days_per_month)
            SELECT 'Default WFH Policy', 2, 8
            WHERE NOT EXISTS (SELECT 1 FROM wfh_policies LIMIT 1);
        `);
        logger.info('WFH tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize WFH tables', error);
    }
};

initWFHTables();

// ==================== WFH Policies (HR Only) ====================

router.get('/policies', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM wfh_policies WHERE is_active = true');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching WFH policies', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/policies', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { name, max_days_per_week, max_days_per_month, requires_approval, allowed_roles, allowed_departments, min_notice_days } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO wfh_policies (name, max_days_per_week, max_days_per_month, requires_approval, allowed_roles, allowed_departments, min_notice_days)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, max_days_per_week || 2, max_days_per_month || 8, requires_approval !== false, allowed_roles, allowed_departments, min_notice_days || 1]);

        logger.info('WFH policy created', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating WFH policy', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ==================== WFH Requests ====================

// Get my WFH requests
router.get('/my-requests', authenticateToken, async (req, res) => {
    const { status, month, year } = req.query;

    try {
        let query = `
            SELECT w.*, 
                   a.first_name || ' ' || a.last_name as approved_by_name
            FROM wfh_requests w
            LEFT JOIN user_profiles a ON w.approved_by = a.id
            WHERE w.employee_id = $1
        `;
        const params = [req.user.id];
        let paramIndex = 2;

        if (status) {
            query += ` AND w.status = $${paramIndex++}`;
            params.push(status);
        }
        if (year && month) {
            query += ` AND EXTRACT(YEAR FROM w.start_date) = $${paramIndex++}`;
            params.push(year);
            query += ` AND EXTRACT(MONTH FROM w.start_date) = $${paramIndex++}`;
            params.push(month);
        }

        query += ' ORDER BY w.start_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching my WFH requests', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get all WFH requests (for managers/HR)
router.get('/requests', authenticateToken, async (req, res) => {
    const { status, employee_id, department_id, from_date, to_date } = req.query;

    try {
        let query = `
            SELECT w.*, 
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as emp_code,
                   u.department_id,
                   d.name as department_name,
                   a.first_name || ' ' || a.last_name as approved_by_name
            FROM wfh_requests w
            JOIN user_profiles u ON w.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN user_profiles a ON w.approved_by = a.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        // Role-based filtering
        if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            // Managers see their team only
            if (['manager', 'department_manager'].includes(req.user.role)) {
                query += ` AND u.department_id = $${paramIndex++}`;
                params.push(req.user.department_id);
            } else if (req.user.role === 'team_leader') {
                // Team leaders see their team members
                query += ` AND u.manager_id = $${paramIndex++}`;
                params.push(req.user.id);
            } else {
                // Employees see only their own
                query += ` AND w.employee_id = $${paramIndex++}`;
                params.push(req.user.id);
            }
        }

        if (status) {
            query += ` AND w.status = $${paramIndex++}`;
            params.push(status);
        }
        if (employee_id) {
            query += ` AND w.employee_id = $${paramIndex++}`;
            params.push(employee_id);
        }
        if (department_id) {
            query += ` AND u.department_id = $${paramIndex++}`;
            params.push(department_id);
        }
        if (from_date) {
            query += ` AND w.start_date >= $${paramIndex++}`;
            params.push(from_date);
        }
        if (to_date) {
            query += ` AND w.end_date <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ' ORDER BY w.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching WFH requests', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create WFH request
router.post('/requests', authenticateToken, async (req, res) => {
    const { start_date, end_date, reason, work_type } = req.body;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    try {
        // Check if dates are in the past
        if (new Date(start_date) < new Date().setHours(0, 0, 0, 0)) {
            return res.status(400).json({ error: 'Cannot request WFH for past dates' });
        }

        // Check for overlapping requests
        const overlap = await pool.query(`
            SELECT id FROM wfh_requests 
            WHERE employee_id = $1 
            AND status IN ('pending', 'approved')
            AND (start_date, end_date) OVERLAPS ($2::date, $3::date)
        `, [req.user.id, start_date, end_date]);

        if (overlap.rows.length > 0) {
            return res.status(400).json({ error: 'You already have a WFH request for these dates' });
        }

        // Check monthly limit
        const month = new Date(start_date).getMonth() + 1;
        const year = new Date(start_date).getFullYear();
        const currentMonthWFH = await pool.query(`
            SELECT COUNT(*) as count FROM wfh_requests 
            WHERE employee_id = $1 
            AND status IN ('approved', 'pending')
            AND EXTRACT(MONTH FROM start_date) = $2
            AND EXTRACT(YEAR FROM start_date) = $3
        `, [req.user.id, month, year]);

        const policy = await pool.query('SELECT * FROM wfh_policies WHERE is_active = true LIMIT 1');
        const maxDays = policy.rows[0]?.max_days_per_month || 8;

        if (parseInt(currentMonthWFH.rows[0].count) >= maxDays) {
            return res.status(400).json({ error: `You have reached the maximum of ${maxDays} WFH days this month` });
        }

        const result = await pool.query(`
            INSERT INTO wfh_requests (employee_id, start_date, end_date, reason, work_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [req.user.id, start_date, end_date, reason, work_type || 'full_day']);

        logger.info('WFH request created', { id: result.rows[0].id, employee: req.user.id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating WFH request', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Approve WFH request
router.post('/requests/:id/approve', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager', 'department_manager', 'team_leader']), async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    try {
        // Verify the request exists and is pending
        const request = await pool.query('SELECT * FROM wfh_requests WHERE id = $1', [id]);
        if (request.rows.length === 0) {
            return res.status(404).json({ error: 'WFH request not found' });
        }
        if (request.rows[0].status !== 'pending') {
            return res.status(400).json({ error: 'Can only approve pending requests' });
        }

        const result = await pool.query(`
            UPDATE wfh_requests SET
                status = 'approved',
                approved_by = $1,
                approved_at = NOW(),
                notes = COALESCE($2, notes),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [req.user.id, notes, id]);

        logger.info('WFH request approved', { id, approver: req.user.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error approving WFH request', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Reject WFH request
router.post('/requests/:id/reject', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager', 'department_manager', 'team_leader']), async (req, res) => {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
    }

    try {
        const request = await pool.query('SELECT * FROM wfh_requests WHERE id = $1', [id]);
        if (request.rows.length === 0) {
            return res.status(404).json({ error: 'WFH request not found' });
        }
        if (request.rows[0].status !== 'pending') {
            return res.status(400).json({ error: 'Can only reject pending requests' });
        }

        const result = await pool.query(`
            UPDATE wfh_requests SET
                status = 'rejected',
                rejection_reason = $1,
                approved_by = $2,
                approved_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [rejection_reason, req.user.id, id]);

        logger.info('WFH request rejected', { id, rejector: req.user.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error rejecting WFH request', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Check if employee has approved WFH for a date
router.get('/check-date', authenticateToken, async (req, res) => {
    const { date, employee_id } = req.query;
    const targetEmployee = employee_id || req.user.id;

    try {
        const result = await pool.query(`
            SELECT id, start_date, end_date, work_type 
            FROM wfh_requests 
            WHERE employee_id = $1 
            AND status = 'approved'
            AND $2::date BETWEEN start_date AND end_date
        `, [targetEmployee, date]);

        res.json({
            has_approved_wfh: result.rows.length > 0,
            wfh_request: result.rows[0] || null
        });
    } catch (error) {
        logger.error('Error checking WFH date', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get WFH statistics
router.get('/stats', authenticateToken, async (req, res) => {
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    try {
        let statsQuery;
        const params = [targetMonth, targetYear];

        if (['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM wfh_requests WHERE status = 'pending') as pending_requests,
                    (SELECT COUNT(*) FROM wfh_requests WHERE status = 'approved' AND EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2) as approved_this_month,
                    (SELECT COUNT(DISTINCT employee_id) FROM wfh_requests WHERE status = 'approved' AND start_date = CURRENT_DATE) as wfh_today,
                    (SELECT COUNT(*) FROM wfh_requests WHERE status = 'rejected' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2) as rejected_this_month
            `;
        } else {
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM wfh_requests WHERE employee_id = $3 AND status = 'pending') as my_pending,
                    (SELECT COUNT(*) FROM wfh_requests WHERE employee_id = $3 AND status = 'approved' AND EXTRACT(MONTH FROM start_date) = $1 AND EXTRACT(YEAR FROM start_date) = $2) as my_approved_this_month,
                    (SELECT COUNT(*) FROM wfh_requests WHERE employee_id = $3 AND status = 'approved') as my_total_approved
            `;
            params.push(req.user.id);
        }

        const result = await pool.query(statsQuery, params);
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching WFH stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
