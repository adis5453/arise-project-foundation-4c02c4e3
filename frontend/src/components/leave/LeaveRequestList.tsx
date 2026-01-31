import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Stack,
  Chip,
  Button,
  Paper,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  FilterAltOff as ClearFiltersIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';

import { LeaveRequest } from './types';
import { LeaveRequestCard } from './LeaveRequestCard';
import { useLeaveRequests } from '../../hooks/useLeaveManagement';
import { filterLeaveRequests, sortLeaveRequests } from '../../utils/leaveUtils';

const SORT_OPTIONS = [
  { value: 'start_date:desc', label: 'Newest First' },
  { value: 'start_date:asc', label: 'Oldest First' },
  { value: 'status:asc', label: 'Status (A-Z)' },
  { value: 'status:desc', label: 'Status (Z-A)' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'next_30_days', label: 'Next 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

interface LeaveRequestListProps {
  employeeId?: string;
  statusFilter?: string[];
  showFilters?: boolean;
  showSearch?: boolean;
  showActions?: boolean;
  showEmployeeInfo?: boolean;
  onRequestClick?: (request: LeaveRequest) => void;
  onNewRequest?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export const LeaveRequestList: React.FC<LeaveRequestListProps> = ({
  employeeId,
  statusFilter,
  showFilters = true,
  showSearch = true,
  showActions = true,
  showEmployeeInfo = false,
  onRequestClick,
  onNewRequest,
  onRefresh,
  className = '',
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('start_date:desc');
  const [statuses, setStatuses] = useState<string[]>(statusFilter || []);
  const [dateRange, setDateRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(dayjs(startOfMonth(new Date())));
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(dayjs(endOfMonth(new Date())));
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch leave requests
  const {
    data: leaveRequestsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useLeaveRequests(employeeId ? { employee_id: employeeId } : {});

  // Extract items from paginated response
  const leaveRequests = leaveRequestsResponse?.items || [];

  // Fetch leave types for filtering
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      // This would be an API call in a real app
      return [
        { id: '1', name: 'Annual Leave', code: 'AL' },
        { id: '2', name: 'Sick Leave', code: 'SL' },
        { id: '3', name: 'Personal Leave', code: 'PL' },
        { id: '4', name: 'Unpaid Leave', code: 'UL' },
      ];
    },
  });

  // Apply filters and sorting
  const filteredRequests = useMemo(() => {
    let result = [...leaveRequests];

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (request) =>
          request.leave_type?.name.toLowerCase().includes(term) ||
          request.reason?.toLowerCase().includes(term) ||
          (request.employee &&
            `${request.employee.first_name} ${request.employee.last_name}`.toLowerCase().includes(term)
          )
      );
    }

    // Apply status filter
    if (statuses.length > 0) {
      result = result.filter((request) => statuses.includes(request.status));
    }

    // Apply date range filter
    if (dateRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(
        (request) => request.start_date <= today && request.end_date >= today
      );
    } else if (dateRange === 'this_week') {
      const today = new Date();
      const startOfWeek = format(subDays(today, today.getDay()), 'yyyy-MM-dd');
      const endOfWeek = format(
        new Date(today.setDate(today.getDate() + (6 - today.getDay()))),
        'yyyy-MM-dd'
      );
      result = result.filter(
        (request) =>
          (request.start_date >= startOfWeek && request.start_date <= endOfWeek) ||
          (request.end_date >= startOfWeek && request.end_date <= endOfWeek) ||
          (request.start_date <= startOfWeek && request.end_date >= endOfWeek)
      );
    } else if (dateRange === 'this_month') {
      const today = new Date();
      const startOfMonth = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
      const endOfMonth = format(
        new Date(today.getFullYear(), today.getMonth() + 1, 0),
        'yyyy-MM-dd'
      );
      result = result.filter(
        (request) =>
          (request.start_date >= startOfMonth && request.start_date <= endOfMonth) ||
          (request.end_date >= startOfMonth && request.end_date <= endOfMonth) ||
          (request.start_date <= startOfMonth && request.end_date >= endOfMonth)
      );
    } else if (dateRange === 'next_30_days') {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);

      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(in30Days, 'yyyy-MM-dd');

      result = result.filter(
        (request) =>
          (request.start_date >= startDate && request.start_date <= endDate) ||
          (request.end_date >= startDate && request.end_date <= endDate) ||
          (request.start_date <= startDate && request.end_date >= endDate)
      );
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const startDate = format(customStartDate.toDate(), 'yyyy-MM-dd');
      const endDate = format(customEndDate.toDate(), 'yyyy-MM-dd');

      result = result.filter(
        (request) =>
          (request.start_date >= startDate && request.start_date <= endDate) ||
          (request.end_date >= startDate && request.end_date <= endDate) ||
          (request.start_date <= startDate && request.end_date >= endDate)
      );
    }

    // Apply leave type filter
    if (selectedLeaveTypes.length > 0) {
      result = result.filter((request) =>
        selectedLeaveTypes.includes(request.leave_type_id)
      );
    }

    // Apply sorting
    const [sortField, sortOrder] = sortBy.split(':');
    return sortLeaveRequests(
      result,
      sortField as any,
      sortOrder as 'asc' | 'desc'
    );
  }, [
    leaveRequests,
    searchTerm,
    statuses,
    dateRange,
    customStartDate,
    customEndDate,
    selectedLeaveTypes,
    sortBy,
  ]);

  // Handle filter changes
  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setStatuses(typeof value === 'string' ? value.split(',') : value);
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value);
  };

  const handleLeaveTypeChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedLeaveTypes(typeof value === 'string' ? value.split(',') : value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatuses(statusFilter || []);
    setDateRange('this_month');
    setSelectedLeaveTypes([]);
    setCustomStartDate(dayjs(startOfMonth(new Date())));
    setCustomEndDate(dayjs(endOfMonth(new Date())));
  };

  const hasActiveFilters =
    searchTerm ||
    (statuses.length > 0 && JSON.stringify(statuses) !== JSON.stringify(statusFilter || [])) ||
    dateRange !== 'this_month' ||
    selectedLeaveTypes.length > 0;

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading leave requests: {error?.message || 'Unknown error'}
        <Button onClick={() => refetch()} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box className={className}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5" component="h2">
          Leave Requests
          {filteredRequests.length > 0 && (
            <Chip
              label={`${filteredRequests.length} ${filteredRequests.length === 1 ? 'request' : 'requests'}`}
              size="small"
              sx={{ ml: 1, verticalAlign: 'middle' }}
            />
          )}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}

          {showFilters && (
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              disabled={isLoading}
            >
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          )}

          {onNewRequest && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewRequest}
              disabled={isLoading}
            >
              New Request
            </Button>
          )}
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        {showSearch && (
          <Box mb={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search leave requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { backgroundColor: theme.palette.background.paper },
              }}
              disabled={isLoading}
            />
          </Box>
        )}

        {showAdvancedFilters && showFilters && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.background.paper, 0.5),
            }}
          >
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={statuses}
                  onChange={handleStatusChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={STATUS_OPTIONS.find(opt => opt.value === value)?.label || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  disabled={isLoading}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  label="Date Range"
                  disabled={isLoading}
                >
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {dateRange === 'custom' && (
                <Box display="flex" gap={1} alignItems="center">
                  <DatePicker
                    label="Start Date"
                    value={customStartDate}
                    onChange={(date) => setCustomStartDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    disabled={isLoading}
                  />
                  <Typography>to</Typography>
                  <DatePicker
                    label="End Date"
                    value={customEndDate}
                    onChange={(date) => setCustomEndDate(date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    disabled={isLoading}
                  />
                </Box>
              )}

              <FormControl fullWidth size="small">
                <InputLabel>Leave Type</InputLabel>
                <Select
                  multiple
                  value={selectedLeaveTypes}
                  onChange={handleLeaveTypeChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={leaveTypes.find(lt => lt.id === value)?.name || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  disabled={isLoading}
                >
                  {leaveTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon color="action" />
                    </InputAdornment>
                  }
                  disabled={isLoading}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" alignItems="flex-end">
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters || isLoading}
                  startIcon={<ClearFiltersIcon />}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Loading State */}
      {isLoading && !leaveRequests.length ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* No Results */}
          {!isLoading && filteredRequests.length === 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                No leave requests found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {hasActiveFilters
                  ? 'Try adjusting your filters or search term.'
                  : 'There are no leave requests to display.'}
              </Typography>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<ClearFiltersIcon />}
                >
                  Clear all filters
                </Button>
              )}
            </Paper>
          )}

          {/* Leave Request List */}
          {filteredRequests.length > 0 && (
            <Stack spacing={2}>
              {filteredRequests.map((request) => (
                <LeaveRequestCard
                  key={request.id}
                  request={request}
                  onEdit={onRequestClick}
                  showActions={showActions}
                  showEmployeeInfo={showEmployeeInfo}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LeaveRequestList;
