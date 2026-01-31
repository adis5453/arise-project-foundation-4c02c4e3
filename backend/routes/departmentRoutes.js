const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// ========================================
// DEPARTMENTS - Full CRUD
// ========================================

// GET all departments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, 
                   m.first_name || ' ' || m.last_name as manager_name,
                   m.email as manager_email,
                   (SELECT COUNT(*) FROM user_profiles WHERE department_id = d.id) as employee_count
            FROM departments d
            LEFT JOIN user_profiles m ON d.manager_id = m.id
            ORDER BY d.name
        `);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching departments', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// GET single department
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT d.*, 
                   m.first_name || ' ' || m.last_name as manager_name,
                   m.email as manager_email,
                   (SELECT COUNT(*) FROM user_profiles WHERE department_id = d.id) as employee_count,
                   (SELECT COUNT(*) FROM teams WHERE department_id = d.id) as team_count
            FROM departments d
            LEFT JOIN user_profiles m ON d.manager_id = m.id
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching department', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// CREATE department
router.post('/', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const { name, code, description, manager_id, parent_department_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO departments (name, code, description, manager_id, parent_department_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, code, description, manager_id, parent_department_id]
        );

        logger.info('Department created', { departmentId: result.rows[0].id, name });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating department', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// UPDATE department
router.put('/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    const { name, code, description, manager_id, parent_department_id, is_active } = req.body;
    try {
        const result = await pool.query(`
            UPDATE departments 
            SET name = COALESCE($1, name),
                code = COALESCE($2, code),
                description = COALESCE($3, description),
                manager_id = $4,
                parent_department_id = $5,
                is_active = COALESCE($6, is_active)
            WHERE id = $7 
            RETURNING *
        `, [name, code, description, manager_id, parent_department_id, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        logger.info('Department updated', { departmentId: id });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating department', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// DELETE department
router.delete('/:id', authenticateToken, checkRole(['admin', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    try {
        // Check if department has employees
        const employeeCheck = await pool.query(
            'SELECT COUNT(*) as count FROM user_profiles WHERE department_id = $1',
            [id]
        );

        if (parseInt(employeeCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete department with employees. Reassign employees first.',
                employee_count: parseInt(employeeCheck.rows[0].count)
            });
        }

        // Delete associated teams first
        await pool.query('DELETE FROM teams WHERE department_id = $1', [id]);

        // Delete associated positions
        await pool.query('DELETE FROM positions WHERE department_id = $1', [id]);

        // Delete the department
        const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING id, name', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        logger.info('Department deleted', { departmentId: id, name: result.rows[0].name });
        res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        logger.error('Error deleting department', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// TEAMS - Full CRUD (already exists, keeping as-is)
// ========================================

router.get('/teams', authenticateToken, async (req, res) => {
    try {
        const { departmentId } = req.query;
        let query = `
            SELECT t.*, d.name as department_name, 
            u.first_name || ' ' || u.last_name as lead_name,
            u.email as lead_email,
            u.employee_id as lead_employee_id,
            (SELECT COUNT(*) FROM user_profiles WHERE team_id = t.id) as members_count
            FROM teams t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN user_profiles u ON t.team_lead_id = u.id
        `;
        const params = [];
        if (departmentId) {
            query += ' WHERE t.department_id = $1';
            params.push(departmentId);
        }
        query += ' ORDER BY t.name';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single team
router.get('/teams/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT t.*, d.name as department_name, 
                   u.first_name || ' ' || u.last_name as lead_name,
                   (SELECT COUNT(*) FROM user_profiles WHERE team_id = t.id) as members_count
            FROM teams t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN user_profiles u ON t.team_lead_id = u.id
            WHERE t.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/teams', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin', 'department_manager']), async (req, res) => {
    const { name, department_id, team_lead_id, description, parent_team_id, type } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO teams (name, department_id, team_lead_id, description, parent_team_id, type) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, department_id, team_lead_id, description, parent_team_id, type]
        );
        logger.info('Team created', { teamId: result.rows[0].id, name });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/teams/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin', 'department_manager']), async (req, res) => {
    const { id } = req.params;
    const { name, department_id, team_lead_id, description, parent_team_id, type } = req.body;
    try {
        const result = await pool.query(
            `UPDATE teams 
             SET name=$1, department_id=$2, team_lead_id=$3, description=$4, parent_team_id=$5, type=$6, updated_at=NOW()
             WHERE id=$7 RETURNING *`,
            [name, department_id, team_lead_id, description, parent_team_id, type, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/teams/:id/members', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.employee_id, u.first_name, u.last_name, u.email,
                u.profile_photo_url, u.status, u.hire_date,
                p.name as position_name,
                CASE WHEN t.team_lead_id = u.id THEN true ELSE false END as is_team_lead
            FROM user_profiles u
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.team_id = $1 AND u.status = 'active'
            ORDER BY 
                CASE WHEN t.team_lead_id = u.id THEN 0 ELSE 1 END,
                u.first_name
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/teams/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE user_profiles SET team_id = NULL WHERE team_id = $1', [id]);
        const result = await pool.query('DELETE FROM teams WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }

        logger.info('Team deleted', { teamId: id });
        res.json({ success: true, message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// POSITIONS - Full CRUD
// ========================================

// GET all positions
router.get('/positions', authenticateToken, async (req, res) => {
    const { departmentId } = req.query;
    let query = `
        SELECT p.*, d.name as department_name,
               (SELECT COUNT(*) FROM user_profiles WHERE position_id = p.id) as employee_count
        FROM positions p
        LEFT JOIN departments d ON p.department_id = d.id
    `;
    const params = [];

    if (departmentId) {
        query += ' WHERE p.department_id = $1';
        params.push(departmentId);
    }
    query += ' ORDER BY p.name';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single position
router.get('/positions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, d.name as department_name,
                   (SELECT COUNT(*) FROM user_profiles WHERE position_id = p.id) as employee_count
            FROM positions p
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Position not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// CREATE position
router.post('/positions', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const { name, title, department_id, description, requirements, is_active } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO positions (name, department_id, is_active) 
             VALUES ($1, $2, COALESCE($3, true)) RETURNING *`,
            [name || title, department_id, is_active]
        );
        logger.info('Position created', { positionId: result.rows[0].id, name: name || title });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE position
router.put('/positions/:id', authenticateToken, checkRole(['hr_manager', 'admin', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    const { name, title, department_id, description, requirements, is_active } = req.body;
    try {
        const result = await pool.query(`
            UPDATE positions 
            SET name = COALESCE($1, name),
                department_id = COALESCE($2, department_id),
                is_active = COALESCE($3, is_active)
            WHERE id = $4 
            RETURNING *
        `, [name || title, department_id, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Position not found' });
        }

        logger.info('Position updated', { positionId: id });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE position
router.delete('/positions/:id', authenticateToken, checkRole(['admin', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    try {
        // Check if position has employees
        const employeeCheck = await pool.query(
            'SELECT COUNT(*) as count FROM user_profiles WHERE position_id = $1',
            [id]
        );

        if (parseInt(employeeCheck.rows[0].count) > 0) {
            return res.status(400).json({
                error: 'Cannot delete position with assigned employees. Reassign employees first.',
                employee_count: parseInt(employeeCheck.rows[0].count)
            });
        }

        const result = await pool.query('DELETE FROM positions WHERE id = $1 RETURNING id, name', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Position not found' });
        }

        logger.info('Position deleted', { positionId: id });
        res.json({ success: true, message: 'Position deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

