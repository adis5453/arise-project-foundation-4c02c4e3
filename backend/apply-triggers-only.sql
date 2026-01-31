-- Apply Database Triggers Only
-- Run this if tables already exist but triggers are missing

-- Auto-calculate attendance hours
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
DECLARE
    break_duration NUMERIC := 0;
    work_duration NUMERIC := 0;
BEGIN
    IF NEW.check_out IS NOT NULL AND NEW.check_in IS NOT NULL THEN
        work_duration := EXTRACT(EPOCH FROM (NEW.check_out - NEW.check_in)) / 3600.0;
        
        IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
            break_duration := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 3600.0;
        END IF;
        
        NEW.total_hours := ROUND((work_duration - break_duration)::NUMERIC, 2);
        
        IF NEW.total_hours > 8 THEN
            NEW.overtime_hours := ROUND((NEW.total_hours - 8)::NUMERIC, 2);
        ELSE
            NEW.overtime_hours := 0;
        END IF;
        
        IF NEW.total_hours >= 8 THEN
            NEW.status := 'present';
        ELSIF NEW.total_hours >= 4 THEN
            NEW.status := 'half_day';
        ELSE
            NEW.status := 'partial';
        END IF;
    END IF;
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_hours_trigger ON attendance_records;
CREATE TRIGGER attendance_hours_trigger
    BEFORE INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION calculate_attendance_hours();

-- Auto-update leave balances
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
    balance_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM employee_leave_balances
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date)
    ) INTO balance_exists;
    
    IF NOT balance_exists THEN
        INSERT INTO employee_leave_balances (employee_id, leave_type_id, year, current_balance, accrued_balance)
        VALUES (NEW.employee_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date), 20, 20)
        ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
    END IF;
    
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        UPDATE employee_leave_balances
        SET used_balance = used_balance + NEW.days_requested,
            current_balance = current_balance - NEW.days_requested,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = NEW.employee_id 
        AND leave_type_id = NEW.leave_type_id
        AND year = EXTRACT(YEAR FROM NEW.start_date);
        
    ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
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

DROP TRIGGER IF EXISTS leave_balance_trigger ON leave_requests;
CREATE TRIGGER leave_balance_trigger
    AFTER INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance();

-- Validate overlapping leaves
CREATE OR REPLACE FUNCTION check_overlapping_leaves()
RETURNS TRIGGER AS $$
DECLARE
    overlap_count INTEGER;
BEGIN
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

DROP TRIGGER IF EXISTS check_leave_overlap ON leave_requests;
CREATE TRIGGER check_leave_overlap
    BEFORE INSERT OR UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_overlapping_leaves();

-- Verify triggers created
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap');
