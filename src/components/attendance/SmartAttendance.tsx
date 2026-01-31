'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as buttonHandlers from '../../utils/buttonHandlers'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
} from '@mui/material'
import {
  AccessTime,
  LocationOn,
  PhotoCamera,
  CheckCircle,
  Cancel,
  Schedule,
  History,
  Refresh,
  Settings,
  Warning,
  Login,
  Logout,
  Coffee,
  Work,
  DirectionsWalk,
  MyLocation,
  GpsFixed,
  GpsNotFixed,
  SignalWifi4Bar,
  SignalWifiOff,
  BatteryFull,
  Analytics,
  TrendingUp,
  PlayArrow,
  VerifiedUser,
  Verified,
} from '@mui/icons-material'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import StatusChip from '../common/StatusChip'
import MetricCard from '../common/MetricCard'
import { semantic, designTokens, gradients } from '../../styles/Theme/tokens'
import { useResponsive } from '../../hooks/useResponsive'

// Types
interface AttendanceSession {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  breakStart: string | null
  breakEnd: string | null
  totalHours: number | null
  status: 'present' | 'absent' | 'late' | 'half_day'
  location: {
    latitude: number
    longitude: number
    address: string
    accuracy: number
  } | null
  deviceInfo: {
    userAgent: string
    platform: string
    isMobile: boolean
    batteryLevel: number
    networkType: string
  }
  photos: string[]
  notes: string
  isVerified: boolean
}

interface GeolocationData {
  latitude: number
  longitude: number
  accuracy: number
  address?: string
}

interface DeviceInfo {
  userAgent: string
  platform: string
  isMobile: boolean
  batteryLevel: number
  networkType: string
  isOnline: boolean
}

type AttendanceAction = 'check_in' | 'check_out' | 'break_start' | 'break_end'
type VerificationMethod = 'location' | 'photo'

export function SmartAttendance() {
  const { profile, user } = useAuth()
  const theme = useTheme()

  // State management
  const [currentSession, setCurrentSession] = useState<AttendanceSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [location, setLocation] = useState<GeolocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isTracking, setIsTracking] = useState(false)
  const [workTimer, setWorkTimer] = useState(0)
  const [showVerification, setShowVerification] = useState(false)
  const [pendingAction, setPendingAction] = useState<AttendanceAction | null>(null)
  const [verificationMethods] = useState<VerificationMethod[]>(['location', 'photo'])
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceSession[]>([])
  const [todayStats] = useState({
    expectedHours: 8,
    workedHours: 0,
    breakTime: 0,
    overtime: 0,
    productivity: 95,
    efficiency: 88
  })

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Initialize device info and location
  useEffect(() => {
    initializeDeviceInfo()
    getCurrentLocation()
    loadTodaySession()
    loadAttendanceHistory()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Work timer effect
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        if (currentSession?.checkIn && !currentSession.checkOut) {
          const checkInTime = new Date(currentSession.checkIn).getTime()
          const now = new Date().getTime()
          const elapsed = Math.floor((now - checkInTime) / 1000)
          setWorkTimer(elapsed)
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTracking, currentSession])

  // Initialize device information
  const initializeDeviceInfo = useCallback(async () => {
    const deviceData: DeviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      batteryLevel: 100,
      networkType: (navigator as any).connection?.effectiveType || 'unknown',
      isOnline: navigator.onLine
    }

    // Get battery info if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        deviceData.batteryLevel = Math.round(battery.level * 100)
      } catch (error) {
      }
    }

    setDeviceInfo(deviceData)
  }, [])

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords

        try {
          // Reverse geocoding to get address (mock implementation)
          const address = await reverseGeocode(latitude, longitude)

          setLocation({
            latitude,
            longitude,
            accuracy,
            address
          })
          setLocationError(null)
        } catch (error) {
          setLocation({
            latitude,
            longitude,
            accuracy
          })
        }

        setIsLoading(false)
      },
      (error) => {
        setLocationError(error.message)
        setIsLoading(false)
      },
      options
    )
  }, [])

  // Mock reverse geocoding
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // In a real app, you'd use a geocoding service like Google Maps API
    return `${lat.toFixed(4)}, ${lng.toFixed(4)} (Office Location)`
  }

  // Load today's session
  const loadTodaySession = useCallback(async () => {
    try {
      // Access employee_id safely
      const employeeId = (user as any)?.employee_id || user?.id
      if (!user || !employeeId) return

      const today = new Date().toISOString().split('T')[0]
      const response = await api.getAttendance({
        employeeId: employeeId,
        date: today
      })

      const records = response as any[]
      if (records.length > 0) {
        const record = records[0]
        setCurrentSession({
          id: record.id,
          date: record.date,
          checkIn: record.check_in_time,
          checkOut: record.check_out_time,
          breakStart: record.break_start_time, // Assuming these fields exist or are null
          breakEnd: record.break_end_time,
          totalHours: record.total_hours,
          status: record.status || 'present',
          location: record.location_data || {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            address: ''
          }, // Assuming backend stores JSON or similar
          deviceInfo: deviceInfo!, // Keep current device info for new actions
          photos: record.photos || [],
          notes: record.notes || '',
          isVerified: record.is_verified || false
        })
      } else {
        // No session exists yet for today
        setCurrentSession({
          id: 'new',
          date: today,
          checkIn: null,
          checkOut: null,
          breakStart: null,
          breakEnd: null,
          totalHours: null,
          status: 'present',
          location: null,
          deviceInfo: deviceInfo!,
          photos: [],
          notes: '',
          isVerified: false
        })
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }, [user, deviceInfo])

  // Load attendance history
  const loadAttendanceHistory = useCallback(async () => {
    try {
      const employeeId = (user as any)?.employee_id || user?.id
      if (!user || !employeeId) return

      // Fetch last 30 days
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const response = await api.getAttendance({
        employeeId: employeeId,
        startDate,
        endDate
      })

      const records = response as any[]
      const history = records.map(record => ({
        id: record.id,
        date: record.date,
        checkIn: record.check_in_time,
        checkOut: record.check_out_time,
        breakStart: record.break_start_time,
        breakEnd: record.break_end_time,
        totalHours: record.total_hours,
        status: record.status as any,
        location: record.location_data,
        deviceInfo: deviceInfo!, // Placeholder as history might not save full device info
        photos: record.photos || [],
        notes: record.notes || '',
        isVerified: record.is_verified
      }))

      setAttendanceHistory(history)
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }, [user, deviceInfo])

  // Handle attendance action
  const handleAttendanceAction = useCallback(async (action: AttendanceAction) => {
    const employeeId = (user as any)?.employee_id
    if (!user || !employeeId) {
      console.error("User not identified")
      toast.error("User session invalid. Please log in again.")
      return
    }
    setPendingAction(action)

    // Check if verification is required
    if (verificationMethods.length > 0) {
      setShowVerification(true)
      return
    }

    await processAttendanceAction(action)
  }, [verificationMethods])

  // Process attendance action
  const processAttendanceAction = useCallback(async (action: AttendanceAction) => {
    // if (!deviceInfo) return // Relaxed strict check to allow basic action even if device info partial
    const employeeId = (user as any)?.employee_id || user?.id

    if (!employeeId) {
      console.error('No employee ID found');
      return;
    }

    setIsLoading(true)

    try {
      let response;
      const locationData = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || ''
      } : null

      switch (action) {
        case 'check_in':
          response = await api.clockIn({
            ...(locationData || {}),
            clock_in_type: 'regular',
            photo: photoUrl || null // Use captured photo if any
          });
          setIsTracking(true)
          break

        case 'check_out':
          response = await api.clockOut({
            ...(locationData || {})
          });
          setIsTracking(false)
          break

        case 'break_start':
          response = await api.toggleBreak('start', employeeId);
          break

        case 'break_end':
          response = await api.toggleBreak('end', employeeId);
          break
      }

      // Refresh session
      await loadTodaySession();
      setShowVerification(false)
      setPendingAction(null)
      setPhotoUrl(null); // Clear photo

      // We could show success toast here if toast was imported
      // console.log("Attendance success:", response);

    } catch (error: any) {
      console.error('Attendance Action Failed:', error);
      setLocationError(error.message || 'Action failed');
    } finally {
      setIsLoading(false)
    }
  }, [currentSession, deviceInfo, location, photoUrl, user, loadTodaySession])

  // Capture photo verification
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          resolve(url)
        }
      }, 'image/jpeg', 0.8)
    })
  }, [])

  // Start camera for photo verification
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setShowCamera(true)
    } catch (error) {
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }, [])

  // Format time duration
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Get current status
  const getCurrentStatus = useCallback((): {
    status: string
    color: 'success' | 'warning' | 'error' | 'info'
    icon: React.ReactElement
  } => {
    if (!currentSession) {
      return { status: 'Not Started', color: 'info', icon: <Schedule /> }
    }

    if (currentSession.checkIn && !currentSession.checkOut) {
      if (currentSession.breakStart && !currentSession.breakEnd) {
        return { status: 'On Break', color: 'warning', icon: <Coffee /> }
      }
      return { status: 'Working', color: 'success', icon: <Work /> }
    }

    if (currentSession.checkOut) {
      return { status: 'Completed', color: 'info', icon: <CheckCircle /> }
    }

    return { status: 'Ready to Start', color: 'info', icon: <PlayArrow /> }
  }, [currentSession])

  const status = getCurrentStatus()

  // Check if action is available
  const isActionAvailable = useCallback((action: AttendanceAction): boolean => {
    if (!currentSession) return false

    switch (action) {
      case 'check_in':
        return !currentSession.checkIn
      case 'check_out':
        return !!currentSession.checkIn && !currentSession.checkOut
      case 'break_start':
        return !!currentSession.checkIn && !currentSession.checkOut && !currentSession.breakStart
      case 'break_end':
        return !!currentSession.breakStart && !currentSession.breakEnd
      default:
        return false
    }
  }, [currentSession])

  // Action button configurations
  const actionButtons = [
    {
      action: 'check_in' as AttendanceAction,
      label: 'Check In',
      icon: <Login />,
      color: 'success' as const,
      gradient: gradients.success
    },
    {
      action: 'check_out' as AttendanceAction,
      label: 'Check Out',
      icon: <Logout />,
      color: 'error' as const,
      gradient: gradients.error
    },
    {
      action: 'break_start' as AttendanceAction,
      label: 'Start Break',
      icon: <Coffee />,
      color: 'warning' as const,
      gradient: gradients.warning
    },
    {
      action: 'break_end' as AttendanceAction,
      label: 'End Break',
      icon: <DirectionsWalk />,
      color: 'info' as const,
      gradient: gradients.info
    }
  ]

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`,
      pb: { xs: 8, md: 4 }
    }}>
      {/* Mobile Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          background: gradients.brandPrimary,
          color: theme.palette.primary.contrastText,
          borderRadius: 0
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={profile?.profile_photo_url}
            sx={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.3)' }}
          >
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {profile?.first_name} {profile?.last_name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {profile?.role?.display_name} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
          <Stack alignItems="flex-end" spacing={0.5}>
            <Chip
              label={status.status}
              icon={status.icon as any}
              size="small"
              sx={{
                backgroundColor: alpha(theme.palette.common.white, 0.2),
                color: theme.palette.common.white,
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
            {deviceInfo && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Network Status">
                  {deviceInfo.isOnline ?
                    <SignalWifi4Bar fontSize="small" sx={{ opacity: 0.7 }} /> :
                    <SignalWifiOff fontSize="small" sx={{ opacity: 0.7 }} />
                  }
                </Tooltip>
                <Tooltip title={`Battery: ${deviceInfo.batteryLevel}%`}>
                  <BatteryFull sx={{ opacity: 0.7, fontSize: 'small' }} />
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              borderRadius: 4,
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Status Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `linear-gradient(135deg, ${theme.palette[status.color].main}, ${theme.palette[status.color].dark})`,
                        color: theme.palette.common.white
                      }}
                    >
                      {status.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {status.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Stack>

                  <IconButton onClick={() => getCurrentLocation()}>
                    <Refresh />
                  </IconButton>
                </Stack>

                {/* Time Display */}
                {isTracking && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        textAlign: 'center',
                        color: theme.palette.primary.main
                      }}
                    >
                      {formatDuration(workTimer)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                      Hours Worked Today
                    </Typography>
                  </Box>
                )}

                {/* Session Info */}
                {currentSession && (
                  <Stack spacing={2}>
                    {currentSession.checkIn && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Login fontSize="small" color="success" />
                          <Typography variant="body2">Check In</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {new Date(currentSession.checkIn).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    )}

                    {currentSession.breakStart && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Coffee fontSize="small" color="warning" />
                          <Typography variant="body2">Break Started</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {new Date(currentSession.breakStart).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    )}

                    {currentSession.checkOut && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Logout fontSize="small" color="error" />
                          <Typography variant="body2">Check Out</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {new Date(currentSession.checkOut).toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                )}

                {/* Location Info */}
                {location && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOn fontSize="small" color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                    </Typography>
                    <Chip
                      label={`±${location.accuracy}m`}
                      size="small"
                      variant="outlined"
                      color={location.accuracy < 20 ? 'success' : location.accuracy < 50 ? 'warning' : 'error'}
                    />
                  </Stack>
                )}

                {locationError && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      Location access required for attendance tracking. {locationError}
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {actionButtons.map((button, index) => (
            <Grid key={button.action} size={{ xs: 6, sm: 3 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={button.icon}
                  disabled={!isActionAvailable(button.action) || isLoading}
                  onClick={() => handleAttendanceAction(button.action)}
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    background: isActionAvailable(button.action) ? button.gradient : undefined,
                    color: theme.palette.common.white,
                    flexDirection: 'column',
                    gap: 1,
                    height: 80,
                    '&:disabled': {
                      backgroundColor: alpha(theme.palette.action.disabled, 0.1),
                      color: theme.palette.action.disabled
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ textTransform: 'none' }}>
                    {button.label}
                  </Typography>
                </Button>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Today's Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Expected"
              value={`${todayStats.expectedHours}h`}
              icon={<Schedule />}
              color="info"
              size="sm"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Worked"
              value={`${todayStats.workedHours.toFixed(1)}h`}
              icon={<Work />}
              color="primary"
              size="sm"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Break Time"
              value={`${todayStats.breakTime}m`}
              icon={<Coffee />}
              color="warning"
              size="sm"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <MetricCard
              title="Efficiency"
              value={`${todayStats.efficiency}%`}
              icon={<TrendingUp />}
              color="success"
              size="sm"
            />
          </Grid>
        </Grid>

        {/* Recent Attendance History */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Attendance
              </Typography>
              <Button variant="outlined" size="small" startIcon={<History />}>
                View All
              </Button>
            </Stack>

            <Stack spacing={2}>
              {attendanceHistory.slice(0, 3).map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        borderColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: session.status === 'present' ? theme.palette.success.main :
                              session.status === 'late' ? theme.palette.warning.main :
                                theme.palette.error.main
                          }}
                        >
                          {session.status === 'present' ? <CheckCircle /> :
                            session.status === 'late' ? <AccessTime /> :
                              <Cancel />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {session.checkIn && session.checkOut ?
                              `${new Date(session.checkIn).toLocaleTimeString()} - ${new Date(session.checkOut).toLocaleTimeString()}` :
                              'Incomplete'
                            }
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack alignItems="flex-end" spacing={0.5}>
                        <StatusChip status={session.status as any} size="sm" />
                        {session.totalHours && (
                          <Typography variant="caption" color="text.secondary">
                            {session.totalHours.toFixed(1)}h
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Verification Dialog */}
      <Dialog
        open={showVerification}
        onClose={() => setShowVerification(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <VerifiedUser color="primary" />
            <Typography variant="h6">
              Verify Your Identity
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please complete the verification steps to {pendingAction?.replace('_', ' ')}.
          </Typography>

          <Stepper orientation="vertical">
            {verificationMethods.includes('location') && (
              <Step active>
                <StepLabel>Location Verification</StepLabel>
                <StepContent>
                  {location ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GpsFixed color="success" />
                      <Typography variant="body2">
                        Location verified ±{location.accuracy}m
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GpsNotFixed color="warning" />
                      <Typography variant="body2">
                        Getting location...
                      </Typography>
                    </Stack>
                  )}
                </StepContent>
              </Step>
            )}

            {verificationMethods.includes('photo') && (
              <Step active>
                <StepLabel>Photo Verification</StepLabel>
                <StepContent>
                  {!showCamera ? (
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={startCamera}
                    >
                      Take Photo
                    </Button>
                  ) : (
                    <Stack spacing={2}>
                      <Box
                        sx={{
                          position: 'relative',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: theme.palette.background.default
                        }}
                      >
                        <video
                          ref={videoRef}
                          style={{ width: '100%', height: 'auto' }}
                        />
                        <canvas
                          ref={canvasRef}
                          style={{ display: 'none' }}
                        />
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          startIcon={<PhotoCamera />}
                          onClick={async () => {
                            const photo = await capturePhoto()
                            if (photo) {
                              setPhotoUrl(photo)
                              stopCamera()
                            }
                          }}
                        >
                          Capture
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={stopCamera}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  )}

                  {photoUrl && (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <Verified color="success" />
                      <Typography variant="body2">
                        Photo captured successfully
                      </Typography>
                    </Stack>
                  )}
                </StepContent>
              </Step>
            )}
          </Stepper>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowVerification(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!location || (verificationMethods.includes('photo') && !photoUrl)}
            onClick={() => pendingAction && processAttendanceAction(pendingAction)}
          >
            Complete {pendingAction?.replace('_', ' ')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'fixed', bottom: { xs: 80, md: 24 }, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Analytics />}
          tooltipTitle="View Analytics"
        />
        <SpeedDialAction
          icon={<History />}
          tooltipTitle="Attendance History"
        />
        <SpeedDialAction
          icon={<Settings />}
          tooltipTitle="Settings"
        />
      </SpeedDial>

      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.common.black, 0.5),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal + 1
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography variant="body2">
              Processing attendance...
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  )
}

export default SmartAttendance;
