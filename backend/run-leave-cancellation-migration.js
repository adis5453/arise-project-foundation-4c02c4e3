// Run leave cancellation migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('\n🔧 Running Leave Cancellation Migration...\n');

        const sqlFile = path.join(__dirname, 'migrations', 'add-leave-cancellation.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        await client.query('BEGIN');

        await client.query(sql);

        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');
        console.log('Added fields:');
        console.log('  - cancelled_at');
        console.log('  - cancelled_by');
        console.log('  - cancellation_reason');
        console.log('\n✅ Created leave_audit_log table');
        console.log('\n🎯 Ready to implement cancel endpoint!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
