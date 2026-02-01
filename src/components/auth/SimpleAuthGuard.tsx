import React, { ReactNode, useEffect, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

interface SimpleAuthGuardProps {
  children: ReactNode
}

export const SimpleAuthGuard = forwardRef<HTMLDivElement, SimpleAuthGuardProps>(({ children }, ref) => {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()

  // Fix navigation loop by using useEffect
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, loading, user, navigate])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        ref={ref}
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Authenticating...
        </Typography>
      </Box>
    )
  }

  // Don't render anything during redirect
  if (!isAuthenticated || !user) {
    return (
      <Box
        ref={ref}
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Redirecting to login...
        </Typography>
      </Box>
    )
  }

  // ✅ FIXED: Render children if authenticated (profile fallback ensures profile exists)
  return (
    <div ref={ref}>
      {children}
    </div>
  )
})

SimpleAuthGuard.displayName = 'SimpleAuthGuard'

export default SimpleAuthGuard
