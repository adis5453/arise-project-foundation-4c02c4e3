// Salary Components Breakdown Component
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Paper,
    Divider,
    CircularProgress,
    Chip
} from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown } from '@mui/icons-material';
import api from '../../lib/api';

interface SalaryComponentsProps {
    employeeId: string;
}

export const SalaryComponents: React.FC<SalaryComponentsProps> = ({ employeeId }) => {
    const { data: components, isLoading } = useQuery({
        queryKey: ['salary-components', employeeId],
        queryFn: () => api.getSalaryComponents(employeeId),
        enabled: !!employeeId
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

    if (!components) {
        return (
            <Card>
                <CardContent>
                    <Typography color="textSecondary">No salary data available</Typography>
                </CardContent>
            </Card>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <AccountBalance color="primary" />
                    <Typography variant="h6">Salary Breakdown</Typography>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableBody>
                            {/* Earnings */}
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Typography variant="subtitle2" color="success.main">
                                        <TrendingUp fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                        Earnings
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Basic Salary</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                        {formatCurrency(components.basic_salary)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4 }}>Housing Allowance</TableCell>
                                <TableCell align="right">
                                    {formatCurrency(components.breakdown.housing_allowance)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ pl: 4 }}>Transport Allowance</TableCell>
                                <TableCell align="right">
                                    {formatCurrency(components.breakdown.transport_allowance)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    <Typography variant="subtitle2">Total Allowances</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                        {formatCurrency(components.allowances)}
                                    </Typography>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Divider />
                                </TableCell>
                            </TableRow>

                            {/* Gross Salary */}
                            <TableRow>
                                <TableCell>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Gross Salary
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Chip
                                        label={formatCurrency(components.gross_salary)}
                                        color="success"
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Divider />
                                </TableCell>
                            </TableRow>

                            {/* Deductions */}
                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Typography variant="subtitle2" color="error.main">
                                        <TrendingDown fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                        Deductions
                                    </Typography>
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Income Tax</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" color="error.main">
                                        -{formatCurrency(components.tax_deduction)}
                                    </Typography>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={2}>
                                    <Divider sx={{ borderStyle: 'dashed' }} />
                                </TableCell>
                            </TableRow>

                            {/* Net Salary */}
                            <TableRow>
                                <TableCell>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        Net Salary
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        {formatCurrency(components.net_salary)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                        * Amounts are calculated based on system settings and may vary based on attendance and leave records.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SalaryComponents;
