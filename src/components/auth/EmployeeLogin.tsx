import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, Person,
  Schedule, Assignment, AccountBox, ArrowBack, Info
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { getDenimGradient, denimColors } from '../../styles/denimTheme'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const EmployeeLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, isAuthenticated } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  })

  const roleData = location.state?.roleData
  const autoFill = location.state?.autoFill
  const fromPath = (location.state as any)?.from?.pathname as string | undefined
  const demoCredentials = location.state?.demoCredentials || {
    email: 'employee@arisehrm.test',
    password: 'Emp@1234'
  }

  // Auto-fill demo credentials if requested
  useEffect(() => {
    if (autoFill && demoCredentials) {
      setFormData(prev => ({
        ...prev,
        email: demoCredentials.email,
        password: demoCredentials.password
      }))
    }
  }, [autoFill, demoCredentials])

  // If user is already authenticated (e.g., refresh), return to the original route.
  useEffect(() => {
    if (!isAuthenticated) return
    navigate(fromPath || '/dashboard', { replace: true })
  }, [fromPath, isAuthenticated, navigate])

  const handleInputChange = useCallback((field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'rememberMe' ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }, [error])

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })

      if (result.success) {
        toast.success('Welcome to your workspace!', {
          description: 'Access your tasks, schedule, and personal information'
        })
        navigate(fromPath || result.redirectTo || '/dashboard', { replace: true })
      } else {
        throw new Error(result.error || 'Login failed')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [formData, login, navigate])

  const handleDemoLogin = () => {
    if (demoCredentials) {
      setFormData(prev => ({
        ...prev,
        email: demoCredentials.email,
        password: demoCredentials.password
      }))
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: getDenimGradient('employee'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M20 20l-10-10h20z"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        }
      }}
    >
      <Container maxWidth="sm">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/login')}
            sx={{
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Back to Role Selection
          </Button>
        </Box>

        <Card
          elevation={24}
          sx={{
            maxWidth: 450,
            width: '100%',
            mx: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 4,
            border: '1px solid rgba(124, 58, 237, 0.2)',
            overflow: 'hidden'
          }}
        >
          {/* Header Bar */}
          <Box
            sx={{
              background: getDenimGradient('employee'),
              p: 2,
              textAlign: 'center'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Person sx={{ color: 'white', fontSize: '1.2rem' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Employee Access
              </Typography>
            </Stack>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: getDenimGradient('employee'),
                }}
              >
                <Person sx={{ fontSize: '2rem' }} />
              </Avatar>

              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                Employee Portal
              </Typography>

              <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                Access your personal workspace and daily tools
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip
                  label="Personal Dashboard"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label="Time Tracking"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label="Leave Requests"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Stack>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Demo Credentials Info */}
            {demoCredentials && (
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: 2 }}
                action={
                  <Button
                    size="small"
                    onClick={handleDemoLogin}
                    sx={{ textTransform: 'none' }}
                  >
                    Use Demo
                  </Button>
                }
              >
                <Typography variant="body2">
                  <strong>Demo Account:</strong> {demoCredentials.email}
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Employee Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: denimColors[400],
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: denimColors[400],
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: denimColors[400] }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                required
                autoComplete="current-password"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&.Mui-focused fieldset': {
                      borderColor: denimColors[400],
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: denimColors[400],
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: denimColors[400] }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748b' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={handleInputChange('rememberMe')}
                      name="rememberMe"
                      sx={{
                        color: denimColors[400],
                        '&.Mui-checked': {
                          color: denimColors[400],
                        },
                      }}
                    />
                  }
                  label="Keep me signed in"
                  sx={{ color: '#64748b' }}
                />

                <Link
                  href="#"
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    color: denimColors[400],
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 2,
                  mb: 3,
                  py: 1.5,
                  borderRadius: 2,
                  background: getDenimGradient('employee'),
                  boxShadow: `0 4px 12px ${denimColors[400]}40`,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${denimColors[500]} 30%, ${denimColors[600]} 90%)`,
                    boxShadow: `0 6px 16px ${denimColors[400]}60`,
                  },
                }}
                startIcon={<Person />}
              >
                {isLoading ? 'Signing In...' : 'Access Employee Dashboard'}
              </Button>

              <Divider sx={{ mb: 3, '& .MuiDivider-wrapper': { color: '#64748b' } }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Employee Features
                </Typography>
              </Divider>

              {/* Employee-specific features */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Schedule sx={{ color: denimColors[400], mb: 1 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      Time Tracking
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Clock in/out easily
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Assignment sx={{ color: denimColors[400], mb: 1 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      Leave Requests
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Apply for time off
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <AccountBox sx={{ color: '#64748b' }} fontSize="small" />
                <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                  Secure employee portal with personal data protection
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Need Help?
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Info />}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Contact IT Support
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Reset Password
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default EmployeeLogin
