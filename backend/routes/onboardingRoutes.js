const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// Self-Healing Schema - Uses existing onboarding_tasks table from schema.sql
// ========================================
const initOnboardingTables = async () => {
    try {
        // Onboarding templates table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                department_id UUID REFERENCES departments(id),
                position_id UUID REFERENCES positions(id),
                tasks JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT true,
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Onboarding processes (employee onboarding instances)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS onboarding_processes (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                template_id INTEGER REFERENCES onboarding_templates(id),
                start_date DATE DEFAULT CURRENT_DATE,
                expected_end_date DATE,
                actual_end_date DATE,
                status VARCHAR(50) DEFAULT 'in_progress',
                progress_percentage INTEGER DEFAULT 0,
                assigned_buddy_id UUID REFERENCES user_profiles(id),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        logger.info('Onboarding module tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize onboarding tables', { error: error.message });
    }
};

initOnboardingTables();

// ========================================
// ONBOARDING TEMPLATES ROUTES
// ========================================

// Get all templates
router.get('/templates', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ot.*, 
                   d.name as department_name,
                   p.name as position_name,
                   u.first_name || ' ' || u.last_name as created_by_name
            FROM onboarding_templates ot
            LEFT JOIN departments d ON ot.department_id = d.id
            LEFT JOIN positions p ON ot.position_id = p.id
            LEFT JOIN user_profiles u ON ot.created_by = u.id
            WHERE ot.is_active = true
            ORDER BY ot.name
        `);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching onboarding templates', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Create template
router.post('/templates', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { name, description, department_id, position_id, tasks } = req.body;

        const result = await pool.query(`
            INSERT INTO onboarding_templates (name, description, department_id, position_id, tasks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, description, department_id, position_id, tasks || [], req.user.id]);

        logger.info('Onboarding template created', { templateId: result.rows[0].id, name });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating template', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update template
router.put('/templates/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, department_id, position_id, tasks, is_active } = req.body;

        const result = await pool.query(`
            UPDATE onboarding_templates
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                department_id = COALESCE($3, department_id),
                position_id = COALESCE($4, position_id),
                tasks = COALESCE($5, tasks),
                is_active = COALESCE($6, is_active),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `, [name, description, department_id, position_id, tasks, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating template', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// ONBOARDING PROCESSES ROUTES
// ========================================

// Get all active onboarding processes
router.get('/processes', authenticateToken, async (req, res) => {
    try {
        const { status, employee_id } = req.query;
        const userRole = req.user.role?.toLowerCase();

        let query = `
            SELECT op.*, 
                   e.first_name || ' ' || e.last_name as employee_name,
                   e.employee_id as employee_code,
                   e.email as employee_email,
                   d.name as department_name,
                   b.first_name || ' ' || b.last_name as buddy_name,
                   ot.name as template_name
            FROM onboarding_processes op
            JOIN user_profiles e ON op.employee_id = e.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN user_profiles b ON op.assigned_buddy_id = b.id
            LEFT JOIN onboarding_templates ot ON op.template_id = ot.id
            WHERE 1=1
        `;
        const params = [];

        // Non-admins can only see their own or their team's onboarding
        if (!['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            query += ` AND (op.employee_id = $${params.length + 1} OR op.assigned_buddy_id = $${params.length + 1})`;
            params.push(req.user.id);
        }

        if (status) {
            query += ` AND op.status = $${params.length + 1}`;
            params.push(status);
        }

        if (employee_id) {
            query += ` AND op.employee_id = $${params.length + 1}`;
            params.push(employee_id);
        }

        query += ' ORDER BY op.start_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching onboarding processes', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get my onboarding (for new employees)
router.get('/my-onboarding', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT op.*, 
                   ot.name as template_name,
                   ot.tasks as template_tasks,
                   b.first_name || ' ' || b.last_name as buddy_name,
                   b.email as buddy_email
            FROM onboarding_processes op
            LEFT JOIN onboarding_templates ot ON op.template_id = ot.id
            LEFT JOIN user_profiles b ON op.assigned_buddy_id = b.id
            WHERE op.employee_id = $1
            ORDER BY op.start_date DESC
            LIMIT 1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.json(null);
        }

        // Get tasks for this employee
        const tasks = await pool.query(`
            SELECT * FROM onboarding_tasks 
            WHERE employee_id = $1 
            ORDER BY priority DESC, due_date ASC
        `, [req.user.id]);

        const process = result.rows[0];
        process.tasks = tasks.rows;

        res.json(process);
    } catch (error) {
        logger.error('Error fetching my onboarding', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Start onboarding for employee
router.post('/start', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const { employee_id, template_id, assigned_buddy_id, expected_end_date } = req.body;

        // Create onboarding process
        const process = await pool.query(`
            INSERT INTO onboarding_processes 
            (employee_id, template_id, assigned_buddy_id, expected_end_date)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [employee_id, template_id, assigned_buddy_id, expected_end_date]);

        // If template has tasks, create them for the employee
        if (template_id) {
            const template = await pool.query(
                'SELECT tasks FROM onboarding_templates WHERE id = $1',
                [template_id]
            );

            if (template.rows.length > 0 && template.rows[0].tasks) {
                const tasks = template.rows[0].tasks;
                for (const task of tasks) {
                    await pool.query(`
                        INSERT INTO onboarding_tasks 
                        (employee_id, task_name, description, category, priority, due_date, assigned_to)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [
                        employee_id,
                        task.name,
                        task.description,
                        task.category || 'general',
                        task.priority || 'medium',
                        task.due_days ? new Date(Date.now() + task.due_days * 24 * 60 * 60 * 1000) : null,
                        assigned_buddy_id || employee_id
                    ]);
                }
            }
        }

        logger.info('Onboarding started', { employeeId: employee_id, processId: process.rows[0].id });
        res.status(201).json(process.rows[0]);
    } catch (error) {
        logger.error('Error starting onboarding', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// ONBOARDING TASKS ROUTES
// ========================================

// Get tasks for employee
router.get('/tasks/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;

        const result = await pool.query(`
            SELECT ot.*, 
                   a.first_name || ' ' || a.last_name as assigned_to_name
            FROM onboarding_tasks ot
            LEFT JOIN user_profiles a ON ot.assigned_to = a.id
            WHERE ot.employee_id = $1
            ORDER BY ot.priority DESC, ot.due_date ASC
        `, [employeeId]);

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching tasks', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update task status
router.put('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const result = await pool.query(`
            UPDATE onboarding_tasks
            SET status = COALESCE($1, status),
                completed_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_date END,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Update process progress
        const task = result.rows[0];
        const progressResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'completed') as completed
            FROM onboarding_tasks
            WHERE employee_id = $1
        `, [task.employee_id]);

        const progress = progressResult.rows[0];
        const percentage = Math.round((parseInt(progress.completed) / parseInt(progress.total)) * 100);

        await pool.query(`
            UPDATE onboarding_processes
            SET progress_percentage = $1,
                status = CASE WHEN $1 = 100 THEN 'completed' ELSE status END,
                actual_end_date = CASE WHEN $1 = 100 THEN CURRENT_DATE ELSE actual_end_date END,
                updated_at = NOW()
            WHERE employee_id = $2 AND status != 'completed'
        `, [percentage, task.employee_id]);

        res.json({ ...result.rows[0], progress_percentage: percentage });
    } catch (error) {
        logger.error('Error updating task', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get onboarding stats
router.get('/stats', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM onboarding_processes WHERE status = 'in_progress') as in_progress,
                (SELECT COUNT(*) FROM onboarding_processes WHERE status = 'completed') as completed,
                (SELECT AVG(progress_percentage) FROM onboarding_processes WHERE status = 'in_progress') as avg_progress,
                (SELECT COUNT(*) FROM onboarding_tasks WHERE status = 'pending') as pending_tasks,
                (SELECT COUNT(*) FROM onboarding_templates WHERE is_active = true) as active_templates
        `);

        const stats = result.rows[0];
        stats.avg_progress = Math.round(parseFloat(stats.avg_progress) || 0);

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching onboarding stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
