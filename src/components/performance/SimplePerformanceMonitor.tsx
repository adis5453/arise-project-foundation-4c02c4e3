import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Collapse,
  useTheme,
  alpha
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Memory,
  Speed,
  NetworkCheck,
  ExpandMore,
  ExpandLess,
  Refresh
} from '@mui/icons-material'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  memoryLimit: number
  networkStatus: 'online' | 'offline' | 'slow'
  pageLoadTime: number
  lastUpdate: Date
}

const SimplePerformanceMonitor: React.FC = () => {
  const theme = useTheme()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    memoryLimit: 0,
    networkStatus: 'online',
    pageLoadTime: 0,
    lastUpdate: new Date()
  })
  const [expanded, setExpanded] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(true)

  // Simple FPS monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics(prev => ({ ...prev, fps, lastUpdate: new Date() }))
        frameCount = 0
        lastTime = currentTime
      }
      
      if (isMonitoring) {
        animationId = requestAnimationFrame(measureFPS)
      }
    }

    if (isMonitoring) {
      animationId = requestAnimationFrame(measureFPS)
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isMonitoring])

  // Memory usage monitoring
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          memoryLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        }))
      }
    }

    const interval = setInterval(updateMemoryInfo, 2000)
    updateMemoryInfo()

    return () => clearInterval(interval)
  }, [])

  // Network status monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline'
      setMetrics(prev => ({ ...prev, networkStatus: status }))
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  // Page load time
  useEffect(() => {
    const loadTime = performance.now()
    setMetrics(prev => ({ ...prev, pageLoadTime: Math.round(loadTime) }))
  }, [])

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'success'
    if (fps >= 30) return 'warning'
    return 'error'
  }

  const getMemoryColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100
    if (percentage < 70) return 'success'
    if (percentage < 90) return 'warning'
    return 'error'
  }

  const getNetworkColor = (status: string) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'error'
      case 'slow': return 'warning'
      default: return 'info'
    }
  }

  const handleRefresh = () => {
    setMetrics(prev => ({ ...prev, lastUpdate: new Date() }))
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  return (
    <Card 
      sx={{ 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 2
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600} color="primary">
            Performance Monitor
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={handleRefresh}>
              <Refresh fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={toggleExpanded}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </Stack>

        {/* Quick Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <Speed fontSize="small" color={getFPSColor(metrics.fps) as any} />
              <Typography variant="h6" fontWeight={600}>
                {metrics.fps}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              FPS
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <Memory fontSize="small" color={getMemoryColor(metrics.memoryUsage, metrics.memoryLimit) as any} />
              <Typography variant="h6" fontWeight={600}>
                {metrics.memoryUsage}MB
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Memory
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <NetworkCheck fontSize="small" color={getNetworkColor(metrics.networkStatus) as any} />
              <Typography variant="h6" fontWeight={600}>
                {metrics.networkStatus === 'online' ? 'ON' : 'OFF'}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Network
            </Typography>
          </Box>
        </Stack>

        {/* Memory Usage Bar */}
        {metrics.memoryLimit > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Memory Usage
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round((metrics.memoryUsage / metrics.memoryLimit) * 100)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(metrics.memoryUsage / metrics.memoryLimit) * 100}
              color={getMemoryColor(metrics.memoryUsage, metrics.memoryLimit) as any}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Stack spacing={2} sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Page Load Time
              </Typography>
              <Chip 
                label={`${metrics.pageLoadTime}ms`} 
                size="small" 
                color={metrics.pageLoadTime < 1000 ? 'success' : 'warning'}
              />
            </Stack>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Last Update
              </Typography>
              <Typography variant="body2" color="text.primary">
                {metrics.lastUpdate.toLocaleTimeString()}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={isMonitoring ? 'Monitoring' : 'Paused'} 
                size="small" 
                color={isMonitoring ? 'success' : 'default'}
              />
            </Stack>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default SimplePerformanceMonitor
