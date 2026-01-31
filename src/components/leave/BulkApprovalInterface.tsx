import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Chip,
    Checkbox,
    Avatar,
    Divider,
    IconButton,
    Tooltip,
    useTheme,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    FilterList,
    SelectAll,
    CheckBox,
    CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DatabaseService from '../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkApprovalInterfaceProps {
    className?: string;
}

interface LeaveRequest {
    id: string;
    employee_id: string;
    employee_name: string;
    employee_avatar?: string;
    department: string;
    leave_type: string;
    leave_type_color: string;
    start_date: string;
    end_date: string;
    total_days: number;
    reason: string;
    status: string;
    created_at: string;
}

export const BulkApprovalInterface: React.FC<BulkApprovalInterfaceProps> = ({ className }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterDepartment, setFilterDepartment] = useState<string>('all');

    // Fetch pending leave requests
    const { data: pendingRequests = [], isLoading } = useQuery({
        queryKey: ['pending-leaves', user?.id],
        queryFn: async () => {
            const requests = await DatabaseService.getLeaveRequests({ status: ['pending'] });
            return requests
                .filter((req: any) => req.employee_id !== user?.id) // Exclude own requests
                .map((req: any) => ({
                    id: req.id,
                    employee_id: req.employee_id,
                    employee_name: `${req.employee?.first_name} ${req.employee?.last_name}`,
                    employee_avatar: req.employee?.profile_photo_url,
                    department: req.employee?.department || 'N/A',
                    leave_type: req.leave_type?.name || 'Leave',
                    leave_type_color: req.leave_type?.color_code || '#1976d2',
                    start_date: req.start_date,
                    end_date: req.end_date,
                    total_days: req.total_days || 1,
                    reason: req.reason || 'No reason provided',
                    status: req.status,
                    created_at: req.created_at,
                }));
        },
    });

    // Bulk approve mutation
    const approveMutation = useMutation({
        mutationFn: async (requestIds: string[]) => {
            const promises = requestIds.map((id) =>
                DatabaseService.updateLeaveRequestStatus(id, 'approved', user?.id, 'Bulk approved')
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            setSelectedRequests(new Set());
            toast.success(`${selectedRequests.size} leave request(s) approved`);
        },
        onError: () => {
            toast.error('Failed to approve requests');
        },
    });

    // Bulk reject mutation
    const rejectMutation = useMutation({
        mutationFn: async ({ requestIds, reason }: { requestIds: string[]; reason: string }) => {
            const promises = requestIds.map((id) =>
                DatabaseService.updateLeaveRequestStatus(id, 'rejected', user?.id, reason)
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
            setSelectedRequests(new Set());
            setShowRejectDialog(false);
            setRejectionReason('');
            toast.success(`${selectedRequests.size} leave request(s) rejected`);
        },
        onError: () => {
            toast.error('Failed to reject requests');
        },
    });

    // Selection handlers
    const handleSelectAll = () => {
        if (selectedRequests.size === pendingRequests.length) {
            setSelectedRequests(new Set());
        } else {
            setSelectedRequests(new Set(pendingRequests.map((req: LeaveRequest) => req.id)));
        }
    };

    const handleSelectRequest = (id: string) => {
        const newSelected = new Set(selectedRequests);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRequests(newSelected);
    };

    // Action handlers
    const handleBulkApprove = () => {
        if (selectedRequests.size === 0) {
            toast.warning('Please select at least one request');
            return;
        }
        approveMutation.mutate(Array.from(selectedRequests));
    };

    const handleBulkReject = () => {
        if (selectedRequests.size === 0) {
            toast.warning('Please select at least one request');
            return;
        }
        setShowRejectDialog(true);
    };

    const confirmReject = () => {
        if (!rejectionReason.trim()) {
            toast.warning('Please provide a reason for rejection');
            return;
        }
        rejectMutation.mutate({
            requestIds: Array.from(selectedRequests),
            reason: rejectionReason,
        });
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent>
                    <Typography>Loading...</Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={className}>
                <CardContent>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h6">Pending Approvals</Typography>
                            <Chip
                                label={`${pendingRequests.length} requests`}
                                color="warning"
                                size="small"
                            />
                            {selectedRequests.size > 0 && (
                                <Chip
                                    label={`${selectedRequests.size} selected`}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Stack>

                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                startIcon={selectedRequests.size === pendingRequests.length ? <CheckBox /> : <CheckBoxOutlineBlank />}
                                onClick={handleSelectAll}
                                disabled={pendingRequests.length === 0}
                            >
                                {selectedRequests.size === pendingRequests.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Bulk Actions */}
                    <AnimatePresence>
                        {selectedRequests.size > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Alert
                                    severity="info"
                                    sx={{ mb: 3 }}
                                    action={
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                color="success"
                                                variant="contained"
                                                startIcon={<CheckCircle />}
                                                onClick={handleBulkApprove}
                                                disabled={approveMutation.isPending}
                                            >
                                                Approve {selectedRequests.size}
                                            </Button>
                                            <Button
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                startIcon={<Cancel />}
                                                onClick={handleBulkReject}
                                                disabled={rejectMutation.isPending}
                                            >
                                                Reject {selectedRequests.size}
                                            </Button>
                                        </Stack>
                                    }
                                >
                                    <strong>{selectedRequests.size}</strong> request(s) selected for bulk action
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Requests List */}
                    {pendingRequests.length === 0 ? (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: 8,
                                color: 'text.secondary',
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                No pending approvals
                            </Typography>
                            <Typography variant="body2">All leave requests have been processed</Typography>
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {pendingRequests.map((request: LeaveRequest) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            border: `1px solid ${theme.palette.divider}`,
                                            borderRadius: 2,
                                            borderLeft: `4px solid ${request.leave_type_color}`,
                                            bgcolor: selectedRequests.has(request.id)
                                                ? alpha(theme.palette.primary.main, 0.05)
                                                : 'background.paper',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                transform: 'translateX(4px)',
                                            },
                                        }}
                                        onClick={() => handleSelectRequest(request.id)}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            {/* Checkbox */}
                                            <Checkbox
                                                checked={selectedRequests.has(request.id)}
                                                onChange={() => handleSelectRequest(request.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />

                                            {/* Employee Info */}
                                            <Avatar src={request.employee_avatar} sx={{ width: 40, height: 40 }}>
                                                {request.employee_name[0]}
                                            </Avatar>

                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={600}>
                                                    {request.employee_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {request.department}
                                                </Typography>
                                            </Box>

                                            {/* Leave Details */}
                                            <Box sx={{ minWidth: 200 }}>
                                                <Chip
                                                    label={request.leave_type}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(request.leave_type_color, 0.15),
                                                        color: request.leave_type_color,
                                                        fontWeight: 500,
                                                        mb: 0.5,
                                                    }}
                                                />
                                                <Typography variant="body2">
                                                    {format(parseISO(request.start_date), 'MMM d')} -{' '}
                                                    {format(parseISO(request.end_date), 'MMM d, yyyy')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {request.total_days} day{request.total_days > 1 ? 's' : ''}
                                                </Typography>
                                            </Box>

                                            {/* Reason */}
                                            <Box sx={{ minWidth: 250, maxWidth: 300 }}>
                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                    {request.reason}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Requested {format(parseISO(request.created_at), 'MMM d, yyyy')}
                                                </Typography>
                                            </Box>

                                            {/* Quick Actions */}
                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="Approve">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            approveMutation.mutate([request.id]);
                                                        }}
                                                        sx={{ border: '1px solid', borderColor: 'success.main' }}
                                                    >
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Reject">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRequests(new Set([request.id]));
                                                            setShowRejectDialog(true);
                                                        }}
                                                        sx={{ border: '1px solid', borderColor: 'error.main' }}
                                                    >
                                                        <Cancel fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </motion.div>
                            ))}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Dialog */}
            <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject Leave Request(s)</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        You are about to reject <strong>{selectedRequests.size}</strong> leave request(s).
                        Please provide a reason:
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmReject}
                        disabled={!rejectionReason.trim() || rejectMutation.isPending}
                    >
                        Reject {selectedRequests.size} Request(s)
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BulkApprovalInterface;
