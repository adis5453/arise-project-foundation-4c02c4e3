import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Paper,
  useTheme,
  alpha,
  Skeleton
} from '@mui/material'
import { styled, keyframes } from '@mui/material/styles'
import {
  TrendingUp,
  TrendingDown,
  People,
  Schedule,
  Assignment,
  AttachMoney,
  Notifications,
  MoreVert,
  Add,
  CheckCircle,
  Warning,
  Error,
  Info,
  Business,
  PersonAdd,
  Today,
  Event,
  Message
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import DatabaseService from '../../services/databaseService'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import AnimatedCounter from '../common/AnimatedCounter'
import GlassCard from '../common/GlassCard'

// Keyframes for animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`

// Styled glass stat card
const GlassStatCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(73, 151, 232, 0.15)',
  borderRadius: 20,
  padding: theme.spacing(3),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    borderColor: 'rgba(107, 181, 239, 0.4)',
    boxShadow: '0 20px 40px rgba(73, 151, 232, 0.15)',
    transform: 'translateY(-4px)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'linear-gradient(90deg, #4997e8 0%, #6bb5ef 50%, #347bdc 100%)',
    borderRadius: '20px 20px 0 0',
  },
}))

// Animated icon container
const IconContainer = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
  },
}))

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  pendingLeaves: number
  attendanceRate: number
  payrollPending: number
  newHires: number
  upcomingEvents: number
  unreadMessages: number
}

interface RecentActivity {
  id: string
  type: 'leave' | 'attendance' | 'employee' | 'payroll' | 'message'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
  user?: {
    name: string
    avatar?: string
  }
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  path: string
  badge?: number
}

import EmployeeDashboard from './EmployeeDashboard'

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()

  // Determine if user is Admin/HR
  const userRole = profile?.role?.name || 'employee';
  const isAdmin = ['super_admin', 'admin', 'hr_manager'].includes(userRole);

  // If NOT admin, show Employee Dashboard
  if (!isAdmin) {
    return <EmployeeDashboard />
  }

  // --- Exact COPY of original Admin Dashboard Logic below ---

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    attendanceRate: 0,
    payrollPending: 0,
    newHires: 0,
    upcomingEvents: 0,
    unreadMessages: 0
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  const quickActions: QuickAction[] = [
    {
      id: 'add-employee',
      title: 'Add Employee',
      description: 'Register new employee',
      icon: <PersonAdd />,
      color: theme.palette.primary.main,
      path: '/hr/employee-management',
      badge: 0
    },
    {
      id: 'attendance',
      title: 'Mark Attendance',
      description: 'Record daily attendance',
      icon: <Schedule />,
      color: theme.palette.success.main,
      path: '/attendance'
    },
    {
      id: 'leave-request',
      title: 'Leave Requests',
      description: 'Review pending requests',
      icon: <Assignment />,
      color: theme.palette.warning.main,
      path: '/leave',
      badge: stats.pendingLeaves
    },
    {
      id: 'payroll',
      title: 'Process Payroll',
      description: 'Manage employee payroll',
      icon: <AttachMoney />,
      color: theme.palette.info.main,
      path: '/payroll',
      badge: stats.payrollPending
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Team communications',
      icon: <Message />,
      color: theme.palette.secondary.main,
      path: '/messages',
      badge: stats.unreadMessages
    },
    {
      id: 'reports',
      title: 'Generate Reports',
      description: 'Analytics & insights',
      icon: <TrendingUp />,
      color: theme.palette.error.main,
      path: '/reports'
    }
  ]

  // Fetch live dashboard data with REAL percentages from database
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Call enhanced /stats endpoint that calculates real growth percentages
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch stats')
        return
      }

      const data = await response.json()

      // Use REAL data from database (no mocks!)
      setStats({
        totalEmployees: data.admin?.total_employees || 0,
        activeEmployees: data.admin?.present_today || 0,
        pendingLeaves: data.admin?.pending_approvals || 0,
        attendanceRate: data.admin?.present_today
          ? Math.round((data.admin.present_today / data.admin.total_employees) * 100)
          : 0,
        payrollPending: 0, // TODO: Add to backend
        newHires: data.admin?.new_hires_this_month || 0,
        upcomingEvents: 0, // TODO: Add to backend
        unreadMessages: 0 // TODO: Add to backend
      })

      // Fetch recent leave requests for activity feed (LIVE DATA)
      const leaveResponse = await fetch('/api/leave/requests?limit=4&sort_by=created_at&sort_order=desc', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (leaveResponse.ok) {
        const leaveData = await leaveResponse.json()
        const leaves = leaveData.items || leaveData || []

        const activities: RecentActivity[] = leaves.map((leave: any, idx: number) => ({
          id: leave.id,
          type: 'leave',
          title: `${leave.status === 'approved' ? 'Leave Approved' : leave.status === 'rejected' ? 'Leave Rejected' : 'Leave Requested'}`,
          description: `${leave.employee?.first_name || 'Employee'} - ${leave.leave_type?.name || 'Leave'}`,
          timestamp: new Date(leave.created_at).toLocaleDateString(),
          status: leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'info' : 'warning',
          user: {
            name: leave.employee ? `${leave.employee.first_name} ${leave.employee.last_name}` : 'Unknown'
          }
        }))

        setRecentActivity(activities)
      }

    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    // Set up real-time updates
    const interval = window.setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />
      case 'warning': return <Warning color="warning" />
      case 'error': return <Error color="error" />
      default: return <Info color="info" />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {profile?.first_name || 'Admin'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening in your organization today
        </Typography>
      </Box>

      {/* Stats Cards - Premium Glass Design */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 3, mb: 4 }}>
        {loading ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <Box key={i} sx={{ p: 3, borderRadius: 5, bgcolor: 'background.paper' }}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 4 }} />
            </Box>
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <GlassStatCard>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" fontSize="0.875rem" fontWeight={500} gutterBottom>
                      Total Employees
                    </Typography>
                    <AnimatedCounter
                      value={stats.totalEmployees}
                      variant="h3"
                      fontWeight={800}
                      gradient
                    />
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 1,
                        py: 0.3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1)
                      }}>
                        <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          +{stats.newHires}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        this month
                      </Typography>
                    </Stack>
                  </Box>
                  <IconContainer
                    sx={{
                      background: 'linear-gradient(135deg, #4997e8 0%, #347bdc 100%)',
                      animation: `${float} 3s ease-in-out infinite`
                    }}
                  >
                    <People sx={{ color: '#fff', fontSize: 28 }} />
                  </IconContainer>
                </Stack>
              </GlassStatCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GlassStatCard>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" fontSize="0.875rem" fontWeight={500} gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <AnimatedCounter
                        value={stats.attendanceRate}
                        suffix="%"
                        variant="h3"
                        fontWeight={800}
                        gradient
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={stats.attendanceRate}
                      sx={{
                        mt: 2,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>
                  <IconContainer
                    sx={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      ml: 2,
                      animation: `${float} 3s ease-in-out infinite`,
                      animationDelay: '0.5s'
                    }}
                  >
                    <Schedule sx={{ color: '#fff', fontSize: 28 }} />
                  </IconContainer>
                </Stack>
              </GlassStatCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassStatCard>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" fontSize="0.875rem" fontWeight={500} gutterBottom>
                      Pending Leaves
                    </Typography>
                    <AnimatedCounter
                      value={stats.pendingLeaves}
                      variant="h3"
                      fontWeight={800}
                      gradient
                    />
                    <Box sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      mt: 1.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.warning.main, 0.1)
                    }}>
                      <Typography variant="caption" color="warning.main" fontWeight={600}>
                        ⚠️ Requires attention
                      </Typography>
                    </Box>
                  </Box>
                  <IconContainer
                    sx={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      animation: `${float} 3s ease-in-out infinite`,
                      animationDelay: '1s'
                    }}
                  >
                    <Assignment sx={{ color: '#fff', fontSize: 28 }} />
                  </IconContainer>
                </Stack>
              </GlassStatCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassStatCard>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" fontSize="0.875rem" fontWeight={500} gutterBottom>
                      Active Employees
                    </Typography>
                    <AnimatedCounter
                      value={stats.activeEmployees}
                      variant="h3"
                      fontWeight={800}
                      gradient
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                      Currently working today
                    </Typography>
                  </Box>
                  <IconContainer
                    sx={{
                      background: 'linear-gradient(135deg, #6bb5ef 0%, #4997e8 100%)',
                      animation: `${float} 3s ease-in-out infinite`,
                      animationDelay: '1.5s'
                    }}
                  >
                    <Business sx={{ color: '#fff', fontSize: 28 }} />
                  </IconContainer>
                </Stack>
              </GlassStatCard>
            </motion.div>
          </>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Quick Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {quickActions.map((action) => (
                <Paper
                  key={action.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${alpha(action.color, 0.2)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                      borderColor: action.color
                    }
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={action.badge} color="error">
                      <Avatar sx={{ bgcolor: alpha(action.color, 0.1), color: action.color }}>
                        {action.icon}
                      </Avatar>
                    </Badge>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {action.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Activity
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Stack>
            <List sx={{ p: 0 }}>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getStatusIcon(activity.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {activity.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default Dashboard
