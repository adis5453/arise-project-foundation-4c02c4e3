// ========================================
// ARISE HRM COMPONENT LIBRARY EXPORTS
// ========================================

// Layout Components
import { MainLayout } from './layout/MainLayout'
export { MainLayout }

// Dashboard Components
import CustomizableDashboard from './dashboard/CustomizableDashboard'
import { DashboardCustomizer } from './dashboard/DashboardCustomizer'
import { AnimatedStats } from './dashboard/AnimatedStats'
// import { DashboardPreferencesContext } from './dashboard/DashboardPreferencesContext'
export { CustomizableDashboard, DashboardCustomizer, AnimatedStats }

// Employee Components
// import { AdvancedEmployeeDirectory } from './employees/AdvancedEmployeeDirectory'
import EmployeeManagement from './employees/EmployeeManagement'
import EmployeeCards from './employees/EmployeeCards'
// import { EmployeeDirectory } from './employees/EmployeeDirectory'
export { EmployeeManagement, EmployeeCards }

// Attendance Components
import { SmartAttendance } from './attendance/SmartAttendance'
export { SmartAttendance }

// Leave Management Components
import { LeaveManagementDashboard } from './leave/LeaveManagementDashboard'
import { LeaveBalanceTracker } from './leave/LeaveBalanceTracker'
import { TeamLeaveCalendar } from './leave/TeamLeaveCalendar'
import { LeaveAnalytics } from './leave/LeaveAnalytics'
import { LeaveRequestForm } from './leave/LeaveRequestForm'
export {
  LeaveManagementDashboard,
  LeaveBalanceTracker,
  TeamLeaveCalendar,
  LeaveAnalytics,
  LeaveRequestForm
}

// Payroll Components
import { PayrollDashboard } from './payroll/PayrollDashboard'
export { PayrollDashboard }

// Performance Components
import { PerformanceReviewDashboard } from './performance/PerformanceReviewDashboard'
export { PerformanceReviewDashboard }

// Recruitment Components
import { RecruitmentDashboard } from './recruitment/RecruitmentDashboard'
export { RecruitmentDashboard }

// Training Components
// import { TrainingDashboard } from './training/TrainingDashboard'

// Onboarding Components
import OnboardingDashboard from './onboarding/OnboardingDashboard'
export { OnboardingDashboard }

// Benefits Components
import BenefitsManagement from './benefits/BenefitsManagement'
export { BenefitsManagement }

// Document Components
import DocumentManagement from './documents/DocumentManagement'
export { DocumentManagement }

// Organization Components
import { OrganizationChart } from './organization/OrganizationChart'
export { OrganizationChart }

// Self Service Components
import { EmployeeSelfService } from './selfservice/EmployeeSelfService'
export { EmployeeSelfService }

// Analytics Components
import { AdvancedAnalyticsDashboard } from './analytics/AdvancedAnalyticsDashboard'
export { AdvancedAnalyticsDashboard }

// Settings Components
import SettingsDashboard from './settings/SettingsDashboard'
export { SettingsDashboard }

// Admin Components
import DatabaseAdminPanel from './admin/DatabaseAdminPanel'
import UserManagement from './admin/UserManagement'
export { DatabaseAdminPanel, UserManagement }

// Auth Components
import { AuthGuard } from './auth/AuthGuard'
import UnifiedLoginPage from './auth/UnifiedLoginPage'
import { PasswordStrengthMeter } from './auth/PasswordStrengthMeter'
import { PermissionGuard } from './auth/PermissionGuard'
export { AuthGuard, UnifiedLoginPage, PasswordStrengthMeter, PermissionGuard }

// Common Components
import MetricCard from './common/MetricCard'
import StatusChip from './common/StatusChip'
import CountUp from './common/CountUp'
import NumberTicker from './common/NumberTicker'
import ErrorBoundary from './common/ErrorBoundary'
import { AnimatedNotifications } from './common/AnimatedNotifications'
// import { ResponsiveComponents } from './common/ResponsiveComponents'
import { ResponsiveContainer } from './common/ResponsiveContainer'
import { ResponsiveDialog } from './common/ResponsiveDialog'
import { ResponsiveTable } from './common/ResponsiveTable'
import { ThemeToggle } from './common/ThemeToggle'

export {
  MetricCard,
  StatusChip,
  CountUp,
  NumberTicker,
  ErrorBoundary,
  AnimatedNotifications,
  ResponsiveContainer,
  ResponsiveDialog,
  ResponsiveTable,
  ThemeToggle
}

// Export specific components from ResponsiveComponents file if needed, or let them be imported directly
export * from './common/ResponsiveComponents'

// Types
export type * from './common/types'

// Component Groups for Easier Imports
export const DashboardComponents = {
  CustomizableDashboard,
  DashboardCustomizer,
  AnimatedStats,
}

export const EmployeeComponents = {
  EmployeeManagement,
  EmployeeCards,
}

export const AttendanceComponents = {
  SmartAttendance,
}

export const LeaveComponents = {
  LeaveManagementDashboard,
  LeaveBalanceTracker,
  TeamLeaveCalendar,
  LeaveAnalytics,
  LeaveRequestForm,
}

export const CommonComponents = {
  MetricCard,
  StatusChip,
  CountUp,
  NumberTicker,
  ErrorBoundary,
  AnimatedNotifications,
  // ResponsiveComponents, // Removed as it's not a single component
  ResponsiveContainer,
  ResponsiveDialog,
  ResponsiveTable,
  ThemeToggle,
}

export const AuthComponents = {
  AuthGuard,
  UnifiedLoginPage,
  PasswordStrengthMeter,
  PermissionGuard,
}

export const AdminComponents = {
  DatabaseAdminPanel,
  UserManagement,
  SettingsDashboard,
}

// Default export for convenience
export default {
  Dashboard: DashboardComponents,
  Employee: EmployeeComponents,
  Attendance: AttendanceComponents,
  Leave: LeaveComponents,
  Common: CommonComponents,
  Auth: AuthComponents,
  Admin: AdminComponents,
}
