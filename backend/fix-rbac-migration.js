const { pool } = require('./db');
require('dotenv').config();

async function fixAndMigrateRBAC() {
    const client = await pool.connect();

    try {
        console.log('🔐 RBAC Phase 1: Fix and Migrate...\n');

        await client.query('BEGIN');

        // Step 1: Check current roles
        console.log('1️⃣ Checking existing roles...');
        const existingRoles = await client.query('SELECT id, name FROM roles ORDER BY id');
        console.table(existingRoles.rows);

        // Step 2: Fix sequence (set to max ID + 1)
        console.log('\n2️⃣ Fixing role ID sequence...');
        await client.query(`
      SELECT setval('roles_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM roles), false);
    `);
        console.log('   ✅ Sequence fixed\n');

        // Step 3: Rename department_head if it exists
        console.log('3️⃣ Updating role names...');
        const renameResult = await client.query(`
      UPDATE roles SET name = 'department_manager' WHERE name = 'department_head' RETURNING id, name
    `);
        if (renameResult.rowCount > 0) {
            console.log('   ✅ Renamed department_head → department_manager');
        } else {
            console.log('   ⏭️  No department_head found to rename');
        }

        // Step 4: Add missing roles
        console.log('\n4️⃣ Adding missing roles...');
        const roleNames = existingRoles.rows.map(r => r.name);

        if (!roleNames.includes('admin')) {
            await client.query(`INSERT INTO roles (name, description) VALUES ('admin', 'Administrator')`);
            console.log('   ✅ Added admin');
        } else {
            console.log('   ⏭️  admin exists');
        }

        if (!roleNames.includes('senior_employee')) {
            await client.query(`INSERT INTO roles (name, description) VALUES ('senior_employee', 'Senior Employee')`);
            console.log('   ✅ Added senior_employee');
        } else {
            console.log('   ⏭️  senior_employee exists');
        }

        // Step 5: Add metadata columns
        console.log('\n5️⃣ Adding metadata columns...');
        await client.query(`
      ALTER TABLE roles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
      ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
      ALTER TABLE roles ADD COLUMN IF NOT EXISTS color_code VARCHAR(20);
      ALTER TABLE roles ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
      ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT FALSE;
    `);
        console.log('   ✅ Columns added\n');

        // Step 6: Update metadata
        console.log('6️⃣ Updating role metadata...');
        await client.query(`
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
        END
      WHERE display_name IS NULL OR level = 0
    `);
        console.log('   ✅ Metadata updated\n');

        // Step 7: Create role_permissions table
        console.log('7️⃣ Creating role_permissions table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        permission_key VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        action_type VARCHAR(50),
        scope VARCHAR(20) DEFAULT 'own',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_id, permission_key, scope)
      )
    `);
        console.log('   ✅ Table created\n');

        // Step 8: Create indexes
        console.log('8️⃣ Creating indexes...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key ON role_permissions(permission_key);
      CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);
      CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id_active 
        ON user_profiles(manager_id) WHERE is_active = TRUE;
    `);
        console.log('   ✅ Indexes created\n');

        await client.query('COMMIT');

        // Verify
        console.log('📊 Final Roles:');
        const finalRoles = await client.query(`
      SELECT id, name, display_name, level, color_code, is_system_role 
      FROM roles 
      ORDER BY level DESC
    `);
        console.table(finalRoles.rows);

        console.log('\n✅ RBAC Phase 1 Migration SUCCESSFUL!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration failed:', error.message);
        console.error('Full error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixAndMigrateRBAC();
