import { createClient } from '@supabase/supabase-js';
import { testUsers } from '../src/__tests__/test-data/testUsers';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Leave types for testing
const leaveTypes = [
  {
    id: 'annual',
    name: 'Annual Leave',
    description: 'Paid time off work granted by employers to employees',
    maxDaysPerYear: 20,
    colorCode: '#4f46e5',
    requiresApproval: true,
    isActive: true,
  },
  {
    id: 'sick',
    name: 'Sick Leave',
    description: 'Leave for health-related reasons',
    maxDaysPerYear: 10,
    colorCode: '#10b981',
    requiresApproval: false,
    isActive: true,
  },
  {
    id: 'personal',
    name: 'Personal Leave',
    description: 'Leave for personal reasons',
    maxDaysPerYear: 5,
    colorCode: '#f59e0b',
    requiresApproval: true,
    isActive: true,
  },
];

// Departments for testing
const departments = [
  { id: 'dept-eng', name: 'Engineering' },
  { id: 'dept-hr', name: 'Human Resources' },
  { id: 'dept-mkt', name: 'Marketing' },
  { id: 'dept-fin', name: 'Finance' },
  { id: 'dept-sales', name: 'Sales' },
];

// Positions for testing
const positions = [
  { id: 'pos-swe', name: 'Software Engineer' },
  { id: 'pos-mgr', name: 'Manager' },
  { id: 'pos-hr', name: 'HR Specialist' },
  { id: 'pos-mkt', name: 'Marketing Specialist' },
  { id: 'pos-int', name: 'Intern' },
];

// Helper function to get a random date within a range
function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get a random number in range
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function setupTestData() {
  console.log('Starting test data setup...');
  
  try {
    // 1. Create departments
    console.log('Creating departments...');
    const { error: deptError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'id' });
    
    if (deptError) throw deptError;
    
    // 2. Create positions
    console.log('Creating positions...');
    const { error: posError } = await supabase
      .from('positions')
      .upsert(positions, { onConflict: 'id' });
    
    if (posError) throw posError;
    
    // 3. Create leave types
    console.log('Creating leave types...');
    const { error: leaveTypeError } = await supabase
      .from('leave_types')
      .upsert(leaveTypes, { onConflict: 'id' });
    
    if (leaveTypeError) throw leaveTypeError;
    
    // 4. Get all test users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .in('email', Object.values(testUsers).map(u => u.email));
    
    if (usersError) throw usersError;
    
    if (!users || users.length === 0) {
      console.error('No test users found. Please run init-test-users.ts first.');
      process.exit(1);
    }
    
    // 5. Create leave balances for users
    console.log('Creating leave balances...');
    const leaveBalances = [];
    
    for (const user of users) {
      for (const leaveType of leaveTypes) {
        const usedDays = getRandomInt(0, leaveType.maxDaysPerYear / 2);
        const pendingDays = getRandomInt(0, 3);
        const availableDays = Math.max(0, leaveType.maxDaysPerYear - usedDays - pendingDays);
        
        leaveBalances.push({
          id: `${user.id}-${leaveType.id}`,
          user_id: user.id,
          leave_type_id: leaveType.id,
          total_days: leaveType.maxDaysPerYear,
          used_days: usedDays,
          pending_days: pendingDays,
          available_days: availableDays,
          year: new Date().getFullYear(),
        });
      }
    }
    
    const { error: balanceError } = await supabase
      .from('leave_balances')
      .upsert(leaveBalances, { onConflict: 'id' });
    
    if (balanceError) throw balanceError;
    
    // 6. Create sample leave requests
    console.log('Creating sample leave requests...');
    const leaveRequests = [];
    const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
    
    // For each user, create some leave requests
    for (const user of users) {
      const userLeaveTypes = leaveTypes.filter(lt => 
        Math.random() > 0.3
      );
      
      for (const leaveType of userLeaveTypes) {
        const requestCount = getRandomInt(1, 5);
        
        for (let i = 0; i < requestCount; i++) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + getRandomInt(-60, 60));
          
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + getRandomInt(1, 7));
          
          const status = getRandomItem(statuses);
          
          leaveRequests.push({
            id: uuidv4(),
            user_id: user.id,
            leave_type_id: leaveType.id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            reason: `Sample ${leaveType.name} request #${i + 1}`,
            status: status,
            created_at: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            reviewed_by: status !== 'pending' ? getRandomItem(users.filter(u => u.role === 'hr_manager' || u.role === 'department_manager'))?.id : null,
            reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
            review_notes: status !== 'pending' ? `Request ${status} by system` : null,
          });
        }
      }
    }
    
    // Insert in batches to avoid hitting limits
    const batchSize = 50;
    for (let i = 0; i < leaveRequests.length; i += batchSize) {
      const batch = leaveRequests.slice(i, i + batchSize);
      const { error: requestError } = await supabase
        .from('leave_requests')
        .insert(batch);
      
      if (requestError) throw requestError;
      console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(leaveRequests.length / batchSize)}`);
    }
    
    console.log('Test data setup completed successfully!');
    console.log(`\nCreated/Updated:`);
    console.log(`- ${departments.length} departments`);
    console.log(`- ${positions.length} positions`);
    console.log(`- ${leaveTypes.length} leave types`);
    console.log(`- ${leaveBalances.length} leave balances`);
    console.log(`- ${leaveRequests.length} leave requests`);
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    process.exit(1);
  }
}

// Run the script
setupTestData()
  .then(() => {
    console.log('\nTest data setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting up test data:', error);
    process.exit(1);
  });
