import React, { ReactNode, useEffect, forwardRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface SimpleAuthGuardProps {
  children: ReactNode
}

export const SimpleAuthGuard = forwardRef<HTMLDivElement, SimpleAuthGuardProps>(({ children }, ref) => {
  const { isAuthenticated, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Fix navigation loop by using useEffect
  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      // Preserve the originally requested URL so login can send the user back.
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [isAuthenticated, loading, user, navigate, location])

  // No global loading UI (per request). Render nothing while auth resolves.
  if (loading) {
    return <div ref={ref} />
  }

  // Don't render anything during redirect
  if (!isAuthenticated || !user) {
    return <div ref={ref} />
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
