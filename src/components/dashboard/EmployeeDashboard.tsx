import React from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    Grid,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    Paper,
    CircularProgress
} from '@mui/material'
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

            {/* @ts-ignore */}
            <Grid container spacing={3}>
                {/* 1. Context Cards (Department & Team) */}
                {/* @ts-ignore */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* @ts-ignore */}
                    <Grid container spacing={3}>
                        {/* Department Info */}
                        {/* @ts-ignore */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Business /></Avatar>
                                        <Typography variant="h6">My Department</Typography>
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                        {department?.name || 'No Department'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Manager: {department?.manager_fname} {department?.manager_lname || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Team Info */}
                        {/* @ts-ignore */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #00695c 0%, #004d40 100%)', color: 'white' }}>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><Group /></Avatar>
                                        <Typography variant="h6">My Team</Typography>
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                        {team?.name || 'No Team'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Lead: {team?.lead_fname} {team?.lead_lname || 'N/A'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Active Projects */}
                        {/* @ts-ignore */}
                        <Grid size={{ xs: 12 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Assignment color="primary" /> Active Projects ({myProjects.length})
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {myProjects.length === 0 ? (
                                        <Typography color="text.secondary">No active projects assigned.</Typography>
                                    ) : (
                                        /* @ts-ignore */
                                        <Grid container spacing={2}>
                                            {myProjects.map((p: any) => (
                                                /* @ts-ignore */
                                                <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                                                    <Paper variant="outlined" sx={{ p: 2 }}>
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
                {/* @ts-ignore */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={3}>
                        {/* Team Members */}
                        <Card>
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
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventBusy color="warning" /> Who is Away?
                                </Typography>
                                <List dense>
                                    {teamLeaves.length === 0 && <Typography variant="body2" color="text.secondary">Everyone is present.</Typography>}
                                    {teamLeaves.map((l: any) => (
                                        <ListItem key={l.id}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'warning.light' }}><Schedule /></Avatar>
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
