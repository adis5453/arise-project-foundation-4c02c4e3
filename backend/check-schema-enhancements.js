// Database Status Checker and Schema Applier
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'arise_hrm',
    password: 'your_password', // Update this
    port: 5432,
});

async function checkDatabaseStatus() {
    console.log('🔍 Checking database status...\n');

    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connection successful\n');

        // Check if new tables exist
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('payroll_records', 'system_settings', 'performance_goals', 'performance_reviews', 'projects')
            ORDER BY table_name
        `);

        console.log('📊 New Tables Status:');
        const expectedTables = ['payroll_records', 'system_settings', 'performance_goals', 'performance_reviews', 'projects'];
        const existingTables = tables.rows.map(r => r.table_name);

        expectedTables.forEach(table => {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table} - EXISTS`);
            } else {
                console.log(`   ❌ ${table} - MISSING`);
            }
        });

        // Check if triggers exist
        console.log('\n🔧 Triggers Status:');
        const triggers = await client.query(`
            SELECT DISTINCT tgname 
            FROM pg_trigger 
            WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap')
        `);

        const expectedTriggers = ['attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap'];
        const existingTriggers = triggers.rows.map(r => r.tgname);

        expectedTriggers.forEach(trigger => {
            if (existingTriggers.includes(trigger)) {
                console.log(`   ✅ ${trigger} - ACTIVE`);
            } else {
                console.log(`   ❌ ${trigger} - MISSING`);
            }
        });

        // Check system settings
        console.log('\n⚙️  System Settings:');
        const settings = await client.query('SELECT COUNT(*) as count FROM system_settings');
        if (settings.rows[0].count > 0) {
            console.log(`   ✅ ${settings.rows[0].count} settings configured`);
            const settingsList = await client.query('SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key');
            settingsList.rows.forEach(s => {
                console.log(`      - ${s.setting_key}: ${s.setting_value}`);
            });
        } else {
            console.log('   ❌ No system settings found');
        }

        // Check existing data
        console.log('\n📈 Existing Data:');
        const employees = await client.query('SELECT COUNT(*) FROM user_profiles');
        const attendance = await client.query('SELECT COUNT(*) FROM attendance_records');
        const leaves = await client.query('SELECT COUNT(*) FROM leave_requests');

        console.log(`   - Employees: ${employees.rows[0].count}`);
        console.log(`   - Attendance Records: ${attendance.rows[0].count}`);
        console.log(`   - Leave Requests: ${leaves.rows[0].count}`);

        client.release();

        // Determine if schema needs to be applied
        console.log('\n📋 Recommendation:');
        if (existingTables.length === 0 && existingTriggers.length === 0) {
            console.log('   ⚠️  Schema enhancements NOT applied yet');
            console.log('   ➡️  Run: psql -U postgres -d arise_hrm -f schema-enhancements.sql');
        } else if (existingTables.length === expectedTables.length && existingTriggers.length === expectedTriggers.length) {
            console.log('   ✅ Schema enhancements already applied');
            console.log('   ➡️  Ready to proceed with frontend updates');
        } else {
            console.log('   ⚠️  Partial schema applied - may need to re-run');
            console.log('   ➡️  Run: psql -U postgres -d arise_hrm -f schema-enhancements.sql');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.message.includes('does not exist')) {
            console.log('\n💡 Database does not exist. Create it first:');
            console.log('   createdb -U postgres arise_hrm');
            console.log('   psql -U postgres -d arise_hrm -f schema.sql');
            console.log('   psql -U postgres -d arise_hrm -f schema-enhancements.sql');
        }
    } finally {
        await pool.end();
    }
}

checkDatabaseStatus();
