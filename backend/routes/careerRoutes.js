const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// CAREER PROGRESSION MANAGEMENT ROUTES
// ========================================

// Get all career progression records
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { employee_id, department_id } = req.query;
        const userRole = req.user.role?.toLowerCase();

        let query = `
            SELECT cp.*,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   u.email,
                   d.name as department_name,
                   pf.name as from_position_name,
                   pt.name as to_position_name,
                   ap.first_name || ' ' || ap.last_name as approved_by_name
            FROM career_progression cp
            JOIN user_profiles u ON cp.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN positions pf ON cp.from_position_id = pf.id
            LEFT JOIN positions pt ON cp.to_position_id = pt.id
            LEFT JOIN user_profiles ap ON cp.approved_by = ap.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see their own career progression
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND cp.employee_id = $${params.length + 1}`;
            params.push(req.user.id);
        }

        if (employee_id) {
            query += ` AND cp.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (department_id) {
            query += ` AND u.department_id = $${params.length + 1}`;
            params.push(department_id);
        }

        query += ' ORDER BY cp.promotion_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching career progression', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get career history for employee
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;

        const result = await pool.query(`
            SELECT cp.*,
                   pf.name as from_position_name,
                   pt.name as to_position_name,
                   ap.first_name || ' ' || ap.last_name as approved_by_name
            FROM career_progression cp
            LEFT JOIN positions pf ON cp.from_position_id = pf.id
            LEFT JOIN positions pt ON cp.to_position_id = pt.id
            LEFT JOIN user_profiles ap ON cp.approved_by = ap.id
            WHERE cp.employee_id = $1
            ORDER BY cp.promotion_date DESC
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching employee career history', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Record promotion
router.post('/promotion', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            employee_id,
            from_position_id,
            to_position_id,
            promotion_date,
            effective_date,
            salary_change,
            reason
        } = req.body;

        // Get current position and salary
        const currentInfo = await client.query(
            'SELECT position_id, salary FROM user_profiles WHERE id = $1',
            [employee_id]
        );

        if (currentInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        const actualFromPosition = from_position_id || currentInfo.rows[0].position_id;
        const currentSalary = currentInfo.rows[0].salary || 0;

        // Record promotion
        const promotion = await client.query(`
            INSERT INTO career_progression
            (employee_id, from_position_id, to_position_id, promotion_date, effective_date, salary_change, reason, approved_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [employee_id, actualFromPosition, to_position_id, promotion_date, effective_date, salary_change, reason, req.user.id]);

        // Update employee record
        await client.query(`
            UPDATE user_profiles
            SET position_id = $1,
                salary = COALESCE(salary, 0) + $2,
                updated_at = NOW()
            WHERE id = $3
        `, [to_position_id, salary_change || 0, employee_id]);

        await client.query('COMMIT');

        logger.info('Promotion recorded', {
            employeeId: employee_id,
            fromPosition: actualFromPosition,
            toPosition: to_position_id,
            salaryChange: salary_change
        });

        res.status(201).json(promotion.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error recording promotion', { error: error.message });
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Record employee transfer
router.post('/transfer', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            employee_id,
            from_department_id,
            to_department_id,
            from_position_id,
            to_position_id,
            transfer_date,
            effective_date,
            reason
        } = req.body;

        // Get current department and position
        const currentInfo = await client.query(
            'SELECT department_id, position_id FROM user_profiles WHERE id = $1',
            [employee_id]
        );

        if (currentInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        const actualFromDept = from_department_id || currentInfo.rows[0].department_id;
        const actualFromPos = from_position_id || currentInfo.rows[0].position_id;

        // Record transfer
        const transfer = await client.query(`
            INSERT INTO employee_transfers
            (employee_id, from_department_id, to_department_id, from_position_id, to_position_id, transfer_date, effective_date, reason, approved_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [employee_id, actualFromDept, to_department_id, actualFromPos, to_position_id, transfer_date, effective_date, reason, req.user.id]);

        // Update employee record
        await client.query(`
            UPDATE user_profiles
            SET department_id = $1,
                position_id = COALESCE($2, position_id),
                updated_at = NOW()
            WHERE id = $3
        `, [to_department_id, to_position_id, employee_id]);

        await client.query('COMMIT');

        logger.info('Employee transfer recorded', {
            employeeId: employee_id,
            fromDept: actualFromDept,
            toDept: to_department_id,
            fromPos: actualFromPos,
            toPos: to_position_id
        });

        res.status(201).json(transfer.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error recording transfer', { error: error.message });
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get pending transfers
router.get('/transfers/pending', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT et.*,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   fd.name as from_department_name,
                   td.name as to_department_name,
                   fp.name as from_position_name,
                   tp.name as to_position_name,
                   ap.first_name || ' ' || ap.last_name as approved_by_name
            FROM employee_transfers et
            JOIN user_profiles u ON et.employee_id = u.id
            LEFT JOIN departments fd ON et.from_department_id = fd.id
            LEFT JOIN departments td ON et.to_department_id = td.id
            LEFT JOIN positions fp ON et.from_position_id = fp.id
            LEFT JOIN positions tp ON et.to_position_id = tp.id
            LEFT JOIN user_profiles ap ON et.approved_by = ap.id
            WHERE et.status = 'pending'
            ORDER BY et.transfer_date DESC
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching pending transfers', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Approve/reject transfer
router.put('/transfer/:id/status', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body; // status: 'approved', 'rejected'

        const result = await pool.query(`
            UPDATE employee_transfers
            SET status = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transfer not found' });
        }

        // If approved, update the effective date
        if (status === 'approved') {
            await pool.query(`
                UPDATE employee_transfers
                SET effective_date = CURRENT_DATE
                WHERE id = $1
            `, [id]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating transfer status', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get career progression statistics
router.get('/stats/summary', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM career_progression WHERE EXTRACT(YEAR FROM promotion_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as promotions_this_year,
                (SELECT COUNT(*) FROM employee_transfers WHERE EXTRACT(YEAR FROM transfer_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as transfers_this_year,
                (SELECT ROUND(AVG(salary_change), 2) FROM career_progression WHERE salary_change > 0 AND EXTRACT(YEAR FROM promotion_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as avg_salary_increase,
                (SELECT COUNT(*) FROM employee_transfers WHERE status = 'pending') as pending_transfers
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching career stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
