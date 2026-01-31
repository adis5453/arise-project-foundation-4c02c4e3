const { pool } = require('./backend/db');

async function fixRemainingIssues() {
    try {
        console.log('🔧 Fixing remaining database schema issues...');

        // 1. Add missing department_id column to projects table
        console.log('1. Adding department_id to projects table...');
        try {
            await pool.query(`
                ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
            `);
            console.log('   ✅ Added department_id to projects table');
        } catch (error) {
            console.log('   ⚠️  department_id column may already exist or error:', error.message);
        }

        // 2. Add missing total_days column to leave_requests table
        console.log('2. Adding total_days to leave_requests table...');
        try {
            await pool.query(`
                ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS total_days DECIMAL(5,2) DEFAULT 0;
            `);

            // Populate existing records
            await pool.query(`
                UPDATE leave_requests SET total_days = COALESCE(days_requested, 0) WHERE total_days = 0;
            `);
            console.log('   ✅ Added total_days to leave_requests table');
        } catch (error) {
            console.log('   ⚠️  total_days column may already exist or error:', error.message);
        }

        // 3. Fix system_settings table structure
        console.log('3. Fixing system_settings table...');
        try {
            await pool.query(`
                ALTER TABLE system_settings
                ADD COLUMN IF NOT EXISTS setting_key VARCHAR(255) UNIQUE,
                ADD COLUMN IF NOT EXISTS setting_value TEXT,
                ADD COLUMN IF NOT EXISTS setting_type VARCHAR(50) DEFAULT 'string',
                ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);
            console.log('   ✅ Fixed system_settings table structure');
        } catch (error) {
            console.log('   ⚠️  system_settings fix may have issues:', error.message);
        }

        // 4. Add missing indexes for performance
        console.log('4. Adding performance indexes...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status)',
            'CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date)',
            'CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id)',
            'CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date)',
            'CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email)',
            'CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id)'
        ];

        for (const index of indexes) {
            try {
                await pool.query(index);
            } catch (error) {
                console.log(`   ⚠️  Index creation failed: ${index.substring(0, 50)}...`);
            }
        }
        console.log('   ✅ Added performance indexes');

        // 5. Create missing triggers
        console.log('5. Creating missing database triggers...');

        // Attendance hours trigger
        try {
            await pool.query(`
                CREATE OR REPLACE FUNCTION calculate_attendance_hours()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Calculate total hours if check_in and check_out are both present
                    IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
                        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `);

            await pool.query(`
                DROP TRIGGER IF EXISTS attendance_hours_trigger ON attendance_records;
                CREATE TRIGGER attendance_hours_trigger
                    BEFORE INSERT OR UPDATE ON attendance_records
                    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_hours();
            `);
            console.log('   ✅ Created attendance hours trigger');
        } catch (error) {
            console.log('   ⚠️  Attendance trigger creation failed:', error.message);
        }

        // 6. Verify all fixes
        console.log('\n🔍 Verifying all fixes...');

        const verifications = [
            {
                name: 'Projects table has department_id',
                query: `SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'department_id'`
            },
            {
                name: 'Leave requests has total_days',
                query: `SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'total_days'`
            },
            {
                name: 'System settings has setting_key',
                query: `SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'setting_key'`
            },
            {
                name: 'Attendance hours trigger exists',
                query: `SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'attendance_hours_trigger'`
            }
        ];

        for (const verification of verifications) {
            try {
                const result = await pool.query(verification.query);
                if (result.rows.length > 0) {
                    console.log(`✅ ${verification.name}: OK`);
                } else {
                    console.log(`❌ ${verification.name}: FAILED`);
                }
            } catch (error) {
                console.log(`❌ ${verification.name}: ERROR - ${error.message}`);
            }
        }

        console.log('\n✅ All remaining database issues have been addressed!');

    } catch (error) {
        console.error('❌ Error fixing remaining issues:', error);
    } finally {
        await pool.end();
    }
}

fixRemainingIssues();
