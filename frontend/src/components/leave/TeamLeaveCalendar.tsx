import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AvatarGroup,
  LinearProgress,
} from '@mui/material'
import {
  CalendarToday,
  Person,
  Group,
  Warning,
  CheckCircle,
  Error,
  MoreVert,
  FilterList,
  ViewWeek,
  ViewModule,
  Today,
  NavigateBefore,
  NavigateNext,
  Assignment,
  Visibility,
  Edit,
  Delete,
  Add,
  Refresh,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusChip } from '../common/StatusChip'
import { api } from '../../lib/api'
import { format, startOfMonth, endOfMonth, addDays, isBefore, isAfter, isEqual, isSameDay, parseISO } from 'date-fns'

type ViewType = 'month' | 'week' | 'day'

interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: string
  leave_type_id?: string
  start_date: string
  end_date: string
  days_requested: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason?: string
  employee?: {
    first_name: string
    last_name: string
    department?: string
    avatar_url?: string
  }
}

interface LeaveEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    employeeId: string
    employeeName: string
    leaveType: string
    status: string
    avatar?: string
    department: string
    conflictLevel: 'none' | 'low' | 'medium' | 'high'
    delegations: any[]
  }
}

interface TeamCoverageInfo {
  date: string
  totalTeamSize: number
  onLeave: number
  available: number
  coveragePercentage: number
  criticalRoles: string[]
  conflicts: string[]
}

import { useAuth } from '../../contexts/AuthContext'

interface TeamLeaveCalendarProps {
  employeeId?: string
  userRole?: 'employee' | 'manager' | 'hr' | 'admin'
  departmentId?: string
}

const leaveTypeColors: Record<string, string> = {
  annual: '#4f46e5',
  sick: '#ef4444',
  personal: '#06b6d4',
  emergency: '#f59e0b',
  maternity: '#ec4899',
  paternity: '#8b5cf6',
  study: '#10b981',
  compensatory: '#6b7280',
  casual: '#3b82f6',
  earned: '#14b8a6',
}

const leaveTypeIcons: Record<string, string> = {
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

export const TeamLeaveCalendar: React.FC<TeamLeaveCalendarProps> = ({
  employeeId: propEmployeeId,
  userRole: propUserRole,
  departmentId: propDepartmentId,
}) => {
  const { user, profile } = useAuth()
  const employeeId = propEmployeeId || user?.id || ''
  const userRole = propUserRole || (profile?.role as any) || 'employee'
  const departmentId = propDepartmentId || profile?.department
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<LeaveEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<ViewType>('month')
  const [selectedEvent, setSelectedEvent] = useState<LeaveEvent | null>(null)
  const [coverageDialogOpen, setCoverageDialogOpen] = useState(false)
  const [teamCoverage, setTeamCoverage] = useState<TeamCoverageInfo[]>([])
  const [filters, setFilters] = useState({
    department: 'all',
    leaveType: 'all',
    status: 'all',
    showConflicts: false,
  })

  useEffect(() => {
    fetchLeaveEvents()
    fetchTeamCoverage()
  }, [employeeId, userRole, departmentId, currentDate, filters])

  const fetchLeaveEvents = async () => {
    setLoading(true)
    try {
      // Fetch leave requests from API
      const params: any = {}
      if (userRole !== 'hr' && userRole !== 'admin') {
        params.department_id = departmentId
      }

      const leaveRequests = await api.getLeaves(params)
      // Handle both paginated response {items: [...]} and array response
      const requestsArray = Array.isArray(leaveRequests) ? leaveRequests : (leaveRequests?.items || [])

      // Filter based on current filters
      let filteredRequests = requestsArray.filter((request: LeaveRequest) => {
        if (filters.department !== 'all' && request.employee?.department !== filters.department) return false
        if (filters.leaveType !== 'all' && request.leave_type !== filters.leaveType) return false
        if (filters.status !== 'all' && request.status !== filters.status) return false
        return true
      })

      // Convert to calendar events
      const calendarEvents: LeaveEvent[] = filteredRequests.map((request: LeaveRequest) => ({
        id: request.id,
        title: `${leaveTypeIcons[request.leave_type] || '📅'} ${request.employee?.first_name || 'Employee'} ${request.employee?.last_name || ''}`,
        start: new Date(request.start_date),
        end: new Date(request.end_date),
        resource: {
          employeeId: request.employee_id,
          employeeName: `${request.employee?.first_name || ''} ${request.employee?.last_name || ''}`.trim() || 'Employee',
          leaveType: request.leave_type,
          status: request.status,
          avatar: request.employee?.avatar_url,
          department: request.employee?.department || '',
          conflictLevel: calculateConflictLevel(request, filteredRequests),
          delegations: []
        },
      }))

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to fetch leave events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamCoverage = async () => {
    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      const coverage: TeamCoverageInfo[] = []

      let date = startDate
      while (isBefore(date, endDate) || isSameDay(date, endDate)) {
        const dayEvents = events.filter(event =>
          (isBefore(event.start, date) || isSameDay(event.start, date)) &&
          (isAfter(event.end, date) || isSameDay(event.end, date)) &&
          event.resource.status === 'approved'
        )

        coverage.push({
          date: format(date, 'yyyy-MM-dd'),
          totalTeamSize: 20, // This should come from actual team data
          onLeave: dayEvents.length,
          available: 20 - dayEvents.length,
          coveragePercentage: ((20 - dayEvents.length) / 20) * 100,
          criticalRoles: dayEvents
            .filter(event => ['manager', 'lead'].includes(event.resource.department))
            .map(event => event.resource.employeeName),
          conflicts: dayEvents.length > 5 ? ['Team understaffed'] : [],
        })
        date = addDays(date, 1)
      }

      setTeamCoverage(coverage)
    } catch (error) {
      console.error('Failed to fetch team coverage:', error)
    }
  }

  const calculateConflictLevel = (request: LeaveRequest, allRequests: LeaveRequest[]): 'none' | 'low' | 'medium' | 'high' => {
    const overlapping = allRequests.filter(r =>
      r.id !== request.id &&
      r.status === 'approved' &&
      r.employee?.department === request.employee?.department &&
      (
        (new Date(r.start_date) <= new Date(request.end_date)) &&
        (new Date(r.end_date) >= new Date(request.start_date))
      )
    )

    if (overlapping.length >= 5) return 'high'
    if (overlapping.length >= 3) return 'medium'
    if (overlapping.length >= 1) return 'low'
    return 'none'
  }

  const getCoverageColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  const handleSelectEvent = (event: LeaveEvent) => {
    setSelectedEvent(event)
  }

  const renderEventDetails = () => {
    if (!selectedEvent) return null

    return (
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Leave Details</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <StatusChip status={selectedEvent.resource.status as any} size="sm" />
              {selectedEvent.resource.conflictLevel !== 'none' && (
                <Chip
                  size="small"
                  label={`${selectedEvent.resource.conflictLevel} conflict`}
                  color={
                    selectedEvent.resource.conflictLevel === 'high' ? 'error' :
                      selectedEvent.resource.conflictLevel === 'medium' ? 'warning' : 'default'
                  }
                />
              )}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Employee Information */}
            <Grid component="div" size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar src={selectedEvent.resource.avatar}>
                      {selectedEvent.resource.employeeName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedEvent.resource.employeeName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedEvent.resource.department}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Grid container spacing={2}>
                    <Grid component="div" size={{ xs: 6 }}>
                      <Typography variant="subtitle2">Leave Type</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{leaveTypeIcons[selectedEvent.resource.leaveType] || '📅'}</span>
                        <Typography variant="body2">
                          {selectedEvent.resource.leaveType?.charAt(0).toUpperCase() + selectedEvent.resource.leaveType?.slice(1)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid component="div" size={{ xs: 6 }}>
                      <Typography variant="subtitle2">Duration</Typography>
                      <Typography variant="body2">
                        {Math.ceil((selectedEvent.end.getTime() - selectedEvent.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                      </Typography>
                    </Grid>
                    <Grid component="div" size={{ xs: 12 }}>
                      <Typography variant="subtitle2">Dates</Typography>
                      <Typography variant="body2">
                        {format(selectedEvent.start, 'MMM dd, yyyy')} - {format(selectedEvent.end, 'MMM dd, yyyy')}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Team Impact */}
            <Grid component="div" size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Team Impact</Typography>

                  {selectedEvent.resource.conflictLevel !== 'none' && (
                    <Alert
                      severity={
                        selectedEvent.resource.conflictLevel === 'high' ? 'error' :
                          selectedEvent.resource.conflictLevel === 'medium' ? 'warning' : 'info'
                      }
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2">
                        {selectedEvent.resource.conflictLevel.toUpperCase()} CONFLICT DETECTED
                      </Typography>
                      <Typography variant="body2">
                        Multiple team members will be absent during this period.
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Team Coverage</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Available Staff</Typography>
                      <Typography variant="body2" fontWeight="bold">85%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1, bgcolor: 'success.main', height: 8, borderRadius: 1 }} />
                      <Typography variant="caption">17/20</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Overlapping Leaves */}
            <Grid component="div" size={{ xs: 12 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Overlapping Leaves</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {events
                      .filter(event =>
                        event.id !== selectedEvent.id &&
                        event.resource.department === selectedEvent.resource.department &&
                        (
                          (event.start <= selectedEvent.end) &&
                          (event.end >= selectedEvent.start)
                        )
                      )
                      .map((event) => (
                        <Chip
                          key={event.id}
                          label={`${event.resource.employeeName} (${event.resource.leaveType})`}
                          size="small"
                          avatar={<Avatar src={event.resource.avatar}>{event.resource.employeeName.charAt(0)}</Avatar>}
                        />
                      ))}
                  </Box>
                  {events.filter(event =>
                    event.id !== selectedEvent.id &&
                    event.resource.department === selectedEvent.resource.department
                  ).length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No overlapping leaves in the same department.
                      </Typography>
                    )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
          {(userRole === 'manager' || userRole === 'hr') && (
            <Button variant="outlined" startIcon={<Edit />}>
              Modify
            </Button>
          )}
        </DialogActions>
      </Dialog>
    )
  }

  const renderCoverageIndicator = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Team Coverage Overview</Typography>
          <Button
            size="small"
            onClick={() => setCoverageDialogOpen(true)}
            startIcon={<Visibility />}
          >
            View Details
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid component="div" size={{ xs: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                85%
              </Typography>
              <Typography variant="caption">Current Coverage</Typography>
            </Box>
          </Grid>
          <Grid component="div" size={{ xs: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {events.filter(e => e.resource.status === 'approved').length}
              </Typography>
              <Typography variant="caption">On Leave Today</Typography>
            </Box>
          </Grid>
          <Grid component="div" size={{ xs: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {events.filter(e => e.resource.conflictLevel === 'high').length}
              </Typography>
              <Typography variant="caption">Critical Gaps</Typography>
            </Box>
          </Grid>
          <Grid component="div" size={{ xs: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                15
              </Typography>
              <Typography variant="caption">Available</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Critical alerts */}
        <Box sx={{ mt: 2 }}>
          {teamCoverage.some(day => day.coveragePercentage < 60) && (
            <Alert severity="warning" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Coverage Alert</Typography>
              <Typography variant="body2">
                Critical understaffing detected on multiple days this month.
              </Typography>
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  )

  const renderFilters = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid component="div" size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                label="Department"
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="hr">Human Resources</MenuItem>
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
              </Select>
            </FormControl>
          </Grid>
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
              </Select>
            </FormControl>
          </Grid>
          <Grid component="div" size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({
                department: 'all',
                leaveType: 'all',
                status: 'all',
                showConflicts: false,
              })}
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid component="div" size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchLeaveEvents}
              disabled={loading}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  if (loading && events.length === 0) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading team calendar...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Team Leave Calendar
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Request Leave
          </Button>
        </Box>
      </Box>

      {/* Coverage Indicator */}
      {renderCoverageIndicator()}

      {/* Filters */}
      {renderFilters()}

      {/* Calendar - Simple list view */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Leave Calendar - {format(currentDate, 'MMMM yyyy')}
          </Typography>

          {events.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No leave events found</Typography>
              <Typography variant="body2" color="text.secondary">
                No leave requests match the current filters.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid component="div" size={{ xs: 12, md: 6 }} key={event.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(event.start, 'MMM dd, yyyy')} - {format(event.end, 'MMM dd, yyyy')}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          size="small"
                          label={event.resource.status}
                          color={
                            event.resource.status === 'approved' ? 'success' :
                              event.resource.status === 'pending' ? 'warning' : 'error'
                          }
                        />
                        {event.resource.conflictLevel !== 'none' && (
                          <Chip
                            size="small"
                            label={`${event.resource.conflictLevel} conflict`}
                            color="warning"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {renderEventDetails()}

      {/* Coverage Details Dialog */}
      <Dialog
        open={coverageDialogOpen}
        onClose={() => setCoverageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Detailed Coverage Analysis</DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Team Size</TableCell>
                  <TableCell>On Leave</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Coverage %</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamCoverage.slice(0, 10).map((day) => (
                  <TableRow key={day.date} hover>
                    <TableCell>{format(parseISO(day.date), 'MMM dd')}</TableCell>
                    <TableCell>{day.totalTeamSize}</TableCell>
                    <TableCell>{day.onLeave}</TableCell>
                    <TableCell>{day.available}</TableCell>
                    <TableCell>{day.coveragePercentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          day.coveragePercentage >= 80 ? 'Good' :
                            day.coveragePercentage >= 60 ? 'Warning' : 'Critical'
                        }
                        color={getCoverageColor(day.coveragePercentage)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoverageDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
