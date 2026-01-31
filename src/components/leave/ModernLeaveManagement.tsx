import React, { useState, useMemo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Button,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
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
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material'
import SimpleVirtualList from '../common/SimpleVirtualList'
import SimpleOptimizedImage from '../common/SimpleOptimizedImage'
import {
  EventNote,
  Schedule,
  CheckCircle,
  Cancel,
  Pending,
  Add,
  CalendarToday,
  TrendingUp,
  TrendingDown,
  Analytics,
  FilterList,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Download,
  Upload,
  Notifications,
  Warning,
  Info
} from '@mui/icons-material'
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
  ResponsiveContainer
} from 'recharts'
import { format, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'

interface LeaveRequest {
  id: string
  employee: {
    name: string
    avatar?: string
    department: string
    position: string
  }
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  appliedDate: string
  approver?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
}


// TODO: Connect to /api/leave/* endpoints when available
const mockLeaveRequests: LeaveRequest[] = []


// Leave Balance Card
const LeaveBalanceCard = ({ type, used, total, color }: any) => {
  const theme = useTheme()
  const percentage = (used / total) * 100
  const remaining = total - used

  return (

    <Card
      sx={{
        background: `linear-gradient(135deg, ${(theme.palette as any)[color].main}15 0%, ${(theme.palette as any)[color].main}05 100%)`,
        border: `1px solid ${alpha((theme.palette as any)[color].main, 0.2)}`,
        '&:hover': {
          boxShadow: `0 8px 32px ${alpha((theme.palette as any)[color].main, 0.2)}`
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              {type}
            </Typography>
            <Chip
              label={`${remaining} left`}
              size="small"
              color={remaining > 5 ? 'success' : remaining > 2 ? 'warning' : 'error'}
            />
          </Stack>

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Used: {used} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {total} days
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha((theme.palette as any)[color].main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: `${color}.main`,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>

  )
}

// Leave Request Card
const LeaveRequestCard = ({ request, onAction }: { request: LeaveRequest; onAction: (action: string, id: string) => void }) => {
  const theme = useTheme()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: alpha(theme.palette.primary.main, 0.3)
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: `${getPriorityColor(request.priority)}.main`,
                      border: `2px solid ${theme.palette.background.paper}`
                    }}
                  />
                }
              >
                {request.employee.avatar ? (
                  <SimpleOptimizedImage
                    src={request.employee.avatar}
                    alt={request.employee.name}
                    width={40}
                    height={40}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    priority={false}
                  />
                ) : (
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {request.employee.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                )}
              </Badge>

              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {request.employee.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.employee.position} • {request.employee.department}
                </Typography>
              </Box>
            </Stack>

            <Stack alignItems="flex-end" spacing={1}>
              <Chip
                label={request.status}
                size="small"
                color={getStatusColor(request.status) as any}
              />
              <Typography variant="caption" color="text.secondary">
                {request.priority} priority
              </Typography>
            </Stack>
          </Stack >

          {/* Leave Details */}
          {/* Leave Details */}
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              <Grid component="div" size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Leave Type
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {request.type}
                </Typography>
              </Grid>
              <Grid component="div" size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {request.days} days
                </Typography>
              </Grid>
              <Grid component="div" size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {format(parseISO(request.startDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
              <Grid component="div" size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {format(parseISO(request.endDate), 'MMM dd, yyyy')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Reason */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body2">
              {request.reason}
            </Typography>
          </Box>

          {/* Actions */}
          <Divider />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => onAction('view', request.id)}>
                <Visibility />
              </IconButton>
            </Tooltip>

            {request.status === 'pending' && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => onAction('approve', request.id)}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => onAction('reject', request.id)}
                >
                  Reject
                </Button>
              </>
            )}

            {request.status !== 'pending' && (
              <Chip
                label={`${request.status} ${request.approver ? `by ${request.approver}` : ''}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

// Quick Stats Component
const QuickStats = () => {
  const theme = useTheme()

  const stats = [
    {
      label: 'Pending Requests',
      value: 23,
      change: +5,
      color: 'warning',
      icon: <Pending />
    },
    {
      label: 'Approved Today',
      value: 8,
      change: +2,
      color: 'success',
      icon: <CheckCircle />
    },
    {
      label: 'On Leave Today',
      value: 45,
      change: -3,
      color: 'info',
      icon: <EventNote />
    },
    {
      label: 'Avg Processing Time',
      value: '2.5 days',
      change: -0.5,
      color: 'primary',
      icon: <Schedule />
    }
  ]

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid component="div" size={{ xs: 6, md: 3 }} key={index}>
          <div>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${(theme.palette as any)[stat.color].main}15 0%, ${(theme.palette as any)[stat.color].main}05 100%)`,
                border: `1px solid ${alpha((theme.palette as any)[stat.color].main, 0.2)}`
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 40,
                      height: 40
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {stat.label}
                    </Typography>
                  </Box>
                  {typeof stat.change === 'number' && (
                    <Stack alignItems="center">
                      {stat.change > 0 ? (
                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      <Typography
                        variant="caption"
                        color={stat.change > 0 ? 'success.main' : 'error.main'}
                      >
                        {Math.abs(stat.change)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </div>
        </Grid>
      ))}
    </Grid>
  )
}

const ModernLeaveManagement: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [tabValue, setTabValue] = useState(0)
  const [requests, setRequests] = useState<LeaveRequest[]>(mockLeaveRequests)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)

  const leaveBalances = [
    { type: 'Annual Leave', used: 12, total: 25, color: 'primary' },
    { type: 'Sick Leave', used: 3, total: 10, color: 'error' },
    { type: 'Personal Leave', used: 2, total: 5, color: 'info' },
    { type: 'Maternity Leave', used: 0, total: 90, color: 'success' }
  ]

  const handleRequestAction = (action: string, id: string) => {
    if (action === 'approve') {
      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'approved' as const } : req
      ))
    } else if (action === 'reject') {
      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: 'rejected' as const } : req
      ))
    }
  }

  const filteredRequests = useMemo(() => {
    switch (tabValue) {
      case 1: return requests.filter(req => req.status === 'pending')
      case 2: return requests.filter(req => req.status === 'approved')
      case 3: return requests.filter(req => req.status === 'rejected')
      default: return requests
    }
  }, [requests, tabValue])

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <div>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Leave Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage employee leave requests and balances
            </Typography>
          </Box>

          {!isMobile && (
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" startIcon={<Analytics />}>
                Reports
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowNewRequestDialog(true)}
              >
                New Request
              </Button>
            </Stack>
          )}
        </Stack>
      </div>

      {/* Quick Stats */}
      <div>
        <Box sx={{ mb: 4 }}>
          <QuickStats />
        </Box>
      </div>

      {/* Leave Balances */}
      <div>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
          Leave Balances
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {leaveBalances.map((balance, index) => (
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <LeaveBalanceCard {...balance} />
            </Grid>
          ))}
        </Grid>
      </div>

      {/* Leave Requests */}
      <div>
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight={600}>
                  Leave Requests
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small">
                    <FilterList />
                  </IconButton>
                  <IconButton size="small">
                    <Refresh />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>

            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{ px: 3 }}
            >
              <Tab label={`All (${requests.length})`} />
              <Tab label={`Pending (${requests.filter(r => r.status === 'pending').length})`} />
              <Tab label={`Approved (${requests.filter(r => r.status === 'approved').length})`} />
              <Tab label={`Rejected (${requests.filter(r => r.status === 'rejected').length})`} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              <SimpleVirtualList
                items={filteredRequests}
                height={500}
                itemHeight={140}
                renderItem={(request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    onAction={handleRequestAction}
                  />
                )}
                emptyMessage="No leave requests found"
              />

              {filteredRequests.length === 0 && (
                <Box textAlign="center" py={4}>
                  <EventNote sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No requests found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'No leave requests available' : `No ${['all', 'pending', 'approved', 'rejected'][tabValue]} requests`}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* New Request Dialog */}
      <Dialog
        open={showNewRequestDialog}
        onClose={() => setShowNewRequestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>New Leave Request</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Leave Type</InputLabel>
                  <Select label="Leave Type">
                    <MenuItem value="vacation">Vacation</MenuItem>
                    <MenuItem value="sick">Sick Leave</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="maternity">Maternity</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority">
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
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid component="div" size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  placeholder="Please provide a reason for your leave request..."
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewRequestDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowNewRequestDialog(false)}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ModernLeaveManagement
