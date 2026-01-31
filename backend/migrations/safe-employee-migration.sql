-- Safe Employee Enhancement Migration
-- Checks for existing columns before adding

BEGIN;

-- Check if shifts table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'shifts') THEN
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
        );
        
        RAISE NOTICE 'Created shifts table';
    ELSE
        RAISE NOTICE 'Shifts table already exists';
    END IF;
END $$;

-- Insert default shifts if they don't exist
INSERT INTO shifts (name, code, start_time, end_time, is_night_shift) 
VALUES
    ('General Shift', 'GEN', '09:00:00', '18:00:00', false),
    ('Morning Shift', 'MOR', '06:00:00', '15:00:00', false),
    ('Evening Shift', 'EVE', '15:00:00', '00:00:00', false),
    ('Night Shift', 'NGT', '22:00:00', '07:00:00', true)
ON CONFLICT (code) DO NOTHING;

-- Add columns one by one with checks
DO $$ 
BEGIN
    -- Personal Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='middle_name') THEN
        ALTER TABLE user_profiles ADD COLUMN middle_name VARCHAR(100);
        RAISE NOTICE 'Added middle_name';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='preferred_name') THEN
        ALTER TABLE user_profiles ADD COLUMN preferred_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='gender') THEN
        ALTER TABLE user_profiles ADD COLUMN gender VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='marital_status') THEN
        ALTER TABLE user_profiles ADD COLUMN marital_status VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='blood_group') THEN
        ALTER TABLE user_profiles ADD COLUMN blood_group VARCHAR(5);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='nationality') THEN
        ALTER TABLE user_profiles ADD COLUMN nationality VARCHAR(50) DEFAULT 'Indian';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='alternate_phone') THEN
        ALTER TABLE user_profiles ADD COLUMN alternate_phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='personal_email') THEN
        ALTER TABLE user_profiles ADD COLUMN personal_email VARCHAR(255);
    END IF;
    
    -- Indian Compliance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='pan_number') THEN
        ALTER TABLE user_profiles ADD COLUMN pan_number VARCHAR(10) UNIQUE;
        RAISE NOTICE 'Added pan_number';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='aadhaar_number') THEN
        ALTER TABLE user_profiles ADD COLUMN aadhaar_number VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='uan_number') THEN
        ALTER TABLE user_profiles ADD COLUMN uan_number VARCHAR(12);
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

COMMIT;

-- Verification
SELECT 
    COUNT(*) FILTER (WHERE column_name = 'pan_number') as has_pan,
    COUNT(*) FILTER (WHERE column_name = 'aadhaar_number') as has_aadhaar,
    COUNT(*) FILTER (WHERE column_name = 'middle_name') as has_middle_name
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
