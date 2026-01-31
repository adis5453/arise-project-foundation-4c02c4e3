const { pool } = require('./db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Add shift column to user_profiles');
        await client.query('BEGIN');

        // Add shift column
        await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='shift') THEN
            ALTER TABLE user_profiles ADD COLUMN shift VARCHAR(50);
        END IF;
      END $$;
    `);

        console.log('Added shift column');

        await client.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit(); // Ensure script exits
    }
}

migrate();
