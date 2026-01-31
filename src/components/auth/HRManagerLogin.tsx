import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, People,
  Business, Assignment, Analytics, ArrowBack, Info,
  CheckCircle, Schedule, TrendingUp, PersonAdd, Assessment
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const HRManagerLogin: React.FC = () => {
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
    email: 'hr@arisehrm.com',
    password: 'hr123'
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
        toast.success('Welcome, HR Manager!', {
          description: 'Access your comprehensive HR management dashboard'
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
        background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M30 30l-15-15h30z"/%3E%3Cpath d="M15 15l15 15v-30z"/%3E%3C/g%3E%3C/svg%3E")',
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
          {/* Left Side - HR Management Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ color: 'white', mb: { xs: 4, md: 0 } }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <People sx={{ fontSize: '2.5rem', color: 'white' }} />
              </Avatar>

              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                HR Leadership
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                Comprehensive human resources management with full employee lifecycle control
              </Typography>

              {/* HR Manager Benefits */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Employee Lifecycle Management
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Complete control over recruitment, onboarding, development, and offboarding
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Policy & Compliance Management
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Manage company policies, ensure regulatory compliance, and handle audits
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Advanced Analytics & Reporting
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Workforce analytics, retention insights, and comprehensive HR metrics
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Compensation & Benefits Administration
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Manage payroll, benefits enrollment, and compensation planning
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
                border: '1px solid rgba(194, 65, 12, 0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Bar */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 100%)',
                  p: 2.5,
                  textAlign: 'center'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <People sx={{ color: 'white', fontSize: '1.5rem' }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                      HR Manager Portal
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Level 80 • Human Resources Management Access
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                    HR Management Hub
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    Access comprehensive HR tools and workforce analytics
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip
                      label="Employee Management"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#c2410c', fontWeight: 600 }}
                    />
                    <Chip
                      label="Compliance"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#c2410c', fontWeight: 600 }}
                    />
                    <Chip
                      label="Analytics"
                      size="small"
                      sx={{ backgroundColor: '#fed7aa', color: '#c2410c', fontWeight: 600 }}
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
                  sx={{ mb: 3, borderRadius: 2, backgroundColor: '#fed7aa', borderColor: '#c2410c' }}
                  action={
                    <Button
                      size="small"
                      onClick={handleDemoLogin}
                      sx={{ textTransform: 'none', color: '#c2410c', fontWeight: 600 }}
                    >
                      Use Demo
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ color: '#c2410c' }}>
                    <strong>Demo HR Manager:</strong> {demoCredentials.email}
                  </Typography>
                </Alert>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="HR Manager Email Address"
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
                          borderColor: '#c2410c',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#c2410c',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#c2410c' }} />
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
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&.Mui-focused fieldset': {
                          borderColor: '#c2410c',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#c2410c',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#c2410c' }} />
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
                            color: '#c2410c',
                            '&.Mui-checked': {
                              color: '#c2410c',
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
                        color: '#c2410c',
                        fontWeight: 600,
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
                      mb: 4,
                      py: 1.8,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #c2410c 30%, #ea580c 90%)',
                      boxShadow: '0 4px 12px rgba(194, 65, 12, 0.3)',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #a21f08 30%, #c2410c 90%)',
                        boxShadow: '0 6px 16px rgba(194, 65, 12, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    startIcon={<People />}
                  >
                    {isLoading ? 'Signing In...' : 'Access HR Management Hub'}
                  </Button>

                  {isLoading && (
                    <LinearProgress
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #c2410c 30%, #ea580c 90%)',
                        }
                      }}
                    />
                  )}

                  {/* HR Management Features */}
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
                            borderColor: '#c2410c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(194, 65, 12, 0.15)'
                          }
                        }}
                      >
                        <PersonAdd sx={{ color: '#c2410c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Recruitment
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage hiring process
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
                            borderColor: '#c2410c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(194, 65, 12, 0.15)'
                          }
                        }}
                      >
                        <Assessment sx={{ color: '#c2410c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Analytics
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Workforce insights
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
                            borderColor: '#c2410c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(194, 65, 12, 0.15)'
                          }
                        }}
                      >
                        <Assignment sx={{ color: '#c2410c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Compliance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Policy management
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
                            borderColor: '#c2410c',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(194, 65, 12, 0.15)'
                          }
                        }}
                      >
                        <Business sx={{ color: '#c2410c', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Organization
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Structure management
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <People sx={{ color: '#64748b' }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                      Secure HR management portal with advanced employee lifecycle tools
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
              HR Resources & Support
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
                HR Management Guide
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
                Contact System Admin
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default HRManagerLogin
