// Late Arrivals Tracker Component for HR/Admin
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    Box,
    TextField,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import { AccessTime, Warning } from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../lib/api';

export const LateArrivalsTracker: React.FC = () => {
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [departmentFilter, setDepartmentFilter] = useState<string>('');

    const { data: lateArrivals, isLoading, error } = useQuery({
        queryKey: ['late-arrivals', dateRange.startDate, dateRange.endDate, departmentFilter],
        queryFn: () => api.getLateArrivals(
            dateRange.startDate,
            dateRange.endDate,
            departmentFilter || undefined
        )
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

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">Failed to load late arrivals data</Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Warning color="warning" />
                        <Typography variant="h6">Late Arrivals Tracker</Typography>
                    </Box>
                    <Chip
                        label={`${lateArrivals?.length || 0} Late Arrivals`}
                        color="warning"
                        size="small"
                    />
                </Box>

                {/* Filters */}
                <Box display="flex" gap={2} mb={3}>
                    <TextField
                        label="Start Date"
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                </Box>

                {/* Table */}
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Employee</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Check-In Time</TableCell>
                                <TableCell>Late By</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lateArrivals && lateArrivals.length > 0 ? (
                                lateArrivals.map((record: any) => {
                                    const checkInHour = parseInt(record.check_in_hour);
                                    const checkInMinute = parseInt(record.check_in_minute);
                                    const lateMinutes = (checkInHour - 9) * 60 + (checkInMinute - 30);

                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar sx={{ width: 32, height: 32 }}>
                                                        {record.first_name?.[0]}{record.last_name?.[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {record.first_name} {record.last_name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {record.emp_number}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>{record.department || 'N/A'}</TableCell>
                                            <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <AccessTime fontSize="small" color="action" />
                                                    {format(new Date(record.check_in), 'hh:mm a')}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${lateMinutes} min`}
                                                    color={lateMinutes > 30 ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography color="textSecondary">No late arrivals found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default LateArrivalsTracker;
