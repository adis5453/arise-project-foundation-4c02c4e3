// Payroll Calculation Dialog Component
// Add this to PayrollDashboard.tsx or use as standalone component

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { Calculate, CheckCircle } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '../../lib/api';

interface PayrollCalculationDialogProps {
    open: boolean;
    onClose: () => void;
}

export const PayrollCalculationDialog: React.FC<PayrollCalculationDialogProps> = ({
    open,
    onClose
}) => {
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });

    const calculateMutation = useMutation({
        mutationFn: () => api.calculatePayroll(period.start, period.end),
        onSuccess: (data) => {
            toast.success(`Payroll calculated for ${data.records.length} employees`);
            queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to calculate payroll');
        }
    });

    const handleCalculate = () => {
        calculateMutation.mutate();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Calculate />
                    <Typography variant="h6">Calculate Payroll</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        This will calculate payroll for all active employees based on their attendance and leave records.
                    </Alert>

                    <Box display="flex" gap={2} mb={3}>
                        <TextField
                            label="Period Start"
                            type="date"
                            value={period.start}
                            onChange={(e) => setPeriod(prev => ({ ...prev, start: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Period End"
                            type="date"
                            value={period.end}
                            onChange={(e) => setPeriod(prev => ({ ...prev, end: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>

                    {calculateMutation.isSuccess && calculateMutation.data && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="success" icon={<CheckCircle />}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Calculation Complete
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Total Employees Processed"
                                            secondary={calculateMutation.data.summary.total_employees}
                                        />
                                    </ListItem>
                                    <Divider />
                                    <ListItem>
                                        <ListItemText
                                            primary="Tax Rate Applied"
                                            secondary={`${(calculateMutation.data.summary.tax_rate * 100).toFixed(1)}%`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Allowance Rate Applied"
                                            secondary={`${(calculateMutation.data.summary.allowance_rate * 100).toFixed(1)}%`}
                                        />
                                    </ListItem>
                                </List>
                            </Alert>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleCalculate}
                    disabled={calculateMutation.isPending}
                    startIcon={calculateMutation.isPending ? <CircularProgress size={20} /> : <Calculate />}
                >
                    {calculateMutation.isPending ? 'Calculating...' : 'Calculate Payroll'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PayrollCalculationDialog;
