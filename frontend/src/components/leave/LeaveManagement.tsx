import React, { useState, useMemo, useCallback, useEffect } from 'react'
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { toast } from 'sonner'

interface ComprehensiveLeaveManagementProps {
  className?: string
}
// Mock Timeline components - replace with @mui/lab imports if available
const Timeline = ({ children, ...props }: any) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} {...props}>
    {children}
  </Box>
)

const TimelineItem = ({ children, ...props }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }} {...props}>
    {children}
  </Box>
)

const TimelineSeparator = ({ children, ...props }: any) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }} {...props}>
    {children}
  </Box>
)

const TimelineConnector = ({ ...props }: any) => (
  <Box
    sx={{
      width: 2,
      height: 40,
      bgcolor: 'divider',
      borderRadius: 1
    }}
    {...props}
  />
)

const TimelineContent = ({ children, ...props }: any) => (
  <Box sx={{ flex: 1, pt: 0.5 }} {...props}>
    {children}
  </Box>
)

const TimelineDot = ({ children, color = 'primary', ...props }: any) => (
  <Avatar
    sx={{
      width: 24,
      height: 24,
      bgcolor: `${color}.main`,
      fontSize: '0.75rem'
    }}
    {...props}
  >
    {children}
  </Avatar>
)

const TimelineOppositeContent = ({ children, ...props }: any) => (
  <Box sx={{ flex: 0.3, pt: 0.5, pr: 2, textAlign: 'right' }} {...props}>
    {children}
  </Box>
)

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
import { motion, AnimatePresence } from 'framer-motion'
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
import { useResponsive } from '../../hooks/useResponsive'
import DatabaseService from '../../services/databaseService'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import LeaveRequestCard from './LeaveRequestCard'
import LeaveCalendar from './LeaveCalendar'
import BulkApprovalInterface from './BulkApprovalInterface'

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
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  return <Chip label={status} size={size} color={getColor(status) as any} />
}

// Import types from centralized type definition
import {
  LeaveRequest,
  LeaveType,
  EmployeeLeaveBalance
} from './types/leave.types'

// BulkApprovalInterface imported at top


export const ComprehensiveLeaveManagement: React.FC<ComprehensiveLeaveManagementProps> = ({ className }) => {
  const theme = useTheme()
  const { isMobile, isTablet } = useResponsive()

  // State management
  const [selectedTab, setSelectedTab] = useState(0)
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const queryClient = useQueryClient();

  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<Partial<LeaveType> | null>(null);
  const [leaveTypeFormData, setLeaveTypeFormData] = useState<Partial<LeaveType>>({
    name: '',
    code: '',
    color_code: '#2196f3',
    description: '',
    is_paid: true,
    is_active: true,
    requires_manager_approval: true,
    max_days_per_year: 20
  });

  const resetLeaveTypeForm = () => {
    setLeaveTypeFormData({
      name: '',
      code: '',
      color_code: '#2196f3',
      description: '',
      is_paid: true,
      is_active: true,
      requires_manager_approval: true,
      max_days_per_year: 20
    });
    setEditingLeaveType(null);
  };

  const handleEditLeaveType = (type: LeaveType) => {
    setEditingLeaveType(type);
    setLeaveTypeFormData(type);
    setShowLeaveTypeDialog(true);
  };

  const handleDeleteLeaveType = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave type?')) {
      try {
        await DatabaseService.deleteLeaveType(id);
        toast.success('Leave type deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete leave type');
      }
    }
  };

  const handleLeaveTypeSubmit = async () => {
    try {
      if (editingLeaveType?.id) {
        await DatabaseService.updateLeaveType(editingLeaveType.id, leaveTypeFormData);
        toast.success('Leave type updated successfully');
      } else {
        await DatabaseService.createLeaveType(leaveTypeFormData);
        toast.success('Leave type created successfully');
      }
      setShowLeaveTypeDialog(false);
      resetLeaveTypeForm();
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save leave type');
    }
  };

  // Fetch Data
  const { data: leaveTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['leave-types'],
    queryFn: DatabaseService.getLeaveTypes
  });

  const { data: leaveBalances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances', user?.id],
    queryFn: () => user?.id ? DatabaseService.getLeaveBalances(user.id) : Promise.resolve([]),
    enabled: !!user?.id
  });

  const { data: leaveRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['leave-requests', user?.id],
    queryFn: () => DatabaseService.getLeaveRequests({
      employeeId: hasPermission('view_all_leaves') ? undefined : (user?.id || '')
    })
  });

  const requests = leaveRequests; // Alias for existing code usage
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRequest, setNewRequest] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    days_requested: 0,
    priority: 'medium',
    detailed_reason: '',
    emergency_request: false,
    work_handover_completed: false,
    coverage_arranged: false,
    contact_number: ''
  });

  const handleEditRequest = (request: LeaveRequest) => {
    setNewRequest({
      leave_type_id: request.leave_type_id,
      start_date: request.start_date.split('T')[0],
      end_date: request.end_date.split('T')[0],
      reason: request.reason || '',
      days_requested: request.total_days || 0, // Assuming total_days maps to days_requested
      priority: (request as any).priority || 'medium',
      detailed_reason: (request as any).detailed_reason || '',
      emergency_request: (request as any).emergency_request || false,
      work_handover_completed: (request as any).work_handover_completed || false,
      coverage_arranged: (request as any).coverage_arranged || false,
      contact_number: (request as any).contact_number || ''
    });
    setEditingId(request.id);
    setShowRequestDialog(true);
  };

  const handleRequestSubmit = async (data: any) => {
    try {
      if (editingId) {
        await DatabaseService.updateLeaveRequest(editingId, {
          ...data,
          days_requested: data.days_requested // explicit pass
        });
        toast.success('Leave request updated successfully');
      } else {
        await DatabaseService.createLeaveRequest({
          ...data,
          employee_id: user?.id,
          status: 'pending'
        });
        toast.success('Leave request submitted successfully');
      }
      setShowRequestDialog(false);
      setEditingId(null);
      refetchRequests();
    } catch (error) {
      toast.error(editingId ? 'Failed to update leave request' : 'Failed to submit leave request');
    }
  }

  // Reset editing state when dialog closes
  useEffect(() => {
    if (!showRequestDialog) {
      setEditingId(null);
      setNewRequest({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        days_requested: 0,
        priority: 'medium',
        detailed_reason: '',
        emergency_request: false,
        work_handover_completed: false,
        coverage_arranged: false,
        contact_number: ''
      });
      if (!editingId) {
        // ensuring clean state
      }
    }
  }, [showRequestDialog]);

  const handleApprove = async (id: string) => {
    try {
      await DatabaseService.updateLeaveRequestStatus(id, 'approved', user?.id, 'Approved via dashboard');
      toast.success('Leave request approved');
      refetchRequests();
    } catch (error) {
      toast.error('Failed to approve request');
    }
  }

  const handleReject = async (id: string, reason: string) => {
    try {
      await DatabaseService.updateLeaveRequestStatus(id, 'rejected', user?.id, reason);
      toast.success('Leave request rejected');
      refetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  }

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await DatabaseService.deleteLeaveRequest(id);
        toast.success('Leave request deleted successfully');
        refetchRequests();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete leave request');
      }
    }
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const pendingCount = leaveRequests.filter((r: LeaveRequest) => r.status === 'pending').length
    const approvedCount = leaveRequests.filter((r: LeaveRequest) => r.status === 'approved').length
    const rejectedCount = leaveRequests.filter((r: LeaveRequest) => r.status === 'rejected').length
    const totalBalance = leaveBalances.reduce((sum: number, b: EmployeeLeaveBalance) => sum + (Number(b.available_balance) || 0), 0)
    const usedThisYear = leaveBalances.reduce((sum: number, b: EmployeeLeaveBalance) => sum + (Number(b.ytd_used) || 0), 0)
    const pendingDays = leaveRequests
      .filter((r: LeaveRequest) => r.status === 'pending')
      .reduce((sum: number, r: LeaveRequest) => sum + (Number(r.total_days) || 0), 0)

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalBalance,
      usedThisYear,
      pendingDays,
      approvalRate: (approvedCount + rejectedCount) > 0 ?
        Math.round((approvedCount / (approvedCount + rejectedCount)) * 100) : 100 // Default to 100% if no rejections yet? Or 0? Usually 100 if only approvals.
    }
  }, [leaveRequests, leaveBalances])

  // Chart data
  const chartData = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayRequests = leaveRequests.filter((r: LeaveRequest) => {
        // Ensure accurate date comparison by stripping time if present
        const start = r.start_date ? r.start_date.split('T')[0] : '';
        const end = r.end_date ? r.end_date.split('T')[0] : '';
        return dayStr >= start && dayStr <= end && r.status === 'approved';
      })

      return {
        date: format(day, 'MMM dd'),
        onLeave: dayRequests.length,
        types: leaveTypes.map((type: LeaveType) => ({
          name: type.name,
          count: dayRequests.filter((r: LeaveRequest) => r.leave_type_id === type.id).length,
          color: type.color_code
        }))
      }
    })
  }, [leaveRequests, leaveTypes])

  // Event handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }, [])

  const handleRequestClick = useCallback((request: LeaveRequest) => {
    setSelectedRequest(request)
  }, [])

  const handleNewRequestChange = useCallback((field: string, value: any) => {
    setNewRequest(prev => ({ ...prev, [field]: value }))
  }, [])


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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
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
              onClick={() => setShowRequestDialog(true)}
            >
              Request Leave
            </Button>
          </Stack>
        </Stack>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Pending Requests"
              value={<CountUp end={metrics.pendingCount} />}
              change={-5.2}
              icon={<PendingIcon />}
              color="warning"
            />
          </Grid>
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Available Days"
              value={<CountUp end={metrics.totalBalance} decimals={1} />}
              change={8.3}
              icon={<AccountBalanceIcon />}
              color="success"
            />
          </Grid>
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Used This Year"
              value={<CountUp end={metrics.usedThisYear} decimals={1} />}
              change={12.7}
              icon={<AssessmentIcon />}
              color="info"
            />
          </Grid>
          <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
            <MetricCard
              title="Approval Rate"
              value={<CountUp end={metrics.approvalRate} decimals={1} suffix="%" />}
              change={2.1}
              icon={<ApprovalIcon />}
              color="primary"
            />
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
                label="My Requests"
                icon={<AssignmentIcon />}
                iconPosition="start"
              />
              <Tab
                label="Balances"
                icon={<AccountBalanceIcon />}
                iconPosition="start"
              />
              <Tab
                label="Team Calendar"
                icon={<CalendarTodayIcon />}
                iconPosition="start"
              />
              <Tab
                label="Analytics"
                icon={<AnalyticsIcon />}
                iconPosition="start"
              />
              <Tab
                label="Policies"
                icon={<PolicyIcon />}
                iconPosition="start"
              />
              {/* Admin/Manager Approval Tab */}
              {(hasPermission('view_all_leaves') || (user?.role as any) === 'super_admin' || (user?.role as any) === 'admin' || (user?.role as any) === 'manager') && (
                <Tab
                  label="Approvals"
                  icon={<ApprovalIcon />}
                  iconPosition="start"
                  value={5}
                />
              )}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            <AnimatePresence mode="wait">
              {selectedTab === 0 && (
                <motion.div
                  key="requests"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Leave Requests */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      My Leave Requests
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
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
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

                  <Grid container spacing={3}>
                    {leaveRequests
                      // Filter for My Requests ONLY
                      .filter((request: LeaveRequest) => request.employee_id === user?.id)
                      .filter((request: LeaveRequest) =>
                        filterStatus === 'all' || request.status === filterStatus
                      )
                      .filter((request: LeaveRequest) =>
                        searchQuery === '' ||
                        (request.employee?.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (request.employee?.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (request.reason?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                      )
                      .map((request: LeaveRequest) => (
                        <Grid component="div" size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                          <LeaveRequestCard
                            request={request}
                            onEdit={() => handleEditRequest(request)}
                            onDelete={handleDeleteRequest}
                            showEmployeeInfo={false} // My requests dont need employee info
                          />
                        </Grid>
                      ))}
                  </Grid>

                  {leaveRequests.filter((r: any) => r.employee_id === user?.id).length === 0 && (
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
                </motion.div>
              )}

              {/* ... Balances (Tab 1) ... */}

              {selectedTab === 5 && (hasPermission('view_all_leaves') || (user?.role as any) === 'super_admin' || (user?.role as any) === 'admin' || (user?.role as any) === 'manager') && (
                <motion.div
                  key="approvals"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      Pending Approvals
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={`${leaveRequests.filter((r: any) => r.employee_id !== user?.id && r.status === 'pending').length} Pending`}
                        color="warning"
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>

                  <Grid container spacing={3}>
                    {leaveRequests
                      // Filter for OTHERS requests (Team)
                      .filter((request: LeaveRequest) => request.employee_id !== user?.id)
                      .filter((request: LeaveRequest) => filterStatus === 'all' || request.status === filterStatus) // Optional separate filter
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
                      .map((request: LeaveRequest) => (
                        <Grid component="div" size={{ xs: 12, md: 6, lg: 4 }} key={request.id}>
                          <LeaveRequestCard
                            request={request}
                            onApprove={() => handleApprove(request.id)}
                            onReject={() => handleReject(request.id, 'Rejected by Admin')}
                            showEmployeeInfo={true}
                          />
                        </Grid>
                      ))}
                  </Grid>

                  {leaveRequests.filter((r: any) => r.employee_id !== user?.id).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      <CheckCircleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="h6">All caught up!</Typography>
                      <Typography variant="body2">No pending leave requests from your team.</Typography>
                    </Box>
                  )}
                </motion.div>
              )}

              {selectedTab === 1 && (
                <motion.div
                  key="balances"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Leave Balances */}
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Leave Balances
                  </Typography>

                  <Grid container spacing={3}>
                    {leaveBalances.map((balance: EmployeeLeaveBalance) => (
                      <Grid component="div" size={{ xs: 12, sm: 6, md: 4 }} key={balance.id}>
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

                                {balance.available_balance <= (balance.low_balance_threshold || 0) && (
                                  <Alert severity="warning">
                                    Low balance alert
                                  </Alert>
                                )}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              )}

              {selectedTab === 2 && (
                <motion.div
                  key="calendar"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Team Leave Calendar - Enhanced Component */}
                  <LeaveCalendar />
                </motion.div>
              )}

              {selectedTab === 3 && (
                <motion.div
                  key="analytics"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Analytics */}
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    Leave Analytics
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid component="div" size={{ xs: 12, lg: 8 }}>
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
                    </Grid>

                    <Grid component="div" size={{ xs: 12, lg: 4 }}>
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
                                    value: leaveBalances.find((b: EmployeeLeaveBalance) => b.leave_type_id === type.id)?.used_balance || 0,
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
                    </Grid>
                  </Grid>
                </motion.div>
              )}

              {selectedTab === 4 && (
                <motion.div
                  key="policies"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Leave Policies */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      Leave Policies & Types
                    </Typography>
                    {hasPermission('manage_leave_types') && (
                      <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setShowLeaveTypeDialog(true)}>
                        Add Type
                      </Button>
                    )}
                  </Stack>

                  <Grid container spacing={3}>
                    {leaveTypes.map((type: LeaveType) => (
                      <Grid component="div" size={{ xs: 12 }} key={type.id}>
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
                                {(hasPermission('manage_leave_types') || true) && (
                                  <>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditLeaveType(type); }}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteLeaveType(type.id); }}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Stack>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid container spacing={3}>
                              <Grid component="div" size={{ xs: 12, sm: 6, md: 4 }}>
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
                              </Grid>

                              <Grid component="div" size={{ xs: 12, sm: 6, md: 4 }}>
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
                              </Grid>

                              <Grid component="div" size={{ xs: 12, sm: 6, md: 4 }}>
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
                              </Grid>

                              <Grid component="div" size={{ xs: 12 }}>
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
                              </Grid>
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              )}

              {selectedTab === 5 && (
                <motion.div
                  key="team-approvals"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <BulkApprovalInterface />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Leave Type Dialog */}
        <Dialog
          open={showLeaveTypeDialog}
          onClose={() => { setShowLeaveTypeDialog(false); resetLeaveTypeForm(); }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingLeaveType ? 'Edit Leave Type' : 'Add Leave Type'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid component="div" size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={leaveTypeFormData.name || ''}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, name: e.target.value })}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Code"
                  value={leaveTypeFormData.code || ''}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, code: e.target.value })}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Color"
                  type="color"
                  value={leaveTypeFormData.color_code || '#2196f3'}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, color_code: e.target.value })}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={2}
                  value={leaveTypeFormData.description || ''}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, description: e.target.value })}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Max Days/Year"
                  type="number"
                  value={leaveTypeFormData.max_days_per_year || 0}
                  onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, max_days_per_year: Number(e.target.value) })}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12 }}>
                <FormGroup>
                  <FormControlLabel
                    control={<Switch checked={leaveTypeFormData.is_paid || false} onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, is_paid: e.target.checked })} />}
                    label="Is Paid"
                  />
                  <FormControlLabel
                    control={<Switch checked={leaveTypeFormData.is_active || false} onChange={(e) => setLeaveTypeFormData({ ...leaveTypeFormData, is_active: e.target.checked })} />}
                    label="Is Active"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowLeaveTypeDialog(false); resetLeaveTypeForm(); }}>Cancel</Button>
            <Button variant="contained" onClick={handleLeaveTypeSubmit}>Save</Button>
          </DialogActions>
        </Dialog>

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
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
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
              </Grid>

              <Grid component="div" size={{ xs: 12, sm: 6 }}>
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
              </Grid>

              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={newRequest.start_date}
                  onChange={(e) => handleNewRequestChange('start_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={newRequest.end_date}
                  onChange={(e) => handleNewRequestChange('end_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid component="div" size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Reason"
                  value={newRequest.reason}
                  onChange={(e) => handleNewRequestChange('reason', e.target.value)}
                  placeholder="Brief reason for leave"
                />
              </Grid>

              <Grid component="div" size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Detailed Explanation"
                  value={newRequest.detailed_reason}
                  onChange={(e) => handleNewRequestChange('detailed_reason', e.target.value)}
                  placeholder="Provide additional details if necessary"
                />
              </Grid>

              <Grid component="div" size={{ xs: 12 }}>
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleRequestSubmit(newRequest)}
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
                <Grid container spacing={3}>
                  <Grid component="div" size={{ xs: 12, sm: 6 }}>
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
                        <strong>Status:</strong> <StatusChip status={selectedRequest.status} size="small" />
                      </Typography>
                      <Typography variant="body2">
                        <strong>Priority:</strong> {selectedRequest.priority}
                      </Typography>
                    </Stack>
                  </Grid>

                  <Grid component="div" size={{ xs: 12, sm: 6 }}>
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
                  </Grid>

                  <Grid component="div" size={{ xs: 12 }}>
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
                  </Grid>

                  {selectedRequest.medical_certificate_required && (
                    <Grid component="div" size={{ xs: 12 }}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          Medical certificate is required for this leave type.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
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
                {selectedRequest.status === 'approved' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={async () => {
                      const reason = window.prompt(
                        `Cancel this approved leave?\n\nThis will restore ${selectedRequest.total_days} day(s) to the employee's balance.\n\nPlease enter cancellation reason:`
                      );

                      if (!reason || reason.trim() === '') {
                        if (reason !== null) toast.error('Cancellation reason is required');
                        return;
                      }

                      try {
                        const result = await DatabaseService.cancelLeaveRequest(selectedRequest.id, reason.trim());

                        toast.success(`Leave cancelled! ${result.balance_restored} day(s) restored to balance`);
                        setSelectedRequest(null);
                        queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to cancel leave');
                      }
                    }}
                  >
                    Cancel Leave
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </motion.div>
  )
}

export default ComprehensiveLeaveManagement
