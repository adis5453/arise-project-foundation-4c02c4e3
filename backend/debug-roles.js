const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'arise_hrm',
    password: 'admin',
    port: 5432,
});

async function checkRoles() {
    try {
        const roles = await pool.query('SELECT * FROM roles');
        console.log('Roles:', roles.rows);

        // Check specific user role if needed, e.g., for 'suraj pandey' or the logged in user
        const users = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.role_id, r.name as role_name 
      FROM user_profiles u 
      JOIN roles r ON u.role_id = r.id
    `);
        console.log('Users with Roles:', users.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkRoles();
