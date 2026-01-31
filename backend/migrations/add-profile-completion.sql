-- Migration: Add Profile Completion Tracking
-- Purpose: Track employee onboarding progress (Progressive Completion System)

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_deadline DATE,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_profile_reminder_sent TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_sections_completed JSONB DEFAULT '{
    "personal": 0,
    "contact": 0,
    "compliance": 0,
    "bank": 0,
    "documents": 0,
    "education": 0,
    "additional": 0
}'::jsonb;

-- Create index for performance on admin dashboard
CREATE INDEX IF NOT EXISTS idx_profile_completion ON user_profiles(profile_completion_percentage);

COMMENT ON COLUMN user_profiles.profile_completion_percentage IS 'Overall profile completion (0-100)';
COMMENT ON COLUMN user_profiles.profile_sections_completed IS 'Completion % of individual sections';
