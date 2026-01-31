import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    Container,
    Stack,
    Alert,
    useTheme,
    Checkbox,
    FormControlLabel,
    useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Login } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const UnifiedLoginPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { login, loading } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [formData, setFormData] = useState({
        email: 'admin@arisehrm.com',
        password: 'password123',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(formData);
            toast.success('Login successful');
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login failed');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 2
            }}
        >
            <Container maxWidth="sm">
                <Card elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{
                        bgcolor: 'primary.main',
                        p: 4,
                        textAlign: 'center',
                        color: 'primary.contrastText'
                    }}>
                        <Typography variant="h4" fontWeight="bold">Arise HRM</Typography>
                        <Typography variant="subtitle1">Unified Access Portal</Typography>
                    </Box>

                    <CardContent sx={{ p: isMobile ? 3 : 5 }}>
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        <form onSubmit={handleLogin}>
                            <Stack spacing={3}>
                                <TextField
                                    label="Email Address"
                                    type="email"
                                    fullWidth
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <TextField
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    fullWidth
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.rememberMe}
                                            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                                        />
                                    }
                                    label="Remember me"
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loading}
                                    startIcon={<Login />}
                                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                                >
                                    {loading ? 'Signing In...' : 'Sign In'}
                                </Button>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default UnifiedLoginPage;
