const { pool } = require('./db');

async function migrate() {
    try {
        console.log('Adding notes column to attendance_records...');
        await pool.query(`
      ALTER TABLE attendance_records 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
        console.log('Successfully added notes column.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
