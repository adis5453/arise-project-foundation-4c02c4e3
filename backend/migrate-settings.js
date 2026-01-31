const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log('Creating system_settings table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('Inserting default attendance settings...');
        // Default: New Delhi coordinates from previous hardcoded values
        await pool.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES 
        ('office_lat', '28.6139', 'Office Latitude'),
        ('office_lng', '77.2090', 'Office Longitude'),
        ('office_radius', '200', 'Geofencing Radius (meters)')
      ON CONFLICT (key) DO NOTHING;
    `);

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
