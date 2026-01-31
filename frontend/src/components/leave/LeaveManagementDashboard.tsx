import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  LinearProgress,
  Divider,
  Stack,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse,
} from '@mui/material'
import {
  Add,
  FilterList,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  CalendarToday,
  TrendingUp,
  Warning,
  Group,
  Assignment,
  Notifications,
  Download,
  Refresh,
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  Visibility,
  History,
  Send,
  Comment,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { motion, AnimatePresence } from 'framer-motion'
import StatusChip from '../common/StatusChip'
import MetricCard from '../common/MetricCard'
import { LeaveRequestForm } from './LeaveRequestForm'
import { api } from '../../lib/api'
import dayjs, { Dayjs } from 'dayjs'

interface LeaveStats {
  totalRequests: number
  pendingApprovals: number
  approvedRequests: number
  rejectedRequests: number
  teamUtilization: number
  averageLeaveLength: number
  upcomingLeaves: number
  criticalCoverage: number
}

interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id?: string
  leave_type: string
  start_date: string
  end_date: string
  days_requested: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
  employee?: {
    first_name: string
    last_name: string
    department?: string
  }
}

interface ApprovalAction {
  type: 'approve' | 'reject' | 'request_info'
  requestId: string
  comments: string
  conditions?: string[]
}

import { useAuth } from '../../contexts/AuthContext'

interface LeaveManagementDashboardProps {
  employeeId?: string
  userRole?: 'employee' | 'manager' | 'hr' | 'admin'
}

export const LeaveManagementDashboard: React.FC<LeaveManagementDashboardProps> = (props) => {
  const { user } = useAuth()
  const employeeId = props.employeeId || user?.id || ''
  const userRole = props.userRole || (user?.role as any) || 'employee'
  const [activeTab, setActiveTab] = useState(0)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([])
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>({
    type: 'approve',
    requestId: '',
    comments: '',
  })

  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    dateRange: { start: null as Dayjs | null, end: null as Dayjs | null },
    employee: 'all',
  })

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetchData()
  }, [employeeId, userRole])

  useEffect(() => {
    applyFilters()
  }, [leaveRequests, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch leave requests from API
      const params: any = {}
      if (userRole === 'employee') {
        params.employee_id = employeeId
      }

      const requests = await api.getLeaves(params)
      // Handle both paginated response {items: [...]} and array response
      const requestsArray = Array.isArray(requests) ? requests : (requests?.items || [])
      setLeaveRequests(requestsArray)

      // Calculate stats from requests
      const stats = calculateStats(requestsArray)
      setLeaveStats(stats)
    } catch (error) {
      console.error('Failed to fetch leave data:', error)
      setLeaveRequests([])
      setLeaveStats({
        totalRequests: 0,
        pendingApprovals: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        teamUtilization: 0,
        averageLeaveLength: 0,
        upcomingLeaves: 0,
        criticalCoverage: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (requests: LeaveRequest[]): LeaveStats => {
    const pending = requests.filter(r => r.status === 'pending').length
    const approved = requests.filter(r => r.status === 'approved').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    const upcoming = requests.filter(r =>
      r.status === 'approved' && new Date(r.start_date) > new Date()
    ).length
    const totalDays = requests.reduce((acc, r) => acc + (r.days_requested || 0), 0)
    const avgDays = requests.length > 0 ? totalDays / requests.length : 0

    return {
      totalRequests: requests.length,
      pendingApprovals: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      teamUtilization: Math.round((approved / Math.max(requests.length, 1)) * 100),
      averageLeaveLength: Math.round(avgDays * 10) / 10,
      upcomingLeaves: upcoming,
      criticalCoverage: 100
    }
  }

  const applyFilters = () => {
    const safeLeaveRequests = Array.isArray(leaveRequests) ? leaveRequests : []
    let filtered = [...safeLeaveRequests]

    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    if (filters.leaveType !== 'all') {
      filtered = filtered.filter(req => req.leave_type === filters.leaveType)
    }

    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(req => {
        const startDate = dayjs(req.start_date)
        return (startDate.isAfter(filters.dateRange.start!) || startDate.isSame(filters.dateRange.start!)) &&
          (startDate.isBefore(filters.dateRange.end!) || startDate.isSame(filters.dateRange.end!))
      })
    }

    if (filters.employee !== 'all' && userRole !== 'employee') {
      filtered = filtered.filter(req => req.employee_id === filters.employee)
    }

    setFilteredRequests(filtered)
  }

  const handleApprovalAction = async (action: ApprovalAction) => {
    try {
      const newStatus = action.type === 'approve' ? 'approved' : 'rejected'
      await api.updateLeaveStatus(action.requestId, {
        status: newStatus,
        reviewer_comments: action.comments
      })
      setApprovalDialogOpen(false)
      setApprovalAction({ type: 'approve', requestId: '', comments: '' })
      fetchData() // Refresh data
    } catch (error) {
      console.error('Failed to process approval:', error)
    }
  }

  const handleCreateLeaveRequest = async (request: any) => {
    try {
      await api.createLeaveRequest(request)
      setShowRequestForm(false)
      fetchData()
    } catch (error) {
      console.error('Failed to create leave request:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getLeaveTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      annual: '🏖️',
      sick: '🏥',
      personal: '👤',
      emergency: '🚨',
      maternity: '👶',
      paternity: '👨‍👶',
      study: '📚',
      compensatory: '⚖️',
      casual: '🌴',
      earned: '💼',
    }
    return icons[type?.toLowerCase()] || '📅'
  }

  const canApproveReject = () => {
    return userRole === 'manager' || userRole === 'hr' || userRole === 'admin'
  }

  const TabPanel = ({ children, value, index }: { children: React.ReactNode, value: number, index: number }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Metrics Cards */}
      <Grid component="div" size={{ xs: 12, md: 3 }}>
        <MetricCard
          title="Total Requests"
          value={leaveStats?.totalRequests || 0}
          change={12}
          changeType="increase"
          icon={<Assignment />}
          color="primary"
        />
      </Grid>
      <Grid component="div" size={{ xs: 12, md: 3 }}>
        <MetricCard
          title="Pending Approvals"
          value={leaveStats?.pendingApprovals || 0}
          change={5}
          changeType="decrease"
          icon={<Schedule />}
          color="warning"
        />
      </Grid>
      <Grid component="div" size={{ xs: 12, md: 3 }}>
        <MetricCard
          title="Team Utilization"
          value={`${leaveStats?.teamUtilization || 0}%`}
          change={8}
          changeType="increase"
          icon={<Group />}
          color="success"
        />
      </Grid>
      <Grid component="div" size={{ xs: 12, md: 3 }}>
        <MetricCard
          title="Avg Leave Days"
          value={leaveStats?.averageLeaveLength || 0}
          change={2}
          changeType="decrease"
          icon={<TrendingUp />}
          color="info"
        />
      </Grid>

      {/* Recent Requests */}
      <Grid component="div" size={{ xs: 12, lg: 8 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Requests</Typography>
              <Button
                startIcon={<Refresh />}
                onClick={fetchData}
                disabled={loading}
                size="small"
              >
                Refresh
              </Button>
            </Box>

            {filteredRequests.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No leave requests found
                </Typography>
              </Paper>
            ) : (
              <List>
                {filteredRequests.slice(0, 5).map((request) => (
                  <ListItem key={request.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getLeaveTypeIcon(request.leave_type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {request.leave_type?.charAt(0).toUpperCase() + request.leave_type?.slice(1)} Leave
                          </Typography>
                          <StatusChip status={request.status as any} size="sm" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.days_requested} day(s) • {request.reason?.substring(0, 50) || 'No reason provided'}...
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() => setSelectedRequest(request)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Upcoming Leaves */}
      <Grid component="div" size={{ xs: 12, lg: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Leaves
            </Typography>

            <Stack spacing={2}>
              {(() => {
                const upcomingLeaves = (Array.isArray(leaveRequests) ? leaveRequests : [])
                  .filter(req => req.status === 'approved' && new Date(req.start_date) > new Date())
                  .slice(0, 4)

                if (upcomingLeaves.length === 0) {
                  return (
                    <Paper sx={{ p: 3, bgcolor: 'background.default', textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No upcoming approved leaves
                      </Typography>
                    </Paper>
                  )
                }

                return upcomingLeaves.map((request) => (
                  <Paper key={request.id} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {getLeaveTypeIcon(request.leave_type || '')} {request.leave_type || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(request.start_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${request.days_requested} days`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                ))
              })()}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const renderRequestsTab = () => (
    <Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid component="div" size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid component="div" size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={filters.leaveType}
                  onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
                  label="Leave Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="annual">Annual</MenuItem>
                  <MenuItem value="sick">Sick</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="earned">Earned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid component="div" size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="From Date"
                value={filters.dateRange.start ? filters.dateRange.start : null}
                onChange={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: date } })}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="To Date"
                value={filters.dateRange.end ? filters.dateRange.end : null}
                onChange={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: date } })}
                slotProps={{
                  textField: { fullWidth: true, size: 'small' }
                }}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilters({
                  status: 'all',
                  leaveType: 'all',
                  dateRange: { start: null, end: null },
                  employee: 'all',
                })}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No leave requests found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {request.employee?.first_name?.[0] || 'E'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {request.employee?.first_name || 'Employee'} {request.employee?.last_name || ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.employee?.department || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{getLeaveTypeIcon(request.leave_type)}</span>
                            <Typography variant="body2">
                              {request.leave_type?.charAt(0).toUpperCase() + request.leave_type?.slice(1)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(request.start_date).toLocaleDateString()} -
                          </Typography>
                          <Typography variant="body2">
                            {new Date(request.end_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${request.days_requested} day${request.days_requested > 1 ? 's' : ''}`}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={request.status as any} size="sm" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {canApproveReject() && request.status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => {
                                      setApprovalAction({
                                        type: 'approve',
                                        requestId: request.id,
                                        comments: '',
                                      })
                                      setApprovalDialogOpen(true)
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setApprovalAction({
                                        type: 'reject',
                                        requestId: request.id,
                                        comments: '',
                                      })
                                      setApprovalDialogOpen(true)
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRequests.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>
    </Box>
  )

  const renderAnalyticsTab = () => (
    <Grid container spacing={3}>
      <Grid component="div" size={{ xs: 12 }}>
        <Alert severity="info">
          Advanced analytics and reporting features coming soon!
        </Alert>
      </Grid>
    </Grid>
  )

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Leave Management
        </Typography>
        {(userRole === 'employee' || userRole === 'manager') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowRequestForm(true)}
            size="large"
          >
            Request Leave
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Overview" />
        <Tab
          label={
            <Badge badgeContent={leaveStats?.pendingApprovals || 0} color="warning">
              Requests
            </Badge>
          }
        />
        <Tab label="Analytics" />
      </Tabs>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {renderOverviewTab()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderRequestsTab()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderAnalyticsTab()}
      </TabPanel>

      {/* Leave Request Form */}
      <LeaveRequestForm
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleCreateLeaveRequest}
        employeeId={employeeId}
      />

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalAction.type === 'approve' ? 'Approve' : 'Reject'} Leave Request
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments"
            value={approvalAction.comments}
            onChange={(e) => setApprovalAction({ ...approvalAction, comments: e.target.value })}
            placeholder="Add your comments for this decision..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={approvalAction.type === 'approve' ? 'success' : 'error'}
            onClick={() => handleApprovalAction(approvalAction)}
          >
            {approvalAction.type === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  )
}
