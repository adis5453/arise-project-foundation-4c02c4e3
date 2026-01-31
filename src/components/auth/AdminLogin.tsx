import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, AdminPanelSettings,
  Security, Settings, ManageAccounts, ArrowBack, Info,
  CheckCircle, Shield, Storage, Analytics, Gavel, Build
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  })

  const roleData = location.state?.roleData
  const autoFill = location.state?.autoFill
  const demoCredentials = location.state?.demoCredentials || {
    email: 'admin@arisehrm.com',
    password: 'admin123'
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
        toast.success('Welcome, Administrator!', {
          description: 'Access your comprehensive system administration dashboard'
        })
        navigate('/dashboard')
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
    setFormData(prev => ({
      ...prev,
      email: demoCredentials.email,
      password: demoCredentials.password
    }))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpolygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.2,
        }
      }}
    >
      <Container maxWidth="lg">
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

        <Grid container spacing={4} alignItems="center">
          {/* Left Side - System Administration Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ color: 'white', mb: { xs: 4, md: 0 } }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <AdminPanelSettings sx={{ fontSize: '3rem', color: 'white' }} />
              </Avatar>

              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                System Control
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                Comprehensive system administration with full platform control and security oversight
              </Typography>

              {/* Administrator Benefits */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      System Configuration & Management
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Complete control over system settings, user management, and security policies
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Advanced Security & Monitoring
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Monitor system health, security logs, and implement advanced protection measures
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Platform Analytics & Insights
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Access comprehensive analytics, usage statistics, and business intelligence
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      System Integration & Automation
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Manage integrations, automate processes, and optimize system performance
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={24}
              sx={{
                maxWidth: 550,
                width: '100%',
                ml: { xs: 'auto', md: 0 },
                mr: 'auto',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(234, 88, 12, 0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Bar */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #ea580c 0%, #f97316 100%)',
                  p: 2.5,
                  textAlign: 'center'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <AdminPanelSettings sx={{ color: 'white', fontSize: '1.5rem' }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                      Administrator Portal
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Level 90 • System Administration Access
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                    System Command Center
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    Access comprehensive system administration and security tools
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip
                      label="System Control"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#ea580c', fontWeight: 600 }}
                    />
                    <Chip
                      label="User Management"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#ea580c', fontWeight: 600 }}
                    />
                    <Chip
                      label="Security Monitoring"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#ea580c', fontWeight: 600 }}
                    />
                  </Stack>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Demo Credentials Info */}
                <Alert
                  severity="info"
                  sx={{ mb: 3, borderRadius: 2, backgroundColor: '#fed7aa', borderColor: '#ea580c' }}
                  action={
                    <Button
                      size="small"
                      onClick={handleDemoLogin}
                      sx={{ textTransform: 'none', color: '#ea580c', fontWeight: 600 }}
                    >
                      Use Demo
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ color: '#ea580c' }}>
                    <strong>Demo Administrator:</strong> {demoCredentials.email}
                  </Typography>
                </Alert>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Administrator Email Address"
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
                          borderColor: '#ea580c',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ea580c',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#ea580c' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Administrator Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    margin="normal"
                    required
                    autoComplete="current-password"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: '#ea580c',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#ea580c',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#ea580c' }} />
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
                            color: '#ea580c',
                            '&.Mui-checked': {
                              color: '#ea580c',
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
                        color: '#ea580c',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Security Recovery
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{
                      mb: 4,
                      py: 1.8,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #c2410c 30%, #ea580c 90%)',
                        boxShadow: '0 6px 16px rgba(234, 88, 12, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    startIcon={<AdminPanelSettings />}
                  >
                    {isLoading ? 'Authenticating...' : 'Access System Control'}
                  </Button>

                  {isLoading && (
                    <LinearProgress
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #ea580c 30%, #f97316 90%)',
                        }
                      }}
                    />
                  )}

                  {/* Administrative Features */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ea580c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)'
                          }
                        }}
                      >
                        <ManageAccounts sx={{ color: '#ea580c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          User Management
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage all user accounts
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ea580c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)'
                          }
                        }}
                      >
                        <Shield sx={{ color: '#ea580c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Security Control
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Advanced security settings
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ea580c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)'
                          }
                        }}
                      >
                        <Storage sx={{ color: '#ea580c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Data Management
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Database administration
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Paper
                        sx={{
                          p: 2.5,
                          textAlign: 'center',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: '#ea580c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)'
                          }
                        }}
                      >
                        <Build sx={{ color: '#ea580c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          System Tools
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Configuration & maintenance
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AdminPanelSettings sx={{ color: '#64748b' }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                      Secure administrator portal with comprehensive system control
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Help Section */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Administrator Resources & Emergency Support
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
                System Administration Guide
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
                Emergency Support
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default AdminLogin
