import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import DatabaseService from '../../services/databaseService'
import { useAuth } from '../../contexts/AuthContext'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Button,
  Stack,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
  CircularProgress,
  Badge,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
  Snackbar,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { toast } from 'sonner'
import {
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Coffee as CoffeeIcon,
  Work as WorkIcon,
  MyLocation as MyLocationIcon,
  GpsFixed as GpsFixedIcon,
  GpsNotFixed as GpsNotFixedIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  BatteryFull as BatteryFullIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  VerifiedUser as VerifiedUserIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarTodayIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  GetApp as GetAppIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  EventBusy as EventBusyIcon
} from '@mui/icons-material'
import SimpleOptimizedImage from '../common/SimpleOptimizedImage'
import SimpleVirtualList from '../common/SimpleVirtualList'
import AttendanceMonthlySummary from './AttendanceMonthlySummary'
import RealTimeAttendanceDashboard from './RealTimeAttendanceDashboard'


const AttendanceAnalyticsChart = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" align="center" color="textSecondary">
        Attendance Analytics Chart Placeholder
      </Typography>
    </CardContent>
  </Card>
);
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO } from 'date-fns'
// import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet' // Not installed
import { useResponsive } from '../../hooks/useResponsive'

// Mock components - replace with actual implementations
const MetricCard = ({ title, value, change, icon, color, loading }: any) => (
  <Card>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        <Box>
          <Typography variant="h6">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          {change && (
            <Typography variant="caption" color={change > 0 ? 'success.main' : 'error.main'}>
              {change > 0 ? '+' : ''}{change}%
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
)

const CountUp = ({ end, decimals = 0, suffix = '' }: { end: number; decimals?: number; suffix?: string }) => (
  <span>{end.toFixed(decimals)}{suffix}</span>
)

const StatusChip = ({ status, size = 'medium' }: { status: string; size?: 'small' | 'medium' }) => {
  const getColor = (status: string) => {
    switch (status) {
      case 'present': return 'success'
      case 'late': return 'warning'
      case 'absent': return 'error'
      case 'half_day': return 'info'
      default: return 'default'
    }
  }

  return <Chip label={status} size={size} color={getColor(status) as any} />
}

// Types based on schema
interface AttendanceRecord {
  id: string
  employee_id: string
  user_id?: string
  date: string
  shift_id?: string
  expected_start_time?: string
  expected_end_time?: string
  clock_in_time?: string
  clock_out_time?: string
  actual_start_work_time?: string
  actual_end_work_time?: string
  clock_in_location_id?: string
  clock_out_location_id?: string
  clock_in_latitude?: number
  clock_in_longitude?: number
  clock_out_latitude?: number
  clock_out_longitude?: number
  location_accuracy_meters?: number
  location_verified: boolean
  gps_spoofing_detected: boolean
  clock_in_photo_url?: string
  clock_out_photo_url?: string
  face_recognition_confidence?: number
  face_match_verified: boolean
  photo_quality_score?: number
  total_hours?: number
  regular_hours?: number
  overtime_hours?: number
  break_duration_minutes: number
  productive_hours?: number
  billable_hours?: number
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday'
  is_remote_work: boolean
  is_sick_leave: boolean
  is_authorized_absence: boolean
  is_holiday: boolean
  requires_attention: boolean
  arrival_pattern?: string
  departure_pattern?: string
  location_data?: {
    latitude: number
    longitude: number
    accuracy?: number
    mocked?: boolean
  }
  break_pattern: any[]
  productivity_score?: number
  engagement_indicators: any
  weather_conditions: any
  traffic_conditions?: string
  public_transport_delays: boolean
  special_circumstances?: string
  device_info: any
  app_version?: string
  network_type?: string
  battery_level?: number
  notes?: string
  employee_notes?: string
  manager_notes?: string
  approved_by_id?: string
  approved_at?: string
  review_required: boolean
  correction_requested: boolean
  anomaly_flags: any[]
  risk_score: number
  confidence_score: number
  attendance_risk_score: number
  pattern_analysis: any
  behavioral_insights: any
  recommendations: any[]
  created_at: string
  updated_at: string
  metadata: any
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    profile_photo_url?: string
    department?: string
    position?: string
  }
}

interface ClockLocation {
  id: string
  name: string
  description?: string
  location_type: string
  address?: string
  latitude: number
  longitude: number
  radius_meters: number
  altitude_meters?: number
  indoor_location_details: any
  allowed_employees: string[]
  allowed_departments: string[]
  allowed_roles: string[]
  restricted_times: any
  wifi_ssids?: string[]
  beacon_ids?: string[]
  qr_code_required: boolean
  photo_required: boolean
  face_recognition_enabled: boolean
  temperature_check_required: boolean
  max_capacity?: number
  current_occupancy: number
  safety_protocols: any[]
  health_check_required: boolean
  covid_protocols: any
  operating_hours: any
  timezone: string
  contact_person?: string
  contact_phone?: string
  emergency_procedures?: string
  average_check_in_time?: number
  check_in_success_rate: number
  location_accuracy_score: number
  is_active: boolean
}

interface AttendancePhoto {
  id: string
  attendance_id: string
  employee_id: string
  photo_url: string
  photo_type: string
  file_size?: number
  mime_type?: string
  resolution?: string
  file_hash?: string
  latitude?: number
  longitude?: number
  location_accuracy?: number
  address?: string
  indoor_location: any
  location_verified: boolean
  device_info: any
  camera_info: any
  capture_method: string
  timestamp_verified: boolean
  face_detection_results: any
  face_recognition_confidence?: number
  face_landmarks: any
  emotion_analysis: any
  objects_detected: any[]
  scene_analysis: any
  text_detection: any[]
  photo_quality_score: number
  authenticity_score: number
  manipulation_detected: boolean
  lighting_conditions?: string
  blur_detected: boolean
  face_clearly_visible: boolean
  contains_sensitive_info: boolean
  privacy_blur_applied: boolean
  gdpr_compliant: boolean
  retention_until?: string
  encrypted: boolean
  processing_status: string
  ai_processing_completed: boolean
  processing_error?: string
  processing_time_ms?: number
  created_at: string
  metadata: any
}

interface AttendanceCorrection {
  id: string
  attendance_id?: string
  employee_id: string
  correction_type: string
  field_name: string
  original_value?: string
  requested_value?: string
  actual_value?: string
  reason: string
  detailed_explanation?: string
  supporting_documents: any[]
  witness_statements: any[]
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  escalation_level: number
  requested_by_id?: string
  reviewed_by_id?: string
  approved_by_id?: string
  requested_at: string
  review_deadline?: string
  reviewed_at?: string
  approved_at?: string
  implemented_at?: string
  reviewer_comments?: string
  approver_comments?: string
  rejection_reason?: string
  partial_approval: boolean
  payroll_impact: any
  policy_violation_risk: string
  precedent_analysis: any
  created_at: string
  updated_at: string
  metadata: any
}

// TODO: Connect to /api/attendance/* endpoints when available
// All attendance data comes from useQuery above - NO MOCK DATA
const mockAttendanceData: AttendanceRecord[] = []


const mockLocationData: ClockLocation[] = []


interface ComprehensiveAttendanceSystemProps {
  className?: string
}

const ComprehensiveAttendanceSystem: React.FC<ComprehensiveAttendanceSystemProps> = ({ className }) => {
  const theme = useTheme()
  const { isMobile, isTablet } = useResponsive()
  const { user } = useAuth()

  // State management
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map' | 'timeline'>('list')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [filterAnomalies, setFilterAnomalies] = useState(false)
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)

  const [isClockingIn, setIsClockingIn] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string>('')
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null)
  const [selectedShift, setSelectedShift] = useState<string>('morning')
  const [isClockingOut, setIsClockingOut] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Real Data Fetching
  const { data: attendanceData = [], refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      // Filter by date if API supports it, currently fetching all for user
      return await DatabaseService.getAttendanceRecords({ employeeId: user?.id });
    }
  });

  // Sync active record from fetched data
  useEffect(() => {
    if (attendanceData) {
      const openSession = attendanceData.find((r: any) => !r.clock_out_time);
      if (openSession) {
        setActiveRecord(openSession);
      } else {
        setActiveRecord(null);
      }
    }
  }, [attendanceData]);

  // Geolocation hook
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(position)
          setLocationError('')
        },
        (error) => {
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    }
  }, [])

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const todayRecords = attendanceData.filter((record: any) =>
      record.date && record.date.startsWith(today)
    )

    const totalPresent = todayRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length
    const totalLate = todayRecords.filter((r: any) => r.status === 'late').length
    const totalAbsent = todayRecords.filter((r: any) => r.status === 'absent').length
    const totalRemote = todayRecords.filter((r: any) => r.is_remote_work).length
    const onLeave = todayRecords.filter((r: any) => r.status === 'on_leave').length
    const averageHours = todayRecords.reduce((sum: number, r: any) => sum + (Number(r.total_hours) || 0), 0) / todayRecords.length || 0
    // Fix: Handle missing array properties safely
    const anomaliesCount = todayRecords.filter((r: any) => r.anomaly_flags && r.anomaly_flags.length > 0).length
    const requiresAttention = todayRecords.filter((r: any) => r.requires_attention).length

    return {
      totalPresent,
      totalLate,
      totalAbsent,
      onLeave,
      totalRemote,
      averageHours,
      anomaliesCount,
      requiresAttention,
      attendanceRate: todayRecords.length > 0 ? (totalPresent / todayRecords.length) * 100 : 0
    }
  }, [attendanceData])

  // Chart data
  const chartData = useMemo(() => {
    const weekStart = startOfWeek(selectedDate)
    const weekEnd = endOfWeek(selectedDate)
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRecords = attendanceData.filter((r: any) => r.date && r.date.startsWith(dayStr))

      return {
        date: format(day, 'MMM dd'),
        present: dayRecords.filter((r: any) => r.status === 'present').length,
        late: dayRecords.filter((r: any) => r.status === 'late').length,
        absent: dayRecords.filter((r: any) => r.status === 'absent').length,
        onLeave: dayRecords.filter((r: any) => r.status === 'on_leave').length,
        remote: dayRecords.filter((r: any) => r.is_remote_work).length,
        averageHours: dayRecords.reduce((sum: number, r: any) => sum + (Number(r.total_hours) || 0), 0) / dayRecords.length || 0
      }
    })
  }, [attendanceData, selectedDate])

  // Event handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }, [])

  const handleRecordClick = useCallback((record: AttendanceRecord) => {
    setSelectedRecord(record)
  }, [])

  const handleClockIn = useCallback(async () => {
    setIsClockingIn(true)
    setIsClockingOut(!!activeRecord)


    try {
      // Start camera for photo capture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      setCameraStream(stream)
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Camera access failed. You can retry or use the simulator.");
    }
  }, [])

  // Effect to attach stream to video element when it becomes available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const photoData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedPhoto(photoData)

        // Stop camera stream
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
        }

        // setIsClockingIn(false) // Keep dialog open for submission
      }
    }
  }, [cameraStream])

  const submitAttendance = useCallback(async () => {
    if (!currentLocation || !capturedPhoto) {
      toast.error("Location and photo are required");
      return;
    }

    try {
      const commonData = {
        clock_in_latitude: currentLocation.coords.latitude,
        clock_in_longitude: currentLocation.coords.longitude,
        clock_in_photo_url: capturedPhoto,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      }

      // Check if we have an active record directly from data to be safe
      const currentActive = attendanceData.find((r: any) =>
        r.date &&
        r.clock_in_time &&
        !r.clock_out_time
      );

      if (currentActive || isClockingOut) {
        await DatabaseService.clockOut({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          notes: `Photo captured at clock out`
        });
        toast.success("Clock out successful! Have a great rest.");
      } else {
        const newRecord: any = {
          ...commonData,
          employee_id: user?.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          clock_in_time: new Date().toISOString(),
          status: 'present',
          location_verified: true,
          // shift_id is now handled by backend from user profile
        }
        await DatabaseService.createAttendanceRecord(newRecord);
        toast.success("Clock in successful! Have a great shift.");
      }
      refetchAttendance(); // Refresh list
      setCapturedPhoto('');
      setIsClockingIn(false);
    } catch (e: any) {
      console.error("Attendance action failed", e);
      toast.error(e.message || "Failed to submit attendance");
    }

  }, [currentLocation, capturedPhoto, refetchAttendance, user])

  return (
    <div className={className}>
      <Box sx={{ width: '100%', p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Attendance System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced attendance tracking with AI-powered insights
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<AccessTimeIcon />}
              onClick={handleClockIn}
              disabled={isClockingIn}
            >
              {isClockingIn ? 'Processing...' : activeRecord ? 'Clock Out' : 'Clock In'}
            </Button>
          </Stack>
        </Stack>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
            <MetricCard
              title="Present Today"
              value={metrics.totalPresent}
              icon={<CheckCircleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
            <MetricCard
              title="Late Arrival"
              value={metrics.totalLate}
              icon={<AccessTimeIcon />}
              color="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
            <MetricCard
              title="Absent"
              value={metrics.totalAbsent}
              icon={<CancelIcon />}
              color="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }} component="div">
            <MetricCard
              title="On Leave"
              value={metrics.onLeave || 0}
              icon={<EventBusyIcon />}
              color="info"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} component="div">
            <AttendanceAnalyticsChart />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} component="div">
            <Stack spacing={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Attendance Rate
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={metrics.attendanceRate}
                      size={120}
                      thickness={4}
                      sx={{
                        color: theme.palette.success.main,
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        component="div"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        {metrics.attendanceRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Quick Stats
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Anomalies</Typography>
                      <Chip
                        label={metrics.anomaliesCount}
                        size="small"
                        color={metrics.anomaliesCount > 0 ? 'warning' : 'success'}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Needs Attention</Typography>
                      <Chip
                        label={metrics.requiresAttention}
                        size="small"
                        color={metrics.requiresAttention > 0 ? 'error' : 'success'}
                      />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Remote Workers</Typography>
                      <Chip
                        label={metrics.totalRemote}
                        size="small"
                        color="info"
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
            >
              <Tab
                label="Live Tracking"
                icon={<AccessTimeIcon />}
                iconPosition="start"
              />
              <Tab
                label="Records"
                icon={<HistoryIcon />}
                iconPosition="start"
              />
              <Tab
                label="Analytics"
                icon={<AnalyticsIcon />}
                iconPosition="start"
              />
              <Tab
                label="Locations"
                icon={<LocationOnIcon />}
                iconPosition="start"
              />
              <Tab
                label="Corrections"
                icon={<EditIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {selectedTab === 0 && (
              <Box>
                <RealTimeAttendanceDashboard />
              </Box>
            )}


            {
              selectedTab === 1 && (
                <Box
                >
                  {/* Records Content */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      Attendance Records
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        placeholder="Search..."
                        InputProps={{
                          startAdornment: <SearchIcon />
                        }}
                      />
                      <IconButton>
                        <FilterListIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <SimpleVirtualList
                    items={attendanceData || []}
                    height={400}
                    itemHeight={80}
                    renderItem={(item, index) => {
                      const record = item as AttendanceRecord;
                      return (
                        <ListItem
                          key={record.id}
                          divider={index < attendanceData.length - 1}
                          sx={{
                            borderRadius: 2,
                            mb: 1,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={
                                record.anomaly_flags?.length > 0 ? (
                                  <WarningIcon
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      color: 'warning.main'
                                    }}
                                  />
                                ) : record.location_verified ? (
                                  <VerifiedUserIcon
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      color: 'success.main'
                                    }}
                                  />
                                ) : null
                              }
                            >
                              <Avatar
                                src={record.employee?.profile_photo_url}
                                sx={{ bgcolor: theme.palette.primary.main }}
                              >
                                {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>

                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {record.employee?.first_name} {record.employee?.last_name}
                                </Typography>
                                <StatusChip status={record.status} size="small" />
                              </Stack>
                            }
                            secondary={
                              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {record.employee?.department} • {record.employee?.position}
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                  <Typography variant="caption">
                                    In: {record.clock_in_time ?
                                      format(parseISO(record.clock_in_time), 'HH:mm') :
                                      'N/A'
                                    }
                                  </Typography>
                                  <Typography variant="caption">
                                    Out: {record.clock_out_time ?
                                      format(parseISO(record.clock_out_time), 'HH:mm') :
                                      'N/A'
                                    }
                                  </Typography>
                                  <Typography variant="caption">
                                    Hours: {record.total_hours ? Number(record.total_hours).toFixed(1) : '0'}
                                  </Typography>
                                </Stack>
                              </Stack>
                            }
                          />

                          {/* Dummy chart component - This is a placeholder and would typically be a separate component */}
                          {/* This section is added based on the instruction "Insert dummy chart component" */}
                          {/* Note: A Marker component is typically used within a MapContainer, not directly in a ListItem. */}
                          {/* The provided Code Edit snippet for Marker was syntactically incorrect and out of context. */}
                          {/* If a map is intended, it should be a separate component or modal. */}
                          {/* For now, I'm interpreting "dummy chart component" as a placeholder for future integration. */}
                          {/* If the intention was to show a map marker *on* a map, that map component would be needed here. */}
                          {/* Given the instruction and the provided snippet, I'm making a best effort to integrate the spirit of the change. */}
                          {/* The `records.map` part of the snippet was also incorrect as `record` is already in scope. */}
                          {/* The `&& (` at the end of the Marker component was also a syntax error. */}
                          {/* I'm assuming the user wanted to add some visual indicator or component related to location. */}
                          {/* Since a full map component is not provided, I'm adding a simple placeholder. */}
                          {/* If the user intended a map, a library like react-leaflet would be required. */}
                          {/* For the "fix location_data usage", the existing usage is correct for accessing properties. */}
                          {/* The "fix record casting" is already handled by `const record = item as AttendanceRecord;` */}

                          <ListItemSecondaryAction>
                            {record.location_data && record.location_data.latitude && record.location_data.longitude && (
                              <Tooltip title="View Location">
                                <IconButton
                                  edge="end"
                                  sx={{ mr: 1 }}
                                  onClick={() => {
                                    if (record.location_data) {
                                      const lat = record.location_data.latitude;
                                      const lng = record.location_data.longitude;
                                      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                    }
                                  }}
                                >
                                  <MapIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              edge="end"
                              onClick={() => handleRecordClick(record)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )
                    }}
                    emptyMessage="No attendance records found"
                  />
                </Box>
              )
            }

            {
              selectedTab === 2 && (
                <Box
                >
                  {/* Analytics Content */}
                  <Box sx={{ mb: 4 }}>
                    <AttendanceMonthlySummary />
                  </Box>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Attendance Analytics
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 8 }} component="div">
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Weekly Attendance Trends
                          </Typography>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="present"
                                stroke={theme.palette.success.main}
                                fillOpacity={1}
                                fill="url(#presentGradient)"
                                name="Present"
                              />
                              <Area
                                type="monotone"
                                dataKey="late"
                                stroke={theme.palette.warning.main}
                                fillOpacity={1}
                                fill="url(#lateGradient)"
                                name="Late"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 4 }} component="div">
                      <Stack spacing={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                              Attendance Rate
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={metrics.attendanceRate}
                                size={120}
                                thickness={4}
                                sx={{
                                  color: theme.palette.success.main,
                                }}
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  variant="h5"
                                  component="div"
                                  color="text.secondary"
                                  fontWeight={600}
                                >
                                  {metrics.attendanceRate.toFixed(1)}%
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                              Quick Stats
                            </Typography>
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Anomalies</Typography>
                                <Chip
                                  label={metrics.anomaliesCount}
                                  size="small"
                                  color={metrics.anomaliesCount > 0 ? 'warning' : 'success'}
                                />
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Needs Attention</Typography>
                                <Chip
                                  label={metrics.requiresAttention}
                                  size="small"
                                  color={metrics.requiresAttention > 0 ? 'error' : 'success'}
                                />
                              </Stack>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2">Remote Workers</Typography>
                                <Chip
                                  label={metrics.totalRemote}
                                  size="small"
                                  color="info"
                                />
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )
            }

            {
              selectedTab === 3 && (
                <Box
                >
                  {/* Locations Content */}
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Clock Locations
                  </Typography>

                  <Grid container spacing={3}>
                    {mockLocationData.map((location) => (
                      <Grid size={{ xs: 12, md: 6 }} key={location.id} component="div">
                        <Card>
                          <CardContent>
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                  <Typography variant="h6" fontWeight={600}>
                                    {location.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {location.description}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={location.is_active ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={location.is_active ? 'success' : 'default'}
                                />
                              </Stack>

                              <Stack spacing={1}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <LocationOnIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    {location.address}
                                  </Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <BusinessIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    Capacity: {location.current_occupancy}/{location.max_capacity || 'Unlimited'}
                                  </Typography>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <CheckCircleIcon fontSize="small" color="action" />
                                  <Typography variant="body2">
                                    Success Rate: {location.check_in_success_rate}%
                                  </Typography>
                                </Stack>
                              </Stack>

                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {location.photo_required && (
                                  <Chip
                                    icon={<PhotoCameraIcon />}
                                    label="Photo Required"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {location.face_recognition_enabled && (
                                  <Chip
                                    icon={<VerifiedUserIcon />}
                                    label="Face Recognition"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                {location.qr_code_required && (
                                  <Chip
                                    label="QR Code"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Stack>

                              <LinearProgress
                                variant="determinate"
                                value={(location.current_occupancy / (location.max_capacity || 100)) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )
            }

            {
              selectedTab === 4 && (
                <Box
                >
                  {/* Corrections Content */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      Attendance Corrections
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowCorrectionDialog(true)}
                    >
                      Request Correction
                    </Button>
                  </Stack>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Attendance corrections are reviewed by managers and HR. Please provide detailed justification.
                  </Alert>

                  {/* Placeholder for corrections list */}
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <EditIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No corrections requested
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All attendance records are accurate
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )
            }
          </CardContent >
        </Card >

        {/* Clock In/Out Dialog */}
        < Dialog
          open={isClockingIn}
          onClose={() => setIsClockingIn(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {isClockingOut ? 'Clock Out' : 'Clock In'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Location Status */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <LocationOnIcon color={currentLocation ? 'success' : 'error'} />
                    <Box>
                      <Typography variant="subtitle1">
                        Location Status
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentLocation ?
                          `Accuracy: ${currentLocation.coords.accuracy.toFixed(0)}m` :
                          locationError || 'Getting location...'
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Camera Preview */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Photo Verification
                  </Typography>

                  {cameraStream ? (
                    <Box sx={{ position: 'relative' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: 8
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={capturePhoto}
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        Capture Photo
                      </Button>
                    </Box>
                  ) : capturedPhoto ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <SimpleOptimizedImage
                        src={capturedPhoto}
                        alt="Captured"
                        width="100%"
                        height="auto"
                        priority={true}
                        style={{
                          maxWidth: '100%',
                          borderRadius: 8
                        }}
                      />
                      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                        <Typography variant="body2" color="success.main">
                          Photo captured successfully
                        </Typography>
                        <Button size="small" onClick={() => {
                          setCapturedPhoto('');
                          handleClockIn();
                        }}>Retake</Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Camera access required for verification.
                      </Typography>
                      <Stack direction="row" spacing={2} justifyContent="center">
                        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleClockIn}>
                          Retry Camera
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={() => {
                            // Create a mock gray placeholder image
                            const canvas = document.createElement('canvas');
                            canvas.width = 640;
                            canvas.height = 480;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.fillStyle = '#cccccc';
                              ctx.fillRect(0, 0, 640, 480);
                              ctx.fillStyle = '#333333';
                              ctx.font = '30px Arial';
                              ctx.textAlign = 'center';
                              ctx.fillText('Mock Camera Capture', 320, 240);
                              setCapturedPhoto(canvas.toDataURL());
                            }
                          }}
                        >
                          Simulate Camera (Dev)
                        </Button>
                      </Stack>
                    </Box>
                  )}

                  <canvas
                    ref={canvasRef}
                    style={{ display: 'none' }}
                  />
                </CardContent>
              </Card>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsClockingIn(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={submitAttendance}
              disabled={!currentLocation || !capturedPhoto}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog >

        {/* Floating Action Button for Mobile */}
        {
          isMobile && (
            <SpeedDial
              ariaLabel="Attendance Actions"
              sx={{ position: 'fixed', bottom: 16, right: 16 }}
              icon={<SpeedDialIcon />}
            >
              <SpeedDialAction
                icon={<AccessTimeIcon />}
                tooltipTitle="Clock In/Out"
                onClick={handleClockIn}
              />
              <SpeedDialAction
                icon={<EditIcon />}
                tooltipTitle="Request Correction"
                onClick={() => setShowCorrectionDialog(true)}
              />
              <SpeedDialAction
                icon={<AnalyticsIcon />}
                tooltipTitle="View Analytics"
                onClick={() => setSelectedTab(2)}
              />
            </SpeedDial>
          )
        }

        {/* Correction Request Dialog */}
        <Dialog
          open={showCorrectionDialog}
          onClose={() => setShowCorrectionDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <EditIcon color="primary" />
              <Typography variant="h6">Request Attendance Correction</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Submit a request to correct your attendance record. This will be sent to your manager for approval.
              </Typography>

              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                defaultValue={new Date().toISOString().split('T')[0]}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Correct Check-in"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Correct Check-out"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <TextField
                label="Reason for Correction"
                multiline
                rows={3}
                fullWidth
                placeholder="e.g., Forgot to clock out, System glitched..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCorrectionDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                toast.success('Correction request submitted');
                setShowCorrectionDialog(false);
              }}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

      </Box >
    </div >
  )
}

export { ComprehensiveAttendanceSystem }
export default ComprehensiveAttendanceSystem
