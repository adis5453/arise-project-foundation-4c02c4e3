import React, { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Button,
    Stack,
    Chip,
    Avatar,
    Tooltip,
    useTheme,
    alpha,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Badge,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    Today,
    CalendarMonth,
    ViewWeek,
    ViewDay,
    FilterList,
    Download,
    Person,
} from '@mui/icons-material';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    isToday,
    parseISO,
    isWithinInterval,
} from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import DatabaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveCalendarProps {
    className?: string;
}

type ViewMode = 'month' | 'week' | 'day';

interface LeaveEvent {
    id: string;
    employee_id: string;
    employee_name: string;
    employee_avatar?: string;
    leave_type: string;
    leave_type_color: string;
    start_date: string;
    end_date: string;
    status: 'pending' | 'approved' | 'rejected';
    total_days: number;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ className }) => {
    const theme = useTheme();
    const { user } = useAuth();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('approved');

    // Fetch leave requests
    const { data: leaveRequests = [], isLoading } = useQuery({
        queryKey: ['leave-calendar', currentDate, selectedDepartment, statusFilter],
        queryFn: async () => {
            const requests = await DatabaseService.getLeaveRequests({});
            return requests.map((req: any) => ({
                id: req.id,
                employee_id: req.employee_id,
                employee_name: `${req.employee?.first_name} ${req.employee?.last_name}`,
                employee_avatar: req.employee?.profile_photo_url,
                leave_type: req.leave_type?.name || 'Leave',
                leave_type_color: req.leave_type?.color_code || '#1976d2',
                start_date: req.start_date,
                end_date: req.end_date,
                status: req.status,
                total_days: req.total_days || 1,
            }));
        },
    });

    // Filter requests based on status and view
    const filteredRequests = useMemo(() => {
        return leaveRequests.filter((req: LeaveEvent) => {
            if (statusFilter !== 'all' && req.status !== statusFilter) return false;
            return true;
        });
    }, [leaveRequests, statusFilter]);

    // Get calendar days based on view mode
    const calendarDays = useMemo(() => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate));
            const end = endOfWeek(endOfMonth(currentDate));
            return eachDayOfInterval({ start, end });
        } else if (viewMode === 'week') {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            return eachDayOfInterval({ start, end });
        } else {
            return [currentDate];
        }
    }, [currentDate, viewMode]);

    // Get leaves for a specific day
    const getLeavesForDay = (day: Date) => {
        return filteredRequests.filter((leave: LeaveEvent) => {
            const start = parseISO(leave.start_date);
            const end = parseISO(leave.end_date);
            return isWithinInterval(day, { start, end });
        });
    };

    // Navigation handlers
    const handlePrevious = () => {
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(subWeeks(currentDate, 1));
        } else {
            setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
        }
    };

    const handleNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(addWeeks(currentDate, 1));
        } else {
            setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Render day cell
    const renderDayCell = (day: Date) => {
        const leaves = getLeavesForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isTodayDate = isToday(day);

        return (
            <motion.div
                key={day.toString()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ height: viewMode === 'month' ? '120px' : '100%' }}
            >
                <Box
                    sx={{
                        height: '100%',
                        border: `1px solid ${theme.palette.divider}`,
                        bgcolor: isTodayDate
                            ? alpha(theme.palette.primary.main, 0.05)
                            : 'background.paper',
                        opacity: isCurrentMonth ? 1 : 0.4,
                        p: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'scale(1.02)',
                        },
                    }}
                >
                    <Stack spacing={0.5} height="100%">
                        {/* Day number */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: isTodayDate ? 700 : 400,
                                    color: isTodayDate ? 'primary.main' : 'text.primary',
                                }}
                            >
                                {format(day, 'd')}
                            </Typography>
                            {leaves.length > 0 && (
                                <Badge
                                    badgeContent={leaves.length}
                                    color="primary"
                                    sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                                />
                            )}
                        </Box>

                        {/* Leave indicators */}
                        <Stack spacing={0.5} sx={{ flex: 1, overflow: 'auto' }}>
                            {leaves.slice(0, viewMode === 'month' ? 3 : 10).map((leave: LeaveEvent) => (
                                <Tooltip
                                    key={leave.id}
                                    title={`${leave.employee_name} - ${leave.leave_type} (${leave.total_days} days)`}
                                    arrow
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            p: 0.5,
                                            borderRadius: 1,
                                            bgcolor: alpha(leave.leave_type_color, 0.15),
                                            borderLeft: `3px solid ${leave.leave_type_color}`,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: alpha(leave.leave_type_color, 0.25),
                                            },
                                        }}
                                    >
                                        <Avatar
                                            src={leave.employee_avatar}
                                            sx={{ width: 16, height: 16, fontSize: '0.6rem' }}
                                        >
                                            {leave.employee_name[0]}
                                        </Avatar>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.7rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                            }}
                                        >
                                            {leave.employee_name}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            ))}
                            {leaves.length > (viewMode === 'month' ? 3 : 10) && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    +{leaves.length - (viewMode === 'month' ? 3 : 10)} more
                                </Typography>
                            )}
                        </Stack>
                    </Stack>
                </Box>
            </motion.div>
        );
    };

    return (
        <Card className={className} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton onClick={handlePrevious} size="small">
                            <ChevronLeft />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
                            {viewMode === 'week' &&
                                `${format(startOfWeek(currentDate), 'MMM d')} - ${format(
                                    endOfWeek(currentDate),
                                    'MMM d, yyyy'
                                )}`}
                            {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <IconButton onClick={handleNext} size="small">
                            <ChevronRight />
                        </IconButton>
                        <Button size="small" startIcon={<Today />} onClick={handleToday}>
                            Today
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                        {/* View Mode Toggle */}
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, newMode) => newMode && setViewMode(newMode)}
                            size="small"
                        >
                            <ToggleButton value="month">
                                <Tooltip title="Month View">
                                    <CalendarMonth fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="week">
                                <Tooltip title="Week View">
                                    <ViewWeek fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="day">
                                <Tooltip title="Day View">
                                    <ViewDay fontSize="small" />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {/* Status Filter */}
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Export Button */}
                        <Tooltip title="Export Calendar">
                            <IconButton size="small">
                                <Download />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Calendar Legend */}
                <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
                    <Chip size="small" label={`${filteredRequests.length} Total Requests`} />
                    <Chip
                        size="small"
                        label={`${filteredRequests.filter((r: LeaveEvent) => r.status === 'approved').length} Approved`}
                        color="success"
                        variant="outlined"
                    />
                    <Chip
                        size="small"
                        label={`${filteredRequests.filter((r: LeaveEvent) => r.status === 'pending').length} Pending`}
                        color="warning"
                        variant="outlined"
                    />
                </Stack>

                {/* Calendar Grid */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {viewMode === 'month' && (
                        <Box>
                            {/* Weekday headers */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: 0,
                                    mb: 1,
                                }}
                            >
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                    <Typography
                                        key={day}
                                        variant="caption"
                                        sx={{
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                            p: 1,
                                        }}
                                    >
                                        {day}
                                    </Typography>
                                ))}
                            </Box>

                            {/* Calendar days */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: 0,
                                }}
                            >
                                {calendarDays.map((day) => renderDayCell(day))}
                            </Box>
                        </Box>
                    )}

                    {viewMode === 'week' && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(7, 1fr)',
                                gap: 1,
                                height: '100%',
                            }}
                        >
                            {calendarDays.map((day) => (
                                <Box key={day.toString()}>
                                    <Typography
                                        variant="caption"
                                        sx={{ fontWeight: 600, display: 'block', mb: 1, textAlign: 'center' }}
                                    >
                                        {format(day, 'EEE d')}
                                    </Typography>
                                    {renderDayCell(day)}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {viewMode === 'day' && (
                        <Box sx={{ height: '100%' }}>
                            {renderDayCell(currentDate)}
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default LeaveCalendar;
