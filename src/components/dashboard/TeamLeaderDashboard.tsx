import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
    Avatar,
    Button,
    IconButton,
    Divider,
    useTheme,
    alpha,
    LinearProgress,
    Badge,
    Tooltip,
} from '@mui/material';
import {
    Group as GroupIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Person as PersonIcon,
    EventNote as EventNoteIcon,
    Assessment as AssessmentIcon,
    Refresh as RefreshIcon,
    Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import DatabaseService from '../../services/databaseService';
import RealTimeAttendanceDashboard from '../attendance/RealTimeAttendanceDashboard';
import BulkApprovalInterface from '../leave/BulkApprovalInterface';
import LeaveCalendar from '../leave/LeaveCalendar';
import { toast } from 'sonner';

interface TeamStats {
    totalMembers: number;
    presentToday: number;
    onLeave: number;
    pendingApprovals: number;
    attendanceRate: number;
    leaveUtilization: number;
}

interface DirectReport {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    department: string;
    position: string;
    status: 'present' | 'absent' | 'on_leave' | 'late';
}

const TeamLeaderDashboard: React.FC = () => {
    const theme = useTheme();
    const { user, profile } = useAuth();
    const [selectedView, setSelectedView] = useState<'overview' | 'attendance' | 'approvals' | 'calendar'>('overview');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch team members
    const { data: teamMembers = [], isLoading, refetch } = useQuery({
        queryKey: ['team-members', profile?.id],
        queryFn: async () => {
            const members = await DatabaseService.getTeamMembers(profile?.id || '');
            return members;
        },
        enabled: !!profile?.id,
        refetchInterval: autoRefresh ? 60000 : false, // Auto-refresh every 60 seconds
    });

    // Fetch pending leave requests for team
    const { data: pendingLeaves = [] } = useQuery({
        queryKey: ['pending-team-leaves', profile?.id],
        queryFn: async () => {
            const requests = await DatabaseService.getLeaveRequests();
            return requests.filter((r: any) => r.status === 'pending' && r.manager_id === profile?.id);
        },
        enabled: !!profile?.id,
        refetchInterval: autoRefresh ? 30000 : false,
    });

    // Fetch team statistics with real trends from backend
    const { data: backendStats } = useQuery({
        queryKey: ['team-stats', profile?.id],
        queryFn: async () => {
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) return null;
            return response.json();
        },
        enabled: !!profile?.id,
        refetchInterval: autoRefresh ? 60000 : false,
    });

    // Calculate team statistics with REAL trends (no mocks!)
    const teamStats: TeamStats = {
        totalMembers: teamMembers.length,
        presentToday: teamMembers.filter((m: any) => m.status === 'present').length,
        onLeave: teamMembers.filter((m: any) => m.status === 'on_leave').length,
        pendingApprovals: pendingLeaves.length,
        attendanceRate: teamMembers.length > 0
            ? (teamMembers.filter((m: any) => m.status === 'present').length / teamMembers.length) * 100
            : 0,
        leaveUtilization: teamMembers.length > 0
            ? (teamMembers.filter((m: any) => m.status === 'on_leave').length / teamMembers.length) * 100
            : 0,
    };

    // Get real trend percentages from backend
    const presentTodayTrend = backendStats?.admin?.present_today_change || 0;

    const StatCard: React.FC<{
        title: string;
        value: number | string;
        icon: React.ReactNode;
        color: string;
        trend?: number;
        suffix?: string;
    }> = ({ title, value, icon, color, trend, suffix = '' }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card
                sx={{
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
                    border: `1px solid ${alpha(color, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 24px ${alpha(color, 0.3)}`,
                    },
                }}
            >
                <CardContent>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Avatar
                                sx={{
                                    bgcolor: color,
                                    width: 48,
                                    height: 48,
                                }}
                            >
                                {icon}
                            </Avatar>
                            {trend && (
                                <Chip
                                    label={`${trend > 0 ? '+' : ''}${trend}%`}
                                    size="small"
                                    color={trend > 0 ? 'success' : 'error'}
                                    icon={<TrendingUpIcon style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />}
                                />
                            )}
                        </Stack>
                        <Box>
                            <Typography variant="h3" fontWeight={700} sx={{ color }}>
                                {value}{suffix}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {title}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </motion.div>
    );

    const QuickActionButton: React.FC<{
        label: string;
        icon: React.ReactNode;
        onClick: () => void;
        badge?: number;
    }> = ({ label, icon, onClick, badge }) => (
        <Button
            variant="outlined"
            startIcon={icon}
            onClick={onClick}
            sx={{
                borderRadius: 2,
                textTransform: 'none',
                py: 1.5,
                position: 'relative',
            }}
        >
            {label}
            {badge && badge > 0 && (
                <Badge
                    badgeContent={badge}
                    color="error"
                    sx={{
                        '& .MuiBadge-badge': {
                            right: -12,
                            top: -8,
                        },
                    }}
                />
            )}
        </Button>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        Team Leader Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {profile?.first_name}! Here's your team overview.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Tooltip title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}>
                        <IconButton
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            color={autoRefresh ? 'primary' : 'default'}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Notifications">
                        <IconButton>
                            <Badge badgeContent={pendingLeaves.length} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* View Selection */}
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <QuickActionButton
                    label="Overview"
                    icon={<AssessmentIcon />}
                    onClick={() => setSelectedView('overview')}
                />
                <QuickActionButton
                    label="Team Attendance"
                    icon={<GroupIcon />}
                    onClick={() => setSelectedView('attendance')}
                />
                <QuickActionButton
                    label="Leave Approvals"
                    icon={<CheckCircleIcon />}
                    onClick={() => setSelectedView('approvals')}
                    badge={pendingLeaves.length}
                />
                <QuickActionButton
                    label="Team Calendar"
                    icon={<EventNoteIcon />}
                    onClick={() => setSelectedView('calendar')}
                />
            </Stack>

            {/* Overview Statistics */}
            {selectedView === 'overview' && (
                <>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Team Members"
                                value={teamStats.totalMembers}
                                icon={<GroupIcon />}
                                color={theme.palette.primary.main}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Present Today"
                                value={teamStats.presentToday}
                                icon={<CheckCircleIcon />}
                                color={theme.palette.success.main}
                                trend={presentTodayTrend}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="On Leave"
                                value={teamStats.onLeave}
                                icon={<EventNoteIcon />}
                                color={theme.palette.warning.main}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <StatCard
                                title="Pending Approvals"
                                value={teamStats.pendingApprovals}
                                icon={<ScheduleIcon />}
                                color={theme.palette.error.main}
                            />
                        </Grid>
                    </Grid>

                    {/* Team Performance Metrics */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Attendance Rate
                                    </Typography>
                                    <Box sx={{ mb: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                This Month
                                            </Typography>
                                            <Typography variant="h6" fontWeight={600}>
                                                {teamStats.attendanceRate.toFixed(1)}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={teamStats.attendanceRate}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: theme.palette.success.main,
                                                    borderRadius: 4,
                                                },
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Target: 95% • Current: {teamStats.attendanceRate.toFixed(1)}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Leave Utilization
                                    </Typography>
                                    <Box sx={{ mb: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                This Year
                                            </Typography>
                                            <Typography variant="h6" fontWeight={600}>
                                                {teamStats.leaveUtilization}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={teamStats.leaveUtilization}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    backgroundColor: theme.palette.info.main,
                                                    borderRadius: 4,
                                                },
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Healthy range: 60-80% • Current: {teamStats.leaveUtilization}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Direct Reports List */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Direct Reports ({teamMembers.length})
                            </Typography>
                            <Grid container spacing={2}>
                                {isLoading ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography color="text.secondary" align="center">
                                            Loading team members...
                                        </Typography>
                                    </Grid>
                                ) : teamMembers.length === 0 ? (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography color="text.secondary" align="center">
                                            No team members found
                                        </Typography>
                                    </Grid>
                                ) : (
                                    teamMembers.map((member: any) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={member.id}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        boxShadow: 2,
                                                        transform: 'translateY(-2px)',
                                                    },
                                                }}
                                            >
                                                <CardContent>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Avatar
                                                            src={member.avatar_url}
                                                            sx={{ width: 48, height: 48 }}
                                                        >
                                                            {member.first_name?.[0]}{member.last_name?.[0]}
                                                        </Avatar>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight={600}>
                                                                {member.first_name} {member.last_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {member.position}
                                                            </Typography>
                                                        </Box>
                                                        <Chip
                                                            label={member.status || 'Unknown'}
                                                            size="small"
                                                            color={
                                                                member.status === 'present'
                                                                    ? 'success'
                                                                    : member.status === 'on_leave'
                                                                        ? 'warning'
                                                                        : 'default'
                                                            }
                                                        />
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Team Attendance View */}
            {selectedView === 'attendance' && (
                <RealTimeAttendanceDashboard />
            )}

            {/* Leave Approvals View */}
            {selectedView === 'approvals' && (
                <BulkApprovalInterface />
            )}

            {/* Team Calendar View */}
            {selectedView === 'calendar' && (
                <LeaveCalendar />
            )}
        </Box>
    );
};

export default TeamLeaderDashboard;
