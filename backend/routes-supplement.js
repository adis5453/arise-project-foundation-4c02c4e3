// ============================================
// SUPPLEMENTARY BACKEND ROUTES FOR HRM SYSTEM
// Add these routes to backend/index.js
// ============================================

// ============================================
// LEAVE BALANCE MANAGEMENT ROUTES
// Add after existing leave-balances route (around line 440)
// ============================================

// Initialize leave balances for an employee
app.post('/api/leave-balances/initialize', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.body;

        // Admin check
        if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const currentYear = new Date().getFullYear();
        const leaveTypes = await pool.query('SELECT id, max_days_per_year FROM leave_types WHERE is_active = TRUE');

        const results = [];
        for (const leaveType of leaveTypes.rows) {
            const maxDays = leaveType.max_days_per_year || 20;

            const result = await pool.query(`
                INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, current_balance, accrued_balance)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (employee_id, leave_type_id, year) 
                DO UPDATE SET current_balance = $4, accrued_balance = $5, updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [employeeId, leaveType.id, currentYear, maxDays, maxDays]);

            results.push(result.rows[0]);
        }

        res.json({ message: 'Leave balances initialized', balances: results });
    } catch (error) {
        console.error('Initialize Leave Balances Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Monthly leave accrual (cron job endpoint)
app.post('/api/leave-balances/accrue', authenticateToken, async (req, res) => {
    try {
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const currentYear = new Date().getFullYear();
        const accrualRate = 1.67; // 20 days / 12 months

        const employees = await pool.query("SELECT id FROM user_profiles WHERE status = 'active'");
        const leaveTypes = await pool.query('SELECT id FROM leave_types WHERE is_active = TRUE');

        let updatedCount = 0;
        for (const employee of employees.rows) {
            for (const leaveType of leaveTypes.rows) {
                await pool.query(`
                    INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, current_balance, accrued_balance)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (employee_id, leave_type_id, year) 
                    DO UPDATE SET 
                        accrued_balance = employee_leave_balances.accrued_balance + $4,
                        current_balance = employee_leave_balances.current_balance + $4,
                        updated_at = CURRENT_TIMESTAMP
                `, [employee.id, leaveType.id, currentYear, accrualRate, accrualRate]);
                updatedCount++;
            }
        }

        res.json({ message: 'Leave accrual completed', updated: updatedCount, accrual_rate: accrualRate });
    } catch (error) {
        console.error('Leave Accrual Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PAYROLL CALCULATION ROUTES
// Add after existing payroll routes (around line 950)
// ============================================

// Calculate payroll for a period
app.post('/api/payroll/calculate', authenticateToken, async (req, res) => {
    try {
        const { period_start, period_end, employee_ids } = req.body;

        // Admin check
        if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Get system settings
        const taxRateSetting = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'payroll_tax_rate'"
        );
        const allowanceRateSetting = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'payroll_allowance_rate'"
        );

        const taxRate = parseFloat(taxRateSetting.rows[0]?.setting_value || '0.15');
        const allowanceRate = parseFloat(allowanceRateSetting.rows[0]?.setting_value || '0.10');

        // Get employees to process
        let employeeQuery = `
            SELECT id, employee_id, first_name, last_name, salary
            FROM user_profiles
            WHERE status = 'active'
        `;
        const params = [];

        if (employee_ids && employee_ids.length > 0) {
            employeeQuery += ` AND id = ANY($1)`;
            params.push(employee_ids);
        }

        const employees = await pool.query(employeeQuery, params);
        const results = [];

        for (const employee of employees.rows) {
            // Calculate attendance data
            const attendanceData = await pool.query(`
                SELECT 
                    COUNT(*) as days_worked,
                    COALESCE(SUM(total_hours), 0) as total_hours,
                    COALESCE(SUM(overtime_hours), 0) as overtime_hours
                FROM attendance_records
                WHERE employee_id = $1
                AND date BETWEEN $2 AND $3
            `, [employee.employee_id, period_start, period_end]);

            // Calculate leave data
            const leaveData = await pool.query(`
                SELECT COALESCE(SUM(days_requested), 0) as leave_days
                FROM leave_requests
                WHERE employee_id = $1
                AND status = 'approved'
                AND start_date <= $2
                AND end_date >= $3
            `, [employee.id, period_end, period_start]);

            const basicSalary = parseFloat(employee.salary || 0);
            const allowances = basicSalary * allowanceRate;
            const grossSalary = basicSalary + allowances;
            const taxAmount = grossSalary * taxRate;
            const netSalary = grossSalary - taxAmount;

            // Insert payroll record
            const payrollRecord = await pool.query(`
                INSERT INTO payroll_records (
                    employee_id, period_start, period_end,
                    basic_salary, allowances, tax_amount,
                    total_days_worked, total_hours_worked, overtime_hours,
                    leave_days_taken, status, processed_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (employee_id, period_start, period_end)
                DO UPDATE SET
                    basic_salary = $4,
                    allowances = $5,
                    tax_amount = $6,
                    total_days_worked = $7,
                    total_hours_worked = $8,
                    overtime_hours = $9,
                    leave_days_taken = $10,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [
                employee.id, period_start, period_end,
                basicSalary, allowances, taxAmount,
                attendanceData.rows[0].days_worked,
                attendanceData.rows[0].total_hours,
                attendanceData.rows[0].overtime_hours,
                leaveData.rows[0].leave_days,
                'draft',
                req.user.id
            ]);

            results.push(payrollRecord.rows[0]);
        }

        res.json({
            message: 'Payroll calculated successfully',
            records: results,
            summary: {
                total_employees: results.length,
                period_start,
                period_end,
                tax_rate: taxRate,
                allowance_rate: allowanceRate
            }
        });
    } catch (error) {
        console.error('Payroll Calculation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get payroll records with filters
app.get('/api/payroll/records', authenticateToken, async (req, res) => {
    try {
        const { period_start, period_end, status, employee_id } = req.query;

        let query = `
            SELECT 
                pr.*,
                u.first_name,
                u.last_name,
                u.employee_id as emp_number,
                d.name as department
            FROM payroll_records pr
            JOIN user_profiles u ON pr.employee_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        // Security: Filter by own ID if not admin
        if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            query += ` AND pr.employee_id = $${idx++}`;
            params.push(req.user.id);
        } else if (employee_id) {
            query += ` AND pr.employee_id = $${idx++}`;
            params.push(employee_id);
        }

        if (period_start) {
            query += ` AND pr.period_start >= $${idx++}`;
            params.push(period_start);
        }

        if (period_end) {
            query += ` AND pr.period_end <= $${idx++}`;
            params.push(period_end);
        }

        if (status) {
            query += ` AND pr.status = $${idx++}`;
            params.push(status);
        }

        query += ` ORDER BY pr.period_start DESC, u.last_name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get Payroll Records Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve payroll record
app.put('/api/payroll/records/:id/approve', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Admin check
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const result = await pool.query(`
            UPDATE payroll_records
            SET status = 'approved',
                approved_by = $1,
                approved_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [req.user.id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payroll record not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Approve Payroll Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get salary components for an employee
app.get('/api/payroll/components/:employeeId', authenticateToken, async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Check permissions
        if (employeeId !== req.user.id && !['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }

        const employee = await pool.query(
            'SELECT salary FROM user_profiles WHERE id = $1',
            [employeeId]
        );

        if (employee.rows.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const basicSalary = parseFloat(employee.rows[0].salary || 0);

        // Get system settings
        const taxRate = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'payroll_tax_rate'"
        );
        const allowanceRate = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'payroll_allowance_rate'"
        );

        const tax = parseFloat(taxRate.rows[0]?.setting_value || '0.15');
        const allowance = parseFloat(allowanceRate.rows[0]?.setting_value || '0.10');

        const components = {
            basic_salary: basicSalary,
            allowances: basicSalary * allowance,
            gross_salary: basicSalary + (basicSalary * allowance),
            tax_deduction: (basicSalary + (basicSalary * allowance)) * tax,
            net_salary: (basicSalary + (basicSalary * allowance)) - ((basicSalary + (basicSalary * allowance)) * tax),
            breakdown: {
                basic: basicSalary,
                housing_allowance: basicSalary * (allowance / 2),
                transport_allowance: basicSalary * (allowance / 2),
                income_tax: (basicSalary + (basicSalary * allowance)) * tax
            }
        };

        res.json(components);
    } catch (error) {
        console.error('Get Salary Components Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SYSTEM SETTINGS HELPER (if not exists)
// Add near the top of the file with other helpers
// ============================================

async function getSystemSetting(key, defaultValue = null) {
    try {
        const result = await pool.query(
            'SELECT setting_value FROM system_settings WHERE setting_key = $1',
            [key]
        );
        return result.rows[0]?.setting_value || defaultValue;
    } catch (error) {
        console.error(`Error getting system setting ${key}:`, error);
        return defaultValue;
    }
}

async function setSystemSetting(key, value, category = 'general', description = '') {
    try {
        await pool.query(`
            INSERT INTO system_settings (setting_key, setting_value, category, description)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (setting_key)
            DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
        `, [key, value, category, description]);
        return true;
    } catch (error) {
        console.error(`Error setting system setting ${key}:`, error);
        return false;
    }
}
