const { pool } = require('./db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    try {
        console.log('Seeding database...');

        // 1. Roles
        // Already inserted in schema.sql but let's ensure
        await pool.query(`INSERT INTO roles (id, name) VALUES (1, 'super_admin'), (2, 'hr_manager'), (3, 'department_head'), (4, 'employee') ON CONFLICT DO NOTHING`);

        // 2. Departments
        const deptResult = await pool.query(`INSERT INTO departments (name) VALUES ('Engineering'), ('HR'), ('Sales') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`);
        const engineeringId = deptResult.rows.find(d => d.name === 'Engineering').id;

        // 3. Positions
        const posResult = await pool.query(`INSERT INTO positions (name, department_id) VALUES ('Senior Developer', $1), ('HR Manager', $1) RETURNING id, name`, [engineeringId]);
        const devPositionId = posResult.rows[0].id;

        // 4. Super Admin User
        const passwordHash = await bcrypt.hash('password123', 10);
        const superAdminId = uuidv4();

        // Check if admin exists
        const userCheck = await pool.query(`SELECT * FROM user_profiles WHERE email = 'admin@arise.com'`);
        if (userCheck.rows.length === 0) {
            await pool.query(`
            INSERT INTO user_profiles (
                id, auth_user_id, employee_id, first_name, last_name, email, password_hash, role_id, department_id, position_id, status
            ) VALUES (
                $1, $2, 'EMP001', 'Super', 'Admin', 'admin@arise.com', $3, 1, $4, $5, 'active'
            )
        `, [superAdminId, uuidv4(), passwordHash, engineeringId, devPositionId]);
            console.log('Super Admin created: admin@arise.com / password123');
        } else {
            console.log('Super Admin already exists.');
        }

        console.log('Seeding completed.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        process.exit();
    }
}

seed();
