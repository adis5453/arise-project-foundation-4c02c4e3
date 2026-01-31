import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Chip,
    Tooltip,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Business as BusinessIcon,
    Group as GroupIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import { DatabaseService } from '../../services/databaseService';
import { toast } from 'sonner';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function DepartmentsPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', code: '', description: '', department_id: '' });
    const [deleteError, setDeleteError] = useState('');
    const queryClient = useQueryClient();

    // Queries
    const { data: departments = [], isLoading: loadingDepts } = useQuery({
        queryKey: ['departments'],
        queryFn: () => DatabaseService.getDepartments()
    });

    const { data: positions = [], isLoading: loadingPositions } = useQuery({
        queryKey: ['positions'],
        queryFn: () => DatabaseService.getPositions()
    });

    const { data: teams = [], isLoading: loadingTeams } = useQuery({
        queryKey: ['teams'],
        queryFn: () => DatabaseService.getTeams()
    });

    // Department Mutations
    const createDeptMutation = useMutation({
        mutationFn: DatabaseService.createDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created successfully');
            handleCloseDialog();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create department')
    });

    const updateDeptMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => DatabaseService.updateDepartment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated successfully');
            handleCloseDialog();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update department')
    });

    const deleteDeptMutation = useMutation({
        mutationFn: (id: string) => DatabaseService.deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted successfully');
            handleCloseDialog();
        },
        onError: (error: any) => {
            setDeleteError(error.message || 'Failed to delete department. Make sure no employees are assigned.');
        }
    });

    // Position Mutations
    const createPosMutation = useMutation({
        mutationFn: DatabaseService.createPosition,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Position created successfully');
            handleCloseDialog();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to create position')
    });

    const updatePosMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => DatabaseService.updatePosition(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Position updated successfully');
            handleCloseDialog();
        },
        onError: (error: any) => toast.error(error.message || 'Failed to update position')
    });

    const deletePosMutation = useMutation({
        mutationFn: (id: string) => DatabaseService.deletePosition(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Position deleted successfully');
            handleCloseDialog();
        },
        onError: (error: any) => {
            setDeleteError(error.message || 'Failed to delete position. Make sure no employees are assigned.');
        }
    });

    // Team Mutations
    const deleteTeamMutation = useMutation({
        mutationFn: (id: string) => DatabaseService.deleteTeam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            toast.success('Team deleted successfully');
            handleCloseDialog();
        },
        onError: (error: any) => {
            setDeleteError(error.message || 'Failed to delete team');
        }
    });

    // Handlers
    const handleCloseDialog = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
        setFormData({ name: '', code: '', description: '', department_id: '' });
        setDeleteError('');
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setFormData({
            name: item.name || '',
            code: item.code || '',
            description: item.description || '',
            department_id: item.department_id || ''
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (item: any) => {
        setSelectedItem(item);
        setDeleteError('');
        setIsDeleteDialogOpen(true);
    };

    const handleSubmitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === 0) {
            createDeptMutation.mutate(formData);
        } else if (activeTab === 1) {
            createPosMutation.mutate({ title: formData.name, department_id: formData.department_id });
        }
    };

    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        if (activeTab === 0) {
            updateDeptMutation.mutate({ id: selectedItem.id, data: formData });
        } else if (activeTab === 1) {
            updatePosMutation.mutate({ id: selectedItem.id, data: { name: formData.name, department_id: formData.department_id } });
        }
    };

    const handleConfirmDelete = () => {
        if (!selectedItem) return;

        if (activeTab === 0) {
            deleteDeptMutation.mutate(selectedItem.id);
        } else if (activeTab === 1) {
            deletePosMutation.mutate(selectedItem.id);
        } else if (activeTab === 2) {
            deleteTeamMutation.mutate(selectedItem.id);
        }
    };

    const isLoading = loadingDepts || loadingPositions || loadingTeams;

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">Organization Structure</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddDialogOpen(true)}
                >
                    Add {activeTab === 0 ? 'Department' : activeTab === 1 ? 'Position' : 'Team'}
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab icon={<BusinessIcon />} label={`Departments (${departments.length})`} />
                    <Tab icon={<WorkIcon />} label={`Positions (${positions.length})`} />
                    <Tab icon={<GroupIcon />} label={`Teams (${teams.length})`} />
                </Tabs>
            </Box>

            {/* Departments Tab */}
            <TabPanel value={activeTab} index={0}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Manager</TableCell>
                                <TableCell>Employees</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departments.map((dept: any) => (
                                <TableRow key={dept.id} hover>
                                    <TableCell><strong>{dept.name}</strong></TableCell>
                                    <TableCell><Chip label={dept.code || '-'} size="small" /></TableCell>
                                    <TableCell>{dept.manager_name || '-'}</TableCell>
                                    <TableCell><Chip label={dept.employee_count || 0} color="primary" size="small" /></TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleEdit(dept)}><EditIcon /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(dept)}><DeleteIcon /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {departments.length === 0 && (
                                <TableRow><TableCell colSpan={5} align="center">No departments found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            {/* Positions Tab */}
            <TabPanel value={activeTab} index={1}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Position Name</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Employees</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {positions.map((pos: any) => (
                                <TableRow key={pos.id} hover>
                                    <TableCell><strong>{pos.name}</strong></TableCell>
                                    <TableCell>{pos.department_name || '-'}</TableCell>
                                    <TableCell><Chip label={pos.employee_count || 0} color="primary" size="small" /></TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleEdit(pos)}><EditIcon /></IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(pos)}><DeleteIcon /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {positions.length === 0 && (
                                <TableRow><TableCell colSpan={4} align="center">No positions found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            {/* Teams Tab */}
            <TabPanel value={activeTab} index={2}>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Team Name</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Lead</TableCell>
                                <TableCell>Members</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teams.map((team: any) => (
                                <TableRow key={team.id} hover>
                                    <TableCell><strong>{team.name}</strong></TableCell>
                                    <TableCell>{team.department_name || '-'}</TableCell>
                                    <TableCell>{team.lead_name || '-'}</TableCell>
                                    <TableCell><Chip label={team.members_count || 0} color="primary" size="small" /></TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(team)}><DeleteIcon /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {teams.length === 0 && (
                                <TableRow><TableCell colSpan={5} align="center">No teams found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmitCreate}>
                    <DialogTitle>Add New {activeTab === 0 ? 'Department' : 'Position'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            {activeTab === 0 && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </Grid>
                            )}
                            {activeTab === 1 && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Department"
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        SelectProps={{ native: true }}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </TextField>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createDeptMutation.isPending || createPosMutation.isPending}>
                            Create
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmitEdit}>
                    <DialogTitle>Edit {activeTab === 0 ? 'Department' : 'Position'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            {activeTab === 0 && (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={updateDeptMutation.isPending || updatePosMutation.isPending}>
                            Save Changes
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
                    </Typography>
                    {deleteError && (
                        <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleConfirmDelete}
                        disabled={deleteDeptMutation.isPending || deletePosMutation.isPending || deleteTeamMutation.isPending}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
