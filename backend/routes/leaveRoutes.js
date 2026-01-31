const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/requestValidator');

// Helper to ensure balance exists
async function ensureLeaveBalance(client, employeeId, year) {
    await client.query(`
        INSERT INTO employee_leave_balances(employee_id, leave_type_id, year, current_balance, accrued_balance)
        SELECT $1, id, $2, max_days_per_year, max_days_per_year 
        FROM leave_types WHERE is_active = true
        ON CONFLICT(employee_id, leave_type_id, year) DO NOTHING
    `, [employeeId, year]);
}

// Initialize Leave Types table with default types
const initLeaveTypes = async () => {
    try {
        // Add additional columns if they don't exist (including is_paid which may be missing)
        await pool.query(`
            ALTER TABLE leave_types 
            ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS allow_half_day BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS allow_carryover BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS max_carryover_days INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS requires_document_after_days INTEGER,
            ADD COLUMN IF NOT EXISTS applicable_gender VARCHAR(10) DEFAULT 'ALL',
            ADD COLUMN IF NOT EXISTS min_service_months INTEGER DEFAULT 0;
        `);

        // Insert default leave types if table is empty
        await pool.query(`
            INSERT INTO leave_types (name, code, description, color, max_days_per_year, is_paid, allow_half_day, allow_carryover, max_carryover_days, requires_document_after_days, applicable_gender, min_service_months, is_active)
            SELECT * FROM (VALUES
                ('Annual Leave', 'AL', 'Paid yearly leave for rest and vacation', '#4CAF50', 20, true, true, true, 5, NULL, 'ALL', 0, true),
                ('Sick Leave', 'SL', 'Leave for illness or medical reasons', '#F44336', 12, true, true, false, 0, 2, 'ALL', 0, true),
                ('Casual Leave', 'CL', 'Short-term unplanned personal leave', '#2196F3', 6, true, true, false, 0, NULL, 'ALL', 0, true),
                ('Maternity Leave', 'ML', 'Leave for expecting mothers', '#E91E63', 182, true, false, false, 0, 1, 'F', 6, true),
                ('Paternity Leave', 'PL', 'Leave for new fathers', '#9C27B0', 15, true, false, false, 0, 1, 'M', 6, true),
                ('Bereavement Leave', 'BL', 'Leave for family loss', '#607D8B', 5, true, false, false, 0, 1, 'ALL', 0, true),
                ('Marriage Leave', 'MR', 'Leave for wedding', '#FF9800', 5, true, false, false, 0, 1, 'ALL', 3, true),
                ('Compensatory Off', 'CO', 'Earned leave for extra work', '#00BCD4', 0, true, true, false, 0, NULL, 'ALL', 0, true),
                ('Loss of Pay', 'LOP', 'Unpaid leave when other leaves exhausted', '#795548', 999, false, true, false, 0, NULL, 'ALL', 0, true),
                ('Work From Home', 'WFH', 'Work remotely from home', '#673AB7', 0, true, true, false, 0, NULL, 'ALL', 0, true)
            ) AS v(name, code, description, color, max_days_per_year, is_paid, allow_half_day, allow_carryover, max_carryover_days, requires_document_after_days, applicable_gender, min_service_months, is_active)
            WHERE NOT EXISTS (SELECT 1 FROM leave_types LIMIT 1);
        `);
        logger.info('Leave types initialized');
    } catch (error) {
        logger.error('Failed to initialize leave types', error);
    }
};

initLeaveTypes();


// --- Leave Types ---

router.get('/types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leave_types ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/types', authenticateToken, async (req, res) => {
    const { name, code, description, color, max_days_per_year, is_paid } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO leave_types(name, code, description, color, max_days_per_year, is_paid, is_active)
             VALUES($1, $2, $3, $4, $5, $6, true) RETURNING *`,
            [name, code, description, color, max_days_per_year, is_paid]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/types/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, code, description, color, max_days_per_year, is_paid, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE leave_types 
             SET name = $1, code = $2, description = $3, color = $4, max_days_per_year = $5, is_paid = $6, is_active = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [name, code, description, color, max_days_per_year, is_paid, is_active, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/types/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE leave_types SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Leave type deactivated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Leave Balances ---

router.get('/balances', authenticateToken, async (req, res) => {
    const { employeeId } = req.query;
    const targetId = employeeId || req.user.id;
    const year = new Date().getFullYear();

    try {
        await pool.query(`
            INSERT INTO employee_leave_balances(employee_id, leave_type_id, year, current_balance, accrued_balance)
            SELECT $1, id, $2, max_days_per_year, max_days_per_year 
            FROM leave_types WHERE is_active = true
            ON CONFLICT(employee_id, leave_type_id, year) DO NOTHING
        `, [targetId, year]);

        const result = await pool.query(`
            SELECT elb.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color as color_code
            FROM employee_leave_balances elb
            JOIN leave_types lt ON elb.leave_type_id = lt.id
            WHERE elb.employee_id = $1 AND elb.year = $2
        `, [targetId, year]);

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Leave Requests ---

// Get Leave Requests (with pagination, search, and sorting)
router.get('/requests', authenticateToken, async (req, res) => {
    try {
        const {
            employeeId,
            status,
            startDate,
            endDate,
            leave_type_id,
            search,
            page = 1,
            limit = 50,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Pagination validation
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
        const offset = (pageNum - 1) * limitNum;

        // Build WHERE clause
        let whereConditions = ['1 = 1'];
        const params = [];
        let idx = 1;

        // Search across multiple fields
        if (search && search.trim()) {
            whereConditions.push(`(
                u.first_name ILIKE $${idx} OR
                u.last_name ILIKE $${idx} OR
                u.employee_id ILIKE $${idx} OR
                lt.name ILIKE $${idx} OR
                lr.reason ILIKE $${idx}
            )`);
            params.push(`%${search.trim()}%`);
            idx++;
        }

        if (employeeId) {
            whereConditions.push(`lr.employee_id = $${idx++}`);
            params.push(employeeId);
        }
        if (status) {
            whereConditions.push(`lr.status = $${idx++}`);
            params.push(status);
        }
        if (leave_type_id) {
            whereConditions.push(`lr.leave_type_id = $${idx++}`);
            params.push(leave_type_id);
        }
        if (startDate) {
            whereConditions.push(`lr.end_date >= $${idx++}`);
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`lr.start_date <= $${idx++}`);
            params.push(endDate);
        }

        const whereClause = whereConditions.join(' AND ');

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM leave_requests lr
            JOIN user_profiles u ON lr.employee_id = u.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params.slice(0, idx - 1));
        const total = parseInt(countResult.rows[0].total);

        // Sorting with whitelist (prevent SQL injection)
        const validSortFields = ['created_at', 'start_date', 'end_date', 'status', 'days_requested', 'employee_name', 'leave_type'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Get paginated data
        let dataQuery = `
            SELECT lr.*,
                json_build_object(
                    'id', u.id,
                    'first_name', u.first_name,
                    'last_name', u.last_name,
                    'employee_id', u.employee_id,
                    'avatar_url', u.avatar_url
                ) as employee,
                json_build_object('id', lt.id, 'name', lt.name, 'code', lt.code, 'color', lt.color) as leave_type,
                u.first_name || ' ' || u.last_name as employee_name
            FROM leave_requests lr
            JOIN user_profiles u ON lr.employee_id = u.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE ${whereClause}
            ORDER BY ${sortField === 'employee_name' ? 'u.first_name' : sortField === 'leave_type' ? 'lt.name' : 'lr.' + sortField} ${sortOrder}
            LIMIT $${idx++} OFFSET $${idx++}
        `;
        params.push(limitNum, offset);

        const result = await pool.query(dataQuery, params);

        // Return paginated response
        res.json({
            items: result.rows,
            total,
            page: pageNum,
            page_size: limitNum,
            total_pages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { employee_id, leave_type_id, start_date, end_date, reason, days_requested } = req.body;

        const currentYear = new Date().getFullYear();
        await ensureLeaveBalance(client, employee_id, currentYear);

        const result = await client.query(`
            INSERT INTO leave_requests(employee_id, leave_type_id, start_date, end_date, reason, days_requested, status)
            VALUES($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *
        `, [employee_id, leave_type_id, start_date, end_date, reason, days_requested || 0]);

        await client.query(`
            UPDATE employee_leave_balances 
            SET pending_balance = pending_balance + $1
            WHERE employee_id = $2 AND leave_type_id = $3
        `, [days_requested || 0, employee_id, leave_type_id]);

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.put('/requests/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        status, manager_comments, rejection_reason,
        start_date, end_date, reason, days_requested
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const reqRes = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
        if (reqRes.rows.length === 0) throw new Error('Request not found');
        const request = reqRes.rows[0];
        const oldDays = parseFloat(request.days_requested || 0);
        const newDays = days_requested ? parseFloat(days_requested) : oldDays;

        if (request.status === 'pending' && (!status || status === 'pending')) {
            const result = await client.query(`
                UPDATE leave_requests
                SET start_date = COALESCE($1, start_date),
                    end_date = COALESCE($2, end_date),
                    reason = COALESCE($3, reason),
                    days_requested = COALESCE($4, days_requested),
                    updated_at = NOW()
                WHERE id = $5
                RETURNING *
            `, [start_date, end_date, reason, days_requested, id]);

            if (days_requested && newDays !== oldDays) {
                const diff = newDays - oldDays;
                await client.query(`
                    UPDATE employee_leave_balances 
                    SET pending_balance = pending_balance + $1
                    WHERE employee_id = $2 AND leave_type_id = $3
                `, [diff, request.employee_id, request.leave_type_id]);
            }

            await client.query('COMMIT');
            return res.json(result.rows[0]);
        }

        if (status) {
            const result = await client.query(`
                UPDATE leave_requests
                SET status = $1, manager_comments = $2, rejection_reason = $3, reviewed_by = $4, reviewed_at = NOW(), updated_at = NOW()
                WHERE id = $5
                RETURNING *
            `, [status, manager_comments, rejection_reason, req.user.id, id]);

            if (status === 'approved') {
                await client.query(`
                    UPDATE employee_leave_balances 
                    SET current_balance = current_balance - $1,
                        used_balance = used_balance + $1,
                        pending_balance = pending_balance - $1
                    WHERE employee_id = $2 AND leave_type_id = $3
                `, [request.days_requested, request.employee_id, request.leave_type_id]);
            } else if (status === 'rejected') {
                await client.query(`
                    UPDATE employee_leave_balances 
                    SET pending_balance = pending_balance - $1
                    WHERE employee_id = $2 AND leave_type_id = $3
                `, [request.days_requested, request.employee_id, request.leave_type_id]);
            }

            await client.query('COMMIT');
            return res.json(result.rows[0]);
        }

        res.json(request);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Update Leave Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.post('/requests/:id/cancel',
    authenticateToken,
    checkRole(['team_leader', 'manager', 'hr_manager', 'admin', 'super_admin']),
    [
        body('cancellation_reason').trim().notEmpty().withMessage('Cancellation reason is required'),
        validateRequest
    ],
    async (req, res) => {
        const { id } = req.params;
        const { cancellation_reason } = req.body;
        const cancelledBy = req.user.id;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const leaveResult = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);

            if (leaveResult.rows.length === 0) {
                return res.status(404).json({ error: 'Leave request not found' });
            }

            const leave = leaveResult.rows[0];

            if (leave.status !== 'approved') {
                return res.status(400).json({ error: 'Can only cancel approved leaves' });
            }

            if (leave.cancelled_at) {
                return res.status(400).json({ error: 'Leave already cancelled' });
            }

            const updateResult = await client.query(`
                UPDATE leave_requests
                SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1, cancellation_reason = $2, updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `, [cancelledBy, cancellation_reason, id]);

            await client.query(`
                UPDATE employee_leave_balances
                SET current_balance = current_balance + $1,
                    used_balance = used_balance - $1
                WHERE employee_id = $2 AND leave_type_id = $3
            `, [leave.days_requested, leave.employee_id, leave.leave_type_id]);

            await client.query('COMMIT');
            res.json({ message: 'Leave cancelled successfully', leave: updateResult.rows[0], balance_restored: leave.days_requested });

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Error cancelling leave', { error: error.message, id });
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    }
);

// Get Team Leave Calendar
router.get('/team-calendar', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, teamId, departmentId } = req.query;

    try {
        // Get user's team or department if not specified
        const userResult = await pool.query(
            'SELECT team_id, department_id FROM user_profiles WHERE id = $1',
            [userId]
        );

        const user = userResult.rows[0];
        const filterTeamId = teamId || user?.team_id;
        const filterDepartmentId = departmentId || user?.department_id;

        let query = `
            SELECT 
                lr.id, lr.start_date, lr.end_date, lr.status, lr.days_requested as total_days,
                lt.name as leave_type, lt.color as leave_color, lt.code as leave_code,
                u.id as employee_id, u.employee_id as emp_code, 
                u.first_name, u.last_name, u.profile_photo_url
            FROM leave_requests lr
            JOIN user_profiles u ON lr.employee_id = u.id
            JOIN leave_types lt ON lr.leave_type_id = lt.id
            WHERE lr.status IN ('approved', 'pending')
        `;

        const params = [];
        let paramIndex = 1;

        if (startDate) {
            query += ` AND lr.end_date >= $${paramIndex++}`;
            params.push(startDate);
        }
        if (endDate) {
            query += ` AND lr.start_date <= $${paramIndex++}`;
            params.push(endDate);
        }
        if (filterTeamId) {
            query += ` AND u.team_id = $${paramIndex++}`;
            params.push(filterTeamId);
        } else if (filterDepartmentId) {
            query += ` AND u.department_id = $${paramIndex++}`;
            params.push(filterDepartmentId);
        }

        query += ' ORDER BY lr.start_date';

        const result = await pool.query(query, params);

        // Format for calendar display
        const events = result.rows.map(row => ({
            id: row.id,
            title: `${row.first_name} ${row.last_name} - ${row.leave_type}`,
            start: row.start_date,
            end: row.end_date,
            color: row.leave_color || '#4CAF50',
            status: row.status,
            employee: {
                id: row.employee_id,
                name: `${row.first_name} ${row.last_name}`,
                photo: row.profile_photo_url
            },
            leaveType: row.leave_code,
            days: row.total_days
        }));

        res.json(events);
    } catch (error) {
        logger.error('Error fetching team calendar', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
