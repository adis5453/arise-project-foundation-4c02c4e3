import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    useMediaQuery,
    alpha
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Login } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const UnifiedLoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { login, loading, isAuthenticated } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const redirectTo = useMemo(() => {
        const from = (location.state as any)?.from
        const pathname = from?.pathname as string | undefined
        // Prevent redirecting back to login itself.
        if (!pathname || pathname.startsWith('/login')) return '/dashboard'
        return pathname
    }, [location.state])

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate(redirectTo, { replace: true })
        }
    }, [isAuthenticated, loading, navigate, redirectTo])

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
            navigate(redirectTo, { replace: true });
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
                p: 2,
                background: `radial-gradient(900px 520px at 10% 0%, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 60%),
                            radial-gradient(760px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 55%),
                            linear-gradient(180deg, ${alpha(theme.palette.background.default, 1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
            }}
        >
            <Container maxWidth="sm">
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        backgroundColor: alpha(theme.palette.background.paper, 0.70),
                        backdropFilter: 'blur(22px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                        boxShadow: theme.shadows[10],
                    }}
                >
                    <Box
                        sx={{
                            p: isMobile ? 3 : 4,
                            textAlign: 'center',
                            position: 'relative',
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
                            background: `radial-gradient(640px 260px at 30% 0%, ${alpha(theme.palette.primary.main, 0.20)} 0%, transparent 60%),
                                         radial-gradient(520px 260px at 80% 40%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 55%)`,
                        }}
                    >
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                letterSpacing: -0.5,
                                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.70)} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Arise HRM
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: alpha(theme.palette.text.secondary, 0.9), mt: 0.5 }}>
                            Unified Access Portal
                        </Typography>
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
