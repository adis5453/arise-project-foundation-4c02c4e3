const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize Tables
const initExpenseTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS expense_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                max_amount DECIMAL(10,2),
                requires_receipt BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id),
                category_id INTEGER REFERENCES expense_categories(id),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                expense_date DATE NOT NULL,
                receipt_url VARCHAR(500),
                receipt_name VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, reimbursed
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_by UUID REFERENCES user_profiles(id),
                reviewed_at TIMESTAMP,
                review_notes TEXT,
                reimbursed_at TIMESTAMP,
                payment_method VARCHAR(50),
                payment_reference VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Insert default categories if empty
            INSERT INTO expense_categories (name, description, max_amount, requires_receipt)
            SELECT * FROM (VALUES
                ('Travel', 'Transportation and lodging expenses', 5000.00, true),
                ('Meals', 'Food and beverage expenses', 100.00, true),
                ('Equipment', 'Office equipment and supplies', 1000.00, true),
                ('Software', 'Software licenses and subscriptions', 500.00, false),
                ('Training', 'Professional development and courses', 2000.00, true),
                ('Communication', 'Phone and internet expenses', 200.00, false),
                ('Other', 'Miscellaneous expenses', 500.00, true)
            ) AS v(name, description, max_amount, requires_receipt)
            WHERE NOT EXISTS (SELECT 1 FROM expense_categories LIMIT 1);
        `);
        logger.info('Expenses tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize expenses tables', error);
    }
};

initExpenseTables();

// Routes

// Get expense categories
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expense_categories WHERE is_active = true ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching expense categories', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get expenses with filtering
router.get('/', authenticateToken, async (req, res) => {
    const { status, category_id, employee_id, from_date, to_date } = req.query;

    try {
        let query = `
            SELECT e.*, 
                   u.first_name || ' ' || u.last_name as employee_name,
                   c.name as category_name,
                   r.first_name || ' ' || r.last_name as reviewer_name
            FROM expenses e
            JOIN user_profiles u ON e.employee_id = u.id
            LEFT JOIN expense_categories c ON e.category_id = c.id
            LEFT JOIN user_profiles r ON e.reviewed_by = r.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        // If not admin/manager, only show own expenses
        if (!['super_admin', 'admin', 'hr_manager', 'manager'].includes(req.user.role)) {
            query += ` AND e.employee_id = $${paramIndex++}`;
            params.push(req.user.id);
        } else if (employee_id) {
            query += ` AND e.employee_id = $${paramIndex++}`;
            params.push(employee_id);
        }

        if (status) {
            query += ` AND e.status = $${paramIndex++}`;
            params.push(status);
        }
        if (category_id) {
            query += ` AND e.category_id = $${paramIndex++}`;
            params.push(category_id);
        }
        if (from_date) {
            query += ` AND e.expense_date >= $${paramIndex++}`;
            params.push(from_date);
        }
        if (to_date) {
            query += ` AND e.expense_date <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ' ORDER BY e.submitted_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching expenses', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get single expense
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            SELECT e.*, 
                   u.first_name || ' ' || u.last_name as employee_name,
                   c.name as category_name,
                   r.first_name || ' ' || r.last_name as reviewer_name
            FROM expenses e
            JOIN user_profiles u ON e.employee_id = u.id
            LEFT JOIN expense_categories c ON e.category_id = c.id
            LEFT JOIN user_profiles r ON e.reviewed_by = r.id
            WHERE e.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching expense', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create expense
router.post('/', authenticateToken, async (req, res) => {
    const { category_id, title, description, amount, currency, expense_date, receipt_url, receipt_name } = req.body;

    if (!title || !amount || !expense_date) {
        return res.status(400).json({ error: 'Title, amount, and expense_date are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO expenses (
                employee_id, category_id, title, description, amount, currency, 
                expense_date, receipt_url, receipt_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            req.user.id, category_id, title, description, amount,
            currency || 'USD', expense_date, receipt_url, receipt_name
        ]);

        logger.info('Expense created', { id: result.rows[0].id, employee: req.user.id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating expense', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update expense (only own pending expenses)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { category_id, title, description, amount, currency, expense_date, receipt_url, receipt_name } = req.body;

    try {
        // Check ownership and status
        const check = await pool.query(
            'SELECT * FROM expenses WHERE id = $1 AND employee_id = $2 AND status = $3',
            [id, req.user.id, 'pending']
        );
        if (check.rows.length === 0) {
            return res.status(403).json({ error: 'Cannot update this expense' });
        }

        const result = await pool.query(`
            UPDATE expenses SET
                category_id = COALESCE($1, category_id),
                title = COALESCE($2, title),
                description = COALESCE($3, description),
                amount = COALESCE($4, amount),
                currency = COALESCE($5, currency),
                expense_date = COALESCE($6, expense_date),
                receipt_url = COALESCE($7, receipt_url),
                receipt_name = COALESCE($8, receipt_name),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *
        `, [category_id, title, description, amount, currency, expense_date, receipt_url, receipt_name, id]);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating expense', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Approve/Reject expense
router.post('/:id/review', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'manager']), async (req, res) => {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    try {
        const result = await pool.query(`
            UPDATE expenses SET
                status = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                review_notes = $3,
                updated_at = NOW()
            WHERE id = $4 AND status = 'pending'
            RETURNING *
        `, [status, req.user.id, review_notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found or already reviewed' });
        }

        logger.info('Expense reviewed', { id, status, reviewer: req.user.id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error reviewing expense', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Mark as reimbursed
router.post('/:id/reimburse', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager']), async (req, res) => {
    const { id } = req.params;
    const { payment_method, payment_reference } = req.body;

    try {
        const result = await pool.query(`
            UPDATE expenses SET
                status = 'reimbursed',
                reimbursed_at = NOW(),
                payment_method = $1,
                payment_reference = $2,
                updated_at = NOW()
            WHERE id = $3 AND status = 'approved'
            RETURNING *
        `, [payment_method, payment_reference, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found or not approved' });
        }

        logger.info('Expense reimbursed', { id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error reimbursing expense', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Delete expense (only own pending)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM expenses WHERE id = $1 AND employee_id = $2 AND status = $3 RETURNING id',
            [id, req.user.id, 'pending']
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Cannot delete this expense' });
        }

        logger.info('Expense deleted', { id });
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        logger.error('Error deleting expense', { id, error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get expense statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
    try {
        let statsQuery;
        const params = [];

        if (['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            // Admin view - all expenses
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM expenses WHERE status = 'pending') as pending_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'pending') as pending_amount,
                    (SELECT COUNT(*) FROM expenses WHERE status = 'approved') as approved_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'approved') as approved_amount,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE status = 'reimbursed' AND reimbursed_at > NOW() - INTERVAL '30 days') as monthly_reimbursed
            `;
        } else {
            // Employee view - own expenses
            statsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM expenses WHERE employee_id = $1 AND status = 'pending') as pending_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE employee_id = $1 AND status = 'pending') as pending_amount,
                    (SELECT COUNT(*) FROM expenses WHERE employee_id = $1 AND status = 'approved') as approved_count,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE employee_id = $1 AND status = 'approved') as approved_amount,
                    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE employee_id = $1 AND status = 'reimbursed') as total_reimbursed
            `;
            params.push(req.user.id);
        }

        const result = await pool.query(statsQuery, params);
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching expense stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
