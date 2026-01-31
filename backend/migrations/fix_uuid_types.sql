-- Database Migration: Fix UUID Foreign Key Types
-- Run this script to drop tables created with INTEGER types and let them recreate with UUID types
-- WARNING: This will delete data in these tables. Only run on fresh/development databases.

-- Drop tables in correct order (dependencies first)

-- WFH Module
DROP TABLE IF EXISTS wfh_requests CASCADE;
DROP TABLE IF EXISTS wfh_policies CASCADE;

-- Attendance Module  
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS office_locations CASCADE;

-- Expense Module
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;

-- Compliance Module
DROP TABLE IF EXISTS employee_compliance CASCADE;
DROP TABLE IF EXISTS compliance_items CASCADE;

-- Messaging Module
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Announcements Module
DROP TABLE IF EXISTS announcement_reads CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;

-- Interview Module
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS job_positions CASCADE;

-- Training Module
DROP TABLE IF EXISTS training_enrollments CASCADE;
DROP TABLE IF EXISTS training_courses CASCADE;

-- Documents Module
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_folders CASCADE;

-- Add missing columns to leave_types if they don't exist
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS allow_half_day BOOLEAN DEFAULT TRUE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS allow_carryover BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS max_carryover_days INTEGER DEFAULT 0;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS requires_document_after_days INTEGER;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS applicable_gender VARCHAR(10) DEFAULT 'ALL';
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS min_service_months INTEGER DEFAULT 0;

-- The backend will auto-recreate all tables on next startup with correct UUID types
-- Just restart the backend server after running this migration

SELECT 'Migration completed. Restart backend server to recreate tables.' as status;
