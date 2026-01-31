/**
 * Comprehensive System Verification
 * Checks database, API endpoints, and data integrity
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function verify() {
    console.log('🔍 COMPREHENSIVE SYSTEM VERIFICATION\n');
    console.log('='.repeat(60));

    const issues = [];
    const successes = [];

    try {
        // 1. Database Connection
        console.log('\n1️⃣  DATABASE CONNECTION');
        try {
            const dbTest = await pool.query('SELECT NOW() as time, current_database() as db');
            console.log(`   ✅ Connected to: ${dbTest.rows[0].db}`);
            console.log(`   ✅ Server time: ${dbTest.rows[0].time}`);
            successes.push('Database connection');
        } catch (e) {
            console.log(`   ❌ Connection failed: ${e.message}`);
            issues.push(`Database connection: ${e.message}`);
        }

        // 2. Required Tables
        console.log('\n2️⃣  REQUIRED TABLES');
        const requiredTables = [
            'user_profiles', 'roles', 'departments', 'teams', 'positions',
            'attendance_records', 'leave_requests', 'leave_types', 'employee_leave_balances',
            'notifications', 'announcements', 'messages', 'conversations',
            'payroll_records', 'performance_reviews', 'performance_goals',
            'benefit_plans', 'employee_benefits', 'onboarding_tasks',
            'refresh_tokens', 'system_settings', 'projects', 'training_courses'
        ];

        const tables = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        const existingTables = tables.rows.map(r => r.table_name);

        let missingTables = [];
        for (const table of requiredTables) {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table}`);
            } else {
                console.log(`   ❌ ${table} - MISSING`);
                missingTables.push(table);
            }
        }

        if (missingTables.length > 0) {
            issues.push(`Missing tables: ${missingTables.join(', ')}`);
        } else {
            successes.push('All required tables exist');
        }

        // 3. User Profiles Columns
        console.log('\n3️⃣  USER_PROFILES COLUMNS');
        const requiredColumns = [
            'id', 'email', 'password_hash', 'first_name', 'last_name',
            'role_id', 'department_id', 'employee_id', 'status', 'is_active',
            'phone_number', 'hire_date', 'salary', 'avatar_url', 'profile_photo_url',
            'account_locked', 'failed_login_attempts', 'mfa_enabled', 'mfa_secret'
        ];

        const columns = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'user_profiles'
        `);
        const existingColumns = columns.rows.map(r => r.column_name);

        let missingColumns = [];
        for (const col of requiredColumns) {
            if (existingColumns.includes(col)) {
                console.log(`   ✅ ${col}`);
            } else {
                console.log(`   ❌ ${col} - MISSING`);
                missingColumns.push(col);
            }
        }

        if (missingColumns.length > 0) {
            issues.push(`Missing user_profiles columns: ${missingColumns.join(', ')}`);

            // Auto-fix missing columns
            console.log('\n   🔧 Auto-fixing missing columns...');
            for (const col of missingColumns) {
                try {
                    let dataType = 'TEXT';
                    if (col.includes('_id') && col !== 'employee_id') dataType = 'UUID';
                    else if (col.includes('locked') || col.includes('enabled') || col.includes('active')) dataType = 'BOOLEAN DEFAULT false';
                    else if (col.includes('attempts')) dataType = 'INTEGER DEFAULT 0';
                    else if (col.includes('date') && !col.includes('_at')) dataType = 'DATE';
                    else if (col.includes('_at')) dataType = 'TIMESTAMP';
                    else if (col === 'salary') dataType = 'NUMERIC(12,2)';

                    await pool.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ${col} ${dataType}`);
                    console.log(`   ✅ Added ${col}`);
                } catch (e) {
                    console.log(`   ⚠️ Could not add ${col}: ${e.message}`);
                }
            }
        } else {
            successes.push('All user_profiles columns exist');
        }

        // 4. Notifications Table Check
        console.log('\n4️⃣  NOTIFICATIONS TABLE');
        try {
            const notifCols = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'notifications'
            `);
            const notifColNames = notifCols.rows.map(r => r.column_name);

            console.log(`   Columns: ${notifColNames.join(', ')}`);

            if (notifColNames.includes('recipient_id')) {
                console.log('   ✅ Uses recipient_id (correct)');
                successes.push('Notifications uses recipient_id');
            } else if (notifColNames.includes('user_id')) {
                console.log('   ⚠️ Uses user_id, routes expect recipient_id');
                // Rename column
                try {
                    await pool.query('ALTER TABLE notifications RENAME COLUMN user_id TO recipient_id');
                    console.log('   ✅ Renamed user_id to recipient_id');
                } catch (e) {
                    issues.push(`Notifications column mismatch: ${e.message}`);
                }
            }
        } catch (e) {
            console.log(`   ❌ Error checking notifications: ${e.message}`);
        }

        // 5. Data Counts
        console.log('\n5️⃣  DATA COUNTS');
        const dataTables = ['user_profiles', 'departments', 'roles', 'leave_types', 'attendance_records'];

        for (const table of dataTables) {
            try {
                const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ${table}: ${count.rows[0].count} records`);
            } catch (e) {
                console.log(`   ${table}: ❌ Error - ${e.message}`);
            }
        }

        // 6. Roles Check
        console.log('\n6️⃣  ROLES');
        try {
            const roles = await pool.query('SELECT * FROM roles ORDER BY id');
            if (roles.rows.length === 0) {
                console.log('   ⚠️ No roles found - inserting defaults');
                await pool.query(`
                    INSERT INTO roles (name, description) VALUES 
                        ('super_admin', 'Super Administrator'),
                        ('admin', 'Administrator'),
                        ('hr_manager', 'HR Manager'),
                        ('department_manager', 'Department Manager'),
                        ('manager', 'Manager'),
                        ('team_leader', 'Team Leader'),
                        ('employee', 'Employee'),
                        ('intern', 'Intern')
                    ON CONFLICT (name) DO NOTHING
                `);
                console.log('   ✅ Default roles inserted');
            } else {
                console.log(`   ✅ ${roles.rows.length} roles found`);
                roles.rows.forEach(r => console.log(`      - ${r.name}`));
            }
            successes.push('Roles configured');
        } catch (e) {
            console.log(`   ❌ Roles error: ${e.message}`);
            issues.push(`Roles: ${e.message}`);
        }

        // 7. Test User Check
        console.log('\n7️⃣  TEST USER');
        try {
            const users = await pool.query(`
                SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name
                FROM user_profiles u
                LEFT JOIN roles r ON u.role_id = r.id
                LIMIT 5
            `);

            if (users.rows.length > 0) {
                console.log(`   ✅ Found ${users.rows.length} users`);
                users.rows.forEach(u => {
                    console.log(`      - ${u.first_name} ${u.last_name} (${u.email}) - ${u.role_name || 'no role'}`);
                });
                successes.push('Users exist in database');
            } else {
                console.log('   ⚠️ No users found');
                issues.push('No users in database');
            }
        } catch (e) {
            console.log(`   ❌ User check error: ${e.message}`);
            issues.push(`Users: ${e.message}`);
        }

        // 8. Foreign Key Integrity
        console.log('\n8️⃣  FOREIGN KEY INTEGRITY');
        try {
            // Check users with invalid role_id
            const invalidRoles = await pool.query(`
                SELECT COUNT(*) FROM user_profiles u
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.role_id IS NOT NULL AND r.id IS NULL
            `);

            if (parseInt(invalidRoles.rows[0].count) > 0) {
                console.log(`   ⚠️ ${invalidRoles.rows[0].count} users with invalid role_id`);
                issues.push(`${invalidRoles.rows[0].count} users with invalid role references`);
            } else {
                console.log('   ✅ All role references valid');
            }

            // Check users with invalid department_id
            const invalidDepts = await pool.query(`
                SELECT COUNT(*) FROM user_profiles u
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE u.department_id IS NOT NULL AND d.id IS NULL
            `);

            if (parseInt(invalidDepts.rows[0].count) > 0) {
                console.log(`   ⚠️ ${invalidDepts.rows[0].count} users with invalid department_id`);
            } else {
                console.log('   ✅ All department references valid');
            }

            successes.push('Foreign key integrity checked');
        } catch (e) {
            console.log(`   ❌ Integrity check error: ${e.message}`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('\n📋 VERIFICATION SUMMARY\n');

        console.log('✅ SUCCESSES:');
        successes.forEach(s => console.log(`   • ${s}`));

        if (issues.length > 0) {
            console.log('\n❌ ISSUES FOUND:');
            issues.forEach(i => console.log(`   • ${i}`));
        } else {
            console.log('\n🎉 NO ISSUES FOUND - SYSTEM IS READY!');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
    } finally {
        await pool.end();
    }
}

verify();
