-- ========================================
-- ARISE HRM - COMPREHENSIVE DATABASE SCHEMA
-- ========================================
-- This schema provides a complete HRM system with:
-- • User Management & Authentication
-- • Organizational Structure
-- • Attendance Tracking
-- • Leave Management
-- • Performance Management
-- • Payroll System
-- • Audit & Security
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- SECURITY & ROLES
-- ========================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(role_id, permission_id)
);

-- ========================================
-- ORGANIZATIONAL STRUCTURE
-- ========================================

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    manager_id UUID, -- Will reference user_profiles
    budget DECIMAL(15,2),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id),
    level INTEGER DEFAULT 1,
    min_salary DECIMAL(12,2),
    max_salary DECIMAL(12,2),
    required_skills TEXT[],
    qualifications TEXT[],
    responsibilities TEXT[],
    is_active BOOLEAN DEFAULT TRUE
);

-- ========================================
-- USER PROFILES
-- ========================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    profile_photo_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    address JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    role_id UUID REFERENCES roles(id),
    manager_id UUID REFERENCES user_profiles(id),
    hire_date DATE NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time' 
        CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    salary DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'USD',
    location VARCHAR(100),
    time_zone VARCHAR(50),
    skills TEXT[],
    languages TEXT[],
    qualifications JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key for manager_id in departments
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES user_profiles(id);

-- ========================================
-- ATTENDANCE MANAGEMENT
-- ========================================

-- Create work_schedules table
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration INTEGER DEFAULT 0, -- minutes
    is_working_day BOOLEAN DEFAULT TRUE,
    is_flexible BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50),
    effective_from DATE NOT NULL,
    effective_to DATE,
    UNIQUE(employee_id, day_of_week, effective_from)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'present' 
        CHECK (status IN ('present', 'absent', 'late', 'half_day', 'holiday', 'weekend')),
    location_check_in JSONB DEFAULT '{}'::jsonb, -- {lat, lng, address}
    location_check_out JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    device_info JSONB DEFAULT '{}'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb, -- URLs to photos
    notes TEXT,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_correction BOOLEAN DEFAULT FALSE,
    correction_reason TEXT,
    UNIQUE(employee_id, date)
);

-- ========================================
-- LEAVE MANAGEMENT
-- ========================================

-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    annual_allocation INTEGER DEFAULT 0, -- days per year
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    max_consecutive_days INTEGER,
    advance_notice_days INTEGER DEFAULT 0,
    carry_forward_allowed BOOLEAN DEFAULT FALSE,
    carry_forward_limit INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    color VARCHAR(7) -- hex color for UI
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(3,1) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
    applied_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    documents JSONB DEFAULT '[]'::jsonb, -- URLs to supporting documents
    handover_notes TEXT,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_period VARCHAR(10) CHECK (half_day_period IN ('morning', 'afternoon'))
);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    allocated_days DECIMAL(4,1) NOT NULL,
    used_days DECIMAL(4,1) DEFAULT 0,
    pending_days DECIMAL(4,1) DEFAULT 0,
    carried_forward DECIMAL(4,1) DEFAULT 0,
    expires_at DATE,
    UNIQUE(employee_id, leave_type_id, year)
);

-- ========================================
-- PERFORMANCE MANAGEMENT
-- ========================================

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES user_profiles(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type VARCHAR(20) DEFAULT 'annual' 
        CHECK (review_type IN ('annual', 'quarterly', 'monthly', 'project', '360')),
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'in_progress', 'completed', 'approved')),
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
    goals_achievement DECIMAL(5,2), -- percentage
    competency_rating JSONB DEFAULT '{}'::jsonb, -- {skill: rating} mapping
    strengths TEXT,
    improvement_areas TEXT,
    development_plan JSONB DEFAULT '[]'::jsonb,
    comments TEXT,
    employee_comments TEXT,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    due_date DATE
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'individual' 
        CHECK (category IN ('individual', 'team', 'company')),
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_date DATE NOT NULL,
    completion_date DATE,
    metrics JSONB DEFAULT '{}'::jsonb, -- quantifiable metrics
    created_by UUID REFERENCES user_profiles(id),
    assigned_by UUID REFERENCES user_profiles(id)
);

-- ========================================
-- PAYROLL MANAGEMENT
-- ========================================

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL,
    allowances JSONB DEFAULT '{}'::jsonb, -- {type: amount} mapping
    deductions JSONB DEFAULT '{}'::jsonb, -- {type: amount} mapping
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    payment_date DATE,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    processed_by UUID REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    notes TEXT
);

-- ========================================
-- SYSTEM TABLES
-- ========================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES user_profiles(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Performance reviews indexes
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer ON performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period ON performance_reviews(review_period_start, review_period_end);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_records(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (to be customized based on your needs)
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.email() = email);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.email() = email);

-- Attendance records policies
CREATE POLICY "Users can view own attendance" ON attendance_records
    FOR SELECT USING (
        employee_id IN (SELECT id FROM user_profiles WHERE email = auth.email())
    );

-- Leave requests policies
CREATE POLICY "Users can view own leave requests" ON leave_requests
    FOR SELECT USING (
        employee_id IN (SELECT id FROM user_profiles WHERE email = auth.email())
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        recipient_id IN (SELECT id FROM user_profiles WHERE email = auth.email())
    );

-- ========================================
-- INITIAL DATA
-- ========================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, level, is_system_role) VALUES
    ('super_admin', 'Super Administrator', 'Full system access', 100, true),
    ('admin', 'Administrator', 'Administrative access', 90, true),
    ('hr_manager', 'HR Manager', 'Human Resources management', 80, false),
    ('department_manager', 'Department Manager', 'Department level management', 70, false),
    ('team_lead', 'Team Lead', 'Team leadership role', 60, false),
    ('senior_employee', 'Senior Employee', 'Senior level employee', 50, false),
    ('employee', 'Employee', 'Standard employee access', 40, false),
    ('intern', 'Intern', 'Intern level access', 20, false)
ON CONFLICT (name) DO NOTHING;

-- Insert default leave types
INSERT INTO leave_types (name, code, description, annual_allocation, is_paid, requires_approval, advance_notice_days, color) VALUES
    ('Annual Leave', 'AL', 'Paid annual vacation leave', 21, true, true, 7, '#4CAF50'),
    ('Sick Leave', 'SL', 'Medical leave for illness', 10, true, false, 0, '#FF9800'),
    ('Personal Leave', 'PL', 'Personal time off', 5, false, true, 3, '#2196F3'),
    ('Maternity Leave', 'ML', 'Maternity leave', 90, true, true, 30, '#E91E63'),
    ('Paternity Leave', 'PTL', 'Paternity leave', 14, true, true, 30, '#3F51B5'),
    ('Emergency Leave', 'EL', 'Emergency situations', 3, true, false, 0, '#F44336'),
    ('Study Leave', 'STL', 'Educational purposes', 5, false, true, 14, '#9C27B0')
ON CONFLICT (code) DO NOTHING;

-- Insert default permissions (basic set)
INSERT INTO permissions (name, display_name, resource, action) VALUES
    ('view_dashboard', 'View Dashboard', 'dashboard', 'read'),
    ('manage_employees', 'Manage Employees', 'employees', 'manage'),
    ('view_employees', 'View Employees', 'employees', 'read'),
    ('manage_attendance', 'Manage Attendance', 'attendance', 'manage'),
    ('view_attendance', 'View Attendance', 'attendance', 'read'),
    ('manage_leaves', 'Manage Leaves', 'leaves', 'manage'),
    ('view_leaves', 'View Leaves', 'leaves', 'read'),
    ('manage_payroll', 'Manage Payroll', 'payroll', 'manage'),
    ('view_payroll', 'View Payroll', 'payroll', 'read'),
    ('manage_performance', 'Manage Performance', 'performance', 'manage'),
    ('view_performance', 'View Performance', 'performance', 'read'),
    ('system_admin', 'System Administration', 'system', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Grant permissions to roles (basic setup)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin' 
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.name != 'system_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'employee' AND p.name IN ('view_dashboard', 'view_attendance', 'view_leaves', 'view_performance')
ON CONFLICT DO NOTHING;

-- ========================================
-- VIEWS FOR ANALYTICS
-- ========================================

-- Employee summary view
CREATE OR REPLACE VIEW employee_summary AS
SELECT 
    up.id,
    up.employee_id,
    up.first_name || ' ' || up.last_name AS full_name,
    up.email,
    d.name AS department_name,
    p.title AS position_title,
    r.display_name AS role_name,
    up.status,
    up.hire_date,
    up.salary,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, up.hire_date)) AS years_of_service
FROM user_profiles up
LEFT JOIN departments d ON up.department_id = d.id
LEFT JOIN positions p ON up.position_id = p.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE up.is_active = true;

-- Attendance summary view
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    ar.employee_id,
    up.first_name || ' ' || up.last_name AS employee_name,
    COUNT(*) AS total_days,
    COUNT(*) FILTER (WHERE ar.status = 'present') AS present_days,
    COUNT(*) FILTER (WHERE ar.status = 'absent') AS absent_days,
    COUNT(*) FILTER (WHERE ar.status = 'late') AS late_days,
    ROUND(AVG(ar.total_hours), 2) AS avg_hours_per_day,
    SUM(ar.overtime_hours) AS total_overtime_hours
FROM attendance_records ar
JOIN user_profiles up ON ar.employee_id = up.id
WHERE ar.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ar.employee_id, up.first_name, up.last_name;

-- ========================================
-- TRAINING MANAGEMENT TABLES
-- ========================================

-- Create training_courses table
CREATE TABLE IF NOT EXISTS training_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    level VARCHAR(20) DEFAULT 'beginner' 
        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER NOT NULL,
    max_participants INTEGER,
    instructor_id UUID REFERENCES user_profiles(id),
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    content JSONB DEFAULT '{}'::jsonb,
    prerequisites TEXT[],
    learning_objectives TEXT[],
    certification_provided BOOLEAN DEFAULT FALSE,
    cost DECIMAL(10,2) DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT FALSE,
    tags TEXT[]
);

-- Create training_enrollments table
CREATE TABLE IF NOT EXISTS training_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    course_id UUID REFERENCES training_courses(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    enrolled_by UUID REFERENCES user_profiles(id),
    status VARCHAR(20) DEFAULT 'enrolled' 
        CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    completion_date DATE,
    score DECIMAL(5,2),
    certificate_url TEXT,
    feedback TEXT,
    UNIQUE(course_id, employee_id)
);

-- ========================================
-- ANNOUNCEMENT CENTER TABLES
-- ========================================

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'general' 
        CHECK (type IN ('general', 'urgent', 'policy', 'event', 'system')),
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES user_profiles(id),
    target_audience VARCHAR(20) DEFAULT 'all' 
        CHECK (target_audience IN ('all', 'department', 'role', 'custom')),
    target_departments UUID[],
    target_roles UUID[],
    target_employees UUID[],
    publish_date TIMESTAMP WITH TIME ZONE,
    expire_date TIMESTAMP WITH TIME ZONE,
    requires_acknowledgment BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]'::jsonb,
    tags TEXT[]
);

-- Create announcement_acknowledgments table
CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, employee_id)
);

-- ========================================
-- COMPLIANCE MANAGEMENT TABLES
-- ========================================

-- Create compliance_policies table
CREATE TABLE IF NOT EXISTS compliance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'archived')),
    effective_date DATE NOT NULL,
    review_date DATE,
    owner_id UUID REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    requires_acknowledgment BOOLEAN DEFAULT TRUE,
    applies_to VARCHAR(20) DEFAULT 'all' 
        CHECK (applies_to IN ('all', 'department', 'role', 'custom')),
    target_departments UUID[],
    target_roles UUID[],
    attachments JSONB DEFAULT '[]'::jsonb
);

-- Create policy_acknowledgments table
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    policy_id UUID REFERENCES compliance_policies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version_acknowledged VARCHAR(20),
    UNIQUE(policy_id, employee_id, version_acknowledged)
);

-- ========================================
-- EXPENSE MANAGEMENT TABLES
-- ========================================

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    default_limit DECIMAL(10,2),
    requires_receipt BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create expense_claims table
CREATE TABLE IF NOT EXISTS expense_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    payment_date DATE,
    payment_reference VARCHAR(100)
);

-- Create expense_items table
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claim_id UUID REFERENCES expense_claims(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    merchant VARCHAR(100),
    notes TEXT
);

-- ========================================
-- ADDITIONAL INDEXES FOR NEW MODULES
-- ========================================

-- Training indexes
CREATE INDEX IF NOT EXISTS idx_training_courses_category ON training_courses(category);
CREATE INDEX IF NOT EXISTS idx_training_courses_status ON training_courses(status);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_employee ON training_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course ON training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON training_enrollments(status);

-- Announcement indexes
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_announcement_acknowledgments_employee ON announcement_acknowledgments(employee_id);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_compliance_policies_category ON compliance_policies(category);
CREATE INDEX IF NOT EXISTS idx_compliance_policies_status ON compliance_policies(status);
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_employee ON policy_acknowledgments(employee_id);

-- Expense indexes
CREATE INDEX IF NOT EXISTS idx_expense_claims_employee ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_items_claim ON expense_items(claim_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category_id);

-- ========================================
-- TRIGGERS FOR NEW TABLES
-- ========================================

CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON training_courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_enrollments_updated_at BEFORE UPDATE ON training_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_policies_updated_at BEFORE UPDATE ON compliance_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_claims_updated_at BEFORE UPDATE ON expense_claims 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS FOR NEW TABLES
-- ========================================

ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;

-- Training RLS policies
CREATE POLICY "Users can view published courses" ON training_courses
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view own enrollments" ON training_enrollments
    FOR SELECT USING (
        employee_id IN (SELECT id FROM user_profiles WHERE email = auth.email())
    );

-- Announcement RLS policies
CREATE POLICY "Users can view published announcements" ON announcements
    FOR SELECT USING (status = 'published' AND publish_date <= NOW());

-- Expense RLS policies
CREATE POLICY "Users can view own expense claims" ON expense_claims
    FOR SELECT USING (
        employee_id IN (SELECT id FROM user_profiles WHERE email = auth.email())
    );

-- ========================================
-- INITIAL DATA FOR NEW MODULES
-- ========================================

-- Insert default expense categories
INSERT INTO expense_categories (name, code, description, default_limit, requires_receipt) VALUES
    ('Travel', 'TRAVEL', 'Travel related expenses', 1000.00, true),
    ('Meals', 'MEALS', 'Business meal expenses', 100.00, true),
    ('Accommodation', 'ACCOM', 'Hotel and lodging expenses', 500.00, true),
    ('Office Supplies', 'OFFICE', 'Office supplies and equipment', 200.00, true),
    ('Training', 'TRAINING', 'Training and development costs', 2000.00, true),
    ('Communication', 'COMM', 'Phone and internet expenses', 150.00, false),
    ('Medical', 'MEDICAL', 'Medical reimbursements', 500.00, true),
    ('Other', 'OTHER', 'Other business expenses', 100.00, true)
ON CONFLICT (code) DO NOTHING;

COMMIT;
