const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// Self-Healing Schema Initialization
// ========================================
const initPayrollTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payroll_records (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                basic_salary NUMERIC(12, 2),
                allowances JSONB DEFAULT '{}',
                deductions JSONB DEFAULT '{}',
                gross_salary NUMERIC(12, 2),
                net_salary NUMERIC(12, 2),
                status VARCHAR(50) DEFAULT 'draft',
                processed_by UUID REFERENCES user_profiles(id),
                processed_at TIMESTAMP,
                paid_at TIMESTAMP,
                payment_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fix: Ensure columns exist (fixing "column pr.period_start does not exist" error)
        try {
            await pool.query(`
                ALTER TABLE payroll_records 
                ADD COLUMN IF NOT EXISTS period_start DATE,
                ADD COLUMN IF NOT EXISTS period_end DATE,
                ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS allowances JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS deductions JSONB DEFAULT '{}',
                ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS net_salary NUMERIC(12, 2),
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft',
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
        } catch (e) {
            logger.warn('Failed to add columns to payroll_records', { error: e.message });
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS salary_components (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'allowance' or 'deduction'
                calculation_type VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'percentage'
                default_value NUMERIC(12, 2),
                is_taxable BOOLEAN DEFAULT true,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        logger.info('Payroll module tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize payroll tables', { error: error.message });
    }
};

initPayrollTables();

// ========================================
// PAYROLL ROUTES
// ========================================

// Get all payroll records
router.get('/records', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { employee_id, status, period_start, period_end } = req.query;

        let query = `
            SELECT pr.*, 
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as employee_code,
                   u.email,
                   d.name as department_name
            FROM payroll_records pr
            LEFT JOIN user_profiles u ON pr.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE 1=1
        `;
        const params = [];

        if (employee_id) {
            query += ` AND pr.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        if (status) {
            query += ` AND pr.status = $${params.length + 1}`;
            params.push(status);
        }

        if (period_start) {
            query += ` AND pr.period_start >= $${params.length + 1}`;
            params.push(period_start);
        }

        if (period_end) {
            query += ` AND pr.period_end <= $${params.length + 1}`;
            params.push(period_end);
        }

        query += ' ORDER BY pr.period_start DESC, pr.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching payroll records', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get my payslips (employee view)
router.get('/my-payslips', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM payroll_records 
            WHERE employee_id = $1 AND status = 'paid'
            ORDER BY period_start DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching payslips', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get single payroll record
router.get('/records/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT pr.*, 
                   u.first_name, u.last_name, u.employee_id as employee_code, u.email,
                   u.salary as base_salary,
                   d.name as department_name,
                   p.first_name || ' ' || p.last_name as processed_by_name
            FROM payroll_records pr
            LEFT JOIN user_profiles u ON pr.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN user_profiles p ON pr.processed_by = p.id
            WHERE pr.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }

        // Verify access
        const record = result.rows[0];
        const isOwn = record.employee_id === req.user.id;
        const isAdmin = ['hr_manager', 'admin', 'super_admin'].includes(req.user.role);

        if (!isOwn && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(record);
    } catch (error) {
        logger.error('Error fetching payroll record', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create/Generate payroll for period
router.post('/generate', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { period_start, period_end, employee_ids } = req.body;

        // Get employees to generate payroll for
        let employeeQuery = `
            SELECT id, salary, first_name, last_name, employee_id 
            FROM user_profiles 
            WHERE status = 'active' AND salary IS NOT NULL
        `;
        const params = [];

        if (employee_ids && employee_ids.length > 0) {
            employeeQuery += ` AND id = ANY($1)`;
            params.push(employee_ids);
        }

        const employees = await pool.query(employeeQuery, params);

        const generated = [];
        for (const emp of employees.rows) {
            // Check if already exists
            const existing = await pool.query(
                'SELECT id FROM payroll_records WHERE employee_id = $1 AND period_start = $2 AND period_end = $3',
                [emp.id, period_start, period_end]
            );

            if (existing.rows.length > 0) {
                continue; // Skip if already exists
            }

            const basicSalary = emp.salary || 0;
            const allowances = { hra: basicSalary * 0.4, da: basicSalary * 0.1 };
            const deductions = { pf: basicSalary * 0.12, tax: basicSalary * 0.1 };
            const totalAllowances = Object.values(allowances).reduce((a, b) => a + b, 0);
            const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
            const grossSalary = basicSalary + totalAllowances;
            const netSalary = grossSalary - totalDeductions;

            const result = await pool.query(`
                INSERT INTO payroll_records 
                (employee_id, period_start, period_end, basic_salary, allowances, deductions, gross_salary, net_salary, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
                RETURNING *
            `, [emp.id, period_start, period_end, basicSalary, allowances, deductions, grossSalary, netSalary]);

            generated.push(result.rows[0]);
        }

        logger.info('Payroll generated', { period_start, period_end, count: generated.length });
        res.json({ message: `Generated ${generated.length} payroll records`, records: generated });
    } catch (error) {
        logger.error('Error generating payroll', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update payroll record
router.put('/records/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { basic_salary, allowances, deductions, status, notes } = req.body;

        // Recalculate totals if components changed
        let grossSalary, netSalary;
        if (basic_salary !== undefined || allowances !== undefined || deductions !== undefined) {
            const current = await pool.query('SELECT * FROM payroll_records WHERE id = $1', [id]);
            if (current.rows.length === 0) {
                return res.status(404).json({ error: 'Record not found' });
            }

            const rec = current.rows[0];
            const newBasic = basic_salary ?? rec.basic_salary;
            const newAllowances = allowances ?? rec.allowances;
            const newDeductions = deductions ?? rec.deductions;

            const totalAllowances = Object.values(newAllowances || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
            const totalDeductions = Object.values(newDeductions || {}).reduce((a, b) => a + (parseFloat(b) || 0), 0);
            grossSalary = parseFloat(newBasic) + totalAllowances;
            netSalary = grossSalary - totalDeductions;
        }

        const result = await pool.query(`
            UPDATE payroll_records
            SET basic_salary = COALESCE($1, basic_salary),
                allowances = COALESCE($2, allowances),
                deductions = COALESCE($3, deductions),
                gross_salary = COALESCE($4, gross_salary),
                net_salary = COALESCE($5, net_salary),
                status = COALESCE($6, status),
                notes = COALESCE($7, notes),
                processed_by = CASE WHEN $6 = 'processed' THEN $8 ELSE processed_by END,
                processed_at = CASE WHEN $6 = 'processed' THEN NOW() ELSE processed_at END,
                paid_at = CASE WHEN $6 = 'paid' THEN NOW() ELSE paid_at END,
                updated_at = NOW()
            WHERE id = $9
            RETURNING *
        `, [basic_salary, allowances, deductions, grossSalary, netSalary, status, notes, req.user.id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating payroll record', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get payroll stats
router.get('/stats', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM payroll_records WHERE status = 'draft') as draft_count,
                (SELECT COUNT(*) FROM payroll_records WHERE status = 'processed') as processed_count,
                (SELECT COUNT(*) FROM payroll_records WHERE status = 'paid') as paid_count,
                (SELECT COALESCE(SUM(net_salary), 0) FROM payroll_records WHERE status = 'paid' 
                 AND EXTRACT(MONTH FROM period_start) = EXTRACT(MONTH FROM CURRENT_DATE)) as current_month_paid,
                (SELECT COALESCE(SUM(net_salary), 0) FROM payroll_records WHERE status = 'pending'
                 OR status = 'processed') as pending_amount
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching payroll stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get salary components
router.get('/components', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM salary_components WHERE is_active = true ORDER BY type, name'
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching salary components', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
