import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    IconButton,
    Typography,
    Tabs,
    Tab,
    Box,
    InputAdornment,
    Divider,
    Chip,
    FormControlLabel,
    Checkbox,
    CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Person as PersonIcon,
    AccountBalance as BankIcon,
    AttachMoney as MoneyIcon,
    Schedule as ShiftIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`employee-tabpanel-${index}`}
            aria-labelledby={`employee-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

interface EnhancedEmployeeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    formData: any;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSelectChange: (name: string, value: any) => void;
    departments: any[];
    positions: any[];
    roles: any[];
    shifts?: any[];
    isLoading?: boolean;
    mode?: 'create' | 'edit';
}

export const EnhancedEmployeeForm: React.FC<EnhancedEmployeeFormProps> = ({
    open,
    onClose,
    onSubmit,
    formData,
    onInputChange,
    onSelectChange,
    departments,
    positions,
    roles,
    shifts = [
        { id: 'gen', name: 'General Shift (9 AM - 6 PM)' },
        { id: 'mor', name: 'Morning Shift (6 AM - 3 PM)' },
        { id: 'eve', name: 'Evening Shift (3 PM - 12 AM)' },
        { id: 'ngt', name: 'Night Shift (10 PM - 7 AM)' },
    ],
    isLoading = false,
    mode = 'create',
}) => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {mode === 'create'
                            ? 'Fill critical fields. Employee will complete their profile after first login.'
                            : 'Update employee information'}
                    </Typography>
                </DialogTitle>

                <Divider />

                <DialogContent>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                        <Tab icon={<PersonIcon />} label="Basic Info" iconPosition="start" />
                        <Tab icon={<BadgeIcon />} label="Indian Compliance" iconPosition="start" />
                        <Tab icon={<BankIcon />} label="Bank Details" iconPosition="start" />
                        <Tab icon={<MoneyIcon />} label="Salary" iconPosition="start" />
                        <Tab icon={<ShiftIcon />} label="Shift & Manager" iconPosition="start" />
                    </Tabs>

                    {/* Tab 1: Basic Information */}
                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Chip label="Required for HR" color="primary" size="small" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="First Name"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    onChange={onInputChange}
                                    helperText="Employee's legal first name"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Last Name"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    onChange={onInputChange}
                                    helperText="Employee's legal last name"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={onInputChange}
                                    helperText="Will be used for login"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Phone Number"
                                    name="phone_number"
                                    value={formData.phone_number || ''}
                                    onChange={onInputChange}
                                    helperText="Primary contact number"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Employee ID"
                                    name="employee_id"
                                    value={formData.employee_id || ''}
                                    onChange={onInputChange}
                                    helperText="Leave empty to auto-generate"
                                    disabled={mode === 'edit'}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        name="department_id"
                                        value={formData.department_id || ''}
                                        label="Department"
                                        onChange={(e) => onSelectChange('department_id', e.target.value)}
                                    >
                                        <MenuItem value="">Select Department</MenuItem>
                                        {departments.map(dept => (
                                            <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Position</InputLabel>
                                    <Select
                                        name="position_id"
                                        value={formData.position_id || ''}
                                        label="Position"
                                        onChange={(e) => onSelectChange('position_id', e.target.value)}
                                        disabled={!formData.department_id}
                                    >
                                        <MenuItem value="">Select Position</MenuItem>
                                        {positions.map(pos => (
                                            <MenuItem key={pos.id} value={pos.id}>{pos.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role_id"
                                        value={formData.role_id || ''}
                                        label="Role"
                                        onChange={(e) => onSelectChange('role_id', e.target.value)}
                                    >
                                        <MenuItem value="">Select Role</MenuItem>
                                        {roles.map(role => (
                                            <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Hire Date"
                                    name="hire_date"
                                    type="date"
                                    value={formData.hire_date || ''}
                                    onChange={onInputChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Employment Type</InputLabel>
                                    <Select
                                        name="employment_type"
                                        value={formData.employment_type || 'Full-Time'}
                                        label="Employment Type"
                                        onChange={(e) => onSelectChange('employment_type', e.target.value)}
                                    >
                                        <MenuItem value="Full-Time">Full-Time</MenuItem>
                                        <MenuItem value="Part-Time">Part-Time</MenuItem>
                                        <MenuItem value="Contract">Contract</MenuItem>
                                        <MenuItem value="Intern">Intern</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 2: Indian Compliance */}
                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Stack direction="row" spacing={1}>
                                    <Chip label="Critical for Payroll" color="error" size="small" />
                                    <Chip label="Required before first salary" color="warning" size="small" />
                                </Stack>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="PAN Number"
                                    name="pan_number"
                                    value={formData.pan_number || ''}
                                    onChange={onInputChange}
                                    helperText="Format: ABCDE1234F"
                                    inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Aadhaar Number"
                                    name="aadhaar_number"
                                    value={formData.aadhaar_number || ''}
                                    onChange={onInputChange}
                                    helperText="12-digit Aadhaar number"
                                    inputProps={{ maxLength: 12 }}
                                    type="password"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="UAN Number"
                                    name="uan_number"
                                    value={formData.uan_number || ''}
                                    onChange={onInputChange}
                                    helperText="Universal Account Number (PF)"
                                    inputProps={{ maxLength: 12 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="PF Account Number"
                                    name="pf_account_number"
                                    value={formData.pf_account_number || ''}
                                    onChange={onInputChange}
                                    helperText="Provident Fund account"
                                    inputProps={{ maxLength: 22 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="ESI Number"
                                    name="esi_number"
                                    value={formData.esi_number || ''}
                                    onChange={onInputChange}
                                    helperText="Employee State Insurance (if applicable)"
                                    inputProps={{ maxLength: 17 }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Tax Regime</InputLabel>
                                    <Select
                                        name="tax_regime"
                                        value={formData.tax_regime || 'new'}
                                        label="Tax Regime"
                                        onChange={(e) => onSelectChange('tax_regime', e.target.value)}
                                    >
                                        <MenuItem value="new">New Tax Regime</MenuItem>
                                        <MenuItem value="old">Old Tax Regime</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.pan_aadhaar_linked || false}
                                            onChange={(e) => onSelectChange('pan_aadhaar_linked', e.target.checked)}
                                            name="pan_aadhaar_linked"
                                        />
                                    }
                                    label="PAN-Aadhaar Linked"
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 3: Bank Details */}
                    <TabPanel value={tabValue} index={2}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Chip label="Required for Salary Payment" color="error" size="small" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Bank Name"
                                    name="bank_name"
                                    value={formData.bank_name || ''}
                                    onChange={onInputChange}
                                    helperText="e.g., State Bank of India"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Account Number"
                                    name="bank_account_number"
                                    value={formData.bank_account_number || ''}
                                    onChange={onInputChange}
                                    type="password"
                                    helperText="Will be encrypted"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="IFSC Code"
                                    name="bank_ifsc_code"
                                    value={formData.bank_ifsc_code || ''}
                                    onChange={onInputChange}
                                    helperText="11-character IFSC code"
                                    inputProps={{ maxLength: 11, style: { textTransform: 'uppercase' } }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Branch Name"
                                    name="bank_branch"
                                    value={formData.bank_branch || ''}
                                    onChange={onInputChange}
                                    helperText="Bank branch location"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Account Holder Name"
                                    name="account_holder_name"
                                    value={formData.account_holder_name || ''}
                                    onChange={onInputChange}
                                    helperText="As per bank records"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Account Type</InputLabel>
                                    <Select
                                        name="account_type"
                                        value={formData.account_type || 'savings'}
                                        label="Account Type"
                                        onChange={(e) => onSelectChange('account_type', e.target.value)}
                                    >
                                        <MenuItem value="savings">Savings Account</MenuItem>
                                        <MenuItem value="current">Current Account</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 4: Salary & Compensation */}
                    <TabPanel value={tabValue} index={3}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Chip label="Salary Breakdown" color="primary" size="small" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Basic Salary"
                                    name="basic_salary"
                                    type="number"
                                    value={formData.basic_salary || ''}
                                    onChange={onInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    helperText="Base salary component"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="HRA (House Rent Allowance)"
                                    name="hra"
                                    type="number"
                                    value={formData.hra || ''}
                                    onChange={onInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    helperText="Usually 40-50% of basic"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Special Allowance"
                                    name="special_allowance"
                                    type="number"
                                    value={formData.special_allowance || ''}
                                    onChange={onInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    helperText="Additional allowances"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Gross Salary (CTC)"
                                    name="gross_salary"
                                    type="number"
                                    value={formData.gross_salary ||
                                        (parseFloat(formData.basic_salary || 0) +
                                            parseFloat(formData.hra || 0) +
                                            parseFloat(formData.special_allowance || 0))}
                                    onChange={onInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    helperText="Total CTC (auto-calculated)"
                                    disabled
                                />
                            </Grid>
                        </Grid>
                    </TabPanel>

                    {/* Tab 5: Shift & Manager */}
                    <TabPanel value={tabValue} index={4}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                                <Chip label="Work Schedule" color="primary" size="small" />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Default Shift</InputLabel>
                                    <Select
                                        name="default_shift_id"
                                        value={formData.default_shift_id || ''}
                                        label="Default Shift"
                                        onChange={(e) => onSelectChange('default_shift_id', e.target.value)}
                                    >
                                        <MenuItem value="">No Fixed Shift</MenuItem>
                                        {shifts.map(shift => (
                                            <MenuItem key={shift.id} value={shift.id}>{shift.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Reporting Manager ID"
                                    name="manager_id"
                                    value={formData.manager_id || ''}
                                    onChange={onInputChange}
                                    helperText="UUID of reporting manager"
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Note:</strong> Employee will complete additional details (gender, blood group,
                                    marital status, education, documents, etc.) after their first login using the
                                    progressive profile completion system.
                                </Typography>
                            </Grid>
                        </Grid>
                    </TabPanel>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 3, gap: 1 }}>
                    <Button onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={16} /> : <AddIcon />}
                    >
                        {isLoading ? 'Creating...' : mode === 'create' ? 'Create Employee' : 'Update Employee'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EnhancedEmployeeForm;
