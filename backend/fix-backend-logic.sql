-- Backend Logic Fixes SQL Script
-- Run this to fix database-level issues

-- 1. Ensure notes column exists in attendance_records
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by ON leave_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_performance_goals_employee ON performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);

-- 3. Ensure system_settings has proper structure
-- Add category column if missing
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add description column if missing
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 4. Initialize default system settings if empty
INSERT INTO system_settings (key, value, category, description) VALUES
    ('payroll_tax_rate', '0.15', 'payroll', 'Default tax rate (15%)'),
    ('payroll_allowance_rate', '0.10', 'payroll', 'Default allowance rate (10%)'),
    ('standard_work_hours', '8', 'attendance', 'Standard work hours per day'),
    ('overtime_multiplier', '1.5', 'attendance', 'Overtime pay multiplier'),
    ('late_arrival_threshold', '09:30:00', 'attendance', 'Late arrival time threshold'),
    ('leave_accrual_rate', '1.67', 'leave', 'Monthly leave accrual (20 days/year)'),
    ('max_leave_carryover', '5', 'leave', 'Maximum leave carryover days')
ON CONFLICT (key) DO NOTHING;

-- 5. Ensure proper constraints
ALTER TABLE leave_requests 
DROP CONSTRAINT IF EXISTS check_valid_dates;

ALTER TABLE leave_requests 
ADD CONSTRAINT check_valid_dates 
CHECK (end_date >= start_date);

-- 6. Add updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to system_settings table
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Ensure employee_id is properly indexed in attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);

-- 8. Add constraint to prevent negative leave balances
ALTER TABLE employee_leave_balances
DROP CONSTRAINT IF EXISTS check_non_negative_balance;

ALTER TABLE employee_leave_balances
ADD CONSTRAINT check_non_negative_balance
CHECK (current_balance >= -5); -- Allow small negative for flexibility

-- 9. Verify all tables have updated_at columns
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('user_profiles', 'departments', 'teams', 'leave_requests', 'attendance_records')
    LOOP
        -- Check if updated_at exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = tbl 
            AND column_name = 'updated_at'
        ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', tbl);
            RAISE NOTICE 'Added updated_at to %', tbl;
        END IF;
    END LOOP;
END $$;

-- 10. Create helper function for working days calculation
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    days INTEGER := 0;
    current_date DATE := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        -- Skip weekends (6 = Saturday, 0 = Sunday)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            days := days + 1;
        END IF;
        current_date := current_date + 1;
    END LOOP;
    RETURN days;
END;
$$ LANGUAGE plpgsql;

-- Verification queries
SELECT 'System Settings Count:' as check_name, COUNT(*) as count FROM system_settings;
SELECT 'Triggers Created:' as check_name, COUNT(*) as count 
FROM pg_trigger 
WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap');
SELECT 'Indexes Created:' as check_name, COUNT(*) as count 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%';

COMMIT;
