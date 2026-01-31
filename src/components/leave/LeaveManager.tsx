import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab'
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Snackbar,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  RadioGroup,
  Radio,
  FormLabel,
  Checkbox,
  FormGroup
} from '@mui/material'
// import { supabase } from '@/lib/supabase'
import DatabaseService from '../../services/databaseService'
// Types are inferred from DatabaseService methods
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import MetricCard from '../../components/common/MetricCard'
import StatusChip from '../../components/common/StatusChip'
import CountUp from '../../components/common/CountUp'



import {
  EventNote as EventNoteIcon,
  CalendarToday as CalendarTodayIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
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
  Timeline as TimelineIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  Policy as PolicyIcon,
  RequestQuote as RequestQuoteIcon,
  Approval as ApprovalIcon,
  AccessTime as AccessTimeIcon,
  DateRange as DateRangeIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  LocalHospital as LocalHospitalIcon,
  School as SchoolIcon,
  Flight as FlightIcon,
  FamilyRestroom as FamilyRestroomIcon
} from '@mui/icons-material'
// Removed framer-motion for performance optimization
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
import { format, addDays, differenceInDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { useResponsive } from '@/hooks/useResponsive'



// Types based on schema
interface LeaveType {
  id: string
  name: string
  code: string
  description?: string
  category: string
  max_days_per_year?: number
  max_days_per_period?: number
  accrual_method: string
  accrual_rate?: number
  accrual_frequency: string
  accrual_cap?: number
  proration_method: string
  carry_forward_allowed: boolean
  max_carry_forward_days: number
  carry_forward_expiry_months: number
  use_it_or_lose_it: boolean
  cash_out_allowed: boolean
  cash_out_rate: number
  cash_out_threshold?: number
  min_notice_days: number
  max_notice_days: number
  min_duration_hours: number
  max_duration_days: number
  max_consecutive_days?: number
  min_gap_between_requests: number
  blackout_periods: any[]
  advance_booking_limit_days: number
  requires_medical_certificate: boolean
  medical_cert_threshold_days: number
  requires_manager_approval: boolean
  requires_hr_approval: boolean
  requires_director_approval: boolean
  auto_approve_threshold_days?: number
  delegation_allowed: boolean
  is_paid: boolean
  pay_rate_multiplier: number
  affects_benefits: boolean
  affects_seniority: boolean
  affects_pension: boolean
  affects_bonus_calculation: boolean
  public_holiday_interaction: string
  eligibility_rules: any
  min_service_months: number
  max_service_months?: number
  employment_types: string[]
  applicable_countries?: string[]
  applicable_states?: string[]
  gender_specific: boolean
  age_restrictions: any
  statutory_leave: boolean
  fmla_qualifying: boolean
  workers_comp_related: boolean
  disability_related: boolean
  legal_requirements: any
  reporting_requirements: any
  weekend_counting: string
  public_holiday_counting: string
  half_day_allowed: boolean
  hourly_leave_allowed: boolean
  color_code: string
  icon: string
  display_order: number
  is_active: boolean
  effective_from: string
  effective_to?: string
  created_at: string
  updated_at: string
  metadata: any
}

interface LeaveRequest {
  id: string
  request_number: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  start_period: string
  end_period: string
  start_time?: string
  end_time?: string
  total_days: number
  business_days?: number
  total_hours?: number
  reason?: string
  detailed_reason?: string
  emergency_request: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  urgency_justification?: string
  contact_during_leave: any
  emergency_contact_override: any
  work_handover_completed: boolean
  handover_notes?: string
  handover_checklist: any[]
  coverage_arranged: boolean
  coverage_details: any
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  sub_status?: string
  workflow_step: number
  current_approver_id?: string
  escalation_level: number
  auto_approved: boolean
  requires_coverage: boolean
  approval_chain: any[]
  approvals_received: any[]
  rejections_received: any[]
  delegation_history: any[]
  final_approver_id?: string
  approved_at?: string
  supporting_documents: any[]
  medical_certificate_required: boolean
  medical_certificate_submitted: boolean
  medical_certificate_verified: boolean
  medical_certificate_expiry?: string
  additional_documentation: any[]
  team_impact_score: number
  project_impact: any[]
  client_impact_assessment?: string
  business_justification?: string
  cost_impact_estimate?: number
  revenue_impact_estimate?: number
  expected_return_date: string
  actual_return_date?: string
  return_confirmed: boolean
  return_to_work_interview: boolean
  fitness_for_work_clearance: boolean
  phased_return_plan: any
  pay_impact: any
  benefit_impacts: any[]
  accrual_adjustments: any
  pension_impact: any
  statutory_leave_flag: boolean
  fmla_covered: boolean
  disability_related: boolean
  workers_comp_claim?: string
  legal_requirements_met: boolean
  approval_probability?: number
  similar_requests_analysis: any
  pattern_analysis: any
  risk_assessment: any
  recommendation_engine: any
  notification_preferences: any
  reminder_schedule: any[]
  communication_log: any[]
  created_at: string
  updated_at: string
  submitted_at: string
  metadata: any
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    profile_photo_url?: string
    department: string
    position: string
  }
  leave_type?: LeaveType
}

interface EmployeeLeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  current_balance: number
  accrued_balance: number
  used_balance: number
  pending_balance: number
  reserved_balance: number
  available_balance: number
  last_accrual_date?: string
  next_accrual_date?: string
  accrual_rate_override?: number
  accrual_suspended: boolean
  accrual_suspension_reason?: string
  carry_forward_balance: number
  carry_forward_expiry_date?: string
  previous_year_balance: number
  ytd_accrued: number
  ytd_used: number
  ytd_forfeited: number
  ytd_cashed_out: number
  policy_year_start?: string
  policy_year_end?: string
  manual_adjustments: number
  adjustment_reason?: string
  adjustment_approved_by?: string
  adjustment_date?: string
  low_balance_threshold: number
  expiry_alert_days: number
  last_alert_sent?: string
  created_at: string
  updated_at: string
  metadata: any
  leave_type?: LeaveType
}



interface ComprehensiveLeaveManagementProps {
  className?: string
}

const LeaveManager: React.FC<ComprehensiveLeaveManagementProps> = ({ className }) => {
  const theme = useTheme()
  const { isMobile, isTablet } = useResponsive()
  const { canEdit, canDelete, canView } = usePermissions()
  const queryClient = useQueryClient()

  // State management
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialog, setDialog] = useState<{
    open: boolean
    mode: 'create' | 'edit' | 'view'
    request: LeaveRequest | null
  }>({ open: false, mode: 'create', request: null })
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({})
  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    leave_type_id: 'all',
    emergency_request: 'all'
  })

  const [newRequest, setNewRequest] = useState<Partial<LeaveRequest>>({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    start_period: 'full_day',
    end_period: 'full_day',
    reason: '',
    detailed_reason: '',
    emergency_request: false,
    priority: 'medium',
    work_handover_completed: false,
    coverage_arranged: false
  })

  // Fetch leave requests
  const { data: fetchedLeaveRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests', searchQuery, filters],
    queryFn: async () => {
      return await DatabaseService.getLeaveRequests({
        search: searchQuery,
        status: filters.status !== 'all' ? [filters.status] : undefined,
        leaveTypeId: filters.leave_type_id !== 'all' ? filters.leave_type_id : undefined,
        isEmergency: filters.emergency_request !== 'all' ? filters.emergency_request === 'true' : undefined
      })
    },
    enabled: canView('leaves')
  })

  // Fetch leave types
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      return await DatabaseService.getLeaveTypes()
    }
  })

  // Fetch leave balances
  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: async () => {
      // Assuming getLeaveBalances accepts no args for all, or we pass current user logic if handled by backend
      return await DatabaseService.getLeaveBalances()
    }
  })

  // Create leave request mutation
  const createLeaveRequestMutation = useMutation({
    mutationFn: async (data: Partial<LeaveRequest>) => {
      // Calculate total days
      const startDate = new Date(data.start_date!)
      const endDate = new Date(data.end_date!)
      const totalDays = differenceInDays(endDate, startDate) + 1

      // Construct payload compatible with API
      const requestData: any = {
        ...data,
        total_days: totalDays,
        status: 'pending',
        request_number: `LR-${Date.now()}`,
        // ... include other necessary fields if API requires them, 
        // otherwise rely on backend defaults
        submitted_at: new Date().toISOString()
      }

      return await DatabaseService.createLeaveRequest(requestData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success('Leave request created successfully')
      setDialog({ open: false, mode: 'create', request: null })
      setFormData({})
    },
    onError: (error: any) => {
      toast.error(`Failed to create leave request: ${error.message}`)
    }
  })

  // Update leave request mutation
  const updateLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<LeaveRequest> & { id: string }) => {
      return await DatabaseService.updateLeaveRequest(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success('Leave request updated successfully')
      setDialog({ open: false, mode: 'create', request: null })
      setFormData({})
    },
    onError: (error: any) => {
      // toast.error(`Failed to update leave request: ${error.message}`)
      toast.error(`Failed to update leave request`)
    }
  })

  // Delete leave request mutation
  const deleteLeaveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      await DatabaseService.deleteLeaveRequest(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      toast.success('Leave request deleted successfully')
    },
    onError: (error: any) => {
      toast.error(`Failed to delete leave request: ${error.message}`)
    }
  })

  // Form handling functions
  const handleOpenDialog = useCallback((mode: 'create' | 'edit' | 'view', request?: LeaveRequest) => {
    setDialog({ open: true, mode, request: request || null })
    if (request && mode !== 'create') {
      setFormData(request)
    } else {
      setFormData({
        leave_type_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        start_period: 'full_day',
        end_period: 'full_day',
        reason: '',
        detailed_reason: '',
        emergency_request: false,
        priority: 'medium',
        work_handover_completed: false,
        coverage_arranged: false,
        medical_certificate_required: false
      })
    }
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialog({ open: false, mode: 'create', request: null })
    setFormData({})
  }, [])

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleFormSubmit = useCallback(async () => {
    try {
      if (dialog.mode === 'create') {
        await createLeaveRequestMutation.mutateAsync(formData)
      } else if (dialog.mode === 'edit' && dialog.request) {
        await updateLeaveRequestMutation.mutateAsync({ ...formData, id: dialog.request.id })
      }
    } catch (error) {
    }
  }, [dialog, formData, createLeaveRequestMutation, updateLeaveRequestMutation])

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      await deleteLeaveRequestMutation.mutateAsync(id)
    }
  }, [deleteLeaveRequestMutation])



  const allRequests = useMemo<LeaveRequest[]>(() => {
    return fetchedLeaveRequests || [];
  }, [fetchedLeaveRequests]);

  // Handle filter status changes
  const handleFilterStatusChange = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  // Filter requests based on selected tab
  const filteredRequestsByTab = useMemo<LeaveRequest[]>(() => {
    if (selectedTab === 0) return allRequests.filter(r => r.status === 'pending');
    if (selectedTab === 1) return allRequests.filter(r => r.status === 'approved');
    if (selectedTab === 2) return allRequests.filter(r => r.status === 'rejected');
    return allRequests;
  }, [allRequests, selectedTab]);

  // Get filtered requests based on current filters and search query
  const filteredRequests = useMemo<LeaveRequest[]>(() => {
    return filteredRequestsByTab.filter(request => {
      if (!searchQuery) return true;

      const searchLower = searchQuery.toLowerCase();
      return (
        (request.employee?.first_name?.toLowerCase().includes(searchLower) ?? false) ||
        (request.employee?.last_name?.toLowerCase().includes(searchLower) ?? false) ||
        (request.reason?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [filteredRequestsByTab, searchQuery]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const pendingCount = allRequests.filter(r => r.status === 'pending').length
    const approvedCount = allRequests.filter(r => r.status === 'approved').length
    const rejectedCount = allRequests.filter(r => r.status === 'rejected').length || 0
    const totalBalance = leaveBalances.reduce((sum: number, b: any) => sum + b.available_balance, 0)
    const usedThisYear = leaveBalances.reduce((sum: number, b: any) => sum + b.ytd_used, 0)
    const pendingDays = allRequests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.total_days || 0), 0)

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalBalance,
      usedThisYear,
      pendingDays,
      approvalRate: allRequests.length > 0 && (approvedCount + rejectedCount) > 0 ?
        (approvedCount / (approvedCount + rejectedCount)) * 100 : 0
    }
  }, [allRequests, leaveBalances])

  // Chart data
  const chartData = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRequests = allRequests.filter(r =>
        dayStr >= r.start_date && dayStr <= r.end_date && r.status === 'approved'
      )

      return {
        date: format(day, 'MMM dd'),
        onLeave: dayRequests.length,
        types: leaveTypes.map((type: LeaveType) => ({
          name: type.name,
          count: dayRequests.filter(r => r.leave_type_id === type.id).length,
          color: type.color_code
        }))
      }
    })
  }, [allRequests, leaveTypes])

  // Event handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }, [])

  const handleRequestClick = useCallback((request: LeaveRequest) => {
    setSelectedRequest(request)
    handleOpenDialog('view', request)
  }, [handleOpenDialog])

  const handleNewRequestChange = useCallback((field: string, value: any) => {
    setNewRequest(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmitRequest = useCallback(async () => {
    if (!newRequest.leave_type_id || !newRequest.start_date || !newRequest.end_date) {
      toast.error('Please fill in all required fields')
      return;
    }

    try {
      await createLeaveRequestMutation.mutateAsync(newRequest)
      setShowRequestDialog(false)
      setNewRequest({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        start_period: 'full_day',
        end_period: 'full_day',
        reason: '',
        detailed_reason: '',
        emergency_request: false,
        priority: 'medium',
        work_handover_completed: false,
        coverage_arranged: false
      })
    } catch (error) {
      // Error handled by mutation
    }
  }, [newRequest, createLeaveRequestMutation])

  const getLeaveTypeIcon = useCallback((iconName: string) => {
    switch (iconName) {
      case 'flight': return <FlightIcon />
      case 'local_hospital': return <LocalHospitalIcon />
      case 'home': return <HomeIcon />
      case 'school': return <SchoolIcon />
      case 'family_restroom': return <FamilyRestroomIcon />
      case 'work': return <WorkIcon />
      default: return <EventNoteIcon />
    }
  }, [])

  return (
    <Box
      className={className}
    >
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
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
              Leave Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive leave tracking and approval system
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
              startIcon={<AddIcon />}
            >
              Request Leave
            </Button>
          </Stack>
        </Stack>

        {/* Key Metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
            <MetricCard
              title="Total Requests"
              value={allRequests.length}
              icon={<AssignmentIcon />}
              color="primary"
            />
          </Box>
        </Box>

        {/* Main Content */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3
                }
              }}
            >
              <Tab label={`Pending (${allRequests.filter(req => req.status === 'pending').length})`} value={0} />
              <Tab label={`Approved (${allRequests.filter(req => req.status === 'approved').length})`} value={1} />
              <Tab label={`Rejected (${allRequests.filter(req => req.status === 'rejected').length})`} value={2} />
              <Tab label={`All (${allRequests.length})`} value={3} />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {selectedTab === 0 && (
              <Box
              >
                {/* Leave Requests */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6">
                    Leave Requests
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon />
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.status}
                        onChange={(e) => handleFilterStatusChange(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {filteredRequests.map((request) => (
                    <Box key={request.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: `1px solid ${alpha(request.leave_type?.color_code || theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4],
                            borderColor: request.leave_type?.color_code || theme.palette.primary.main,
                          }
                        }}
                        onClick={() => handleRequestClick(request)}
                      >
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar
                                  sx={{
                                    bgcolor: request.leave_type?.color_code || theme.palette.primary.main,
                                    width: 40,
                                    height: 40
                                  }}
                                >
                                  {getLeaveTypeIcon(request.leave_type?.icon || 'event_note')}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={600}>
                                    {request.leave_type?.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.request_number}
                                  </Typography>
                                </Box>
                              </Stack>
                              <StatusChip status={request.status} size="sm" />
                            </Stack>

                            <Divider />

                            <Stack spacing={1}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <DateRangeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd')}
                                </Typography>
                              </Stack>

                              <Stack direction="row" alignItems="center" spacing={1}>
                                <AccessTimeIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {request.total_days} day{request.total_days !== 1 ? 's' : ''}
                                </Typography>
                              </Stack>

                              <Stack direction="row" alignItems="center" spacing={1}>
                                <InfoIcon fontSize="small" color="action" />
                                <Typography variant="body2" noWrap>
                                  {request.reason || 'No reason provided'}
                                </Typography>
                              </Stack>
                            </Stack>

                            {request.emergency_request && (
                              <Alert severity="warning">
                                Emergency Request
                              </Alert>
                            )}

                            {request.medical_certificate_required && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <LocalHospitalIcon fontSize="small" color="error" />
                                <Typography variant="caption" color="error.main">
                                  Medical certificate required
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>

                {filteredRequests.length === 0 && (
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No leave requests
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        You haven't submitted any leave requests yet
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setShowRequestDialog(true)}
                      >
                        Request Leave
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}

            {selectedTab === 1 && (
              <Box
              >
                {/* Leave Balances */}
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Leave Balances
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {leaveBalances.map((balance: any) => (
                    <Box key={balance.id}>
                      <Card>
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar
                                sx={{
                                  bgcolor: balance.leave_type?.color_code || theme.palette.primary.main,
                                  width: 48,
                                  height: 48
                                }}
                              >
                                {getLeaveTypeIcon(balance.leave_type?.icon || 'event_note')}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight={600}>
                                  {balance.leave_type?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {balance.leave_type?.description}
                                </Typography>
                              </Box>
                            </Stack>

                            <Divider />

                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">
                                  Available
                                </Typography>
                                <Typography variant="h6" fontWeight={600} color="success.main">
                                  {balance.available_balance} days
                                </Typography>
                              </Stack>

                              <LinearProgress
                                variant="determinate"
                                value={(balance.used_balance / balance.accrued_balance) * 100}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: alpha(balance.leave_type?.color_code || theme.palette.primary.main, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: balance.leave_type?.color_code || theme.palette.primary.main,
                                    borderRadius: 4,
                                  }
                                }}
                              />

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.secondary">
                                  Used: {balance.used_balance} days
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total: {balance.accrued_balance} days
                                </Typography>
                              </Stack>

                              {balance.pending_balance > 0 && (
                                <Alert severity="info">
                                  {balance.pending_balance} days pending approval
                                </Alert>
                              )}

                              {balance.available_balance <= balance.low_balance_threshold && (
                                <Alert severity="warning">
                                  Low balance alert
                                </Alert>
                              )}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {selectedTab === 2 && (
              <Box
              >
                {/* Team Calendar */}
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Team Leave Calendar
                </Typography>

                <Card>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar
                          dataKey="onLeave"
                          fill={theme.palette.primary.main}
                          name="Employees on Leave"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Box>
            )}

            {selectedTab === 3 && (
              <Box
              >
                {/* Analytics */}
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Leave Analytics
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Leave Usage Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="leaveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="onLeave"
                              stroke={theme.palette.primary.main}
                              fillOpacity={1}
                              fill="url(#leaveGradient)"
                              name="On Leave"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box>
                    <Stack spacing={3}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Leave Types Usage
                          </Typography>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={leaveTypes.map((type: LeaveType) => ({
                                  name: type.name,
                                  value: leaveBalances.find((b: any) => b.leave_type_id === type.id)?.used_balance || 0,
                                  color: type.color_code
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                dataKey="value"
                              >
                                {leaveTypes.map((type: LeaveType, index: number) => (
                                  <Cell key={`cell-${index}`} fill={type.color_code} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Quick Stats
                          </Typography>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2">Pending Days</Typography>
                              <Chip
                                label={metrics.pendingDays}
                                size="small"
                                color="warning"
                              />
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2">Approved Requests</Typography>
                              <Chip
                                label={metrics.approvedCount}
                                size="small"
                                color="success"
                              />
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2">Rejected Requests</Typography>
                              <Chip
                                label={metrics.rejectedCount}
                                size="small"
                                color="error"
                              />
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            )}

            {selectedTab === 4 && (
              <Box
              >
                {/* Leave Policies */}
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Leave Policies & Types
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
                  {leaveTypes.map((type: LeaveType) => (
                    <Box key={type.id}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                            <Avatar
                              sx={{
                                bgcolor: type.color_code,
                                width: 40,
                                height: 40
                              }}
                            >
                              {getLeaveTypeIcon(type.icon)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {type.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={type.is_paid ? 'Paid' : 'Unpaid'}
                                size="small"
                                color={type.is_paid ? 'success' : 'default'}
                              />
                              <Chip
                                label={`Max: ${type.max_days_per_year || 'Unlimited'} days`}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Accrual Details
                              </Typography>
                              <Stack spacing={1}>
                                <Typography variant="body2">
                                  <strong>Method:</strong> {type.accrual_method}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Rate:</strong> {type.accrual_rate} days/{type.accrual_frequency}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Cap:</strong> {type.accrual_cap || 'None'}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Request Rules
                              </Typography>
                              <Stack spacing={1}>
                                <Typography variant="body2">
                                  <strong>Min Notice:</strong> {type.min_notice_days} days
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Max Duration:</strong> {type.max_duration_days} days
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Min Gap:</strong> {type.min_gap_between_requests} days
                                </Typography>
                              </Stack>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Approval Requirements
                              </Typography>
                              <Stack spacing={1}>
                                {type.requires_manager_approval && (
                                  <Chip label="Manager Approval" size="small" color="primary" />
                                )}
                                {type.requires_hr_approval && (
                                  <Chip label="HR Approval" size="small" color="secondary" />
                                )}
                                {type.requires_medical_certificate && (
                                  <Chip label="Medical Certificate" size="small" color="error" />
                                )}
                              </Stack>
                            </Box>

                            <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 3' } }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Additional Features
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                {type.carry_forward_allowed && (
                                  <Chip label="Carry Forward" size="small" variant="outlined" />
                                )}
                                {type.cash_out_allowed && (
                                  <Chip label="Cash Out" size="small" variant="outlined" />
                                )}
                                {type.half_day_allowed && (
                                  <Chip label="Half Day" size="small" variant="outlined" />
                                )}
                                {type.hourly_leave_allowed && (
                                  <Chip label="Hourly Leave" size="small" variant="outlined" />
                                )}
                                {type.statutory_leave && (
                                  <Chip label="Statutory" size="small" color="info" />
                                )}
                                {type.fmla_qualifying && (
                                  <Chip label="FMLA" size="small" color="warning" />
                                )}
                              </Stack>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* New Leave Request Dialog */}
        <Dialog
          open={showRequestDialog}
          onClose={() => setShowRequestDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            Request Leave
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3, mt: 1 }}>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={newRequest.leave_type_id}
                    onChange={(e) => handleNewRequestChange('leave_type_id', e.target.value)}
                    label="Leave Type"
                  >
                    {leaveTypes.map((type: LeaveType) => (
                      <MenuItem key={type.id} value={type.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar
                            sx={{
                              bgcolor: type.color_code,
                              width: 24,
                              height: 24
                            }}
                          >
                            {getLeaveTypeIcon(type.icon)}
                          </Avatar>
                          <Typography>{type.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newRequest.priority}
                    onChange={(e) => handleNewRequestChange('priority', e.target.value)}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={newRequest.start_date}
                  onChange={(e) => handleNewRequestChange('start_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={newRequest.end_date}
                  onChange={(e) => handleNewRequestChange('end_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <TextField
                  fullWidth
                  label="Reason"
                  value={newRequest.reason}
                  onChange={(e) => handleNewRequestChange('reason', e.target.value)}
                  placeholder="Brief reason for leave"
                />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detailed Explanation"
                  value={newRequest.detailed_reason}
                  onChange={(e) => handleNewRequestChange('detailed_reason', e.target.value)}
                  placeholder="Provide additional details if necessary"
                />
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRequest.emergency_request}
                        onChange={(e) => handleNewRequestChange('emergency_request', e.target.checked)}
                      />
                    }
                    label="Emergency Request"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRequest.work_handover_completed}
                        onChange={(e) => handleNewRequestChange('work_handover_completed', e.target.checked)}
                      />
                    }
                    label="Work handover completed"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newRequest.coverage_arranged}
                        onChange={(e) => handleNewRequestChange('coverage_arranged', e.target.checked)}
                      />
                    }
                    label="Coverage arranged"
                  />
                </FormGroup>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitRequest}
              disabled={!newRequest.leave_type_id || !newRequest.start_date || !newRequest.end_date}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Request Details Dialog */}
        <Dialog
          open={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          {selectedRequest && (
            <>
              <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    sx={{
                      bgcolor: selectedRequest.leave_type?.color_code || theme.palette.primary.main,
                      width: 40,
                      height: 40
                    }}
                  >
                    {getLeaveTypeIcon(selectedRequest.leave_type?.icon || 'event_note')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedRequest.leave_type?.name} Request
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRequest.request_number}
                    </Typography>
                  </Box>
                </Stack>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Request Details
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Dates:</strong> {format(parseISO(selectedRequest.start_date), 'MMM dd, yyyy')} - {format(parseISO(selectedRequest.end_date), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Duration:</strong> {selectedRequest.total_days} days
                      </Typography>
                      <Typography variant="body2">
                        <strong>Status:</strong> <StatusChip status={selectedRequest.status} size="sm" />
                      </Typography>
                      <Typography variant="body2">
                        <strong>Priority:</strong> {selectedRequest.priority}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Request Status
                    </Typography>
                    <Timeline>
                      <TimelineItem>
                        <TimelineSeparator>
                          <TimelineDot color="primary">
                            <AssignmentIcon />
                          </TimelineDot>
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant="body2">
                            Request Submitted
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(selectedRequest.submitted_at), 'MMM dd, HH:mm')}
                          </Typography>
                        </TimelineContent>
                      </TimelineItem>

                      {selectedRequest.status === 'approved' && (
                        <TimelineItem>
                          <TimelineSeparator>
                            <TimelineDot color="success">
                              <CheckCircleIcon />
                            </TimelineDot>
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant="body2">
                              Request Approved
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedRequest.approved_at && format(parseISO(selectedRequest.approved_at), 'MMM dd, HH:mm')}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      )}
                    </Timeline>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Reason
                    </Typography>
                    <Typography variant="body2">
                      {selectedRequest.reason || 'No reason provided'}
                    </Typography>
                    {selectedRequest.detailed_reason && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedRequest.detailed_reason}
                      </Typography>
                    )}
                  </Box>

                  {selectedRequest.medical_certificate_required && (
                    <Box sx={{ gridColumn: 'span 2' }}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          Medical certificate is required for this leave type.
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <Button variant="outlined" startIcon={<EditIcon />}>
                    Edit Request
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  )
}

export default LeaveManager
