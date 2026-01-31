const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roles');
const logger = require('../utils/logger');

// Initialize enhanced attendance table
const initAttendanceTables = async () => {
    try {
        await pool.query(`
            -- Enhanced attendance records
            CREATE TABLE IF NOT EXISTS attendance_records (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id),
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                clock_in TIMESTAMP,
                clock_out TIMESTAMP,
                clock_in_type VARCHAR(20) DEFAULT 'office', -- office, wfh, field
                clock_out_type VARCHAR(20),
                clock_in_latitude DECIMAL(10, 8),
                clock_in_longitude DECIMAL(11, 8),
                clock_out_latitude DECIMAL(10, 8),
                clock_out_longitude DECIMAL(11, 8),
                wfh_request_id INTEGER REFERENCES wfh_requests(id),
                working_hours DECIMAL(5, 2),
                overtime_hours DECIMAL(5, 2) DEFAULT 0,
                break_duration INTEGER DEFAULT 0, -- minutes
                status VARCHAR(20) DEFAULT 'present', -- present, late, half_day, leave, absent
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, date)
            );

            -- Office locations for geofencing
            CREATE TABLE IF NOT EXISTS office_locations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                address TEXT,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                radius_meters INTEGER DEFAULT 100,
                is_default BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Insert default office location if empty
            INSERT INTO office_locations (name, latitude, longitude, radius_meters, is_default)
            SELECT 'Main Office', 0.0, 0.0, 100, true
            WHERE NOT EXISTS (SELECT 1 FROM office_locations LIMIT 1);
        `);
        logger.info('Attendance tables verified/created');
    } catch (error) {
        logger.error('Failed to initialize attendance tables', error);
    }
};

initAttendanceTables();

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// ==================== Office Locations (Admin) ====================

router.get('/locations', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM office_locations WHERE is_active = true ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching office locations', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

router.post('/locations', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
    const { name, address, latitude, longitude, radius_meters, is_default } = req.body;

    try {
        // If setting as default, unset other defaults
        if (is_default) {
            await pool.query('UPDATE office_locations SET is_default = false WHERE is_default = true');
        }

        const result = await pool.query(`
            INSERT INTO office_locations (name, address, latitude, longitude, radius_meters, is_default)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, address, latitude, longitude, radius_meters || 100, is_default || false]);

        logger.info('Office location created', { id: result.rows[0].id });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating office location', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// ==================== Attendance Records ====================

// Get Attendance Records (with pagination, search, and sorting)
router.get('/', authenticateToken, async (req, res) => {
    const {
        employeeId,
        date,
        startDate,
        endDate,
        status,
        department_id,
        search,
        page = 1,
        limit = 50,
        sort_by = 'date',
        sort_order = 'desc'
    } = req.query;

    try {
        // Pagination validation
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
        const offset = (pageNum - 1) * limitNum;

        // Build WHERE clause
        let whereConditions = ['1=1'];
        const params = [];
        let idx = 1;

        // Role-based filtering
        if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            if (['manager', 'department_manager'].includes(req.user.role)) {
                whereConditions.push(`u.department_id = $${idx++}`);
                params.push(req.user.department_id);
            } else if (req.user.role === 'team_leader') {
                whereConditions.push(`(u.manager_id = $${idx++} OR ar.employee_id = $${idx++})`);
                params.push(req.user.id, req.user.id);
            } else {
                whereConditions.push(`ar.employee_id = $${idx++}`);
                params.push(req.user.id);
            }
        }

        // Search across multiple fields
        if (search && search.trim()) {
            whereConditions.push(`(
                u.first_name ILIKE $${idx} OR
                u.last_name ILIKE $${idx} OR
                u.employee_id ILIKE $${idx} OR
                d.name ILIKE $${idx} OR
                CAST(ar.date AS TEXT) ILIKE $${idx}
            )`);
            params.push(`%${search.trim()}%`);
            idx++;
        }

        if (employeeId) {
            whereConditions.push(`ar.employee_id = $${idx++}`);
            params.push(employeeId);
        }
        if (date) {
            whereConditions.push(`ar.date = $${idx++}`);
            params.push(date);
        }
        if (startDate) {
            whereConditions.push(`ar.date >= $${idx++}`);
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`ar.date <= $${idx++}`);
            params.push(endDate);
        }
        if (status) {
            whereConditions.push(`ar.status = $${idx++}`);
            params.push(status);
        }
        if (department_id) {
            whereConditions.push(`u.department_id = $${idx++}`);
            params.push(department_id);
        }

        const whereClause = whereConditions.join(' AND ');

        // Count total records
        const countQuery = `
            SELECT COUNT(*) as total
            FROM attendance_records ar
            JOIN user_profiles u ON ar.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Sorting with whitelist (prevent SQL injection)
        const validSortFields = ['date', 'clock_in', 'clock_out', 'hours_worked', 'status', 'employee_name', 'department_name'];
        const sortField = validSortFields.includes(sort_by) ? sort_by : 'date';
        const sortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Get paginated data
        let dataQuery = `
            SELECT ar.*, 
                   u.first_name || ' ' || u.last_name as employee_name,
                   u.employee_id as emp_code,
                   d.name as department_name,
                   json_build_object('id', u.id, 'name', u.first_name || ' ' || u.last_name, 'employee_id', u.employee_id) as employee,
                   json_build_object('id', d.id, 'name', d.name) as department
            FROM attendance_records ar
            JOIN user_profiles u ON ar.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE ${whereClause}
            ORDER BY ${sortField === 'employee_name' ? 'u.first_name' : sortField === 'department_name' ? 'd.name' : 'ar.' + sortField} ${sortOrder}
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
        logger.error('Error fetching attendance', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get my attendance for today
router.get('/my-today', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM attendance_records 
            WHERE employee_id = $1 AND date = CURRENT_DATE
        `, [req.user.id]);

        res.json(result.rows[0] || null);
    } catch (error) {
        logger.error('Error fetching today attendance', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Clock In
router.post('/clock-in', authenticateToken, async (req, res) => {
    const { latitude, longitude, clock_in_type, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
        // Check if already clocked in
        const existing = await pool.query(
            'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
            [req.user.id, today]
        );

        if (existing.rows.length > 0 && existing.rows[0].clock_in) {
            return res.status(400).json({ error: 'Already clocked in for today' });
        }

        // Determine clock-in type
        let actualClockInType = clock_in_type || 'office';
        let wfhRequestId = null;

        // Check for WFH approval if clocking in remotely
        if (clock_in_type === 'wfh' || !latitude || !longitude) {
            const wfhCheck = await pool.query(`
                SELECT id FROM wfh_requests 
                WHERE employee_id = $1 
                AND status = 'approved'
                AND CURRENT_DATE BETWEEN start_date AND end_date
            `, [req.user.id]);

            if (wfhCheck.rows.length > 0) {
                actualClockInType = 'wfh';
                wfhRequestId = wfhCheck.rows[0].id;
            } else if (clock_in_type === 'wfh') {
                return res.status(400).json({ error: 'No approved WFH request for today. Please request WFH first.' });
            }
        }

        // If office clock-in, validate location
        if (actualClockInType === 'office' && latitude && longitude) {
            const officeLocations = await pool.query(
                'SELECT * FROM office_locations WHERE is_active = true'
            );

            let withinOffice = false;
            for (const office of officeLocations.rows) {
                const distance = calculateDistance(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    parseFloat(office.latitude),
                    parseFloat(office.longitude)
                );
                if (distance <= office.radius_meters) {
                    withinOffice = true;
                    break;
                }
            }

            // If not within any office and no WFH, check for approved WFH
            if (!withinOffice) {
                const wfhCheck = await pool.query(`
                    SELECT id FROM wfh_requests 
                    WHERE employee_id = $1 
                    AND status = 'approved'
                    AND CURRENT_DATE BETWEEN start_date AND end_date
                `, [req.user.id]);

                if (wfhCheck.rows.length > 0) {
                    actualClockInType = 'wfh';
                    wfhRequestId = wfhCheck.rows[0].id;
                } else {
                    // Allow field clock-in or reject
                    actualClockInType = 'field';
                }
            }
        }

        // Determine status (late if after 9:30 AM)
        const now = new Date();
        const nineThirty = new Date();
        nineThirty.setHours(9, 30, 0, 0);
        const status = now > nineThirty ? 'late' : 'present';

        let result;
        if (existing.rows.length > 0) {
            result = await pool.query(`
                UPDATE attendance_records SET
                    clock_in = NOW(),
                    clock_in_type = $1,
                    clock_in_latitude = $2,
                    clock_in_longitude = $3,
                    wfh_request_id = $4,
                    status = $5,
                    notes = COALESCE($6, notes),
                    updated_at = NOW()
                WHERE employee_id = $7 AND date = $8
                RETURNING *
            `, [actualClockInType, latitude, longitude, wfhRequestId, status, notes, req.user.id, today]);
        } else {
            result = await pool.query(`
                INSERT INTO attendance_records (
                    employee_id, date, clock_in, clock_in_type,
                    clock_in_latitude, clock_in_longitude, wfh_request_id, status, notes
                ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [req.user.id, today, actualClockInType, latitude, longitude, wfhRequestId, status, notes]);
        }

        logger.info('Clock in successful', { employee: req.user.id, type: actualClockInType });
        res.json({
            ...result.rows[0],
            message: `Clocked in successfully as ${actualClockInType}`
        });
    } catch (error) {
        logger.error('Error clocking in', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Clock Out
router.post('/clock-out', authenticateToken, async (req, res) => {
    const { latitude, longitude, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
        const existing = await pool.query(
            'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
            [req.user.id, today]
        );

        if (existing.rows.length === 0 || !existing.rows[0].clock_in) {
            return res.status(400).json({ error: 'Must clock in before clocking out' });
        }

        if (existing.rows[0].clock_out) {
            return res.status(400).json({ error: 'Already clocked out for today' });
        }

        const clockInTime = new Date(existing.rows[0].clock_in);
        const clockOutTime = new Date();
        const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);
        const overtimeHours = Math.max(0, hoursWorked - 8);

        // Determine status based on hours worked
        let status = existing.rows[0].status;
        if (hoursWorked < 4) {
            status = 'half_day';
        }

        const result = await pool.query(`
            UPDATE attendance_records SET
                clock_out = NOW(),
                clock_out_type = $1,
                clock_out_latitude = $2,
                clock_out_longitude = $3,
                working_hours = $4,
                overtime_hours = $5,
                status = $6,
                notes = COALESCE($7, notes),
                updated_at = NOW()
            WHERE employee_id = $8 AND date = $9
            RETURNING *
        `, [
            existing.rows[0].clock_in_type, // Same type as clock-in
            latitude, longitude,
            hoursWorked.toFixed(2),
            overtimeHours.toFixed(2),
            status,
            notes,
            req.user.id, today
        ]);

        logger.info('Clock out successful', { employee: req.user.id, hours: hoursWorked.toFixed(2) });
        res.json({
            ...result.rows[0],
            message: `Clocked out successfully. Hours worked: ${hoursWorked.toFixed(2)}`
        });
    } catch (error) {
        logger.error('Error clocking out', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get attendance statistics
router.get('/stats', authenticateToken, async (req, res) => {
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    try {
        let query;
        const params = [targetMonth, targetYear];

        if (['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM attendance_records WHERE status = 'present' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as total_present,
                    (SELECT COUNT(*) FROM attendance_records WHERE status = 'late' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as total_late,
                    (SELECT COUNT(*) FROM attendance_records WHERE clock_in_type = 'wfh' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as total_wfh,
                    (SELECT COUNT(DISTINCT employee_id) FROM attendance_records WHERE date = CURRENT_DATE AND clock_in IS NOT NULL) as present_today,
                    (SELECT ROUND(AVG(working_hours)::numeric, 2) FROM attendance_records WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as avg_hours
            `;
        } else {
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM attendance_records WHERE employee_id = $3 AND status = 'present' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as my_present,
                    (SELECT COUNT(*) FROM attendance_records WHERE employee_id = $3 AND status = 'late' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as my_late,
                    (SELECT COUNT(*) FROM attendance_records WHERE employee_id = $3 AND clock_in_type = 'wfh' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as my_wfh_days,
                    (SELECT ROUND(AVG(working_hours)::numeric, 2) FROM attendance_records WHERE employee_id = $3 AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2) as my_avg_hours
            `;
            params.push(req.user.id);
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching attendance stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
