import { api } from '../lib/api'
import { toast } from 'sonner'

interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'error'
  backend: {
    connected: boolean
    authenticated: boolean
    message: string
  }
  environment: {
    hasUrl: boolean
    message: string
  }
  recommendations: string[]
}

/**
 * Comprehensive health check for backend connectivity
 */
export async function performConnectionHealthCheck(): Promise<HealthCheckResult> {

  const result: HealthCheckResult = {
    overall: 'healthy',
    backend: {
      connected: false,
      authenticated: false,
      message: ''
    },
    environment: {
      hasUrl: false,
      message: ''
    },
    recommendations: []
  }

  // Check environment variables
  const apiUrl = import.meta.env.VITE_API_URL

  result.environment.hasUrl = !!apiUrl

  if (!apiUrl) {
    result.overall = 'error'
    result.environment.message = 'Missing VITE_API_URL environment variable'
    result.recommendations.push('Check your .env file for VITE_API_URL')
    return result
  } else {
    result.environment.message = 'Environment variables configured correctly'
  }

  // Check backend health
  try {
    const health = await fetch(`${apiUrl}/health`).then(res => res.ok).catch(() => false)

    if (health) {
      result.backend.connected = true
      result.backend.message = 'Backend API connected'
    } else {
      result.backend.connected = false
      result.backend.message = 'Backend API unreachable'
      result.overall = 'error'
      result.recommendations.push('Ensure the backend server is running')
    }
  } catch (error: any) {
    result.backend.connected = false
    result.backend.message = `Connection failed: ${error.message}`
    result.overall = 'error'
  }

  // Check authentication status via API
  try {
    const user = await api.getUser().catch(() => null)
    if (user) {
      result.backend.authenticated = true
    } else {
      result.backend.authenticated = false
      // Only warn if not ignoring auth
    }
  } catch (e) {
    // API client might throw if not auth, which is fine
  }

  return result
}

/**
 * Display user-friendly health check results
 */
export function displayHealthCheckResults(result: HealthCheckResult) {
  const { overall, backend, environment, recommendations } = result

  // Show appropriate toast notifications
  switch (overall) {
    case 'healthy':
      toast.success('System Status: Healthy', {
        description: 'All systems are operational'
      })
      break
    case 'warning':
      toast.info('System Status: Functional', {
        description: 'System is running with limited functionality'
      })
      break
    case 'error':
      toast.error('System Status: Issues Detected', {
        description: 'Some components need attention. Check console for details.'
      })
      break
  }
}

/**
 * Quick status check for display in UI
 */
export async function getQuickConnectionStatus(): Promise<{
  status: 'connected' | 'disconnected'
  message: string
  authenticated: boolean
}> {
  try {
    const user = await api.getUser().catch(() => null)
    const apiUrl = import.meta.env.VITE_API_URL
    const connected = await fetch(`${apiUrl}/health`).then(res => res.ok).catch(() => false)

    if (!connected) {
      return {
        status: 'disconnected',
        message: 'Backend unreachable',
        authenticated: !!user
      }
    }

    return {
      status: 'connected',
      message: 'System fully operational',
      authenticated: !!user
    }
  } catch (error) {
    return {
      status: 'disconnected',
      message: 'Connection check failed',
      authenticated: false
    }
  }
}

export default {
  performConnectionHealthCheck,
  displayHealthCheckResults,
  getQuickConnectionStatus
}
