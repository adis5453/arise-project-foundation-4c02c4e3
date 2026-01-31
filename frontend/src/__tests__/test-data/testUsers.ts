import { User, UserRole } from '../../types/user.types.js';

export const testUsers: Record<string, User> = {
  superAdmin: {
    id: 'test-superadmin-1',
    email: 'superadmin@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Super',
    lastName: 'Admin',
    role: UserRole.SUPER_ADMIN,
    department: 'Administration',
    position: 'System Administrator',
    avatar: '/avatars/admin.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'users:manage',
      'roles:manage',
      'settings:manage',
      'reports:view',
      'employees:manage',
      'leave:manage',
      'attendance:manage',
      'payroll:manage',
    ],
  },
  hrManager: {
    id: 'test-hrmanager-1',
    email: 'hr.manager@arisehrm.test',
    password: 'Test@1234',
    firstName: 'HR',
    lastName: 'Manager',
    role: UserRole.HR_MANAGER,
    department: 'Human Resources',
    position: 'HR Manager',
    avatar: '/avatars/hr-manager.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'employees:manage',
      'leave:approve',
      'attendance:view',
      'reports:view',
    ],
  },
  departmentHead: {
    id: 'test-depthead-1',
    email: 'dept.head@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Department',
    lastName: 'Head',
    role: UserRole.DEPARTMENT_HEAD,
    department: 'Engineering',
    position: 'Engineering Manager',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'team:manage',
      'leave:approve',
      'attendance:view',
    ],
  },
  teamLead: {
    id: 'test-teamlead-1',
    email: 'team.lead@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Team',
    lastName: 'Lead',
    role: UserRole.TEAM_LEAD,
    department: 'Engineering',
    position: 'Senior Developer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'team:view',
      'leave:approve',
    ],
  },
  employee: {
    id: 'test-employee-1',
    email: 'employee@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Regular',
    lastName: 'Employee',
    role: UserRole.EMPLOYEE,
    department: 'Engineering',
    position: 'Software Developer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'leave:request',
      'attendance:clock',
    ],
  },
  contractor: {
    id: 'test-contractor-1',
    email: 'contractor@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Contract',
    lastName: 'Worker',
    role: UserRole.EMPLOYEE, // Using EMPLOYEE role since CONTRACTOR is not defined
    department: 'Engineering',
    position: 'Contract Developer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'timesheet:submit',
    ],
  },
  intern: {
    id: 'test-intern-1',
    email: 'intern@arisehrm.test',
    password: 'Test@1234',
    firstName: 'Summer',
    lastName: 'Intern',
    role: UserRole.INTERN,
    department: 'Engineering',
    position: 'Software Engineering Intern',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    permissions: [
      'attendance:clock',
    ],
  },
};

export const getUserByRole = (role: string): User => {
  const user = Object.values(testUsers).find(user => user.role === role);
  if (!user) throw new Error(`No test user found for role: ${role}`);
  return { ...user }; // Return a copy to prevent modification of the original
};

export const getUserByEmail = (email: string): User => {
  const user = Object.values(testUsers).find(user => user.email === email);
  if (!user) throw new Error(`No test user found with email: ${email}`);
  return { ...user }; // Return a copy to prevent modification of the original
};
