import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Alert, AlertTitle } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRole?: string
  fallbackPath?: string
  requireAny?: boolean // If true, user needs ANY of the permissions. If false, user needs ALL permissions
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackPath = '/login',
  requireAny = false
}) => {
  const { user, profile, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const location = useLocation()

  // Show loading while auth is being determined
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={40} />
      </Box>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role requirement
  if (requiredRole && profile.role?.name !== requiredRole) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          You don't have the required role ({requiredRole}) to access this page.
        </Alert>
      </Box>
    )
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAny 
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions)

    if (!hasAccess) {
      return (
        <Box p={3}>
          <Alert severity="error">
            <AlertTitle>Access Denied</AlertTitle>
            You don't have the required permissions to access this page.
          </Alert>
        </Box>
      )
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>
}

export default ProtectedRoute
