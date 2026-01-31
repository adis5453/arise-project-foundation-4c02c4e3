// Run profile completion migration
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
        console.log('\n🔧 Running Profile Completion Migration...\n');

        const sqlFile = path.join(__dirname, 'migrations', 'add-profile-completion.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!');
        console.log('Added columns:');
        console.log('  - profile_completion_percentage');
        console.log('  - profile_sections_completed (JSONB)');
        console.log('  - profile_deadline');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
