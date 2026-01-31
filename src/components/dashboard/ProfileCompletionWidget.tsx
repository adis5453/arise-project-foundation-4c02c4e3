import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Box,
    Button,
    Chip,
    Stack,
    Grid,
} from '@mui/material';
import {
    Warning,
    ArrowForward,
    ErrorOutline
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

// Actual API response format
interface CompletionApiResponse {
    completion_percentage: number;
    missing_fields: string[];
    fields: Array<{
        name: string;
        weight: number;
        filled: boolean;
    }>;
}

const ProfileCompletionWidget: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery<CompletionApiResponse>({
        queryKey: ['profile-completion', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            return await api.get(`/profile/completion/${user.id}`);
        },
        enabled: !!user?.id,
        retry: false
    });

    if (isLoading || !data || error) return null;

    // Hide if 100% complete
    if (data.completion_percentage === 100) return null;

    // Map missing fields to display labels
    const fieldLabels: Record<string, { label: string; critical: boolean }> = {
        'first_name': { label: 'First Name', critical: true },
        'last_name': { label: 'Last Name', critical: true },
        'email': { label: 'Email', critical: true },
        'phone_number': { label: 'Phone Number', critical: false },
        'department_id': { label: 'Department', critical: false },
        'position_id': { label: 'Position', critical: false },
        'profile_photo_url': { label: 'Profile Photo', critical: false },
        'date_of_birth': { label: 'Date of Birth', critical: false },
        'hire_date': { label: 'Hire Date', critical: false },
        'emergency_contact': { label: 'Emergency Contact', critical: false },
        'address': { label: 'Address', critical: false },
    };

    // Get top 3 missing fields
    const pendingFields = (data.missing_fields || [])
        .slice(0, 3)
        .map(field => ({
            key: field,
            label: fieldLabels[field]?.label || field.replace(/_/g, ' '),
            critical: fieldLabels[field]?.critical || false,
            icon: fieldLabels[field]?.critical ? <Warning color="error" /> : <ErrorOutline color="info" />
        }));

    const hasCriticalMissing = data.missing_fields?.some(f => fieldLabels[f]?.critical);

    return (
        <Card sx={{
            mb: 3,
            background: 'linear-gradient(to right, #fff3e0, #ffffff)',
            borderLeft: '6px solid #ed6c02'
        }}>
            <CardContent>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold" color="warning.dark">
                            ⚠️ Profile Incomplete ({data.completion_percentage}%)
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={data.completion_percentage}
                                    color={data.completion_percentage < 60 ? "error" : "warning"}
                                    sx={{ height: 10, borderRadius: 5 }}
                                />
                            </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            Complete your profile for salary processing & compliance.
                        </Typography>
                        {hasCriticalMissing && (
                            <Chip
                                label="Critical Actions Pending"
                                color="error"
                                size="small"
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Pending Fields:</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {pendingFields.map((field) => (
                                <Chip
                                    key={field.key}
                                    icon={field.icon}
                                    label={field.label}
                                    variant="outlined"
                                    color={field.critical ? "error" : "default"}
                                    size="small"
                                    onClick={() => navigate('/profile')}
                                    sx={{ mb: 1, cursor: 'pointer' }}
                                />
                            ))}
                            {pendingFields.length === 0 && (
                                <Chip label="Minor details pending" size="small" />
                            )}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: 'right' }}>
                        <Button
                            variant="contained"
                            color="warning"
                            endIcon={<ArrowForward />}
                            onClick={() => navigate('/profile')}
                        >
                            Complete Now
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ProfileCompletionWidget;

