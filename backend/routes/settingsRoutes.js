const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get system settings
router.get('/system', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT key, value, category, description
            FROM system_settings
            ORDER BY category, key
        `);

        // Convert to key-value object grouped by category
        const settings = {};
        result.rows.forEach(row => {
            const cat = row.category || 'general';
            if (!settings[cat]) {
                settings[cat] = {};
            }
            settings[cat][row.key] = {
                value: row.value,
                description: row.description
            };
        });

        res.json(settings);
    } catch (error) {
        console.error('Get System Settings Error:', error);
        // Return empty object if table doesn't exist or has issues
        res.json({});
    }
});

// Update system settings
router.patch('/system', authenticateToken, async (req, res) => {
    try {
        // Admin check
        if (!['super_admin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updates = req.body;
        const results = [];

        for (const [key, value] of Object.entries(updates)) {
            const result = await pool.query(`
                INSERT INTO system_settings (key, value, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (key)
                DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `, [key, value]);
            results.push(result.rows[0]);
        }

        res.json({ message: 'Settings updated', settings: results });
    } catch (error) {
        console.error('Update System Settings Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get profile completion for a user (when mounted at /api/profile)
router.get('/completion/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check - users can only see their own completion, admins can see all
        if (userId !== req.user.id && !['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT 
                first_name,
                last_name,
                email,
                phone_number,
                department_id,
                position_id,
                profile_photo_url,
                date_of_birth,
                hire_date,
                emergency_contact_name,
                address
            FROM user_profiles
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = result.rows[0];

        // Calculate completion percentage based on filled fields
        const fields = [
            { name: 'first_name', weight: 15, filled: !!profile.first_name },
            { name: 'last_name', weight: 15, filled: !!profile.last_name },
            { name: 'email', weight: 10, filled: !!profile.email },
            { name: 'phone_number', weight: 10, filled: !!profile.phone_number },
            { name: 'department_id', weight: 10, filled: !!profile.department_id },
            { name: 'position_id', weight: 10, filled: !!profile.position_id },
            { name: 'profile_photo_url', weight: 10, filled: !!profile.profile_photo_url },
            { name: 'date_of_birth', weight: 5, filled: !!profile.date_of_birth },
            { name: 'hire_date', weight: 5, filled: !!profile.hire_date },
            { name: 'emergency_contact', weight: 5, filled: !!profile.emergency_contact_name },
            { name: 'address', weight: 5, filled: !!profile.address },
        ];

        const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
        const completedWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0);
        const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

        const missingFields = fields.filter(f => !f.filled).map(f => f.name);

        res.json({
            completion_percentage: completionPercentage,
            missing_fields: missingFields,
            fields: fields
        });
    } catch (error) {
        console.error('Get Profile Completion Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get profile completion for a user (legacy route for /api/settings mount)
router.get('/profile/completion/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check - users can only see their own completion, admins can see all
        if (userId !== req.user.id && !['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(`
            SELECT 
                first_name,
                last_name,
                email,
                phone_number,
                department_id,
                position_id,
                profile_photo_url,
                date_of_birth,
                hire_date,
                emergency_contact_name,
                address
            FROM user_profiles
            WHERE id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = result.rows[0];

        // Calculate completion percentage based on filled fields
        const fields = [
            { name: 'first_name', weight: 15, filled: !!profile.first_name },
            { name: 'last_name', weight: 15, filled: !!profile.last_name },
            { name: 'email', weight: 10, filled: !!profile.email },
            { name: 'phone_number', weight: 10, filled: !!profile.phone_number },
            { name: 'department_id', weight: 10, filled: !!profile.department_id },
            { name: 'position_id', weight: 10, filled: !!profile.position_id },
            { name: 'profile_photo_url', weight: 10, filled: !!profile.profile_photo_url },
            { name: 'date_of_birth', weight: 5, filled: !!profile.date_of_birth },
            { name: 'hire_date', weight: 5, filled: !!profile.hire_date },
            { name: 'emergency_contact', weight: 5, filled: !!profile.emergency_contact_name },
            { name: 'address', weight: 5, filled: !!profile.address },
        ];

        const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
        const completedWeight = fields.filter(f => f.filled).reduce((sum, f) => sum + f.weight, 0);
        const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

        const missingFields = fields.filter(f => !f.filled).map(f => f.name);

        res.json({
            completion_percentage: completionPercentage,
            missing_fields: missingFields,
            fields: fields
        });
    } catch (error) {
        console.error('Get Profile Completion Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
