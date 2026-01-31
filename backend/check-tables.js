const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTables() {
    try {
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        // Check if system_settings exists and show columns
        if (res.rows.find(r => r.table_name === 'system_settings')) {
            const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'system_settings'
        `);
            console.log('system_settings columns:', cols.rows);

            // Check content
            const content = await pool.query('SELECT * FROM system_settings');
            console.log('system_settings content:', content.rows);
        } else {
            console.log('system_settings table DOES NOT exist.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkTables();
