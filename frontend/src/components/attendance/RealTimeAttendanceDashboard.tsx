import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
    Avatar,
    Grid,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    LinearProgress,
    Badge,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
    Divider,
    Button,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    AccessTime,
    Warning,
    TrendingUp,
    TrendingDown,
    Refresh,
    Search,
    FilterList,
    Download,
    People,
    PersonOff,
    Schedule,
    Circle,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import DatabaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO, differenceInMinutes, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface RealTimeAttendanceDashboardProps {
    className?: string;
}

interface EmployeeStatus {
    id: string;
    name: string;
    avatar?: string;
    department: string;
    position: string;
    status: 'present' | 'absent' | 'late' | 'on_break' | 'checked_out';
    check_in_time?: string;
    check_out_time?: string;
    late_by_minutes?: number;
    work_hours?: number;
    expected_time?: string;
    location?: string;
}

export const RealTimeAttendanceDashboard: React.FC<RealTimeAttendanceDashboardProps> = ({
    className,
}) => {
    const theme = useTheme();
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch today's attendance records
    const {
        data: attendanceData = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['real-time-attendance', new Date().toDateString()],
        queryFn: async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const records = await DatabaseService.getAttendanceRecords({
                startDate: today,
                endDate: today,
            });

            // Get all employees
            const allEmployees = await DatabaseService.getAllEmployees?.() || [];

            // Map attendance to employee status
            const statusMap = new Map();

            records.forEach((record: any) => {
                const checkInTime = record.check_in ? parseISO(record.check_in) : null;
                const expectedTime = parseISO(`${today}T09:00:00`); // Standard 9 AM start
                const lateByMinutes = checkInTime
                    ? Math.max(0, differenceInMinutes(checkInTime, expectedTime))
                    : 0;

                statusMap.set(record.employee_id, {
                    id: record.employee_id,
                    name: `${record.employee?.first_name || ''} ${record.employee?.last_name || ''}`,
                    avatar: record.employee?.profile_photo_url,
                    department: record.employee?.department || 'N/A',
                    position: record.employee?.position || 'N/A',
                    status: record.check_out
                        ? 'checked_out'
                        : record.break_start && !record.break_end
                            ? 'on_break'
                            : lateByMinutes > 0
                                ? 'late'
                                : 'present',
                    check_in_time: record.check_in,
                    check_out_time: record.check_out,
                    late_by_minutes: lateByMinutes,
                    work_hours: record.total_hours || 0,
                    expected_time: '09:00 AM',
                    location: record.location,
                });
            });

            // Add absent employees
            allEmployees.forEach((emp: any) => {
                if (!statusMap.has(emp.id)) {
                    statusMap.set(emp.id, {
                        id: emp.id,
                        name: `${emp.first_name} ${emp.last_name}`,
                        avatar: emp.profile_photo_url,
                        department: emp.department || 'N/A',
                        position: emp.position || 'N/A',
                        status: 'absent',
                        expected_time: '09:00 AM',
                    });
                }
            });

            return Array.from(statusMap.values());
        },
        refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
    });

    // Calculate statistics
    const stats = useMemo(() => {
        const total = attendanceData.length;
        const present = attendanceData.filter((e: EmployeeStatus) =>
            ['present', 'late', 'on_break'].includes(e.status)
        ).length;
        const absent = attendanceData.filter((e: EmployeeStatus) => e.status === 'absent').length;
        const late = attendanceData.filter((e: EmployeeStatus) => e.status === 'late').length;
        const onBreak = attendanceData.filter((e: EmployeeStatus) => e.status === 'on_break').length;

        return {
            total,
            present,
            absent,
            late,
            onBreak,
            presentPercentage: total > 0 ? (present / total) * 100 : 0,
        };
    }, [attendanceData]);

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return attendanceData.filter((emp: EmployeeStatus) => {
            const matchesSearch =
                searchQuery === '' ||
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;

            const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [attendanceData, searchQuery, departmentFilter, statusFilter]);

    // Get status color and icon
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'present':
                return { color: theme.palette.success.main, icon: <CheckCircle />, label: 'Present' };
            case 'absent':
                return { color: theme.palette.error.main, icon: <Cancel />, label: 'Absent' };
            case 'late':
                return { color: theme.palette.warning.main, icon: <Warning />, label: 'Late' };
            case 'on_break':
                return { color: theme.palette.info.main, icon: <AccessTime />, label: 'On Break' };
            case 'checked_out':
                return { color: theme.palette.grey[500], icon: <Circle />, label: 'Checked Out' };
            default:
                return { color: theme.palette.grey[400], icon: <Circle />, label: 'Unknown' };
        }
    };

    // Get unique departments
    const departments = useMemo(() => {
        const depts = new Set(attendanceData.map((e: EmployeeStatus) => e.department));
        return Array.from(depts).sort();
    }, [attendanceData]);

    return (
        <Card className={className}>
            <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h5" fontWeight={600}>
                            Live Attendance
                        </Typography>
                        <Chip
                            icon={<Circle sx={{ fontSize: 12 }} />}
                            label="Live"
                            size="small"
                            color="success"
                            sx={{ animation: 'pulse 2s infinite' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Last updated: {format(new Date(), 'h:mm:ss a')}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}>
                            <IconButton size="small" onClick={() => setAutoRefresh(!autoRefresh)}>
                                <Refresh
                                    sx={{
                                        animation: autoRefresh ? 'spin 2s linear infinite' : 'none',
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                        <Button size="small" startIcon={<Download />} variant="outlined">
                            Export
                        </Button>
                    </Stack>
                </Stack>

                {/* Statistics Cards */}
                <Grid container spacing={2} mb={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        <People />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight={700}>
                                            {stats.total}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Employees
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                        <CheckCircle />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight={700}>
                                            {stats.present}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Present ({stats.presentPercentage.toFixed(0)}%)
                                        </Typography>
                                    </Box>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={stats.presentPercentage}
                                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                                    color="success"
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'error.main' }}>
                                        <PersonOff />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight={700}>
                                            {stats.absent}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Absent
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                        <Warning />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight={700}>
                                            {stats.late}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Late Arrivals
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Filters */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                    <TextField
                        size="small"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flex: 1 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={departmentFilter}
                            label="Department"
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Departments</MenuItem>
                            {departments.map((dept) => (
                                <MenuItem key={dept} value={dept}>
                                    {dept}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="present">Present</MenuItem>
                            <MenuItem value="late">Late</MenuItem>
                            <MenuItem value="absent">Absent</MenuItem>
                            <MenuItem value="on_break">On Break</MenuItem>
                            <MenuItem value="checked_out">Checked Out</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Employee List */}
                {isLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Loading attendance data...
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                        <AnimatePresence>
                            {filteredEmployees.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                                    No employees found matching the filters
                                </Typography>
                            ) : (
                                <Stack spacing={1.5}>
                                    {filteredEmployees.map((employee: EmployeeStatus, index: number) => {
                                        const statusConfig = getStatusConfig(employee.status);

                                        return (
                                            <motion.div
                                                key={employee.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.02 }}
                                            >
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        borderRadius: 2,
                                                        borderLeft: `4px solid ${statusConfig.color}`,
                                                        bgcolor: 'background.paper',
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: alpha(statusConfig.color, 0.02),
                                                            transform: 'translateX(4px)',
                                                        },
                                                    }}
                                                >
                                                    <Stack direction="row" alignItems="center" spacing={2}>
                                                        {/* Employee Avatar & Info */}
                                                        <Badge
                                                            overlap="circular"
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            badgeContent={
                                                                <Box
                                                                    sx={{
                                                                        width: 12,
                                                                        height: 12,
                                                                        borderRadius: '50%',
                                                                        bgcolor: statusConfig.color,
                                                                        border: '2px solid white',
                                                                    }}
                                                                />
                                                            }
                                                        >
                                                            <Avatar src={employee.avatar} sx={{ width: 48, height: 48 }}>
                                                                {employee.name[0]}
                                                            </Avatar>
                                                        </Badge>

                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="subtitle1" fontWeight={600} noWrap>
                                                                {employee.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {employee.position} • {employee.department}
                                                            </Typography>
                                                        </Box>

                                                        {/* Status */}
                                                        <Chip
                                                            icon={statusConfig.icon}
                                                            label={statusConfig.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(statusConfig.color, 0.15),
                                                                color: statusConfig.color,
                                                                fontWeight: 500,
                                                                '& .MuiChip-icon': {
                                                                    color: statusConfig.color,
                                                                },
                                                            }}
                                                        />

                                                        {/* Time Info */}
                                                        <Box sx={{ minWidth: 200, textAlign: 'right' }}>
                                                            {employee.check_in_time && (
                                                                <Typography variant="body2">
                                                                    Check-in: {format(parseISO(employee.check_in_time), 'h:mm a')}
                                                                </Typography>
                                                            )}
                                                            {employee.late_by_minutes! > 0 && (
                                                                <Typography variant="caption" color="warning.main">
                                                                    Late by {employee.late_by_minutes} mins
                                                                </Typography>
                                                            )}
                                                            {employee.work_hours! > 0 && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Work hours: {(employee.work_hours || 0).toFixed(1)}h
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            </motion.div>
                                        );
                                    })}
                                </Stack>
                            )}
                        </AnimatePresence>
                    </Box>
                )}
            </CardContent>

            <style>
                {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </Card>
    );
};

export default RealTimeAttendanceDashboard;
