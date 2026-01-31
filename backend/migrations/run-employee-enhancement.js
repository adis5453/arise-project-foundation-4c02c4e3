const { pool } = require('../db');
const logger = require('../utils/logger');

async function runEmployeeEnhancementMigration() {
    const client = await pool.connect();

    try {
        console.log('\n🚀 Starting Employee Management Enhancement Migration...\n');
        logger.info('Starting employee enhancement migration');

        await client.query('BEGIN');

        // Read and execute migration SQL
        const fs = require('fs');
        const path = require('path');
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'employee-enhancement-india.sql'),
            'utf8'
        );

        await client.query(migrationSQL);

        await client.query('COMMIT');

        // Verify migration
        const verification = await client.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(pan_number) as has_pan,
        COUNT(default_shift_id) as has_shift
      FROM user_profiles
      WHERE is_active = true
    `);

        const shifts = await client.query('SELECT COUNT(*) as shift_count FROM shifts');

        console.log('\n✅ Migration Completed Successfully!\n');
        console.log('Statistics:');
        console.log(`  - Total Active Employees: ${verification.rows[0].total_employees}`);
        console.log(`  - Employees with PAN: ${verification.rows[0].has_pan}`);
        console.log(`  - Employees with Shift: ${verification.rows[0].has_shift}`);
        console.log(`  - Total Shifts Created: ${shifts.rows[0].shift_count}`);
        console.log('\n');

        logger.info('Employee enhancement migration completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration Failed:', error.message);
        logger.error('Migration failed', { error: error.message, stack: error.stack });
        throw error;
    } finally {
        client.release();
    }
}

// Run migration if called directly
if (require.main === module) {
    runEmployeeEnhancementMigration()
        .then(() => {
            console.log('Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runEmployeeEnhancementMigration };
