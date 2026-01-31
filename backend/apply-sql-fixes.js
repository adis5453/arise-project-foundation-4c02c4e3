// Apply SQL fixes step by step
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function applyFixesStepByStep() {
    console.log('🔧 Applying Backend Logic Fixes Step by Step...\n');

    const client = await pool.connect();

    try {
        // 1. Add notes column
        console.log('1. Adding notes column to attendance_records...');
        await client.query('ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS notes TEXT');
        console.log('   ✅ Done\n');

        // 2. Add indexes
        console.log('2. Adding performance indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id ON user_profiles(manager_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by ON leave_requests(reviewed_by)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date)');
        console.log('   ✅ Done\n');

        // 3. Add category column to system_settings
        console.log('3. Adding category column to system_settings...');
        await client.query('ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(50)');
        await client.query('ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT');
        console.log('   ✅ Done\n');

        // 4. Initialize system settings
        console.log('4. Initializing default system settings...');
        await client.query(`
            INSERT INTO system_settings (key, value, category, description) VALUES
                ('payroll_tax_rate', '0.15', 'payroll', 'Default tax rate (15%)'),
                ('payroll_allowance_rate', '0.10', 'payroll', 'Default allowance rate (10%)'),
                ('standard_work_hours', '8', 'attendance', 'Standard work hours per day'),
                ('overtime_multiplier', '1.5', 'attendance', 'Overtime pay multiplier'),
                ('late_arrival_threshold', '09:30:00', 'attendance', 'Late arrival time threshold'),
                ('leave_accrual_rate', '1.67', 'leave', 'Monthly leave accrual (20 days/year)'),
                ('max_leave_carryover', '5', 'leave', 'Maximum leave carryover days')
            ON CONFLICT (key) DO NOTHING
        `);
        console.log('   ✅ Done\n');

        // 5. Add constraint to leave_requests
        console.log('5. Adding date validation constraint...');
        await client.query('ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS check_valid_dates');
        await client.query('ALTER TABLE leave_requests ADD CONSTRAINT check_valid_dates CHECK (end_date >= start_date)');
        console.log('   ✅ Done\n');

        // 6. Verify changes
        console.log('📊 Verification:\n');

        const settings = await client.query('SELECT COUNT(*) FROM system_settings');
        console.log(`   System Settings: ${settings.rows[0].count} records`);

        const notesCol = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'attendance_records' AND column_name = 'notes'
        `);
        console.log(`   Attendance notes column: ${notesCol.rows.length > 0 ? '✅ EXISTS' : '❌ MISSING'}`);

        const indexes = await client.query(`
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE indexname LIKE 'idx_%'
        `);
        console.log(`   Performance indexes: ${indexes.rows[0].count} created`);

        console.log('\n✅ All fixes applied successfully!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

applyFixesStepByStep().catch(console.error);
