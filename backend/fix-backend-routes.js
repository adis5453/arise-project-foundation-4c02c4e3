// Backend Routes Fixes
// Add these routes to backend/index.js

// ============================================
// ROLE CONSTANTS (Add at top of file)
// ============================================
const ADMIN_ROLES = ['super_admin', 'admin'];
const HR_ROLES = ['super_admin', 'admin', 'hr_manager'];
const MANAGER_ROLES = ['super_admin', 'admin', 'hr_manager', 'manager'];

// ============================================
// SYSTEM SETTINGS ROUTES (Fixed)
// ============================================

// GET system settings
app.get('/api/settings/system', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings ORDER BY category, key');

        // Convert to key-value object for frontend
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        res.json(settings);
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE system settings
app.put('/api/settings/system', authenticateToken, async (req, res) => {
    try {
        // Admin check using constant
        if (!ADMIN_ROLES.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied. Admin only." });
        }

        const updates = req.body; // { key: value, ... }
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const [key, value] of Object.entries(updates)) {
                await client.query(`
                    INSERT INTO system_settings (key, value, updated_at)
                    VALUES ($1, $2, CURRENT_TIMESTAMP)
                    ON CONFLICT (key)
                    DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
                `, [key, value]);
            }

            await client.query('COMMIT');
            res.json({ message: 'Settings updated successfully', updated: Object.keys(updates).length });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// LEAVE REQUEST ROUTES (Fixed with days calculation)
// ============================================

// CREATE leave request with automatic days calculation
app.post('/api/leaves', authenticateToken, async (req, res) => {
    try {
        const { employee_id, leave_type_id, start_date, end_date, reason } = req.body;

        // Calculate days_requested (including both start and end dates)
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both dates

        const result = await pool.query(`
            INSERT INTO leave_requests (
                employee_id, leave_type_id, start_date, end_date, 
                days_requested, reason, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP)
            RETURNING *
        `, [employee_id, leave_type_id, start_date, end_date, diffDays, reason]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Create Leave Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ATTENDANCE ROUTES (Enhanced with notes)
// ============================================

// UPDATE attendance record (with notes support)
app.put('/api/attendance/:id', authenticateToken, async (req, res) => {
    try {
        // Admin check
        if (!HR_ROLES.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { id } = req.params;
        const { check_in, check_out, status, notes } = req.body;

        const result = await pool.query(`
            UPDATE attendance_records 
            SET check_in = COALESCE($1, check_in),
                check_out = COALESCE($2, check_out),
                status = COALESCE($3, status),
                notes = COALESCE($4, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 
            RETURNING *
        `, [check_in, check_out, status, notes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update Attendance Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// HELPER FUNCTIONS (Fixed for system_settings)
// ============================================

async function getSystemSetting(key, defaultValue = null) {
    try {
        const result = await pool.query(
            'SELECT value FROM system_settings WHERE key = $1',
            [key]
        );
        return result.rows[0]?.value || defaultValue;
    } catch (error) {
        console.error(`Error getting system setting ${key}:`, error);
        return defaultValue;
    }
}

async function setSystemSetting(key, value, category = 'general', description = '') {
    try {
        await pool.query(`
            INSERT INTO system_settings (key, value, category, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (key)
            DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
        `, [key, value, category, description]);
        return true;
    } catch (error) {
        console.error(`Error setting system setting ${key}:`, error);
        return false;
    }
}

// ============================================
// PAYROLL ROUTES (Fixed to use correct column names)
// ============================================

// Get payroll settings
app.get('/api/payroll/settings', authenticateToken, async (req, res) => {
    try {
        const taxRate = await getSystemSetting('payroll_tax_rate', '0.15');
        const allowanceRate = await getSystemSetting('payroll_allowance_rate', '0.10');

        res.json({
            tax_rate: parseFloat(taxRate),
            allowance_rate: parseFloat(allowanceRate)
        });
    } catch (error) {
        console.error('Get Payroll Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update payroll settings
app.post('/api/payroll/settings', authenticateToken, async (req, res) => {
    try {
        if (!ADMIN_ROLES.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const { tax_rate, allowance_rate } = req.body;

        if (tax_rate !== undefined) {
            await setSystemSetting('payroll_tax_rate', tax_rate.toString(), 'payroll', 'Tax rate');
        }

        if (allowance_rate !== undefined) {
            await setSystemSetting('payroll_allowance_rate', allowance_rate.toString(), 'payroll', 'Allowance rate');
        }

        res.json({ message: 'Payroll settings updated successfully' });
    } catch (error) {
        console.error('Update Payroll Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROLE-BASED ACCESS MIDDLEWARE
// ============================================

function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Access denied",
                required_role: allowedRoles,
                your_role: req.user.role
            });
        }
        next();
    };
}

// Usage example:
// app.get('/api/admin/users', authenticateToken, requireRole(ADMIN_ROLES), async (req, res) => { ... });

// ============================================
// EXPORT FOR TESTING
// ============================================
module.exports = {
    ADMIN_ROLES,
    HR_ROLES,
    MANAGER_ROLES,
    getSystemSetting,
    setSystemSetting,
    requireRole
};
