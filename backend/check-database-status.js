const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function comprehensiveDatabaseCheck() {
    console.log('🔍 COMPREHENSIVE DATABASE STATUS CHECK\n');
    console.log('='.repeat(60));

    try {
        // 1. List all tables
        console.log('\n📊 ALL TABLES IN DATABASE:');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        const tableNames = tables.rows.map(r => r.table_name);
        tableNames.forEach((name, i) => {
            console.log(`   ${i + 1}. ${name}`);
        });

        // 2. Check for new tables from schema enhancements
        console.log('\n✨ NEW TABLES STATUS (from schema-enhancements.sql):');
        const newTables = ['payroll_records', 'system_settings', 'performance_goals', 'performance_reviews', 'projects'];

        newTables.forEach(table => {
            const exists = tableNames.includes(table);
            console.log(`   ${exists ? '✅' : '❌'} ${table}`);
        });

        // 3. Check triggers
        console.log('\n🔧 DATABASE TRIGGERS:');
        const triggers = await pool.query(`
            SELECT DISTINCT 
                t.tgname as trigger_name,
                c.relname as table_name,
                p.proname as function_name
            FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_proc p ON t.tgfoid = p.oid
            WHERE t.tgname NOT LIKE 'RI_%'
            AND t.tgname NOT LIKE 'pg_%'
            ORDER BY c.relname, t.tgname
        `);

        if (triggers.rows.length > 0) {
            triggers.rows.forEach(t => {
                console.log(`   ✅ ${t.trigger_name} on ${t.table_name} → ${t.function_name}()`);
            });
        } else {
            console.log('   ⚠️  No custom triggers found');
        }

        // Check for specific triggers we created
        console.log('\n🎯 EXPECTED TRIGGERS:');
        const expectedTriggers = [
            'attendance_hours_trigger',
            'leave_balance_trigger',
            'check_leave_overlap'
        ];

        const existingTriggerNames = triggers.rows.map(t => t.trigger_name);
        expectedTriggers.forEach(trigger => {
            const exists = existingTriggerNames.includes(trigger);
            console.log(`   ${exists ? '✅' : '❌'} ${trigger}`);
        });

        // 4. Check system_settings
        if (tableNames.includes('system_settings')) {
            console.log('\n⚙️  SYSTEM SETTINGS:');
            const settings = await pool.query('SELECT setting_key, setting_value, category FROM system_settings ORDER BY category, setting_key');

            if (settings.rows.length > 0) {
                console.log(`   Found ${settings.rows.length} settings:`);
                let currentCategory = '';
                settings.rows.forEach(s => {
                    if (s.category !== currentCategory) {
                        currentCategory = s.category;
                        console.log(`\n   📁 ${currentCategory || 'general'}:`);
                    }
                    console.log(`      • ${s.setting_key}: ${s.setting_value}`);
                });
            } else {
                console.log('   ⚠️  No settings found - run initialization');
            }
        }

        // 5. Check payroll_records
        if (tableNames.includes('payroll_records')) {
            console.log('\n💰 PAYROLL RECORDS:');
            const payrollCount = await pool.query('SELECT COUNT(*) FROM payroll_records');
            console.log(`   Total records: ${payrollCount.rows[0].count}`);

            if (parseInt(payrollCount.rows[0].count) > 0) {
                const recent = await pool.query(`
                    SELECT pr.*, u.first_name, u.last_name 
                    FROM payroll_records pr
                    JOIN user_profiles u ON pr.employee_id = u.id
                    ORDER BY pr.created_at DESC
                    LIMIT 3
                `);
                console.log('   Recent records:');
                recent.rows.forEach(r => {
                    console.log(`      - ${r.first_name} ${r.last_name}: ${r.period_start} to ${r.period_end} (${r.status})`);
                });
            }
        }

        // 6. Check existing data counts
        console.log('\n📈 EXISTING DATA SUMMARY:');
        const dataTables = [
            'user_profiles',
            'attendance_records',
            'leave_requests',
            'employee_leave_balances',
            'departments',
            'teams'
        ];

        for (const table of dataTables) {
            if (tableNames.includes(table)) {
                const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ${table}: ${count.rows[0].count} records`);
            }
        }

        // 7. Check attendance records with total_hours
        console.log('\n⏱️  ATTENDANCE HOURS CALCULATION:');
        const attendanceWithHours = await pool.query(`
            SELECT COUNT(*) as total,
                   COUNT(total_hours) as with_hours,
                   COUNT(overtime_hours) as with_overtime
            FROM attendance_records
            WHERE check_out IS NOT NULL
        `);

        const stats = attendanceWithHours.rows[0];
        console.log(`   Total completed records: ${stats.total}`);
        console.log(`   Records with total_hours: ${stats.with_hours}`);
        console.log(`   Records with overtime: ${stats.with_overtime}`);

        if (parseInt(stats.total) > 0) {
            const percentage = (parseInt(stats.with_hours) / parseInt(stats.total) * 100).toFixed(1);
            console.log(`   Auto-calculation rate: ${percentage}%`);
        }

        // 8. Check leave balances
        console.log('\n🏖️  LEAVE BALANCES:');
        const leaveBalances = await pool.query(`
            SELECT COUNT(DISTINCT employee_id) as employees_with_balances,
                   COUNT(*) as total_balance_records
            FROM employee_leave_balances
        `);
        console.log(`   Employees with balances: ${leaveBalances.rows[0].employees_with_balances}`);
        console.log(`   Total balance records: ${leaveBalances.rows[0].total_balance_records}`);

        // 9. Final recommendation
        console.log('\n' + '='.repeat(60));
        console.log('\n📋 RECOMMENDATIONS:\n');

        const missingTables = newTables.filter(t => !tableNames.includes(t));
        const missingTriggers = expectedTriggers.filter(t => !existingTriggerNames.includes(t));

        if (missingTables.length === 0 && missingTriggers.length === 0) {
            console.log('   ✅ All schema enhancements are applied!');
            console.log('   ✅ Database is ready for the new HRM features');
            console.log('\n   Next steps:');
            console.log('   1. Ensure backend routes are integrated');
            console.log('   2. Test new API endpoints');
            console.log('   3. Integrate frontend components');
        } else {
            if (missingTables.length > 0) {
                console.log('   ⚠️  Missing tables:', missingTables.join(', '));
            }
            if (missingTriggers.length > 0) {
                console.log('   ⚠️  Missing triggers:', missingTriggers.join(', '));
            }
            console.log('\n   Action required:');
            console.log('   Run: psql -U postgres -d arise_hrm -f schema-enhancements.sql');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nStack:', error.stack);
    } finally {
        await pool.end();
    }
}

comprehensiveDatabaseCheck();
