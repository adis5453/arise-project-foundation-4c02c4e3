import React, { useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stack,
    Divider,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    useTheme
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';

interface PayslipDialogProps {
    open: boolean;
    onClose: () => void;
    record: any; // Using any for simplicity in rapid dev, ideally PayrollRecord
}

export const PayslipDialog: React.FC<PayslipDialogProps> = ({ open, onClose, record }) => {
    const theme = useTheme();
    const printRef = useRef<HTMLDivElement>(null);

    if (!record) return null;

    const handlePrint = () => {
        // Basic window print for now
        window.print();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            {/* Print Styles */}
            <style>{`
        @media print {
          body * { visibility: hidden; }
          #payslip-content, #payslip-content * { visibility: visible; }
          #payslip-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Payslip View</Typography>
                    <Box className="no-print">
                        <Button startIcon={<Print />} onClick={handlePrint}>Print</Button>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent id="payslip-content">
                <Paper elevation={0} sx={{ p: 4, border: '1px solid #ddd' }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" mb={4}>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary">Arise HRM</Typography>
                            <Typography variant="body2" color="text.secondary">123 Business Rd, Tech City</Typography>
                            <Typography variant="body2" color="text.secondary">payslip@arise.com</Typography>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="h4" fontWeight="bold" color="text.primary">PAYSLIP</Typography>
                            <Typography variant="subtitle1" color="text.secondary">{record.payPeriod}</Typography>
                            <Typography variant="caption" display="block">{record.id}</Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ mb: 4 }} />

                    {/* Employee Info */}
                    <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">Employee Details</Typography>
                            <Typography variant="h6">{record.employeeName}</Typography>
                            <Typography variant="body2">{record.department}</Typography>
                            <Typography variant="body2">ID: {record.employeeId}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} textAlign="right">
                            <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">Pay Date</Typography>
                            <Typography variant="h6">{new Date(record.payDate || Date.now()).toLocaleDateString()}</Typography>
                            <Typography variant="body2">Status: {record.status.toUpperCase()}</Typography>
                        </Grid>
                    </Grid>

                    {/* Table */}
                    <Table sx={{ mb: 4, border: '1px solid #eee' }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell><Typography fontWeight="bold">Earnings</Typography></TableCell>
                                <TableCell align="right"><Typography fontWeight="bold">Amount</Typography></TableCell>
                                <TableCell><Typography fontWeight="bold">Deductions</Typography></TableCell>
                                <TableCell align="right"><Typography fontWeight="bold">Amount</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Basic Salary</TableCell>
                                <TableCell align="right">${record.basicSalary?.toLocaleString()}</TableCell>
                                <TableCell>Income Tax</TableCell>
                                <TableCell align="right">${record.deductions?.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Allowances</TableCell>
                                <TableCell align="right">${record.allowances?.toLocaleString()}</TableCell>
                                <TableCell></TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Total Earnings</strong></TableCell>
                                <TableCell align="right"><strong>${record.grossSalary?.toLocaleString()}</strong></TableCell>
                                <TableCell><strong>Total Deductions</strong></TableCell>
                                <TableCell align="right"><strong>${record.deductions?.toLocaleString()}</strong></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    {/* Net Pay */}
                    <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 2, borderRadius: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">NET PAY</Typography>
                            <Typography variant="h4" fontWeight="bold">${record.netSalary?.toLocaleString()}</Typography>
                        </Stack>
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                        This is a computer-generated document and does not require a signature.
                    </Typography>
                </Paper>
            </DialogContent>
            <DialogActions className="no-print">
                <Button onClick={onClose}>Close</Button>
                <Button variant="contained" startIcon={<Download />} onClick={() => window.print()}>
                    Download PDF
                </Button>
            </DialogActions>
        </Dialog>
    );
};
