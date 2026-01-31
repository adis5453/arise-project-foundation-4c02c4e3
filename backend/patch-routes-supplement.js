// Update routes-supplement.js to use correct column names
// Find and replace all instances of setting_key/setting_value with key/value

// BEFORE:
// const result = await pool.query(
//     'SELECT setting_value FROM system_settings WHERE setting_key = $1',
//     [key]
// );

// AFTER:
const result = await pool.query(
    'SELECT value FROM system_settings WHERE key = $1',
    [key]
);

// Apply this change to all occurrences in:
// 1. getSystemSetting() helper function
// 2. setSystemSetting() helper function  
// 3. GET /api/payroll/settings
// 4. POST /api/payroll/calculate
// 5. GET /api/payroll/components/:employeeId

// Full corrected helper functions:

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
