-- Employee Management Enhancement Migration for India
-- Date: 2025-12-16
-- Purpose: Add comprehensive employee fields for Indian compliance + global scalability
-- Fields Added: 50+ new fields (total 75+)

BEGIN;

-- =====================================================
-- PART 1: CREATE SHIFTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS shifts (
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
);

-- Insert default shifts
INSERT INTO shifts (name, code, start_time, end_time, is_night_shift) VALUES
('General Shift', 'GEN', '09:00:00', '18:00:00', false),
('Morning Shift', 'MOR', '06:00:00', '15:00:00', false),
('Evening Shift', 'EVE', '15:00:00', '00:00:00', false),
('Night Shift', 'NGT', '22:00:00', '07:00:00', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PART 2: ADD NEW COLUMNS TO user_profiles
-- =====================================================

-- Personal Information
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'Indian',
ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);

-- Indian Compliance Fields (CRITICAL)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(255), -- Will be encrypted
ADD COLUMN IF NOT EXISTS uan_number VARCHAR(12),
ADD COLUMN IF NOT EXISTS pan_aadhaar_linked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pan_linked_date DATE,
ADD COLUMN IF NOT EXISTS esi_number VARCHAR(17),
ADD COLUMN IF NOT EXISTS pf_account_number VARCHAR(22),
ADD COLUMN IF NOT EXISTS previous_pf_account VARCHAR(22),
ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(10) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS professional_tax_applicable BOOLEAN DEFAULT true;

-- Bank Details
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(255), -- Will be encrypted
ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(11),
ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'savings',
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'INR';

-- Employment Details (Extended)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS confirmation_date DATE,
ADD COLUMN IF NOT EXISTS probation_period_months INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS resignation_date DATE,
ADD COLUMN IF NOT EXISTS last_working_date DATE,
ADD COLUMN IF NOT EXISTS exit_date DATE,
ADD COLUMN IF NOT EXISTS exit_reason TEXT,
ADD COLUMN IF NOT EXISTS rehire_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS employee_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_location VARCHAR(100),
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES user_profiles(id);

-- Shift & Schedule Management
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS default_shift_id UUID REFERENCES shifts(id),
ADD COLUMN IF NOT EXISTS shift_pattern VARCHAR(20) DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS work_hours_per_day NUMERIC(4,2) DEFAULT 8.00,
ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS overtime_eligible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekend_days INTEGER[] DEFAULT ARRAY[0,6],
ADD COLUMN IF NOT EXISTS flexible_hours_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS remote_work_allowed BOOLEAN DEFAULT false;

-- Salary Components (Detailed Breakdown)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS hra NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS transport_allowance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS medical_allowance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS dearness_allowance NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS other_allowances JSONB,
ADD COLUMN IF NOT EXISTS pf_contribution NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS esi_contribution NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS net_salary NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS annual_bonus NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS performance_bonus JSONB,
ADD COLUMN IF NOT EXISTS variable_pay_percentage NUMERIC(5,2);

-- Benefits & Insurance
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS gratuity_applicable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gratuity_eligible_from DATE,
ADD COLUMN IF NOT EXISTS leave_policy_id UUID,
ADD COLUMN IF NOT EXISTS health_insurance_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS health_insurance_provider VARCHAR(100),
ADD COLUMN IF NOT EXISTS health_insurance_expiry DATE;

-- Identity Documents
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS passport_expiry_date DATE,
ADD COLUMN IF NOT EXISTS passport_country VARCHAR(50),
ADD COLUMN IF NOT EXISTS driving_license_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS driving_license_expiry DATE,
ADD COLUMN IF NOT EXISTS voter_id VARCHAR(20);

-- Additional JSONB Fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS education_qualifications JSONB,
ADD COLUMN IF NOT EXISTS previous_employment JSONB;

-- =====================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_pan ON user_profiles(pan_number) WHERE pan_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_aadhaar ON user_profiles(aadhaar_number) WHERE aadhaar_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_uan ON user_profiles(uan_number) WHERE uan_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_joining_date ON user_profiles(joining_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_shift_id ON user_profiles(default_shift_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department_id ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- =====================================================
-- PART 4: ADD CONSTRAINTS & VALIDATIONS
-- =====================================================

-- PAN Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_pan_format,
ADD CONSTRAINT check_pan_format 
  CHECK (pan_number IS NULL OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');

-- IFSC Format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_ifsc_format,
ADD CONSTRAINT check_ifsc_format 
  CHECK (bank_ifsc_code IS NULL OR bank_ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$');

-- Gender constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_gender,
ADD CONSTRAINT check_gender 
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Marital Status constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_marital_status,
ADD CONSTRAINT check_marital_status 
  CHECK (marital_status IS NULL OR marital_status IN ('single', 'married', 'divorced', 'widowed', 'separated'));

-- Tax Regime constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_tax_regime,
ADD CONSTRAINT check_tax_regime 
  CHECK (tax_regime IN ('old', 'new'));

-- Shift Pattern constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_shift_pattern,
ADD CONSTRAINT check_shift_pattern 
  CHECK (shift_pattern IS NULL OR shift_pattern IN ('fixed', 'rotating', 'flexible'));

-- Account Type constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_account_type,
ADD CONSTRAINT check_account_type 
  CHECK (account_type IS NULL OR account_type IN ('savings', 'current'));

-- =====================================================
-- PART 5: DATA MIGRATION & UPDATES
-- =====================================================

-- Set joining_date same as hire_date for existing records
UPDATE user_profiles
SET joining_date = hire_date
WHERE joining_date IS NULL AND hire_date IS NOT NULL;

-- Assign default shift to all active employees
UPDATE user_profiles
SET default_shift_id = (SELECT id FROM shifts WHERE code = 'GEN' LIMIT 1)
WHERE default_shift_id IS NULL AND is_active = true;

-- Set nationality for existing Indian employees
UPDATE user_profiles
SET nationality = 'Indian'
WHERE nationality IS NULL;

-- Set default currency
UPDATE user_profiles
SET currency_code = 'INR'
WHERE currency_code IS NULL;

-- =====================================================
-- PART 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to calculate gratuity eligibility (5 years of service)
CREATE OR REPLACE FUNCTION update_gratuity_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.joining_date IS NOT NULL AND 
     (CURRENT_DATE - NEW.joining_date) >= INTERVAL '5 years' THEN
    NEW.gratuity_applicable := true;
    IF NEW.gratuity_eligible_from IS NULL THEN
      NEW.gratuity_eligible_from := NEW.joining_date + INTERVAL '5 years';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update gratuity
DROP TRIGGER IF EXISTS trigger_update_gratuity ON user_profiles;
CREATE TRIGGER trigger_update_gratuity
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_gratuity_eligibility();

-- Function to auto-calculate gross and net salary
CREATE OR REPLACE FUNCTION calculate_salary_components()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate gross salary (sum of all allowances)
  NEW.gross_salary := COALESCE(NEW.basic_salary, 0) +
                      COALESCE(NEW.hra, 0) +
                      COALESCE(NEW.special_allowance, 0) +
                      COALESCE(NEW.transport_allowance, 0) +
                      COALESCE(NEW.medical_allowance, 0) +
                      COALESCE(NEW.dearness_allowance, 0);
  
  -- Calculate net salary (gross - deductions)
  NEW.net_salary := NEW.gross_salary -
                    COALESCE(NEW.pf_contribution, 0) -
                    COALESCE(NEW.esi_contribution, 0) -
                    COALESCE(NEW.professional_tax, 0) -
                    COALESCE(NEW.tds_amount, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate salaries
DROP TRIGGER IF EXISTS trigger_calculate_salary ON user_profiles;
CREATE TRIGGER trigger_calculate_salary
  BEFORE INSERT OR UPDATE OF basic_salary, hra, special_allowance, transport_allowance, 
                             medical_allowance, dearness_allowance, pf_contribution, 
                             esi_contribution, professional_tax, tds_amount
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_salary_components();

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check migration success
SELECT 
  COUNT(*) as total_employees,
  COUNT(pan_number) as has_pan,
  COUNT(aadhaar_number) as has_aadhaar,
  COUNT(uan_number) as has_uan,
  COUNT(bank_account_number) as has_bank_account,
  COUNT(default_shift_id) as has_shift,
  COUNT(joining_date) as has_joining_date
FROM user_profiles
WHERE is_active = true;

-- Verify shifts created
SELECT * FROM shifts ORDER BY code;

-- Check new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('pan_number', 'aadhaar_number', 'default_shift_id', 'basic_salary')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Employee Management Enhancement Migration Completed Successfully!';
  RAISE NOTICE 'Added 50+ new fields to user_profiles table';
  RAISE NOTICE 'Created shifts table with 4 default shifts';
  RAISE NOTICE 'Added 10+ indexes for performance';
  RAISE NOTICE 'Added validation constraints for PAN, IFSC, gender, etc.';
  RAISE NOTICE 'Created auto-calculation triggers for gratuity and salary';
END $$;
