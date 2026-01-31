// Attendance Monthly Summary Component
// Add this to Attendance.tsx or create as a separate component

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Typography, Grid, Box, CircularProgress, Chip } from '@mui/material';
import {
    AccessTime,
    TrendingUp,
    EventBusy,
    Schedule
} from '@mui/icons-material';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface AttendanceSummaryProps {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
}

export const AttendanceMonthlySummary: React.FC<AttendanceSummaryProps> = ({
    employeeId,
    startDate,
    endDate
}) => {
    const { user } = useAuth();
    const targetEmployeeId = employeeId || user?.id;

    const { data: summary, isLoading } = useQuery({
        queryKey: ['attendance-summary', targetEmployeeId, startDate, endDate],
        queryFn: () => api.getAttendanceSummary(targetEmployeeId, startDate, endDate),
        enabled: !!targetEmployeeId
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card>
                <CardContent>
                    <Typography color="textSecondary">No attendance data available</Typography>
                </CardContent>
            </Card>
        );
    }

    const stats = [
        {
            label: 'Total Days',
            value: summary.total_days || 0,
            icon: <Schedule />,
            color: 'primary'
        },
        {
            label: 'Present Days',
            value: summary.present_days || 0,
            icon: <TrendingUp />,
            color: 'success'
        },
        {
            label: 'Half Days',
            value: summary.half_days || 0,
            icon: <EventBusy />,
            color: 'warning'
        },
        {
            label: 'Absent Days',
            value: summary.absent_days || 0,
            icon: <EventBusy />,
            color: 'error'
        },
        {
            label: 'Total Hours',
            value: `${summary.total_hours || 0}h`,
            icon: <AccessTime />,
            color: 'info'
        },
        {
            label: 'Overtime Hours',
            value: `${summary.total_overtime || 0}h`,
            icon: <TrendingUp />,
            color: 'secondary'
        },
        {
            label: 'Avg Hours/Day',
            value: `${summary.avg_hours_per_day || 0}h`,
            icon: <Schedule />,
            color: 'primary'
        }
    ];

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Monthly Attendance Summary
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {stats.map((stat, index) => (
                        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: `${stat.color}.50`,
                                    border: 1,
                                    borderColor: `${stat.color}.200`
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Box sx={{ color: `${stat.color}.main` }}>{stat.icon}</Box>
                                    <Typography variant="caption" color="textSecondary">
                                        {stat.label}
                                    </Typography>
                                </Box>
                                <Typography variant="h5" color={`${stat.color}.main`}>
                                    {stat.value}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Attendance Rate */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Attendance Rate
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'grey.200',
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${((summary.present_days || 0) / (summary.total_days || 1)) * 100}%`,
                                        bgcolor: 'success.main',
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </Box>
                        </Box>
                        <Chip
                            label={`${Math.round(((summary.present_days || 0) / (summary.total_days || 1)) * 100)}%`}
                            color="success"
                            size="small"
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default AttendanceMonthlySummary;
