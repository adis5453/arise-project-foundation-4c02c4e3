import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  Skeleton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  EventNote as EventNoteIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { LeaveRequest } from './types';
import { formatDateRange, getStatusColor, getStatusIcon } from '../../utils/leaveUtils';

// Shimmer animation for loading
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled premium card with glassmorphism
const GlassLeaveCard = styled(Card)<{ statuscolor: string }>(({ theme, statuscolor }) => ({
  position: 'relative',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 254, 0.9) 100%)',
  backdropFilter: 'blur(20px)',
  borderRadius: 16,
  border: '1px solid rgba(73, 151, 232, 0.15)',
  borderLeft: `4px solid ${statuscolor}`,
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 4,
    right: 0,
    height: 2,
    background: `linear-gradient(90deg, ${statuscolor} 0%, ${alpha(statuscolor, 0.3)} 100%)`,
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 20px 40px ${alpha(statuscolor, 0.15)}`,
    borderColor: alpha(statuscolor, 0.3),
  },
}));

// Loading skeleton with shimmer
const ShimmerSkeleton = styled(Skeleton)(() => ({
  background: 'linear-gradient(90deg, #deedfb 0%, #f0f8fe 50%, #deedfb 100%)',
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
}));

interface LeaveRequestCardProps {
  request: LeaveRequest;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onEdit?: (request: LeaveRequest) => void;
  onDelete?: (requestId: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
  showEmployeeInfo?: boolean;
  className?: string;
}

export const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({
  request,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  isLoading = false,
  showActions = true,
  showEmployeeInfo = false,
  className = '',
}) => {
  const theme = useTheme();
  const rawStatusColor = getStatusColor(request.status);

  // Resolve palette path (e.g., 'success.main') to actual color value for alpha() compatibility
  const getThemeColor = (path: string) => {
    if (path.includes('.')) {
      const [group, shade] = path.split('.');
      return (theme.palette as any)[group]?.[shade] || path;
    }
    return path;
  };

  const statusColor = getThemeColor(rawStatusColor);
  const statusIcon = getStatusIcon(request.status);

  if (isLoading) {
    return (
      <Card className={className} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <CardContent>
          <Stack spacing={2}>
            <ShimmerSkeleton variant="text" width="60%" height={32} />
            <ShimmerSkeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
            <ShimmerSkeleton variant="rectangular" height={20} width="80%" sx={{ borderRadius: 2 }} />
          </Stack>
        </CardContent>
      </Card>
    );
  }


  return (
    <GlassLeaveCard
      className={className}
      statuscolor={statusColor}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {request.leave_type?.name || 'Leave Request'}
            </Typography>

            {showEmployeeInfo && request.employee && (
              <Box display="flex" alignItems="center" mb={1.5}>
                <Avatar
                  src={request.employee.profile_photo_url}
                  alt={`${request.employee.first_name} ${request.employee.last_name}`}
                  sx={{ width: 32, height: 32, mr: 1 }}
                >
                  {request.employee.first_name?.[0]}{request.employee.last_name?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.primary">
                    {request.employee.first_name} {request.employee.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.employee.department} • {request.employee.position}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1} mb={1.5}>
              <Chip
                icon={<EventNoteIcon />}
                label={formatDateRange(request.start_date, request.end_date, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                size="small"
                variant="outlined"
              />

              {request.start_time && request.end_time && (
                <Chip
                  icon={<TimeIcon />}
                  label={`${request.start_time} - ${request.end_time}`}
                  size="small"
                  variant="outlined"
                />
              )}

              <Chip
                label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                size="small"
                sx={{
                  background: `linear-gradient(135deg, ${alpha(statusColor, 0.15)} 0%, ${alpha(statusColor, 0.08)} 100%)`,
                  color: statusColor,
                  fontWeight: 600,
                  border: `1px solid ${alpha(statusColor, 0.3)}`,
                  '& .MuiChip-avatar': {
                    color: statusColor,
                  }
                }}
                avatar={
                  <Avatar sx={{
                    bgcolor: 'transparent !important',
                    color: statusColor,
                    width: 20,
                    height: 20,
                    fontSize: '0.75rem'
                  }}>
                    {statusIcon}
                  </Avatar>
                }
              />

              {request.emergency_request && (
                <Chip
                  label="Emergency"
                  size="small"
                  color="error"
                  variant="outlined"
                />
              )}

              <Chip
                icon={<TimeIcon />}
                label={`${request.total_days || (
                  Math.ceil((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                )} days`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          {showActions && (
            <Stack direction="row" spacing={1}>
              {/* Approval Actions */}
              {request.status === 'pending' && onApprove && (
                <Tooltip title="Approve">
                  <IconButton
                    size="small"
                    onClick={() => onApprove(request.id)}
                    color="success"
                    sx={{ border: '1px solid', borderColor: 'success.main' }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {request.status === 'pending' && onReject && (
                <Tooltip title="Reject">
                  <IconButton
                    size="small"
                    onClick={() => onReject(request.id)}
                    color="error"
                    sx={{ border: '1px solid', borderColor: 'error.main' }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Edit/Delete Actions */}
              {onEdit && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(request)}
                    color="primary"
                    disabled={request.status !== 'pending'}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(request.id)}
                    color="error"
                    disabled={request.status !== 'pending'}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>

        {request.reason && (
          <Box mt={1.5}>
            <Typography variant="body2" color="text.secondary" paragraph>
              {request.reason}
            </Typography>
          </Box>
        )}

        {(request.work_handover_completed || request.coverage_arranged) && (
          <Box mt={1.5}>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {request.work_handover_completed && (
                <Box display="flex" alignItems="center">
                  <WorkIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Work handover completed
                  </Typography>
                </Box>
              )}

              {request.coverage_arranged && (
                <Box display="flex" alignItems="center">
                  <PersonIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Coverage arranged
                  </Typography>
                </Box>
              )}

              {request.handover_notes && (
                <Tooltip title={request.handover_notes} arrow>
                  <Box display="flex" alignItems="center">
                    <InfoIcon color="info" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="info.main">
                      Handover notes available
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </GlassLeaveCard>
  );
};


export default LeaveRequestCard;
