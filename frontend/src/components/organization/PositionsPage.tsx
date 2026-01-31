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
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Work as WorkIcon } from '@mui/icons-material';
import { DatabaseService } from '../../services/databaseService';
import { toast } from 'sonner';

export default function PositionsPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ title: '', department_id: '', description: '', requirements: '' });
    const queryClient = useQueryClient();

    const { data: positions, isLoading: loadingPositions } = useQuery({
        queryKey: ['positions'],
        queryFn: () => DatabaseService.getPositions()
    });

    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: () => DatabaseService.getDepartments()
    });

    const createMutation = useMutation({
        mutationFn: DatabaseService.createPosition,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            toast.success('Position created successfully');
            setIsAddDialogOpen(false);
            setFormData({ title: '', department_id: '', description: '', requirements: '' });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create position');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    if (loadingPositions) return <CircularProgress />;

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">Positions</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddDialogOpen(true)}
                >
                    Add Position
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {positions?.map((pos: any) => (
                            <TableRow key={pos.id}>
                                <TableCell>{pos.title}</TableCell>
                                <TableCell>{departments?.find((d: any) => d.id === pos.department_id)?.name || 'N/A'}</TableCell>
                                <TableCell>{pos.description}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><EditIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {positions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No positions found. Add one to get started.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Add New Position</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="Position Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid size={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={formData.department_id}
                                        label="Department"
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                    >
                                        {departments?.map((dept: any) => (
                                            <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={12}>
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
                        <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}
