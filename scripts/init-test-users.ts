import { createClient } from '@supabase/supabase-js';
import { testUsers } from '../src/__tests__/test-data/testUsers.js';
import dotenv from 'dotenv';
import { UserRole } from '../src/types/user.types.js';

dotenv.config();

// Initialize Supabase client with environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure the following environment variables are set in your .env file:');
  console.error('  1. NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL');
  console.error('  2. SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key');
  console.error('\nYou can copy .env.example to .env and update the values');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUsers() {
  console.log('Starting test user creation...');
  
  // Create auth users and profiles for each test user
  for (const [role, user] of Object.entries(testUsers)) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.email} already exists, updating...`);
        
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: user.firstName,
            last_name: user.lastName,
            role: user.role,
            department: user.department,
            position: user.position,
            avatar_url: user.avatar,
            is_active: user.isActive,
            permissions: user.permissions,
            updated_at: new Date().toISOString(),
          })
          .eq('email', user.email)
          .select()
          .single();
          
        if (updateError) throw updateError;
        console.log(`Updated user: ${updatedUser.email}`);
        continue;
      }
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password!,
        email_confirm: true,
        user_metadata: {
          name: `${user.firstName} ${user.lastName}`,
        },
      });
      
      if (authError) throw authError;
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
          department: user.department,
          position: user.position,
          avatar_url: user.avatar,
          is_active: user.isActive,
          permissions: user.permissions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
        
      if (profileError) throw profileError;
      
      console.log(`Created user: ${user.email}`);
      
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
  
  console.log('Test user creation completed!');
  
  // Print login information
  console.log('\n=== Test Accounts ===');
  Object.entries(testUsers).forEach(([role, user]) => {
    console.log(`\nRole: ${role}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Permissions: ${user.permissions?.join(', ')}`);
  });
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('\nTest user setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting up test users:', error);
    process.exit(1);
  });
