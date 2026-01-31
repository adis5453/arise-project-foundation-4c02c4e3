import { useContext, useMemo } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { PERMISSIONS, ROLES, canUserAccess, getUserAccessLevel } from '../types/permissions'
import type { ResourceType, ActionType, AccessLevel } from '../types/permissions'

export const usePermissions = () => {
  const { profile, user } = useContext(AuthContext)

  const userPermissions = useMemo(() => {
    if (!profile?.role) return []

    const role = ROLES[profile.role.name]
    if (!role) return []

    return role.permissions
  }, [profile?.role])

  const hasPermission = (permission: string): boolean => {
    return canUserAccess(userPermissions, permission, profile?.role)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const canAccess = (resource: ResourceType, action: ActionType): boolean => {
    const permission = `${resource}.${action}`
    return hasPermission(permission)
  }

  const getAccessLevel = (resource: ResourceType): AccessLevel => {
    return getUserAccessLevel(userPermissions, resource)
  }

  const canManage = (resource: ResourceType): boolean => {
    return hasPermission(`${resource}.manage`) || hasPermission('system.admin')
  }

  const canView = (resource: ResourceType, scope: 'own' | 'team' | 'department' | 'all' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission(`${resource}.view_all`)
      case 'department':
        return hasPermission(`${resource}.view_department`) || hasPermission(`${resource}.view_all`)
      case 'team':
        return hasPermission(`${resource}.view_team`) || hasPermission(`${resource}.view_department`) || hasPermission(`${resource}.view_all`)
      case 'own':
      default:
        return hasPermission(`${resource}.view_own`) || hasPermission(`${resource}.view_team`) || hasPermission(`${resource}.view_department`) || hasPermission(`${resource}.view_all`)
    }
  }

  const canEdit = (resource: ResourceType, scope: 'own' | 'team' | 'department' | 'all' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission(`${resource}.edit_all`)
      case 'department':
        return hasPermission(`${resource}.edit_department`) || hasPermission(`${resource}.edit_all`)
      case 'team':
        return hasPermission(`${resource}.edit_team`) || hasPermission(`${resource}.edit_department`) || hasPermission(`${resource}.edit_all`)
      case 'own':
      default:
        return hasPermission(`${resource}.edit_own`) || hasPermission(`${resource}.edit_team`) || hasPermission(`${resource}.edit_department`) || hasPermission(`${resource}.edit_all`)
    }
  }

  const canDelete = (resource: ResourceType, scope: 'own' | 'team' | 'department' | 'all' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission(`${resource}.delete_all`)
      case 'department':
        return hasPermission(`${resource}.delete_department`) || hasPermission(`${resource}.delete_all`)
      case 'team':
        return hasPermission(`${resource}.delete_team`) || hasPermission(`${resource}.delete_department`) || hasPermission(`${resource}.delete_all`)
      case 'own':
      default:
        return hasPermission(`${resource}.delete_own`) || hasPermission(`${resource}.delete_team`) || hasPermission(`${resource}.delete_department`) || hasPermission(`${resource}.delete_all`)
    }
  }

  const canApprove = (resource: ResourceType, scope: 'team' | 'department' | 'all' = 'team'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission(`${resource}.approve_all`)
      case 'department':
        return hasPermission(`${resource}.approve_department`) || hasPermission(`${resource}.approve_all`)
      case 'team':
      default:
        return hasPermission(`${resource}.approve_team`) || hasPermission(`${resource}.approve_department`) || hasPermission(`${resource}.approve_all`)
    }
  }

  const isAdmin = (): boolean => {
    return hasPermission('system.admin') || profile?.role?.name === 'super_admin' || profile?.role?.name === 'admin'
  }

  const isHR = (): boolean => {
    return profile?.role?.name === 'hr_manager' || isAdmin()
  }

  const isManager = (): boolean => {
    return profile?.role?.name === 'department_manager' || profile?.role?.name === 'team_lead' || isHR()
  }

  const canAccessModule = (module: string): boolean => {
    switch (module) {
      case 'admin':
        return isAdmin()
      case 'hr':
        return isHR()
      case 'manager':
        return isManager()
      case 'reports':
        return hasAnyPermission(['reports.view_all', 'reports.view_department', 'analytics.advanced'])
      case 'payroll':
        return hasAnyPermission(['payroll.view_all', 'payroll.process', 'payroll.approve'])
      case 'performance':
        return hasAnyPermission(['performance.view_all', 'performance.view_team', 'performance.review_team'])
      default:
        return true
    }
  }

  const getRoleLevel = (): number => {
    return profile?.role?.level || 0
  }

  const getRoleName = (): string => {
    return profile?.role?.display_name || profile?.role?.name || 'Employee'
  }

  const getRoleColor = (): string => {
    return profile?.role?.color_code || '#6B7280'
  }

  return {
    // Core permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    getAccessLevel,

    // Convenience methods
    canManage,
    canView,
    canEdit,
    canDelete,
    canApprove,

    // Role checks
    isAdmin,
    isHR,
    isManager,
    canAccessModule,

    // Role info
    getRoleLevel,
    getRoleName,
    getRoleColor,

    // Raw data
    userPermissions,
    role: profile?.role,
    profile
  }
}

export default usePermissions
