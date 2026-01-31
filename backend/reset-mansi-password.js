
require('dotenv').config();
const { pool } = require('./db');
const bcrypt = require('bcrypt');

async function resetMansiPassword() {
    try {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = 'mansir5453@gmail.com';

        const res = await pool.query(
            'UPDATE user_profiles SET password_hash = $1 WHERE email = $2 RETURNING id',
            [hashedPassword, email]
        );

        if (res.rowCount > 0) {
            console.log(`Password for ${email} reset successfully. User ID: ${res.rows[0].id}`);
        } else {
            console.error(`User ${email} not found.`);
        }
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await pool.end();
    }
}

resetMansiPassword();
