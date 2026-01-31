import React from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import { usePermissions } from '../../hooks/usePermissions'

interface RoleGuardProps {
  children: React.ReactNode
  permissions?: string[]
  roles?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  hideOnNoAccess?: boolean
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback,
  hideOnNoAccess = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, profile } = usePermissions()

  // Check role requirements
  const hasRequiredRole = roles.length === 0 || roles.includes(profile?.role?.name || '')

  // Check permission requirements
  let hasRequiredPermissions = true
  if (permissions.length > 0) {
    hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  const hasAccess = hasRequiredRole && hasRequiredPermissions

  if (!hasAccess) {
    if (hideOnNoAccess) {
      return null
    }

    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <Box p={2}>
        <Alert severity="warning">
          <AlertTitle>Insufficient Permissions</AlertTitle>
          You don't have access to this content.
        </Alert>
      </Box>
    )
  }

  return <>{children}</>
}

export default RoleGuard
