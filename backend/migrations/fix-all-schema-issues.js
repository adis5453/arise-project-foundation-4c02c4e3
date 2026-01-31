/**
 * Comprehensive Database Schema Fixes
 * Fixes all column mismatches between routes and database
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigrations() {
    console.log('🔧 Running Comprehensive Database Schema Fixes...\n');

    try {
        // =============================================
        // 1. Fix user_profiles table - add missing columns
        // =============================================
        console.log('1️⃣  Fixing user_profiles table...');

        // Add profile_photo_url (some routes use this instead of avatar_url)
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
        `);

        // Copy avatar_url to profile_photo_url if profile_photo_url is null
        await pool.query(`
            UPDATE user_profiles 
            SET profile_photo_url = avatar_url 
            WHERE profile_photo_url IS NULL AND avatar_url IS NOT NULL;
        `);

        // Add account security columns
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false;
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;
        `);

        // Add MFA columns
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];
        `);

        // Add employment_status (some routes use this)
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active';
        `);

        // Add emergency_contact fields as separate columns (not just JSONB)
        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(100);
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);
        `);

        await pool.query(`
            ALTER TABLE user_profiles 
            ADD COLUMN IF NOT EXISTS emergency_contact_relation VARCHAR(50);
        `);

        // Add role_name computed from roles table
        await pool.query(`
            DROP VIEW IF EXISTS user_profiles_with_role;
            CREATE OR REPLACE VIEW user_profiles_with_role AS
            SELECT u.*, r.name as role_name, r.description as role_description
            FROM user_profiles u
            LEFT JOIN roles r ON u.role_id = r.id;
        `);

        console.log('   ✅ user_profiles table fixed');

        // =============================================
        // 2. Add missing roles
        // =============================================
        console.log('2️⃣  Adding missing roles...');

        await pool.query(`
            INSERT INTO roles (name, description) VALUES 
                ('super_admin', 'Super Administrator with full access'),
                ('admin', 'Administrator'),
                ('hr_manager', 'HR Manager'),
                ('department_manager', 'Department Manager'),
                ('manager', 'Manager'),
                ('team_leader', 'Team Leader'),
                ('employee', 'Regular Employee'),
                ('intern', 'Intern')
            ON CONFLICT (name) DO NOTHING;
        `);

        // Add permissions column to roles
        await pool.query(`
            ALTER TABLE roles
            ADD COLUMN IF NOT EXISTS permissions TEXT[];
        `);

        console.log('   ✅ Roles updated');

        // =============================================
        // 3. Create refresh_tokens table if not exists
        // =============================================
        console.log('3️⃣  Creating refresh_tokens table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                token_id VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                revoked BOOLEAN DEFAULT false,
                revoked_at TIMESTAMP,
                user_agent TEXT,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_id ON refresh_tokens(token_id);
        `);

        console.log('   ✅ refresh_tokens table ready');

        // =============================================
        // 4. Create system_settings table if not exists
        // =============================================
        console.log('4️⃣  Creating system_settings table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                category VARCHAR(50),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert default settings
        await pool.query(`
            INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
                ('company_name', 'Arise HRM', 'general', 'Company name'),
                ('timezone', 'Asia/Kolkata', 'general', 'Default timezone'),
                ('date_format', 'DD/MM/YYYY', 'general', 'Date format'),
                ('work_hours_start', '09:00', 'attendance', 'Work day start time'),
                ('work_hours_end', '18:00', 'attendance', 'Work day end time'),
                ('min_password_length', '12', 'security', 'Minimum password length'),
                ('max_failed_logins', '5', 'security', 'Max failed login attempts before lockout'),
                ('session_timeout_minutes', '30', 'security', 'Session idle timeout in minutes')
            ON CONFLICT (setting_key) DO NOTHING;
        `);

        console.log('   ✅ system_settings table ready');

        // =============================================
        // 5. Create payroll_records table if not exists
        // =============================================
        console.log('5️⃣  Creating payroll tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payroll_records (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                period_start DATE NOT NULL,
                period_end DATE NOT NULL,
                basic_salary NUMERIC(12, 2),
                allowances JSONB DEFAULT '{}',
                deductions JSONB DEFAULT '{}',
                gross_salary NUMERIC(12, 2),
                net_salary NUMERIC(12, 2),
                status VARCHAR(50) DEFAULT 'draft',
                processed_by UUID REFERENCES user_profiles(id),
                processed_at TIMESTAMP,
                paid_at TIMESTAMP,
                payment_method VARCHAR(50),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
            CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period_start, period_end);
        `);

        console.log('   ✅ payroll_records table ready');

        // =============================================
        // 6. Create performance tables if not exist
        // =============================================
        console.log('6️⃣  Creating performance tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS performance_reviews (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                reviewer_id UUID REFERENCES user_profiles(id),
                review_period_start DATE NOT NULL,
                review_period_end DATE NOT NULL,
                overall_rating DECIMAL(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
                strengths TEXT,
                areas_for_improvement TEXT,
                goals_achieved TEXT,
                comments TEXT,
                status VARCHAR(50) DEFAULT 'draft',
                submitted_at TIMESTAMP,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS performance_goals (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_date DATE,
                category VARCHAR(100),
                priority VARCHAR(50) DEFAULT 'medium',
                progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
                status VARCHAR(50) DEFAULT 'in_progress',
                created_by UUID REFERENCES user_profiles(id),
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('   ✅ performance tables ready');

        // =============================================
        // 7. Create benefits tables if not exist
        // =============================================
        console.log('7️⃣  Creating benefits tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS benefit_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                description TEXT,
                provider VARCHAR(255),
                coverage_details JSONB,
                cost_employee NUMERIC(10, 2),
                cost_employer NUMERIC(10, 2),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS employee_benefits (
                id SERIAL PRIMARY KEY,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                benefit_plan_id INTEGER REFERENCES benefit_plans(id),
                enrollment_date DATE,
                coverage_level VARCHAR(50),
                dependents JSONB,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, benefit_plan_id)
            );
        `);

        console.log('   ✅ benefits tables ready');

        // =============================================
        // 8. Create announcements table if not exists
        // =============================================
        console.log('8️⃣  Creating announcements tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                content TEXT,
                author_id UUID REFERENCES user_profiles(id),
                priority VARCHAR(50) DEFAULT 'normal',
                target_audience VARCHAR(100),
                department_ids UUID[],
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS announcement_reads (
                id SERIAL PRIMARY KEY,
                announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
                user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(announcement_id, user_id)
            );
        `);

        console.log('   ✅ announcements tables ready');

        // =============================================
        // 9. Create messaging tables if not exist
        // =============================================
        console.log('9️⃣  Creating messaging tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                type VARCHAR(50) DEFAULT 'direct',
                name VARCHAR(255),
                avatar_url VARCHAR(500),
                created_by UUID REFERENCES user_profiles(id),
                last_message_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversation_participants (
                id SERIAL PRIMARY KEY,
                conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_read_at TIMESTAMP,
                UNIQUE(conversation_id, user_id)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id UUID REFERENCES user_profiles(id),
                content TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text',
                attachments JSONB,
                is_edited BOOLEAN DEFAULT false,
                edited_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
        `);

        console.log('   ✅ messaging tables ready');

        // =============================================
        // 10. Create projects table if not exists
        // =============================================
        console.log('🔟  Creating projects tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'planning',
                priority VARCHAR(50) DEFAULT 'medium',
                start_date DATE,
                end_date DATE,
                budget NUMERIC(15, 2),
                department_id UUID REFERENCES departments(id),
                manager_id UUID REFERENCES user_profiles(id),
                created_by UUID REFERENCES user_profiles(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_members (
                id SERIAL PRIMARY KEY,
                project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
                role VARCHAR(100),
                allocation_percentage INTEGER DEFAULT 100,
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, employee_id)
            );
        `);

        console.log('   ✅ projects tables ready');

        // =============================================
        // Final Summary
        // =============================================
        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(50));

        // Verify tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`\n📊 Total tables in database: ${tables.rows.length}`);
        console.log('\nKey tables verified:');
        const keyTables = [
            'user_profiles', 'roles', 'departments', 'teams', 'positions',
            'attendance_records', 'leave_requests', 'leave_types',
            'notifications', 'announcements', 'conversations', 'messages',
            'payroll_records', 'performance_reviews', 'performance_goals',
            'benefit_plans', 'employee_benefits', 'projects', 'refresh_tokens'
        ];

        const tableNames = tables.rows.map(r => r.table_name);
        keyTables.forEach(table => {
            const exists = tableNames.includes(table);
            console.log(`   ${exists ? '✅' : '❌'} ${table}`);
        });

    } catch (error) {
        console.error('\n❌ Migration Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

runMigrations();
