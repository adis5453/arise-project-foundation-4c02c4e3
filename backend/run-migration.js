/**
 * Database Migration: Fix UUID Foreign Key Types
 * Run: node run-migration.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

const migrationSQL = `
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
`;

const alterSQL = `
-- Add missing columns to leave_types
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS allow_half_day BOOLEAN DEFAULT TRUE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS allow_carryover BOOLEAN DEFAULT FALSE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS max_carryover_days INTEGER DEFAULT 0;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS requires_document_after_days INTEGER;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS applicable_gender VARCHAR(10) DEFAULT 'ALL';
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS min_service_months INTEGER DEFAULT 0;
`;

async function runMigration() {
    console.log('🚀 Starting database migration...\n');

    try {
        console.log('📦 Dropping tables with incorrect types...');
        await pool.query(migrationSQL);
        console.log('✅ Tables dropped successfully\n');

        console.log('📝 Adding missing columns to leave_types...');
        await pool.query(alterSQL);
        console.log('✅ Columns added successfully\n');

        console.log('✨ Migration completed!');
        console.log('👉 Now restart the backend server to recreate tables with correct UUID types.');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();
