import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    IconButton,
    Button,
    Chip,
    Stack,
    CircularProgress
} from '@mui/material';
import {
    Computer,
    PhoneIphone,
    TabletMac,
    Delete,
    AccessTime,
    LocationOn
} from '@mui/icons-material';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Session {
    id: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    ipAddress: string;
    location?: string;
    lastActive: string;
    isCurrent: boolean;
}

export const SessionManagement = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await api.get('/auth/sessions');
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions', error);
            // Mock data for now if API fails
            setSessions([
                {
                    id: '1',
                    deviceType: 'desktop',
                    browser: 'Chrome 120.0',
                    os: 'Windows 11',
                    ipAddress: '192.168.1.1',
                    lastActive: new Date().toISOString(),
                    isCurrent: true
                },
                {
                    id: '2',
                    deviceType: 'mobile',
                    browser: 'Safari',
                    os: 'iOS 17',
                    ipAddress: '10.0.0.1',
                    lastActive: new Date(Date.now() - 86400000).toISOString(),
                    isCurrent: false
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            setSessions(sessions.filter(s => s.id !== sessionId));
            toast.success('Session revoked');
        } catch (error) {
            toast.error('Failed to revoke session');
        }
    };

    const handleRevokeAllOther = async () => {
        try {
            await api.delete('/auth/sessions/other');
            setSessions(sessions.filter(s => s.isCurrent));
            toast.success('All other sessions revoked');
        } catch (error) {
            toast.error('Failed to revoke sessions');
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'mobile': return <PhoneIphone />;
            case 'tablet': return <TabletMac />;
            default: return <Computer />;
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h6">Active Sessions</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage devices where you're currently logged in
                    </Typography>
                </Box>
                {sessions.length > 1 && (
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRevokeAllOther}
                        size="small"
                    >
                        Revoke All Other Sessions
                    </Button>
                )}
            </Stack>

            <List>
                {sessions.map((session) => (
                    <ListItem
                        key={session.id}
                        secondaryAction={
                            !session.isCurrent && (
                                <IconButton
                                    edge="end"
                                    aria-label="revoke"
                                    onClick={() => handleRevokeSession(session.id)}
                                >
                                    <Delete />
                                </IconButton>
                            )
                        }
                    >
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: session.isCurrent ? 'primary.main' : 'action.disabledBackground' }}>
                                {getDeviceIcon(session.deviceType)}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="subtitle2">
                                        {session.browser} on {session.os}
                                    </Typography>
                                    {session.isCurrent && (
                                        <Chip label="Current Device" size="small" color="success" />
                                    )}
                                </Stack>
                            }
                            secondary={
                                <Stack direction="row" spacing={2} mt={0.5}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <LocationOn sx={{ fontSize: 16 }} />
                                        <Typography variant="caption">{session.location || 'Unknown Location'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTime sx={{ fontSize: 16 }} />
                                        <Typography variant="caption">
                                            {session.isCurrent ? 'Active now' : new Date(session.lastActive).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Stack>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};
