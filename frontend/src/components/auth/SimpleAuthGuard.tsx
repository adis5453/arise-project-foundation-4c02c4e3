import React, { ReactNode, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

interface SimpleAuthGuardProps {
  children: ReactNode
}

export const SimpleAuthGuard: React.FC<SimpleAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Fix navigation loop by using useEffect
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isAuthenticated, loading, user, navigate, location])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
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
  return <>{children}</>
}

export default SimpleAuthGuard

