const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize Tables
const initComplianceTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS compliance_items (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(50), -- policy, certification, training, document
                type VARCHAR(50), -- mandatory, recommended, optional
                frequency VARCHAR(20), -- once, annually, quarterly, monthly
                due_date DATE,
                department_id UUID REFERENCES departments(id),
                applies_to VARCHAR(50) DEFAULT 'all', -- all, department, role
                created_by UUID REFERENCES user_profiles(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS employee_compliance (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id),
                compliance_item_id INTEGER REFERENCES compliance_items(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending', -- pending, completed, overdue, exempted
                completion_date TIMESTAMP,
                expiry_date DATE,
                document_url VARCHAR(500),
                notes TEXT,
                verified_by UUID REFERENCES user_profiles(id),
                verified_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, compliance_item_id)
            );
        `);
        logger.info('Compliance tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize compliance tables', error);
    }
};

initComplianceTables();

// Routes

// Get compliance items
router.get('/items', authenticateToken, async (req, res) => {
    const { category, type, department_id, active_only } = req.query;

    try {
        let query = `
            SELECT c.*, 
                   d.name as department_name,
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM compliance_items c
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN user_profiles u ON c.created_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (active_only !== 'false') {
            query += ` AND c.is_active = true`;
        }
        if (category) {
            query += ` AND c.category = $${paramIndex++}`;
            params.push(category);
        }
        if (type) {
            query += ` AND c.type = $${paramIndex++}`;
            params.push(type);
        }
        if (department_id) {
            query += ` AND c.department_id = $${paramIndex++}`;
            params.push(department_id);
        }

        query += ' ORDER BY c.due_date ASC NULLS LAST, c.title';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching compliance items', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get employee compliance status
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
    const { employeeId } = req.params;

    try {
        const result = await pool.query(`
            SELECT ec.*, 
                   ci.title, ci.description, ci.category, ci.type, ci.frequency, ci.due_date as item_due_date,
                   v.first_name || ' ' || v.last_name as verified_by_name
            FROM employee_compliance ec
            JOIN compliance_items ci ON ec.compliance_item_id = ci.id
            LEFT JOIN user_profiles v ON ec.verified_by = v.id
            WHERE ec.employee_id = $1 AND ci.is_active = true
            ORDER BY 
                CASE ec.status WHEN 'overdue' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
                ec.expiry_date ASC NULLS LAST
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching employee compliance', { employeeId, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get my compliance status
router.get('/my-status', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ec.*, 
                   ci.title, ci.description, ci.category, ci.type, ci.frequency
            FROM employee_compliance ec
            JOIN compliance_items ci ON ec.compliance_item_id = ci.id
            WHERE ec.employee_id = $1 AND ci.is_active = true
            ORDER BY 
                CASE ec.status WHEN 'overdue' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
                ec.expiry_date ASC NULLS LAST
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching my compliance', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create compliance item
router.post('/items', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { title, description, category, type, frequency, due_date, department_id, applies_to } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO compliance_items (
                title, description, category, type, frequency, 
                due_date, department_id, applies_to, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [title, description, category, type, frequency, due_date, department_id, applies_to, req.user.id]);

        logger.info('Compliance item created', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating compliance item', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update compliance item
router.put('/items/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { id } = req.params;
    const { title, description, category, type, frequency, due_date, department_id, applies_to, is_active } = req.body;

    try {
        const result = await pool.query(`
            UPDATE compliance_items SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                type = COALESCE($4, type),
                frequency = COALESCE($5, frequency),
                due_date = COALESCE($6, due_date),
                department_id = COALESCE($7, department_id),
                applies_to = COALESCE($8, applies_to),
                is_active = COALESCE($9, is_active),
                updated_at = NOW()
            WHERE id = $10
            RETURNING *
        `, [title, description, category, type, frequency, due_date, department_id, applies_to, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Compliance item not found' });
        }

        logger.info('Compliance item updated', { id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating compliance item', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Complete/Update employee compliance
router.post('/complete', authenticateToken, async (req, res) => {
    const { compliance_item_id, document_url, notes, expiry_date } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO employee_compliance (
                employee_id, compliance_item_id, status, completion_date, document_url, notes, expiry_date
            ) VALUES ($1, $2, 'completed', NOW(), $3, $4, $5)
            ON CONFLICT (employee_id, compliance_item_id) 
            DO UPDATE SET 
                status = 'completed',
                completion_date = NOW(),
                document_url = COALESCE($3, employee_compliance.document_url),
                notes = COALESCE($4, employee_compliance.notes),
                expiry_date = COALESCE($5, employee_compliance.expiry_date),
                updated_at = NOW()
            RETURNING *
        `, [req.user.id, compliance_item_id, document_url, notes, expiry_date]);

        logger.info('Compliance completed', { employee: req.user.id, item: compliance_item_id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error completing compliance', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Verify employee compliance (admin)
router.post('/verify/:recordId', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { recordId } = req.params;
    const { notes } = req.body;

    try {
        const result = await pool.query(`
            UPDATE employee_compliance SET
                verified_by = $1,
                verified_at = NOW(),
                notes = COALESCE($2, notes),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [req.user.id, notes, recordId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Compliance record not found' });
        }

        logger.info('Compliance verified', { id: recordId, verifier: req.user.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error verifying compliance', { recordId, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get compliance statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        let query;
        const params = [];

        if (['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM compliance_items WHERE is_active = true) as total_items,
                    (SELECT COUNT(*) FROM employee_compliance WHERE status = 'completed') as total_completed,
                    (SELECT COUNT(*) FROM employee_compliance WHERE status = 'pending') as total_pending,
                    (SELECT COUNT(*) FROM employee_compliance WHERE status = 'overdue') as total_overdue,
                    (SELECT COUNT(DISTINCT employee_id) FROM employee_compliance WHERE status = 'completed') as compliant_employees
            `;
        } else {
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM employee_compliance WHERE employee_id = $1 AND status = 'completed') as completed,
                    (SELECT COUNT(*) FROM employee_compliance WHERE employee_id = $1 AND status = 'pending') as pending,
                    (SELECT COUNT(*) FROM employee_compliance WHERE employee_id = $1 AND status = 'overdue') as overdue
            `;
            params.push(req.user.id);
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching compliance stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
