const { pool } = require('../db');
require('dotenv').config();

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting MFA migration...');

        // Check if columns exist to avoid errors
        const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND column_name = 'mfa_enabled';
    `;
        const res = await client.query(checkQuery);

        if (res.rows.length === 0) {
            await client.query(`
        ALTER TABLE user_profiles 
        ADD COLUMN mfa_enabled BOOLEAN DEFAULT false,
        ADD COLUMN mfa_secret VARCHAR(255),
        ADD COLUMN mfa_backup_codes TEXT[];
      `);
            console.log('MFA columns added successfully.');
        } else {
            console.log('MFA columns already exist. Skipping.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
