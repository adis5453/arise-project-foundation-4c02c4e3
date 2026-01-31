const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function runSafeMigration() {
    console.log('\n🚀 Running SAFE Employee Enhancement Migration...\n');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Read the safe migration SQL
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'safe-employee-migration.sql'),
            'utf8'
        );

        console.log('📝 Executing safe migration SQL...\n');

        // Execute the safe migration
        await client.query(migrationSQL);

        await client.query('COMMIT');

        console.log('\n✅ Safe migration completed successfully!\n');

        // Verify
        const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

        const shiftsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'shifts'
      )
    `);

        console.log(`📊 Verification:`);
        console.log(`   user_profiles columns: ${columns.rows.length}`);
        console.log(`   shifts table: ${shiftsExists.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);

        if (shiftsExists.rows[0].exists) {
            const shifts = await client.query('SELECT COUNT(*) as count FROM shifts');
            console.log(`   shifts records: ${shifts.rows[0].count}`);
        }

        console.log('\n🎉 Migration complete!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runSafeMigration();
