// Fix script - Manually create the employee that failed
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function createEmployee() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const email = 'adis5453@gmail.com';
        const password = 'password123';

        console.log('\n🔧 Creating employee manually...\n');

        // Check if already exists
        const existing = await client.query(
            'SELECT id FROM user_profiles WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            console.log('⚠️  User already exists! Updating password instead...\n');

            const hashedPassword = await bcrypt.hash(password, 10);
            await client.query(
                'UPDATE user_profiles SET password_hash = $1 WHERE email = $2',
                [hashedPassword, email]
            );

            console.log('✅ Password updated successfully!');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
            console.log('\n🔐 You can now login!');

        } else {
            // Generate employee_id
            const year = new Date().getFullYear();
            const countResult = await client.query(
                'SELECT COUNT(*) as count FROM user_profiles WHERE employee_id LIKE $1',
                [`EMP-${year}-%`]
            );
            const nextNumber = (parseInt(countResult.rows[0].count) + 1).toString().padStart(4, '0');
            const employee_id = `EMP-${year}-${nextNumber}`;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert employee
            const result = await client.query(`
                INSERT INTO user_profiles (
                    employee_id, first_name, last_name, email, password_hash,
                    role_id, employment_type, status, hire_date
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, employee_id, first_name, last_name, email
            `, [
                employee_id,
                'Adis',  // Extracted from email
                'User',  // Placeholder
                email,
                hashedPassword,
                4,  // Employee role
                'Full-Time',
                'active',
                new Date()
            ]);

            console.log('✅ Employee created successfully!\n');
            console.log('Details:');
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Employee ID: ${result.rows[0].employee_id}`);
            console.log(`   Name: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
            console.log(`   Email: ${result.rows[0].email}`);
            console.log(`   Password: ${password}`);
            console.log('\n🔐 You can now login with these credentials!');
        }

        await client.query('COMMIT');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createEmployee();
