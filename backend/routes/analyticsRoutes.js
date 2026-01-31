const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// ADVANCED ANALYTICS & REPORTING ROUTES
// ========================================

// Get dashboard widgets for user
router.get('/dashboard/widgets', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM dashboard_widgets
            WHERE user_id = $1 AND is_visible = true
            ORDER BY position_y, position_x
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching dashboard widgets', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Save dashboard widget configuration
router.post('/dashboard/widgets', authenticateToken, async (req, res) => {
    try {
        const { widget_type, title, config, position_x, position_y, width, height } = req.body;

        const result = await pool.query(`
            INSERT INTO dashboard_widgets
            (user_id, widget_type, title, config, position_x, position_y, width, height)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [req.user.id, widget_type, title, config || {}, position_x || 0, position_y || 0, width || 4, height || 3]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating dashboard widget', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update dashboard widget
router.put('/dashboard/widgets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, config, position_x, position_y, width, height, is_visible } = req.body;

        // Verify ownership
        const check = await pool.query(
            'SELECT id FROM dashboard_widgets WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Widget not found or access denied' });
        }

        const result = await pool.query(`
            UPDATE dashboard_widgets
            SET title = COALESCE($1, title),
                config = COALESCE($2, config),
                position_x = COALESCE($3, position_x),
                position_y = COALESCE($4, position_y),
                width = COALESCE($5, width),
                height = COALESCE($6, height),
                is_visible = COALESCE($7, is_visible),
                updated_at = NOW()
            WHERE id = $8 AND user_id = $9
            RETURNING *
        `, [title, config, position_x, position_y, width, height, is_visible, id, req.user.id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating dashboard widget', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete dashboard widget
router.delete('/dashboard/widgets/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM dashboard_widgets WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Widget not found or access denied' });
        }

        res.json({ message: 'Widget deleted successfully' });
    } catch (error) {
        logger.error('Error deleting dashboard widget', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get KPI tracking data
router.get('/kpi', authenticateToken, async (req, res) => {
    try {
        const { department_id, category } = req.query;
        const userRole = req.user.role?.toLowerCase();

        let query = `
            SELECT k.*,
                   d.name as department_name,
                   u.first_name || ' ' || u.last_name as responsible_person
            FROM kpi_tracking k
            LEFT JOIN departments d ON k.department_id = d.id
            LEFT JOIN user_profiles u ON k.responsible_user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see KPIs they're responsible for or department KPIs
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND (k.responsible_user_id = $${params.length + 1}`;
            if (req.user.department_id) {
                query += ` OR k.department_id = $${params.length + 2})`;
                params.push(req.user.id, req.user.department_id);
            } else {
                query += `)`;
                params.push(req.user.id);
            }
        }

        if (department_id) {
            query += ` AND k.department_id = $${params.length + 1}`;
            params.push(department_id);
        }

        if (category) {
            query += ` AND k.category = $${params.length + 1}`;
            params.push(category);
        }

        query += ' ORDER BY k.last_updated DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching KPIs', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create/update KPI
router.post('/kpi', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { name, category, target_value, current_value, unit, period, department_id, responsible_user_id } = req.body;

        const result = await pool.query(`
            INSERT INTO kpi_tracking
            (name, category, target_value, current_value, unit, period, department_id, responsible_user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (name, department_id)
            DO UPDATE SET
                target_value = EXCLUDED.target_value,
                current_value = EXCLUDED.current_value,
                last_updated = NOW()
            RETURNING *
        `, [name, category, target_value, current_value || 0, unit, period, department_id, responsible_user_id]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating/updating KPI', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update KPI value
router.put('/kpi/:id/value', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { current_value } = req.body;

        // Check if user is responsible for this KPI or is admin
        const kpi = await pool.query('SELECT * FROM kpi_tracking WHERE id = $1', [id]);
        if (kpi.rows.length === 0) {
            return res.status(404).json({ error: 'KPI not found' });
        }

        const userRole = req.user.role?.toLowerCase();
        const isResponsible = kpi.rows[0].responsible_user_id === req.user.id;
        const isAdmin = ['super_admin', 'admin', 'hr_manager'].includes(userRole);

        if (!isResponsible && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            UPDATE kpi_tracking
            SET current_value = $1, last_updated = NOW()
            WHERE id = $2
            RETURNING *
        `, [current_value, id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating KPI value', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get custom reports
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        let query = `
            SELECT r.*,
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM custom_reports r
            LEFT JOIN user_profiles u ON r.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see public reports or their own
        const userRole = req.user.role?.toLowerCase();
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND (r.is_public = true OR r.created_by = $${params.length + 1})`;
            params.push(req.user.id);
        }

        query += ' ORDER BY r.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching custom reports', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create custom report
router.post('/reports', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { name, description, report_type, filters, columns, is_public } = req.body;

        const result = await pool.query(`
            INSERT INTO custom_reports
            (name, description, report_type, filters, columns, created_by, is_public)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, description, report_type, filters || {}, columns || [], req.user.id, is_public || false]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating custom report', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Execute custom report
router.get('/reports/:id/execute', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get report definition
        const report = await pool.query('SELECT * FROM custom_reports WHERE id = $1', [id]);
        if (report.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const reportDef = report.rows[0];

        // Check access
        const userRole = req.user.role?.toLowerCase();
        const hasAccess = reportDef.is_public ||
                          reportDef.created_by === req.user.id ||
                          ['super_admin', 'admin', 'hr_manager'].includes(userRole);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build dynamic query based on report type
        let query = '';
        const params = [];

        switch (reportDef.report_type) {
            case 'employee':
                query = buildEmployeeReportQuery(reportDef, params);
                break;
            case 'attendance':
                query = buildAttendanceReportQuery(reportDef, params);
                break;
            case 'payroll':
                query = buildPayrollReportQuery(reportDef, params);
                break;
            case 'performance':
                query = buildPerformanceReportQuery(reportDef, params);
                break;
            default:
                return res.status(400).json({ error: 'Unsupported report type' });
        }

        const result = await pool.query(query, params);
        res.json({
            report: reportDef,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        logger.error('Error executing custom report', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get analytics summary for dashboard
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM user_profiles WHERE status = 'active') as total_employees,
                (SELECT COUNT(*) FROM user_profiles WHERE status = 'active' AND hire_date >= CURRENT_DATE - INTERVAL '30 days') as new_hires_30d,
                (SELECT COUNT(*) FROM leave_requests WHERE status = 'approved' AND start_date >= CURRENT_DATE) as upcoming_leaves,
                (SELECT ROUND(AVG(final_rating), 2) FROM employee_probation WHERE status = 'completed' AND final_rating IS NOT NULL) as avg_probation_rating,
                (SELECT COUNT(*) FROM attendance_records WHERE date = CURRENT_DATE) as today_attendance,
                (SELECT COUNT(*) FROM performance_reviews WHERE status = 'completed' AND EXTRACT(YEAR FROM review_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as reviews_completed_year
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching analytics summary', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Helper functions for building report queries
function buildEmployeeReportQuery(reportDef, params) {
    let query = `
        SELECT u.employee_id, u.first_name, u.last_name, u.email, u.hire_date, u.status,
               d.name as department_name, p.name as position_name, r.name as role_name,
               u.salary, u.profile_completion_percentage
        FROM user_profiles u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN positions p ON u.position_id = p.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE 1=1
    `;

    // Apply filters
    if (reportDef.filters.department_id) {
        query += ` AND u.department_id = $${params.length + 1}`;
        params.push(reportDef.filters.department_id);
    }

    if (reportDef.filters.status) {
        query += ` AND u.status = $${params.length + 1}`;
        params.push(reportDef.filters.status);
    }

    if (reportDef.filters.hire_date_from) {
        query += ` AND u.hire_date >= $${params.length + 1}`;
        params.push(reportDef.filters.hire_date_from);
    }

    if (reportDef.filters.hire_date_to) {
        query += ` AND u.hire_date <= $${params.length + 1}`;
        params.push(reportDef.filters.hire_date_to);
    }

    return query;
}

function buildAttendanceReportQuery(reportDef, params) {
    let query = `
        SELECT a.*, u.first_name, u.last_name, u.employee_id, d.name as department_name
        FROM attendance_records a
        JOIN user_profiles u ON a.employee_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
    `;

    if (reportDef.filters.date_from) {
        query += ` AND a.date >= $${params.length + 1}`;
        params.push(reportDef.filters.date_from);
    }

    if (reportDef.filters.date_to) {
        query += ` AND a.date <= $${params.length + 1}`;
        params.push(reportDef.filters.date_to);
    }

    if (reportDef.filters.department_id) {
        query += ` AND u.department_id = $${params.length + 1}`;
        params.push(reportDef.filters.department_id);
    }

    return query + ' ORDER BY a.date DESC, u.last_name';
}

function buildPayrollReportQuery(reportDef, params) {
    let query = `
        SELECT p.*, u.first_name, u.last_name, u.employee_id, d.name as department_name
        FROM payroll_records p
        JOIN user_profiles u ON p.employee_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
    `;

    if (reportDef.filters.period_start) {
        query += ` AND p.period_start >= $${params.length + 1}`;
        params.push(reportDef.filters.period_start);
    }

    if (reportDef.filters.period_end) {
        query += ` AND p.period_end <= $${params.length + 1}`;
        params.push(reportDef.filters.period_end);
    }

    if (reportDef.filters.status) {
        query += ` AND p.status = $${params.length + 1}`;
        params.push(reportDef.filters.status);
    }

    return query + ' ORDER BY p.period_start DESC';
}

function buildPerformanceReportQuery(reportDef, params) {
    let query = `
        SELECT pr.*, u.first_name, u.last_name, u.employee_id, d.name as department_name
        FROM performance_reviews pr
        JOIN user_profiles u ON pr.employee_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE 1=1
    `;

    if (reportDef.filters.review_year) {
        query += ` AND EXTRACT(YEAR FROM pr.review_date) = $${params.length + 1}`;
        params.push(reportDef.filters.review_year);
    }

    if (reportDef.filters.status) {
        query += ` AND pr.status = $${params.length + 1}`;
        params.push(reportDef.filters.status);
    }

    if (reportDef.filters.min_rating) {
        query += ` AND pr.overall_rating >= $${params.length + 1}`;
        params.push(reportDef.filters.min_rating);
    }

    return query + ' ORDER BY pr.review_date DESC';
}

module.exports = router;
