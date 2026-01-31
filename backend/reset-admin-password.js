const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function resetAdmin() {
    try {
        const email = 'admin@arisehrm.com';
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);

        console.log(`Resetting password for ${email}...`);

        const res = await pool.query(`
            UPDATE user_profiles 
            SET password_hash = $1 
            WHERE email = $2
            RETURNING id, email, role_id
        `, [hash, email]);

        if (res.rows.length > 0) {
            console.log('✅ Password updated successfully for:', res.rows[0]);
        } else {
            console.error('❌ Admin user not found in DB!');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

resetAdmin();
