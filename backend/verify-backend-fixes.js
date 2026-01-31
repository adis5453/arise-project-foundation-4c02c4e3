// Final verification script
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function finalVerification() {
    console.log('🔍 Final Backend Verification\n');
    console.log('='.repeat(60));

    const client = await pool.connect();

    try {
        // 1. Check system settings
        console.log('\n1. System Settings:');
        const settings = await client.query('SELECT COUNT(*) as count FROM system_settings');
        console.log(`   ✅ ${settings.rows[0].count} settings configured`);

        const payrollSettings = await client.query(`
            SELECT key, value FROM system_settings 
            WHERE category = 'payroll' 
            ORDER BY key
        `);
        console.log('   Payroll settings:');
        payrollSettings.rows.forEach(s => {
            console.log(`      - ${s.key}: ${s.value}`);
        });

        // 2. Check triggers
        console.log('\n2. Database Triggers:');
        const triggers = await client.query(`
            SELECT tgname, tgrelid::regclass as table_name
            FROM pg_trigger 
            WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap')
            ORDER BY tgname
        `);

        if (triggers.rows.length === 3) {
            console.log('   ✅ All 3 triggers active:');
            triggers.rows.forEach(t => {
                console.log(`      - ${t.tgname} on ${t.table_name}`);
            });
        } else {
            console.log(`   ⚠️  Only ${triggers.rows.length}/3 triggers found`);
        }

        // 3. Check indexes
        console.log('\n3. Performance Indexes:');
        const indexes = await client.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE indexname LIKE 'idx_%'
            AND tablename IN ('user_profiles', 'leave_requests', 'attendance_records')
            ORDER BY indexname
        `);
        console.log(`   ✅ ${indexes.rows.length} indexes created:`);
        indexes.rows.forEach(idx => {
            console.log(`      - ${idx.indexname}`);
        });

        // 4. Check attendance notes column
        console.log('\n4. Attendance Notes Column:');
        const notesCol = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'attendance_records' 
            AND column_name = 'notes'
        `);
        if (notesCol.rows.length > 0) {
            console.log(`   ✅ EXISTS (${notesCol.rows[0].data_type})`);
        } else {
            console.log('   ❌ MISSING');
        }

        // 5. Check constraints
        console.log('\n5. Data Constraints:');
        const constraints = await client.query(`
            SELECT conname, contype 
            FROM pg_constraint 
            WHERE conname IN ('check_valid_dates', 'check_non_negative_balance')
        `);
        console.log(`   ${constraints.rows.length} constraints found:`);
        constraints.rows.forEach(c => {
            console.log(`      - ${c.conname}`);
        });

        // 6. Sample data check
        console.log('\n6. Sample Data:');
        const employees = await client.query('SELECT COUNT(*) FROM user_profiles');
        const attendance = await client.query('SELECT COUNT(*) FROM attendance_records');
        const leaves = await client.query('SELECT COUNT(*) FROM leave_requests');

        console.log(`   Employees: ${employees.rows[0].count}`);
        console.log(`   Attendance Records: ${attendance.rows[0].count}`);
        console.log(`   Leave Requests: ${leaves.rows[0].count}`);

        // Final verdict
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ BACKEND VERIFICATION COMPLETE\n');

        const allGood =
            settings.rows[0].count >= 10 &&
            triggers.rows.length === 3 &&
            indexes.rows.length >= 4 &&
            notesCol.rows.length > 0;

        if (allGood) {
            console.log('✅ All backend fixes verified successfully!');
            console.log('✅ System is ready for frontend integration');
            console.log('\nNext steps:');
            console.log('  1. Restart backend server');
            console.log('  2. Test API endpoints');
            console.log('  3. Integrate frontend components');
        } else {
            console.log('⚠️  Some issues detected - review above');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

finalVerification();
