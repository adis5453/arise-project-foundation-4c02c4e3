const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function quickCheck() {
    console.log('🔍 Quick Database Check\n');

    try {
        // Check for new tables
        console.log('Checking for new tables...');
        const newTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('payroll_records', 'performance_goals', 'projects')
            ORDER BY table_name
        `);

        console.log('\nNew Tables Status:');
        ['payroll_records', 'performance_goals', 'projects'].forEach(table => {
            const exists = newTables.rows.find(r => r.table_name === table);
            console.log(`  ${exists ? '✅' : '❌'} ${table}`);
        });

        // Check triggers
        console.log('\nChecking for triggers...');
        const triggers = await pool.query(`
            SELECT tgname 
            FROM pg_trigger 
            WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap')
        `);

        console.log('\nTriggers Status:');
        ['attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap'].forEach(trigger => {
            const exists = triggers.rows.find(r => r.tgname === trigger);
            console.log(`  ${exists ? '✅' : '❌'} ${trigger}`);
        });

        // Check system settings
        console.log('\nChecking system settings...');
        const settings = await pool.query(`
            SELECT setting_key, setting_value 
            FROM system_settings 
            WHERE setting_key IN (
                'payroll_tax_rate',
                'payroll_allowance_rate',
                'standard_work_hours',
                'overtime_multiplier',
                'late_arrival_threshold',
                'leave_accrual_rate',
                'max_leave_carryover'
            )
            ORDER BY setting_key
        `);

        console.log('\nPayroll/HR Settings:');
        const expectedSettings = [
            'payroll_tax_rate',
            'payroll_allowance_rate',
            'standard_work_hours',
            'overtime_multiplier',
            'late_arrival_threshold',
            'leave_accrual_rate',
            'max_leave_carryover'
        ];

        expectedSettings.forEach(key => {
            const setting = settings.rows.find(r => r.setting_key === key);
            if (setting) {
                console.log(`  ✅ ${key}: ${setting.setting_value}`);
            } else {
                console.log(`  ❌ ${key}: NOT SET`);
            }
        });

        // Final verdict
        const allTablesExist = newTables.rows.length === 3;
        const allTriggersExist = triggers.rows.length === 3;
        const allSettingsExist = settings.rows.length === 7;

        console.log('\n' + '='.repeat(50));
        console.log('\n📋 VERDICT:\n');

        if (allTablesExist && allTriggersExist && allSettingsExist) {
            console.log('✅ ALL SCHEMA ENHANCEMENTS ARE APPLIED!');
            console.log('✅ Database is ready for new HRM features');
            console.log('\nNext steps:');
            console.log('  1. Integrate backend routes');
            console.log('  2. Test API endpoints');
            console.log('  3. Deploy frontend components');
        } else {
            console.log('⚠️  SCHEMA ENHANCEMENTS NEED TO BE APPLIED\n');
            if (!allTablesExist) console.log('  Missing tables detected');
            if (!allTriggersExist) console.log('  Missing triggers detected');
            if (!allSettingsExist) console.log('  Missing system settings detected');
            console.log('\nAction required:');
            console.log('  psql -U postgres -d arise_hrm -f schema-enhancements.sql');
        }
        console.log('\n' + '='.repeat(50));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

quickCheck();
