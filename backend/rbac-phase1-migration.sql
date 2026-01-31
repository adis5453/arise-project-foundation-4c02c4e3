-- Phase 1: RBAC Database Updates
-- Update roles and add missing ones

-- 1. Rename department_head to department_manager for consistency
UPDATE roles SET name = 'department_manager' WHERE name = 'department_head';

-- 2. Add missing roles
INSERT INTO roles (name, description) VALUES 
  ('admin', 'Administrator with full access except system config'),
  ('senior_employee', 'Senior Employee with mentoring capabilities')
ON CONFLICT (name) DO NOTHING;

-- 3. Add role levels and metadata
ALTER TABLE roles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS color_code VARCHAR(20);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT FALSE;

-- 4. Update role levels
UPDATE roles SET 
  level = CASE name
    WHEN 'super_admin' THEN 100
    WHEN 'admin' THEN 90
    WHEN 'hr_manager' THEN 80
    WHEN 'department_manager' THEN 70
    WHEN 'team_lead' THEN 60
    WHEN 'senior_employee' THEN 50
    WHEN 'employee' THEN 40
    WHEN 'intern' THEN 30
    ELSE 0
  END,
  display_name = CASE name
    WHEN 'super_admin' THEN 'Super Administrator'
    WHEN 'admin' THEN 'Administrator'
    WHEN 'hr_manager' THEN 'HR Manager'
    WHEN 'department_manager' THEN 'Department Manager'
    WHEN 'team_lead' THEN 'Team Leader'
    WHEN 'senior_employee' THEN 'Senior Employee'
    WHEN 'employee' THEN 'Employee'
    WHEN 'intern' THEN 'Intern'
    ELSE name
  END,
  color_code = CASE name
    WHEN 'super_admin' THEN '#dc2626'
    WHEN 'admin' THEN '#ea580c'
    WHEN 'hr_manager' THEN '#c2410c'
    WHEN 'department_manager' THEN '#dc2626'
    WHEN 'team_lead' THEN '#2563eb'
    WHEN 'senior_employee' THEN '#059669'
    WHEN 'employee' THEN '#6b7280'
    WHEN 'intern' THEN '#9ca3af'
    ELSE '#6b7280'
  END,
  icon = CASE name
    WHEN 'super_admin' THEN 'SupervisorAccount'
    WHEN 'admin' THEN 'AdminPanelSettings'
    WHEN 'hr_manager' THEN 'People'
    WHEN 'department_manager' THEN 'Business'
    WHEN 'team_lead' THEN 'Group'
    WHEN 'senior_employee' THEN 'School'
    WHEN 'employee' THEN 'Person'
    WHEN 'intern' THEN 'PersonOutline'
    ELSE 'Person'
  END,
  is_system_role = CASE name
    WHEN 'super_admin' THEN TRUE
    WHEN 'admin' THEN TRUE
    ELSE FALSE
  END;

-- 5. Create role_permissions table for granular permission management
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  action_type VARCHAR(50),
  scope VARCHAR(20) DEFAULT 'own', -- own, team, department, all
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_key, scope)
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key ON role_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

-- 7. Add manager_id index for team hierarchy queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id_active ON user_profiles(manager_id) WHERE is_active = TRUE;

COMMENT ON TABLE role_permissions IS 'Granular permission assignments for each role';
COMMENT ON COLUMN roles.level IS 'Hierarchical level (100=Super Admin, 40=Employee, 30=Intern)';
COMMENT ON COLUMN role_permissions.scope IS 'Data access scope: own, team, department, or all';
