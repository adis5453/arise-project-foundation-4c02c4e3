const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Initialize projects table
const initProjectsTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE,
                description TEXT,
                status VARCHAR(50) DEFAULT 'active',
                priority VARCHAR(20) DEFAULT 'medium',
                start_date DATE,
                end_date DATE,
                budget DECIMAL(15, 2),
                progress INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add missing columns if table existed with old schema
        await pool.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS department_id UUID,
            ADD COLUMN IF NOT EXISTS team_id UUID,
            ADD COLUMN IF NOT EXISTS manager_id UUID
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                role VARCHAR(100),
                allocation_percentage INTEGER DEFAULT 100,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, employee_id)
            )
        `);

        logger.info('Projects tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize projects tables', { error: error.message });
    }
};

initProjectsTable();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, departmentId, teamId, managerId, search } = req.query;

        let query = `
            SELECT p.*,
                d.name as department_name,
                t.name as team_name,
                u.first_name || ' ' || u.last_name as manager_name,
                (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
            FROM projects p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN user_profiles u ON p.manager_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND p.status = $${paramIndex++}`;
            params.push(status);
        }
        if (departmentId) {
            query += ` AND p.department_id = $${paramIndex++}`;
            params.push(departmentId);
        }
        if (teamId) {
            query += ` AND p.team_id = $${paramIndex++}`;
            params.push(teamId);
        }
        if (managerId) {
            query += ` AND p.manager_id = $${paramIndex++}`;
            params.push(managerId);
        }
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching projects', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT p.*,
                d.name as department_name,
                t.name as team_name,
                u.first_name || ' ' || u.last_name as manager_name
            FROM projects p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN user_profiles u ON p.manager_id = u.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project members
        const membersResult = await pool.query(`
            SELECT pm.*, u.first_name, u.last_name, u.email, u.employee_id, u.profile_photo_url,
                   p.name as position
            FROM project_members pm
            JOIN user_profiles u ON pm.employee_id = u.id
            LEFT JOIN positions p ON u.position_id = p.id
            WHERE pm.project_id = $1
        `, [id]);

        res.json({
            ...result.rows[0],
            members: membersResult.rows
        });
    } catch (error) {
        logger.error('Error fetching project', { error: error.message, projectId: id });
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/', authenticateToken, async (req, res) => {
    const { name, code, description, status, priority, department_id, team_id, manager_id, start_date, end_date, budget } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO projects (name, code, description, status, priority, department_id, team_id, manager_id, start_date, end_date, budget)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [name, code, description, status || 'active', priority || 'medium', department_id, team_id, manager_id, start_date, end_date, budget]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating project', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, code, description, status, priority, department_id, team_id, manager_id, start_date, end_date, budget, progress } = req.body;

    try {
        const result = await pool.query(`
            UPDATE projects 
            SET name = COALESCE($1, name),
                code = COALESCE($2, code),
                description = COALESCE($3, description),
                status = COALESCE($4, status),
                priority = COALESCE($5, priority),
                department_id = COALESCE($6, department_id),
                team_id = COALESCE($7, team_id),
                manager_id = COALESCE($8, manager_id),
                start_date = COALESCE($9, start_date),
                end_date = COALESCE($10, end_date),
                budget = COALESCE($11, budget),
                progress = COALESCE($12, progress),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING *
        `, [name, code, description, status, priority, department_id, team_id, manager_id, start_date, end_date, budget, progress, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating project', { error: error.message, projectId: id });
        res.status(500).json({ error: error.message });
    }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        logger.error('Error deleting project', { error: error.message, projectId: id });
        res.status(500).json({ error: error.message });
    }
});

// Add member to project
router.post('/:id/members', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { employee_id, role, allocation_percentage } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO project_members (project_id, employee_id, role, allocation_percentage)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [id, employee_id, role, allocation_percentage || 100]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error adding project member', { error: error.message, projectId: id });
        res.status(500).json({ error: error.message });
    }
});

// Remove member from project
router.delete('/:id/members/:employeeId', authenticateToken, async (req, res) => {
    const { id, employeeId } = req.params;

    try {
        await pool.query('DELETE FROM project_members WHERE project_id = $1 AND employee_id = $2', [id, employeeId]);
        res.json({ message: 'Member removed from project' });
    } catch (error) {
        logger.error('Error removing project member', { error: error.message, projectId: id });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
