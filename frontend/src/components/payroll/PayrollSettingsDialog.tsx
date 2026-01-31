import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    Typography,
    InputAdornment,
    Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import DatabaseService from '@/services/databaseService';
import { Settings, Percent } from '@mui/icons-material';

interface PayrollSettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

export const PayrollSettingsDialog: React.FC<PayrollSettingsDialogProps> = ({ open, onClose }) => {
    const queryClient = useQueryClient();
    const [taxRate, setTaxRate] = useState<string>('5');
    const [allowanceRate, setAllowanceRate] = useState<string>('10');

    // Fetch Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['payroll-settings'],
        queryFn: async () => {
            return await DatabaseService.getPayrollSettings();
        },
        enabled: open
    });

    useEffect(() => {
        if (settings) {
            setTaxRate(settings.tax_rate.toString());
            setAllowanceRate(settings.allowance_rate.toString());
        }
    }, [settings]);

    // Save Mutation
    const mutation = useMutation({
        mutationFn: async () => {
            return await DatabaseService.updatePayrollSettings({
                tax_rate: parseFloat(taxRate),
                allowance_rate: parseFloat(allowanceRate)
            });
        },
        onSuccess: () => {
            toast.success('Payroll settings saved successfully');
            onClose();
        },
        onError: () => {
            toast.error('Failed to save settings');
        }
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Settings color="primary" />
                    <Typography variant="h6">Payroll Configuration</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={3} mt={2}>
                    <Alert severity="info">
                        These settings will apply to future payroll processing cycles. Existing records will not be changed.
                    </Alert>

                    <TextField
                        label="Income Tax Rate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        fullWidth
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><Percent fontSize="small" /></InputAdornment>,
                        }}
                        helperText="Percentage of basic salary to deduct"
                    />

                    <TextField
                        label="Allowance Rate"
                        type="number"
                        value={allowanceRate}
                        onChange={(e) => setAllowanceRate(e.target.value)}
                        fullWidth
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><Percent fontSize="small" /></InputAdornment>,
                        }}
                        helperText="Percentage of basic salary to add as allowances"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={() => mutation.mutate()}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
