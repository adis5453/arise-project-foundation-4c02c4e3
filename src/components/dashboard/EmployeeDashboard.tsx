import React from 'react'
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

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Welcome back, {profile?.first_name}! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {team ? `You are part of the ${team.name}` : 'Employee Dashboard'}
                </Typography>
            </Box>

            {/* Profile Completion Widget */}
            <ProfileCompletionWidget />

            <Grid container spacing={3}>
                {/* 1. Context Cards (Department & Team) */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing={3}>
                        {/* Department Info */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={heroCardSx('primary')}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.contrastText, 0.18) }}>
                                            <Business />
                                        </Avatar>
                                        <Typography variant="h6">My Department</Typography>
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                        {department?.name || 'No Department'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                        Manager: {department?.manager_fname} {department?.manager_lname || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Team Info */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={heroCardSx('secondary')}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.contrastText, 0.18) }}>
                                            <Group />
                                        </Avatar>
                                        <Typography variant="h6">My Team</Typography>
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                        {team?.name || 'No Team'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                        Lead: {team?.lead_fname} {team?.lead_lname || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Active Projects */}
                        <Grid size={{ xs: 12 }}>
                            <Card sx={{ borderRadius: 4 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Assignment color="primary" /> Active Projects ({myProjects.length})
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {myProjects.length === 0 ? (
                                        <Typography color="text.secondary">No active projects assigned.</Typography>
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
                                                        <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>{p.description}</Typography>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} />
                                                            <Typography variant="caption">{p.progress}% Done</Typography>
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

                {/* 2. Side Widgets (Colleagues & Leaves) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        {/* Team Members */}
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Team Members</Typography>
                                <List dense>
                                    {colleagues.length === 0 && <Typography variant="body2" color="text.secondary">No other members in this team.</Typography>}
                                    {colleagues.map((col: any) => (
                                        <ListItem key={col.id}>
                                            <ListItemAvatar>
                                                <Avatar src={col.avatar_url}>{col.first_name?.[0]}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={`${col.first_name} ${col.last_name}`}
                                            // secondary={col.position_name || 'Member'} // If position joined
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>

                        {/* Team Leave Calendar */}
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventBusy color="warning" /> Who is Away?
                                </Typography>
                                <List dense>
                                    {teamLeaves.length === 0 && <Typography variant="body2" color="text.secondary">Everyone is present.</Typography>}
                                    {teamLeaves.map((l: any) => (
                                        <ListItem key={l.id}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.18), color: theme.palette.warning.main }}>
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
