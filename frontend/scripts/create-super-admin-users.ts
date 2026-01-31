/**
 * Super Admin User Creation Script for Arise HRM
 * 
 * This script creates users in Supabase Auth and user_profiles table
 * for development and testing purposes.
 * 
 * Usage:
 * npm run script:ts scripts/create-super-admin-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key needed for user creation

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('  - VITE_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('  - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY)
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// User templates for different roles
interface UserTemplate {
  role_id: number
  role_name: string
  count: number
  email_pattern: string
  department: string
  position: string
  salary_min: number
  salary_max: number
}

const USER_TEMPLATES: UserTemplate[] = [
  {
    role_id: 1,
    role_name: 'super_admin',
    count: 1,
    email_pattern: 'superadmin{n}@arisehrm.com',
    department: 'Information Technology',
    position: 'System Administrator',
    salary_min: 100000,
    salary_max: 150000
  },
  {
    role_id: 3,
    role_name: 'hr_manager',
    count: 2,
    email_pattern: 'hrmanager{n}@arisehrm.com',
    department: 'Human Resources',
    position: 'HR Manager',
    salary_min: 75000,
    salary_max: 100000
  },
  {
    role_id: 4,
    role_name: 'manager',
    count: 3,
    email_pattern: 'manager{n}@arisehrm.com',
    department: 'Engineering',
    position: 'Department Manager',
    salary_min: 85000,
    salary_max: 120000
  },
  {
    role_id: 5,
    role_name: 'team_lead',
    count: 5,
    email_pattern: 'teamlead{n}@arisehrm.com',
    department: 'Engineering',
    position: 'Team Lead',
    salary_min: 70000,
    salary_max: 95000
  },
  {
    role_id: 6,
    role_name: 'employee',
    count: 10,
    email_pattern: 'employee{n}@arisehrm.com',
    department: 'Engineering',
    position: 'Software Engineer',
    salary_min: 60000,
    salary_max: 85000
  }
]

// Sample names for user generation
const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Ashley',
  'William', 'Jessica', 'James', 'Amanda', 'Christopher', 'Melissa',
  'Matthew', 'Stephanie', 'Joshua', 'Nicole', 'Daniel', 'Elizabeth',
  'Anthony', 'Lisa', 'Mark', 'Helen', 'Donald', 'Sandra', 'Steven', 'Donna'
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez'
]

// Utility functions
function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

function generateEmployeeId(role: string, sequence: number): string {
  const rolePrefix = {
    'super_admin': 'SA',
    'hr_manager': 'HR',
    'manager': 'MG',
    'team_lead': 'TL',
    'employee': 'EMP'
  }[role] || 'EMP'
  
  const timestamp = Date.now().toString().slice(-4)
  return `${rolePrefix}${timestamp}${sequence.toString().padStart(3, '0')}`
}

function generateName(index: number) {
  return {
    first_name: FIRST_NAMES[index % FIRST_NAMES.length],
    last_name: LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]
  }
}

async function getDepartmentId(departmentName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('departments')
    .select('id')
    .eq('name', departmentName)
    .single()

  if (error) {
    console.error(`Error finding department ${departmentName}:`, error)
    return null
  }

  return data?.id || null
}

async function getPositionId(positionTitle: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('positions')
    .select('id')
    .eq('title', positionTitle)
    .single()

  if (error) {
    console.error(`Error finding position ${positionTitle}:`, error)
    return null
  }

  return data?.id || null
}

async function createUser(userData: {
  email: string
  password: string
  employee_id: string
  first_name: string
  last_name: string
  role_id: number
  department_id: string | null
  position_id: string | null
  salary: number
}) {
  try {
    // Step 1: Create user in Supabase Auth
    console.log(`  Creating auth user: ${userData.email}`)
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        employee_id: userData.employee_id
      }
    })

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`)
    }

    if (!authUser.user) {
      throw new Error('Auth user creation returned null')
    }

    console.log(`  ✅ Auth user created: ${authUser.user.id}`)

    // Step 2: Create user profile
    console.log(`  Creating user profile...`)
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        employee_id: userData.employee_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        department_id: userData.department_id,
        position_id: userData.position_id,
        salary: userData.salary,
        employment_status: 'active',
        employment_type: 'full_time',
        hire_date: new Date().toISOString().split('T')[0],
        auth_user_id: authUser.user.id
      })

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authUser.user.id)
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    console.log(`  ✅ User profile created`)
    
    return {
      success: true,
      user: {
        id: authUser.user.id,
        email: userData.email,
        employee_id: userData.employee_id,
        password: userData.password,
        name: `${userData.first_name} ${userData.last_name}`
      }
    }

  } catch (error) {
    console.error(`  ❌ Failed to create user ${userData.email}:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

async function createUsersFromTemplate(template: UserTemplate) {
  console.log(`\n🚀 Creating ${template.count} ${template.role_name} user(s)...`)
  
  const results = []
  const departmentId = await getDepartmentId(template.department)
  const positionId = await getPositionId(template.position)
  
  if (!departmentId) {
    console.warn(`  ⚠️ Department '${template.department}' not found, using null`)
  }
  
  if (!positionId) {
    console.warn(`  ⚠️ Position '${template.position}' not found, using null`)
  }

  for (let i = 1; i <= template.count; i++) {
    const names = generateName(i - 1)
    const email = template.email_pattern.replace('{n}', i.toString())
    const password = generateSecurePassword(12)
    const employeeId = generateEmployeeId(template.role_name, i)
    const salary = template.salary_min + Math.floor(Math.random() * (template.salary_max - template.salary_min))

    console.log(`\n  Creating user ${i}/${template.count}:`)
    console.log(`    Email: ${email}`)
    console.log(`    Employee ID: ${employeeId}`)
    console.log(`    Name: ${names.first_name} ${names.last_name}`)

    const result = await createUser({
      email,
      password,
      employee_id: employeeId,
      first_name: names.first_name,
      last_name: names.last_name,
      role_id: template.role_id,
      department_id: departmentId,
      position_id: positionId,
      salary
    })

    results.push(result)

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount

  console.log(`\n  📊 Template '${template.role_name}' completed:`)
  console.log(`    ✅ Success: ${successCount}`)
  console.log(`    ❌ Failed: ${failureCount}`)

  return results
}

async function exportCredentials(allResults: any[]) {
  const successful = allResults.filter(r => r.success)
  
  if (successful.length === 0) {
    console.log('\n❌ No users created successfully - skipping export')
    return
  }

  console.log('\n📄 Generated User Credentials:')
  console.log('=' .repeat(80))
  console.log('| Employee ID | Email | Password | Name |')
  console.log('=' .repeat(80))
  
  successful.forEach(result => {
    console.log(`| ${result.user.employee_id} | ${result.user.email} | ${result.user.password} | ${result.user.name} |`)
  })
  
  console.log('=' .repeat(80))
  console.log('\n⚠️  IMPORTANT: Save these credentials securely!')
  console.log('   These passwords will not be shown again.')
  console.log('\n💡 You can also find test account information in TEST_ACCOUNTS.md')
}

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .limit(1)
    
    if (error) {
      throw error
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

async function checkExistingUsers() {
  console.log('🔍 Checking for existing test users...')
  
  const testEmails = USER_TEMPLATES.flatMap(template => {
    const emails = []
    for (let i = 1; i <= template.count; i++) {
      emails.push(template.email_pattern.replace('{n}', i.toString()))
    }
    return emails
  })
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('email')
    .in('email', testEmails)
  
  if (error) {
    console.warn('Warning: Could not check existing users:', error.message)
    return []
  }
  
  if (data && data.length > 0) {
    console.log(`⚠️  Found ${data.length} existing test users:`)
    data.forEach(user => console.log(`   - ${user.email}`))
    console.log('\nℹ️  These users will be skipped if they already exist')
  } else {
    console.log('✅ No existing test users found')
  }
  
  return data?.map(u => u.email) || []
}

// Main execution function
async function main() {
  console.log('🏢 Arise HRM - Super Admin User Creation Script')
  console.log('=' .repeat(50))
  
  // Test database connection
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Aborting due to connection failure')
    process.exit(1)
  }
  
  // Check for existing users
  await checkExistingUsers()
  
  console.log('\n🎯 Starting user creation process...')
  
  const allResults = []
  let totalSuccess = 0
  let totalFailure = 0
  
  // Process each template
  for (const template of USER_TEMPLATES) {
    const results = await createUsersFromTemplate(template)
    allResults.push(...results)
    
    const successes = results.filter(r => r.success).length
    const failures = results.length - successes
    
    totalSuccess += successes
    totalFailure += failures
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(50))
  console.log('📋 FINAL SUMMARY')
  console.log('=' .repeat(50))
  console.log(`✅ Total users created: ${totalSuccess}`)
  console.log(`❌ Total failures: ${totalFailure}`)
  console.log(`📊 Success rate: ${Math.round((totalSuccess / (totalSuccess + totalFailure)) * 100)}%`)
  
  // Export credentials
  if (totalSuccess > 0) {
    await exportCredentials(allResults.filter(r => r.success))
    
    console.log('\n🎉 User creation completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Update TEST_ACCOUNTS.md with new credentials')
    console.log('   2. Test login with created accounts')
    console.log('   3. Verify role permissions are working correctly')
  } else {
    console.log('\n❌ No users were created successfully')
  }
  
  console.log('\n👋 Script completed')
}

// Execute the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

export { main as createSuperAdminUsers }
