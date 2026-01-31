const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hrm_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function fixShiftsTable() {
    const client = await pool.connect();

    try {
        console.log('\n🔧 Fixing shifts table...\n');

        // Check if shifts table exists
        const shiftsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'shifts'
      )
    `);

        if (shiftsExists.rows[0].exists) {
            console.log('✅ Shifts table exists');

            // Get current columns
            const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'shifts'
        ORDER BY ordinal_position
      `);

            console.log(`\nCurrent shifts columns (${columns.rows.length}):`);
            columns.rows.forEach(c => console.log(`  - ${c.column_name}`));

            //  Drop and recreate
            console.log('\n🔄 Dropping and recreating shifts table...');

            await client.query('BEGIN');

            // Drop foreign key constraints first if any
            await client.query(`
        ALTER TABLE IF EXISTS user_profiles 
        DROP CONSTRAINT IF EXISTS user_profiles_default_shift_id_fkey CASCADE
      `);

            await client.query('DROP TABLE IF EXISTS shifts CASCADE');

            await client.query(`
        CREATE TABLE shifts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          code VARCHAR(20) UNIQUE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          break_duration_minutes INTEGER DEFAULT 60,
          grace_period_minutes INTEGER DEFAULT 15,
          half_day_threshold_minutes INTEGER DEFAULT 240,
          is_night_shift BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Insert default shifts
            await client.query(`
        INSERT INTO shifts (name, code, start_time, end_time, is_night_shift) VALUES
        ('General Shift', 'GEN', '09:00:00', '18:00:00', false),
        ('Morning Shift', 'MOR', '06:00:00', '15:00:00', false),
        ('Evening Shift', 'EVE', '15:00:00', '00:00:00', false),
        ('Night Shift', 'NGT', '22:00:00', '07:00:00', true)
      `);

            await client.query('COMMIT');

            console.log('✅ Shifts table recreated with 4 default shifts\n');

            const shifts = await client.query('SELECT code, name, start_time, end_time FROM shifts ORDER BY code');
            console.log('Created shifts:');
            shifts.rows.forEach(s => console.log(`  ${s.code}: ${s.name} (${s.start_time} - ${s.end_time})`));

        } else {
            console.log('❌ Shifts table does not exist - will be created by migration');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixShiftsTable();
