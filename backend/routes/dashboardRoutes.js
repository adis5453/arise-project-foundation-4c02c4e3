const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Get Dashboard Context (personalized for user)
router.get('/context', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        // Get user profile with department and team info
        const userResult = await pool.query(`
            SELECT 
                u.id, u.employee_id, u.first_name, u.last_name, u.email,
                u.department_id, u.team_id, u.position_id, u.status,
                d.name as department_name,
                t.name as team_name,
                t.team_lead_id,
                p.name as position_name,
                r.name as role_name
            FROM user_profiles u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN teams t ON u.team_id = t.id
            LEFT JOIN positions p ON u.position_id = p.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Get team members if user is part of a team
        let team = null;
        let colleagues = [];
        if (user.team_id) {
            const teamResult = await pool.query(`
                SELECT
                    u.id, u.employee_id, u.first_name, u.last_name,
                    u.email, u.profile_photo_url as avatar_url, p.name as position_name,
                    t.name as team_name, t.team_lead_id,
                    tl.first_name as lead_fname, tl.last_name as lead_lname
                FROM user_profiles u
                LEFT JOIN positions p ON u.position_id = p.id
                LEFT JOIN teams t ON u.team_id = t.id
                LEFT JOIN user_profiles tl ON t.team_lead_id = tl.id
                WHERE u.team_id = $1 AND u.status = 'active'
                ORDER BY u.first_name
            `, [user.team_id]);

            if (teamResult.rows.length > 0) {
                const teamData = teamResult.rows[0];
                team = {
                    id: user.team_id,
                    name: teamData.team_name || 'Team',
                    lead_fname: teamData.lead_fname || 'Team',
                    lead_lname: teamData.lead_lname || 'Lead',
                    type: 'team'
                };
                colleagues = teamResult.rows.map(row => ({
                    id: row.id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    avatar_url: row.avatar_url,
                    position_name: row.position_name
                }));
            }
        }

        // Get department colleagues if not in a team
        let department = null;
        if (user.department_id && !team) {
            const deptResult = await pool.query(`
                SELECT
                    u.id, u.employee_id, u.first_name, u.last_name,
                    u.email, u.profile_photo_url as avatar_url, p.name as position_name,
                    d.name as department_name, d.manager_id,
                    dm.first_name as manager_fname, dm.last_name as manager_lname
                FROM user_profiles u
                LEFT JOIN positions p ON u.position_id = p.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN user_profiles dm ON d.manager_id = dm.id
                WHERE u.department_id = $1 AND u.status = 'active' AND u.id != $2
                LIMIT 10
            `, [user.department_id, userId]);

            if (deptResult.rows.length > 0) {
                const deptData = deptResult.rows[0];
                department = {
                    id: user.department_id,
                    name: deptData.department_name || 'Department',
                    manager_fname: deptData.manager_fname || 'Department',
                    manager_lname: deptData.manager_lname || 'Manager'
                };
                colleagues = deptResult.rows.map(row => ({
                    id: row.id,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    avatar_url: row.avatar_url,
                    position_name: row.position_name
                }));
            }
        }

        // Get quick stats
        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1 AND status = 'pending') as pending_leaves,
                (SELECT COUNT(*) FROM attendance_records WHERE employee_id = $1 AND date = CURRENT_DATE) as today_attendance,
                (SELECT COUNT(*) FROM announcements 
                 WHERE is_published = true 
                 AND (expire_date IS NULL OR expire_date > NOW())
                 AND created_at > NOW() - INTERVAL '7 days') as recent_announcements
        `, [userId]);

        const stats = statsResult.rows[0];

        res.json({
            user: {
                id: user.id,
                employee_id: user.employee_id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                department: user.department_name,
                team: user.team_name,
                position: user.position_name,
                role: user.role_name
            },
            team,
            department,
            colleagues,
            stats: {
                pendingLeaves: parseInt(stats.pending_leaves) || 0,
                todayAttendance: parseInt(stats.today_attendance) > 0,
                recentAnnouncements: parseInt(stats.recent_announcements) || 0
            }
        });
    } catch (error) {
        logger.error('Error fetching dashboard context', { error: error.message, userId });
        res.status(500).json({ error: error.message });
    }
});

// Get Dashboard Stats Overview with Real Growth Percentages
router.get('/stats', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        let stats = {};

        // Admin/HR stats with REAL growth calculations
        if (['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
            // Get current month stats
            const currentMonthStats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM user_profiles WHERE status = 'active') as total_employees,
                    (SELECT COUNT(*) FROM attendance_records 
                     WHERE date = CURRENT_DATE AND status IN ('present', 'wfh')) as present_today,
                    (SELECT COUNT(*) FROM leave_requests 
                     WHERE status = 'approved' 
                     AND start_date <= CURRENT_DATE 
                     AND end_date >= CURRENT_DATE) as on_leave_today,
                    (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') as pending_approvals,
                    (SELECT COUNT(*) FROM user_profiles 
                     WHERE hire_date >= DATE_TRUNC('month', CURRENT_DATE)) as new_hires_this_month,
                    (SELECT COUNT(*) FROM departments) total_departments,
                    (SELECT COUNT(*) FROM teams) as total_teams
            `);

            // Get last month stats for comparison
            const lastMonthStats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM attendance_records 
                     WHERE date = CURRENT_DATE - INTERVAL '1 month' 
                     AND status IN ('present', 'wfh')) as present_last_month,
                    (SELECT COUNT(*) FROM leave_requests 
                     WHERE status = 'approved' 
                     AND start_date <= (CURRENT_DATE - INTERVAL '1 month')
                     AND end_date >= (CURRENT_DATE - INTERVAL '1 month')) as on_leave_last_month,
                    (SELECT COUNT(*) FROM leave_requests 
                     WHERE status = 'pending' 
                     AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                     AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as pending_last_month
            `);

            const current = currentMonthStats.rows[0];
            const last = lastMonthStats.rows[0];

            // Calculate percentage changes (avoid division by zero)
            const calculateChange = (current, previous) => {
                if (!previous || previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous * 100).toFixed(1);
            };

            stats.admin = {
                total_employees: parseInt(current.total_employees) || 0,
                total_employees_change: 0, // Employee count doesn't change daily

                present_today: parseInt(current.present_today) || 0,
                present_today_change: parseFloat(calculateChange(
                    parseInt(current.present_today) || 0,
                    parseInt(last.present_last_month) || 0
                )),

                on_leave_today: parseInt(current.on_leave_today) || 0,
                on_leave_today_change: parseFloat(calculateChange(
                    parseInt(current.on_leave_today) || 0,
                    parseInt(last.on_leave_last_month) || 0
                )),

                pending_approvals: parseInt(current.pending_approvals) || 0,
                pending_approvals_change: parseFloat(calculateChange(
                    parseInt(current.pending_approvals) || 0,
                    parseInt(last.pending_last_month) || 0
                )),

                new_hires_this_month: parseInt(current.new_hires_this_month) || 0,
                total_departments: parseInt(current.total_departments) || 0,
                total_teams: parseInt(current.total_teams) || 0
            };
        }

        // Employee-level stats
        const personalStats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1) as total_leave_requests,
                (SELECT COUNT(*) FROM leave_requests WHERE employee_id = $1 AND status = 'approved') as approved_leaves,
                (SELECT COUNT(*) FROM attendance_records 
                 WHERE employee_id = $1 
                 AND date >= DATE_TRUNC('month', CURRENT_DATE)) as attendance_this_month,
                (SELECT available_balance FROM employee_leave_balances 
                 WHERE employee_id = $1 
                 ORDER BY created_at DESC LIMIT 1) as leave_balance
        `, [userId]);

        stats.personal = {
            total_leave_requests: parseInt(personalStats.rows[0].total_leave_requests) || 0,
            approved_leaves: parseInt(personalStats.rows[0].approved_leaves) || 0,
            attendance_this_month: parseInt(personalStats.rows[0].attendance_this_month) || 0,
            leave_balance: parseFloat(personalStats.rows[0].leave_balance) || 0
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error fetching dashboard stats', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get quick actions for dashboard
router.get('/quick-actions', authenticateToken, async (req, res) => {
    const userRole = req.user.role;

    const actions = [
        { id: 'apply_leave', label: 'Apply Leave', icon: 'EventBusy', path: '/leaves/apply', roles: ['*'] },
        { id: 'view_attendance', label: 'My Attendance', icon: 'AccessTime', path: '/attendance', roles: ['*'] },
        { id: 'view_payslip', label: 'View Payslip', icon: 'Receipt', path: '/payroll/payslips', roles: ['*'] },
    ];

    if (['super_admin', 'admin', 'hr_manager', 'department_manager', 'team_lead'].includes(userRole)) {
        actions.push(
            { id: 'approve_leaves', label: 'Pending Approvals', icon: 'Approval', path: '/leaves/approvals', roles: ['manager'] },
            { id: 'team_dashboard', label: 'Team Dashboard', icon: 'Group', path: '/team', roles: ['manager'] }
        );
    }

    if (['super_admin', 'admin', 'hr_manager'].includes(userRole)) {
        actions.push(
            { id: 'add_employee', label: 'Add Employee', icon: 'PersonAdd', path: '/employees/new', roles: ['hr'] },
            { id: 'reports', label: 'Reports', icon: 'Assessment', path: '/reports', roles: ['hr'] }
        );
    }

    res.json(actions);
});

// Get recent activities (system-wide or personal)
router.get('/activities', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // This is a mock implementation or needs an 'activities' table
        // For now, we can aggregate from recent changes in other tables or return empty if no table exists
        // Real implementation would track events in an audit_logs or activities table

        // Mocking structure for now to satisfy frontend contract
        const activities = [
            { id: 1, type: 'login', description: 'Logged in successfully', timestamp: new Date() },
            // Add real DB queries here if activity_log table exists
        ];

        // Try to fetch from proper table if exists, e.g. audit_logs
        const result = await pool.query(`
            SELECT * FROM (
                SELECT 'leave' as type, 'Leave Request Created' as description, created_at as timestamp FROM leave_requests WHERE employee_id = $1
                UNION ALL
                SELECT 'attendance' as type, 'Clocked In' as description, created_at as timestamp FROM attendance_records WHERE employee_id = $1
            ) as combined
            ORDER BY timestamp DESC LIMIT 10
        `, [userId]);

        res.json(result.rows.length > 0 ? result.rows : activities);
    } catch (error) {
        logger.error('Error fetching activities', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard announcements (active & recent)
router.get('/announcements', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM announcements 
            WHERE is_published = true 
            AND (expire_date IS NULL OR expire_date > NOW())
            ORDER BY created_at DESC LIMIT 5
        `);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching dashboard announcements', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
