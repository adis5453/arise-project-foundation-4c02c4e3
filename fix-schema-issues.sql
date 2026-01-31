-- Fix Arise HRM Database Schema Issues
-- Run this script to resolve all identified problems

-- ========================================
-- 1. FIX DOCUMENTS TABLE FOREIGN KEY TYPES
-- ========================================

-- Drop existing foreign key constraints if they exist
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_employee_id_fkey;

-- Change column types from INTEGER to UUID
ALTER TABLE documents ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::text::uuid;
ALTER TABLE documents ALTER COLUMN employee_id TYPE UUID USING employee_id::text::uuid;

-- Add correct foreign key constraints
ALTER TABLE documents ADD CONSTRAINT documents_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT documents_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- ========================================
-- 2. FIX PROJECTS TABLE MISSING COLUMN
-- ========================================

-- Add missing department_id column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- ========================================
-- 3. FIX LEAVE REQUESTS MISSING COLUMN
-- ========================================

-- Add missing total_days column to leave_requests table
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS total_days DECIMAL(5,2) DEFAULT 0;

-- Update existing records to populate total_days from days_requested
UPDATE leave_requests SET total_days = COALESCE(days_requested, 0) WHERE total_days = 0;

-- ========================================
-- 4. FIX PERFORMANCE TABLES ISSUES
-- ========================================

-- Drop problematic competency_ratings table if it exists
DROP TABLE IF EXISTS competency_ratings CASCADE;

-- Recreate competency_ratings with correct foreign keys
CREATE TABLE IF NOT EXISTS competency_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES performance_reviews(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL,
    competency_name VARCHAR(255) NOT NULL,
    rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 5. ADD MISSING DATABASE TRIGGERS
-- ========================================

-- Create attendance hours trigger
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

-- Create trigger for attendance hours calculation
DROP TRIGGER IF EXISTS attendance_hours_trigger ON attendance_records;
CREATE TRIGGER attendance_hours_trigger
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION calculate_attendance_hours();

-- ========================================
-- 6. FIX DEPARTMENT/POSITION PARAMETER HANDLING
-- ========================================

-- Ensure departments table has proper UUID handling
-- (This should already be correct, but verify)

-- ========================================
-- 7. ADD MISSING INDEXES FOR PERFORMANCE
-- ========================================

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);

-- ========================================
-- 8. UPDATE SYSTEM SETTINGS TABLE
-- ========================================

-- Fix system_settings table structure
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_key VARCHAR(255) UNIQUE;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_value TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(50) DEFAULT 'string';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify all fixes
SELECT 'Documents table fixed' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'uploaded_by'
    AND data_type = 'uuid'
);

SELECT 'Projects table has department_id' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'department_id'
);

SELECT 'Leave requests has total_days' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'total_days'
);

SELECT 'Competency ratings table exists' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'competency_ratings'
);

SELECT 'Attendance hours trigger exists' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'attendance_hours_trigger'
);
