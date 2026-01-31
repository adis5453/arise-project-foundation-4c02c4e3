// Main login selector
export {default as RoleBasedLoginSelector} from './RoleBasedLoginSelector';

// Role-specific login pages
export {default as EmployeeLogin} from './EmployeeLogin';
export {default as TeamLeaderLogin} from './TeamLeaderLogin';
export {default as HRManagerLogin} from './HRManagerLogin';
export {default as DepartmentManagerLogin} from './DepartmentManagerLogin';
export {default as AdminLogin} from './AdminLogin';
export {default as SuperAdminLogin} from './SuperAdminLogin';

// Other auth components
export {LoginPage} from './LoginPage';
export {default as LoginPageSimple} from './LoginPageSimple';
export {default as PasswordChangeDialog} from './PasswordChangeDialog';
export {AuthGuard} from './AuthGuard';
export {default as ProtectedRoute} from './ProtectedRoute';
export {default as RoleGuard} from './RoleGuard';
export {default as PermissionGuard} from './PermissionGuard';
export {default as SimpleAuthGuard} from './SimpleAuthGuard';
