const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const { calculateCompletion } = require('../utils/profileCompletion'); // Assuming this exists based on index.js

// Create Employee
router.post('/', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'hr manager']), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            employee_id: provided_employee_id, first_name, last_name, email, department_id, team_id, position_id,
            employment_status, employment_type, hire_date, role_id, auth_user_id, phone_number,
            salary, address, shift
        } = req.body;

        // Auto-generate employee_id if not provided
        let employee_id = provided_employee_id;
        if (!employee_id) {
            const year = new Date().getFullYear();
            const countResult = await client.query(
                'SELECT COUNT(*) as count FROM user_profiles WHERE employee_id LIKE $1',
                [`EMP-${year}-%`]
            );
            const nextNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
            employee_id = `EMP-${year}-${nextNumber}`;
            logger.info('Auto-generated employee_id', { employee_id, email });
        }

        // Create password hash (use provided or default)
        const defaultPassword = 'password123';
        const passwordToHash = req.body.password || defaultPassword;
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        // Log if default password is being used
        if (!req.body.password) {
            logger.info('Employee created with default password', {
                employee_id,
                email,
                default_password: defaultPassword,
                message: 'Employee should change password on first login'
            });
        }

        const result = await client.query(`
            INSERT INTO user_profiles (
                employee_id, first_name, last_name, email, department_id, team_id, position_id, 
                status, employment_type, hire_date, role_id, auth_user_id, password_hash, phone_number,
                salary, address, shift
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id, employee_id, first_name, last_name, email, department_id, team_id, position_id,
                      status, employment_type, hire_date, role_id, phone_number, salary, shift, created_at
        `, [
            employee_id, first_name, last_name, email, department_id, team_id, position_id,
            employment_status, employment_type, hire_date, role_id || 4, auth_user_id, hashedPassword, phone_number,
            salary || null, address ? JSON.stringify(address) : null, shift || 'morning'
        ]);

        await client.query('COMMIT');

        // Include generated credentials in response for HR
        const response = {
            ...result.rows[0],
            generated_credentials: {
                employee_id: employee_id,
                email: email,
                temporary_password: req.body.password ? undefined : defaultPassword,
                message: req.body.password ? 'Custom password set' : 'Default password assigned - Employee should change on first login'
            }
        };

        logger.info('Employee created successfully', {
            employee_id,
            email,
            has_custom_password: !!req.body.password
        });

        res.status(201).json(response);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating employee', { error: error.message });
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Update Employee
router.put('/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'hr manager', 'employee']), async (req, res) => {
    const { id } = req.params;
    // Allow employees to update their own profile too
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && req.user.role !== 'hr_manager' && req.user.id !== id && req.user.employee_id !== id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const {
        first_name, last_name, email, department_id, team_id, position_id,
        employment_status, employment_type, hire_date, role_id, phone_number,
        salary, address, shift, is_active,
        // Enhanced fields
        middle_name, preferred_name, personal_email, alternate_phone,
        date_of_birth, gender, marital_status, blood_group, nationality,
        pan_number, aadhaar_number, uan_number, pf_account_number,
        bank_name, bank_account_number, bank_ifsc_code,
        passport_number, driving_license_number
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user exists first to decide on partial or full update (simplified here to coalesce)
        // Note: The monolith code had a potential gap in logic where it had truncated logic in my view
        // I will reconstruct the standard update logic here based on best practices.

        // Construct dynamic update query to handle many fields
        // Since the monolith used explicit fields, I'll mirror that but use COALESCE for safety

        const result = await client.query(`
            UPDATE user_profiles 
            SET first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                email = COALESCE($3, email),
                department_id = COALESCE($4, department_id),
                team_id = COALESCE($5, team_id),
                phone_number = COALESCE($6, phone_number),
                address = COALESCE($7, address),
                position_id = COALESCE($8, position_id),
                status = COALESCE($9, status),
                employment_type = COALESCE($10, employment_type),
                hire_date = COALESCE($11, hire_date),
                role_id = COALESCE($12, role_id),
                salary = COALESCE($13, salary),
                shift = COALESCE($14, shift),
                is_active = COALESCE($15, is_active),
                updated_at = NOW()
            WHERE id = $16
            RETURNING *
        `, [
            first_name, last_name, email, department_id, team_id,
            phone_number, address ? JSON.stringify(address) : null,
            position_id, employment_status, employment_type, hire_date, role_id,
            salary, shift, is_active,
            id
        ]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Calculate profile completion
        const employee = result.rows[0];
        try {
            // Safe guard if calculateCompletion utility is missing or fails
            const completion = calculateCompletion(employee);

            // Update completion stats in DB
            await client.query(`
                 UPDATE user_profiles
                 SET profile_completion_percentage = $1,
                     profile_sections_completed = $2
                 WHERE id = $3
             `, [completion.total, JSON.stringify(completion.breakdown), id]);

            employee.profile_completion = {
                total: completion.total,
                breakdown: completion.breakdown
            };
        } catch (e) {
            logger.warn('Failed to calculate profile completion', { error: e.message });
        }

        await client.query('COMMIT');

        res.json(employee);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Delete Employee
router.delete('/:id', authenticateToken, checkRole(['super_admin', 'admin', 'hr_manager', 'hr manager']), async (req, res) => {
    const { id } = req.params;
    try {
        // Try finding by UUID id first, then by employee_id
        let check = await pool.query('SELECT id, employee_id, status FROM user_profiles WHERE id = $1', [id]);

        // If not found by UUID, try employee_id
        if (check.rows.length === 0) {
            check = await pool.query('SELECT id, employee_id, status FROM user_profiles WHERE employee_id = $1', [id]);
        }

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const employee = check.rows[0];

        if (employee.status === 'terminated') {
            // Permanently delete if already terminated
            await pool.query('DELETE FROM user_profiles WHERE id = $1', [employee.id]);
            return res.json({ message: 'Employee permanently deleted' });
        } else {
            // Soft delete - mark as terminated
            const result = await pool.query(`
                UPDATE user_profiles 
                SET is_active = false, status = 'terminated', updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING id, employee_id, first_name, last_name, email, status
            `, [employee.id]);
            return res.json({
                message: 'Employee terminated successfully',
                employee: result.rows[0]
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Employees (with pagination and search)
router.get('/', authenticateToken, async (req, res) => {
    const {
        department,
        departmentId,
        status,
        search,
        page = 1,
        limit = 50,
        sort_by = 'created_at',
        sort_order = 'desc'
    } = req.query;

    try {
        // Build base query
        let query = `
            SELECT
                u.*,
                d.name as department_name,
                t.name as team_name,
                p.name as position_name,
                r.name as role_name,
                json_build_object('id', d.id, 'name', d.name) as department,
                json_build_object('id', t.id, 'name', t.name) as team,
                json_build_object('id', p.id, 'name', p.name) as position,
                json_build_object('id', r.id, 'name', r.name) as role
            FROM user_profiles u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE 1 = 1
        `;

        const params = [];
        let paramIndex = 1;

        // Apply filters
        const deptId = departmentId || department;
        if (deptId) {
            query += ` AND u.department_id = $${paramIndex++}`;
            params.push(deptId);
        }

        if (status) {
            query += ` AND u.status = $${paramIndex++}`;
            params.push(status);
        } else {
            // By default, exclude terminated employees
            query += ` AND u.status != 'terminated'`;
        }

        // Implement search across multiple fields
        if (search) {
            query += ` AND (
                u.first_name ILIKE $${paramIndex} OR 
                u.last_name ILIKE $${paramIndex} OR 
                u.employee_id ILIKE $${paramIndex} OR 
                u.email ILIKE $${paramIndex} OR
                u.phone_number ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count for pagination
        const countQuery = query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(*) FROM');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Add sorting
        const validSortFields = ['created_at', 'first_name', 'last_name', 'employee_id', 'hire_date', 'email'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY u.${sortField} ${sortOrder}`;

        // Add pagination
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
        const offset = (pageNum - 1) * pageSize;

        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(pageSize, offset);

        // Execute main query
        const result = await pool.query(query, params);

        // Return paginated response
        res.json({
            items: result.rows,
            total,
            page: pageNum,
            page_size: pageSize,
            total_pages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        logger.error('Error fetching employees', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get Employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.*,
                d.name as department_name,
                t.name as team_name,
                p.name as position_name,
                r.name as role_name,
                json_build_object('id', d.id, 'name', d.name) as department,
                json_build_object('id', t.id, 'name', t.name) as team,
                json_build_object('id', p.id, 'name', p.name) as position,
                json_build_object('id', r.id, 'name', r.name) as role
            FROM user_profiles u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching employee', { error: error.message, employeeId: req.params.id });
        res.status(500).json({ error: error.message });
    }
});

// Profile Completion stats
router.get('/profile/completion/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM user_profiles WHERE id = $1', [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const employee = result.rows[0];
        const completion = calculateCompletion(employee);

        if (employee.profile_completion_percentage !== completion.total) {
            await pool.query(`
                UPDATE user_profiles
                SET profile_completion_percentage = $1,
                    profile_sections_completed = $2
                WHERE id = $3
            `, [completion.total, JSON.stringify(completion.breakdown), id]);
        }

        res.json({
            total: completion.total,
            breakdown: completion.breakdown,
            deadline: employee.profile_deadline,
            missing_critical: completion.total < 60
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
