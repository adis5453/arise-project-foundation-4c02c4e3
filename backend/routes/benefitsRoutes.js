const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// Self-Healing Schema Initialization
// ========================================
const initBenefitsTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS benefit_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                description TEXT,
                provider VARCHAR(255),
                coverage_details JSONB,
                cost_employee NUMERIC(10, 2) DEFAULT 0,
                cost_employer NUMERIC(10, 2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_benefits (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                benefit_plan_id INTEGER REFERENCES benefit_plans(id),
                enrollment_date DATE DEFAULT CURRENT_DATE,
                coverage_level VARCHAR(50) DEFAULT 'individual',
                dependents JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, benefit_plan_id)
            )
        `);

        logger.info('Benefits module tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize benefits tables', { error: error.message });
    }
};

initBenefitsTables();

// ========================================
// BENEFIT PLANS ROUTES
// ========================================

// Get all benefit plans
router.get('/plans', authenticateToken, async (req, res) => {
    try {
        const { type, active_only } = req.query;

        let query = 'SELECT * FROM benefit_plans WHERE 1=1';
        const params = [];

        if (type) {
            query += ` AND type = $${params.length + 1}`;
            params.push(type);
        }

        if (active_only === 'true') {
            query += ' AND is_active = true';
        }

        query += ' ORDER BY type, name';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching benefit plans', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get single benefit plan
router.get('/plans/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM benefit_plans WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Benefit plan not found' });
        }

        // Get enrollment count
        const enrollmentCount = await pool.query(
            'SELECT COUNT(*) FROM employee_benefits WHERE benefit_plan_id = $1 AND status = $2',
            [id, 'active']
        );

        const plan = result.rows[0];
        plan.enrollment_count = parseInt(enrollmentCount.rows[0].count);

        res.json(plan);
    } catch (error) {
        logger.error('Error fetching benefit plan', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create benefit plan (admin only)
router.post('/plans', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { name, type, description, provider, coverage_details, cost_employee, cost_employer } = req.body;

        const result = await pool.query(`
            INSERT INTO benefit_plans (name, type, description, provider, coverage_details, cost_employee, cost_employer)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, type, description, provider, coverage_details || {}, cost_employee || 0, cost_employer || 0]);

        logger.info('Benefit plan created', { planId: result.rows[0].id, name });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating benefit plan', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update benefit plan
router.put('/plans/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, description, provider, coverage_details, cost_employee, cost_employer, is_active } = req.body;

        const result = await pool.query(`
            UPDATE benefit_plans
            SET name = COALESCE($1, name),
                type = COALESCE($2, type),
                description = COALESCE($3, description),
                provider = COALESCE($4, provider),
                coverage_details = COALESCE($5, coverage_details),
                cost_employee = COALESCE($6, cost_employee),
                cost_employer = COALESCE($7, cost_employer),
                is_active = COALESCE($8, is_active),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *
        `, [name, type, description, provider, coverage_details, cost_employee, cost_employer, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Benefit plan not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating benefit plan', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// EMPLOYEE BENEFITS ROUTES
// ========================================

// Get my benefits
router.get('/my-benefits', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT eb.*, bp.name as plan_name, bp.type as plan_type, 
                   bp.provider, bp.coverage_details, bp.cost_employee
            FROM employee_benefits eb
            JOIN benefit_plans bp ON eb.benefit_plan_id = bp.id
            WHERE eb.employee_id = $1
            ORDER BY eb.enrollment_date DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching my benefits', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get all employee benefits (admin)
router.get('/enrollments', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { employee_id, plan_id, status } = req.query;

        let query = `
            SELECT eb.*, 
                   bp.name as plan_name, bp.type as plan_type,
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   d.name as department_name
            FROM employee_benefits eb
            JOIN benefit_plans bp ON eb.benefit_plan_id = bp.id
            JOIN user_profiles u ON eb.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            query += ` AND eb.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (plan_id) {
            query += ` AND eb.benefit_plan_id = $${params.length + 1}`;
            params.push(plan_id);
        }

        if (status) {
            query += ` AND eb.status = $${params.length + 1}`;
            params.push(status);
        }

        query += ' ORDER BY eb.enrollment_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching enrollments', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Enroll in benefit plan
router.post('/enroll', authenticateToken, async (req, res) => {
    try {
        const { benefit_plan_id, coverage_level, dependents } = req.body;
        const employeeId = req.user.id;

        // Check if plan exists and is active
        const plan = await pool.query(
            'SELECT * FROM benefit_plans WHERE id = $1 AND is_active = true',
            [benefit_plan_id]
        );

        if (plan.rows.length === 0) {
            return res.status(404).json({ error: 'Benefit plan not found or inactive' });
        }

        const result = await pool.query(`
            INSERT INTO employee_benefits (employee_id, benefit_plan_id, coverage_level, dependents)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (employee_id, benefit_plan_id) 
            DO UPDATE SET coverage_level = $3, dependents = $4, status = 'active', updated_at = NOW()
            RETURNING *
        `, [employeeId, benefit_plan_id, coverage_level || 'individual', dependents || []]);

        logger.info('Employee enrolled in benefit', { employeeId, planId: benefit_plan_id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error enrolling in benefit', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Unenroll from benefit
router.delete('/enrollments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership or admin
        const enrollment = await pool.query(
            'SELECT * FROM employee_benefits WHERE id = $1',
            [id]
        );

        if (enrollment.rows.length === 0) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        const isOwn = enrollment.rows[0].employee_id === req.user.id;
        const isAdmin = ['hr_manager', 'admin', 'super_admin'].includes(req.user.role);

        if (!isOwn && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Soft delete by setting status
        await pool.query(
            'UPDATE employee_benefits SET status = $1, updated_at = NOW() WHERE id = $2',
            ['cancelled', id]
        );

        res.json({ success: true, message: 'Enrollment cancelled' });
    } catch (error) {
        logger.error('Error cancelling enrollment', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get benefits stats
router.get('/stats', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM benefit_plans WHERE is_active = true) as active_plans,
                (SELECT COUNT(*) FROM employee_benefits WHERE status = 'active') as active_enrollments,
                (SELECT COALESCE(SUM(bp.cost_employer), 0) 
                 FROM employee_benefits eb 
                 JOIN benefit_plans bp ON eb.benefit_plan_id = bp.id 
                 WHERE eb.status = 'active') as total_employer_cost,
                (SELECT COUNT(DISTINCT employee_id) FROM employee_benefits WHERE status = 'active') as employees_with_benefits
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching benefits stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
