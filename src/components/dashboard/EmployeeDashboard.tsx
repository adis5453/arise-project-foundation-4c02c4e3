import React, { useMemo } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Paper,
    CircularProgress,
    useTheme,
    alpha
} from '@mui/material'
import { Grid } from '@mui/material'
import {
    Group,
    Business,
    Assignment,
    Schedule,
    EventBusy,
    CheckCircle,
    TrendingUp,
    Person
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import ProfileCompletionWidget from './ProfileCompletionWidget'
import { DashboardHeroHeader } from './ui/DashboardHeroHeader'
import { DashboardQuickActionsBento, type DashboardQuickAction } from './ui/DashboardQuickActionsBento'
import { EmployeeKpiBento } from './ui/EmployeeKpiBento'
import { useNavigate } from 'react-router-dom'

interface DashboardContext {
    user: any;
    team: {
        id: string;
        name: string;
        lead_fname: string;
        lead_lname: string;
        type: string;
    } | null;
    department: {
        id: string;
        name: string;
        manager_fname: string;
        manager_lname: string;
    } | null;
    colleagues: any[];
    stats: {
        projects: number;
        leaves_pending: number;
    };
}

const EmployeeDashboard: React.FC = () => {
    const { profile } = useAuth()
    const theme = useTheme()
    const navigate = useNavigate()

    const { data: context, isLoading, error } = useQuery<DashboardContext>({
        queryKey: ['dashboard-context'],
        queryFn: async () => {
            const res = await api.get('/dashboard/context')
            return res
        }
    })

    const { data: teamLeaves = [] } = useQuery({
        queryKey: ['team-leaves'],
        queryFn: async () => {
            const res = await api.get('/leaves/team-calendar')
            return res
        }
    })

    const { data: myProjects = [] } = useQuery({
        queryKey: ['my-projects'],
        queryFn: async () => {
            const res = await api.get('/projects');
            return res;
        }
    })

    const leavesPending = Number(context?.stats?.leaves_pending ?? 0)

    const quickActions: DashboardQuickAction[] = useMemo(() => {
        return [
            {
                id: 'projects',
                label: 'Projects',
                icon: <Assignment />,
                color: 'primary',
                onClick: () => navigate('/projects'),
            },
            {
                id: 'attendance',
                label: 'Attendance',
                icon: <Schedule />,
                color: 'success',
                onClick: () => navigate('/attendance'),
            },
            {
                id: 'leave',
                label: 'Leave',
                icon: <EventBusy />,
                color: 'warning',
                badge: leavesPending,
                onClick: () => navigate('/leave'),
            },
            {
                id: 'directory',
                label: 'People',
                icon: <Group />,
                color: 'secondary',
                onClick: () => navigate('/hr/employees'),
            },
        ]
    }, [navigate, leavesPending])

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        )
    }

    // Fallback if no context (e.g. new employee/error)
    if (!context) return (
        <Box sx={{ p: 4, color: 'error.main' }}>
            <Typography variant="h6">Error loading dashboard context.</Typography>
            {/* @ts-ignore */}
            <Typography variant="body2">{error?.message || 'Unknown error'}</Typography>
        </Box>
    );

    const { team, department, colleagues } = context

    const heroCardSx = (tone: 'primary' | 'secondary') => ({
        height: '100%',
        color: theme.palette.getContrastText(theme.palette[tone].main),
        background: `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.96)} 0%, ${alpha(theme.palette[tone].dark, 0.92)} 100%)`,
        border: `1px solid ${alpha(theme.palette[tone].contrastText, 0.08)}`,
        borderRadius: 4,
        overflow: 'hidden',
    })

    const awayCount = Array.isArray(teamLeaves) ? teamLeaves.length : 0

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <DashboardHeroHeader
                name={`Welcome back, ${profile?.first_name || 'there'}`}
                subtitle={team ? `You’re in ${team.name}. Here’s what’s moving today.` : 'Your workstream, team, and time-off—one place.'}
                onRefresh={() => {
                    // Data queries are managed by react-query; forcing a full reload keeps this UI-only.
                    window.location.reload()
                }}
                onPrimaryAction={() => navigate('/leave')}
                primaryActionLabel="Request leave"
            />

            <EmployeeKpiBento
                metrics={{
                    projects: Array.isArray(myProjects) ? myProjects.length : 0,
                    colleagues: Array.isArray(colleagues) ? colleagues.length : 0,
                    away: awayCount,
                    pendingLeaves: leavesPending,
                }}
            />

            <DashboardQuickActionsBento actions={quickActions} />

            {/* Profile Completion Widget */}
            <ProfileCompletionWidget />

            <Grid container spacing={3}>
                {/* Main column */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Grid container spacing={3}>
                        {/* Department Info (glass shell + crisp inner) */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={heroCardSx('primary')}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.contrastText, 0.18) }}>
                                            <Business />
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 0.9 }}>
                                                Department
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                                                {department?.name || 'Not assigned'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            borderColor: alpha(theme.palette.common.white, 0.14),
                                            background: alpha(theme.palette.common.black, 0.12),
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Manager: {department?.manager_fname} {department?.manager_lname || 'N/A'}
                                        </Typography>
                                    </Paper>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Team Info */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card sx={heroCardSx('secondary')}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.contrastText, 0.18) }}>
                                            <Group />
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 0.9 }}>
                                                Team
                                            </Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
                                                {team?.name || 'Not assigned'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            borderColor: alpha(theme.palette.common.white, 0.14),
                                            background: alpha(theme.palette.common.black, 0.12),
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Lead: {team?.lead_fname} {team?.lead_lname || 'N/A'}
                                        </Typography>
                                    </Paper>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Active Projects */}
                        <Grid size={{ xs: 12 }}>
                            <Card
                                sx={{
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.78)} 0%, ${alpha(theme.palette.background.default, 0.55)} 100%)`,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                }}
                            >
                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 800,
                                            letterSpacing: -0.2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        <Assignment color="primary" /> Projects
                                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                            ({Array.isArray(myProjects) ? myProjects.length : 0})
                                        </Typography>
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    {myProjects.length === 0 ? (
                                        <Typography color="text.secondary">
                                            Nothing assigned yet—when you’re added to a project, it will show up here.
                                        </Typography>
                                    ) : (
                                        <Grid container spacing={2}>
                                            {myProjects.map((p: any) => (
                                                <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 3,
                                                            borderColor: alpha(theme.palette.divider, 0.7),
                                                            background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.9)})`,
                                                        }}
                                                    >
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                                            {p.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                                                            {p.description}
                                                        </Typography>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Chip
                                                                label={p.status}
                                                                size="small"
                                                                color={p.status === 'active' ? 'success' : 'default'}
                                                                sx={{ fontWeight: 700 }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                                                {p.progress}%
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Side column */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        <Card
                            sx={{
                                borderRadius: 4,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.78)} 0%, ${alpha(theme.palette.background.default, 0.55)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25 }}>
                                    Team
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    People you’ll collaborate with most.
                                </Typography>

                                <List dense>
                                    {colleagues.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No teammates found.
                                        </Typography>
                                    ) : null}
                                    {colleagues.map((col: any) => (
                                        <ListItem key={col.id}>
                                            <ListItemAvatar>
                                                <Avatar src={col.avatar_url}>{col.first_name?.[0]}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary={`${col.first_name} ${col.last_name}`} />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>

                        <Card
                            sx={{
                                borderRadius: 4,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.78)} 0%, ${alpha(theme.palette.background.default, 0.55)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1.25,
                                    }}
                                >
                                    <EventBusy color="warning" /> Away
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Who’s out so you can plan around it.
                                </Typography>

                                <List dense>
                                    {awayCount === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Everyone is in.
                                        </Typography>
                                    ) : null}
                                    {teamLeaves.map((l: any) => (
                                        <ListItem key={l.id}>
                                            <ListItemAvatar>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: alpha(theme.palette.warning.main, 0.18),
                                                        color: theme.palette.warning.main,
                                                    }}
                                                >
                                                    <Schedule />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${l.first_name} ${l.last_name}`}
                                                secondary={`Until ${new Date(l.end_date).toLocaleDateString()}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    )
}

export default EmployeeDashboard
