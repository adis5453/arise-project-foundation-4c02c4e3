-- Enhanced HRM Schema - Missing Tables and Triggers
-- This file adds the missing components identified in the analysis

-- ============================================
-- MISSING TABLES
-- ============================================

-- Payroll Records Table
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL,
    allowances NUMERIC(12, 2) DEFAULT 0,
    deductions NUMERIC(12, 2) DEFAULT 0,
    gross_salary NUMERIC(12, 2) GENERATED ALWAYS AS (basic_salary + allowances) STORED,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    net_salary NUMERIC(12, 2) GENERATED ALWAYS AS (basic_salary + allowances - deductions - tax_amount) STORED,
    total_days_worked INTEGER DEFAULT 0,
    total_hours_worked NUMERIC(8, 2) DEFAULT 0,
    overtime_hours NUMERIC(8, 2) DEFAULT 0,
    leave_days_taken NUMERIC(5, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid')),
    processed_by UUID REFERENCES user_profiles(id),
    processed_at TIMESTAMP,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP,
    payment_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, period_start, period_end)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Goals Table
CREATE TABLE IF NOT EXISTS performance_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_date DATE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50),
    metrics JSONB,
    created_by UUID REFERENCES user_profiles(id),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Reviews Table (if not exists)
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES user_profiles(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    overall_rating NUMERIC(3, 2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_met INTEGER,
    goals_total INTEGER,
    comments TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table (if not exists)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id),
    project_manager_id UUID REFERENCES user_profiles(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium',
    budget NUMERIC(15, 2),
    progress_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INITIAL SYSTEM SETTINGS DATA
-- ============================================

INSERT INTO system_settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
    ('payroll_tax_rate', '0.15', 'number', 'payroll', 'Default tax rate for payroll calculations', false),
    ('payroll_allowance_rate', '0.10', 'number', 'payroll', 'Default allowance rate for payroll', false),
    ('standard_work_hours', '8', 'number', 'attendance', 'Standard work hours per day', true),
    ('overtime_multiplier', '1.5', 'number', 'attendance', 'Overtime pay multiplier', false),
    ('late_arrival_threshold', '09:30:00', 'string', 'attendance', 'Time after which arrival is considered late', true),
    ('leave_accrual_rate', '1.67', 'number', 'leave', 'Monthly leave accrual rate (days)', false),
    ('max_leave_carryover', '5', 'number', 'leave', 'Maximum leave days that can be carried over', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function: Auto-calculate attendance hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
DECLARE
    break_duration NUMERIC := 0;
    work_duration NUMERIC := 0;
BEGIN
    -- Only calculate if both check_in and check_out exist
    IF NEW.check_out IS NOT NULL AND NEW.check_in IS NOT NULL THEN
        -- Calculate total work duration in hours
        work_duration := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0;
        
        -- Calculate break duration if exists
        IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
            break_duration := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600.0;
        END IF;
        
        -- Total hours = work duration - break duration
        NEW.total_hours := ROUND((work_duration - break_duration)::NUMERIC, 2);
        
        -- Calculate overtime (anything over 8 hours)
        IF NEW.total_hours > 8 THEN
            NEW.overtime_hours := ROUND((NEW.total_hours - 8)::NUMERIC, 2);
        ELSE
            NEW.overtime_hours := 0;
        END IF;
        
        -- Set status based on hours worked
        IF NEW.total_hours >= 8 THEN
            NEW.status := 'present';
        ELSIF NEW.total_hours >= 4 THEN
            NEW.status := 'half_day';
        ELSE
            NEW.status := 'partial';
        END IF;
    END IF;
    
    -- Set updated timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS attendance_hours_trigger ON attendance_records;
CREATE TRIGGER attendance_hours_trigger
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_attendance_hours();

-- Function: Auto-update leave balances
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
    balance_exists BOOLEAN;
BEGIN
    -- Check if balance record exists
    SELECT EXISTS(
        SELECT 1 FROM employee_leave_balances
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date)
    ) INTO balance_exists;
    
    -- Create balance record if it doesn't exist
    IF NOT balance_exists THEN
        INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, current_balance, accrued_balance)
        VALUES (NEW.employee_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date), 20, 20)
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
    END IF;
    
    -- Handle status changes
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Deduct from balance when approved
        UPDATE employee_leave_balances
        SET used_balance = used_balance + NEW.days_requested,
            current_balance = current_balance - NEW.days_requested,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date);
        
    ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
        -- Restore balance when previously approved leave is rejected
        UPDATE employee_leave_balances
        SET used_balance = used_balance - NEW.days_requested,
            current_balance = current_balance + NEW.days_requested,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date);
        
    ELSIF NEW.status = 'pending' AND OLD.status = 'approved' THEN
        -- Restore balance if approved leave is moved back to pending
        UPDATE employee_leave_balances
        SET used_balance = used_balance - NEW.days_requested,
            current_balance = current_balance + NEW.days_requested,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS leave_balance_trigger ON leave_requests;
CREATE TRIGGER leave_balance_trigger
    AFTER INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance();

-- Function: Validate overlapping leaves
CREATE OR REPLACE FUNCTION check_overlapping_leaves()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
    -- Only check for pending or approved leaves
    IF NEW.status IN ('pending', 'approved') THEN
        SELECT COUNT(*) INTO overlap_count
        FROM leave_requests
        WHERE employee_id = NEW.employee_id
        AND id != COALESCE(NEW.id, uuid_generate_v4())
        AND status IN ('pending', 'approved')
        AND (
            (NEW.start_date BETWEEN start_date AND end_date) OR
            (NEW.end_date BETWEEN start_date AND end_date) OR
            (start_date BETWEEN NEW.start_date AND NEW.end_date) OR
            (end_date BETWEEN NEW.start_date AND NEW.end_date)
        );
        
        IF overlap_count > 0 THEN
            RAISE EXCEPTION 'Overlapping leave request exists for this employee';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS check_leave_overlap ON leave_requests;
CREATE TRIGGER check_leave_overlap
    BEFORE INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_overlapping_leaves();

-- Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Leave indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_year ON employee_leave_balances(employee_id, year);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll_records(employee_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_records(status);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_goals_employee ON performance_goals(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- ============================================
-- DATA CONSTRAINTS
-- ============================================

-- Attendance constraints
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS check_valid_hours;
ALTER TABLE attendance_records ADD CONSTRAINT check_valid_hours 
    CHECK (total_hours IS NULL OR (total_hours >= 0 AND total_hours <= 24));

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS check_valid_overtime;
ALTER TABLE attendance_records ADD CONSTRAINT check_valid_overtime 
    CHECK (overtime_hours IS NULL OR overtime_hours >= 0);

-- Leave constraints
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS check_valid_dates;
ALTER TABLE leave_requests ADD CONSTRAINT check_valid_dates 
    CHECK (end_date >= start_date);

ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS check_positive_days;
ALTER TABLE leave_requests ADD CONSTRAINT check_positive_days 
    CHECK (days_requested > 0);

-- Leave balance constraints
ALTER TABLE employee_leave_balances DROP CONSTRAINT IF EXISTS check_non_negative_balance;
ALTER TABLE employee_leave_balances ADD CONSTRAINT check_non_negative_balance 
    CHECK (current_balance >= -5); -- Allow small negative for edge cases

-- Payroll constraints
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS check_valid_period;
ALTER TABLE payroll_records ADD CONSTRAINT check_valid_period 
    CHECK (period_end >= period_start);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to initialize leave balances for a new employee
CREATE OR REPLACE FUNCTION initialize_employee_leave_balances(p_employee_id UUID)
RETURNS VOID AS $$
DECLARE
    leave_type RECORD;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    FOR leave_type IN SELECT id, max_days_per_year FROM leave_types WHERE is_active = TRUE
    LOOP
        INSERT INTO employee_leave_balances (
            employee_id, 
            leave_type_id, 
            year, 
            current_balance, 
            accrued_balance
        ) VALUES (
            p_employee_id,
            leave_type.id,
            current_year,
            COALESCE(leave_type.max_days_per_year, 20),
            COALESCE(leave_type.max_days_per_year, 20)
        ) ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate days between dates (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS NUMERIC AS $$
DECLARE
    total_days NUMERIC := 0;
    current_date DATE := start_date;
BEGIN
    WHILE current_date <= end_date LOOP
        -- Exclude Saturday (6) and Sunday (0)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            total_days := total_days + 1;
        END IF;
        current_date := current_date + 1;
    END LOOP;
    RETURN total_days;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE payroll_records IS 'Stores payroll calculation records for employees';
COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
COMMENT ON TABLE performance_goals IS 'Employee performance goals and objectives';
COMMENT ON FUNCTION calculate_attendance_hours() IS 'Automatically calculates total hours and overtime for attendance records';
COMMENT ON FUNCTION update_leave_balance() IS 'Automatically updates employee leave balances when leave status changes';
COMMENT ON FUNCTION check_overlapping_leaves() IS 'Prevents overlapping leave requests for the same employee';
