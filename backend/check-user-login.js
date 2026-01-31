// Quick script to check if user exists and has password
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function checkUser() {
    try {
        const email = 'adis5453@gmail.com';

        console.log(`\n🔍 Checking user: ${email}\n`);

        const result = await pool.query(`
            SELECT 
                id,
                employee_id,
                first_name,
                last_name,
                email,
                role_id,
                department_id,
                password_hash IS NOT NULL as has_password,
                LENGTH(password_hash) as password_length,
                created_at
            FROM user_profiles 
            WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            console.log('❌ USER NOT FOUND IN DATABASE');
            console.log('\nPossible reasons:');
            console.log('1. Employee creation failed silently');
            console.log('2. Email was entered differently');
            console.log('3. Database transaction rolled back');
            console.log('\n💡 Solution: Try creating the employee again');
        } else {
            const user = result.rows[0];
            console.log('✅ USER FOUND\n');
            console.log('Details:');
            console.log(`  ID: ${user.id}`);
            console.log(`  Employee ID: ${user.employee_id || 'NOT SET'}`);
            console.log(`  Name: ${user.first_name} ${user.last_name}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role ID: ${user.role_id}`);
            console.log(`  Department: ${user.department_id || 'NOT SET'}`);
            console.log(`  Has Password: ${user.has_password ? '✅ YES' : '❌ NO'}`);
            console.log(`  Password Length: ${user.password_length || 0} chars`);
            console.log(`  Created: ${user.created_at}`);

            if (!user.has_password) {
                console.log('\n❌ PROBLEM: NO PASSWORD SET!');
                console.log('\nThis is why login fails.');
                console.log('\n💡 Solution:');
                console.log('1. Delete this employee');
                console.log('2. Create again (password will be set automatically)');
                console.log('3. Or manually set password via UPDATE query');
            } else {
                console.log('\n✅ Password exists - Login should work!');
                console.log('\nIf still failing:');
                console.log('1. Make sure you\'re using: password123');
                console.log('2. Check for typos');
                console.log('3. Wait 5 minutes if rate-limited');
            }
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkUser();
