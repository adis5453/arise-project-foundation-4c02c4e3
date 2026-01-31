import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, Group,
  People, Assignment, TrendingUp, ArrowBack, Info,
  CheckCircle, Schedule, Analytics
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const TeamLeaderLogin: React.FC = () => {
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
    email: 'team.lead@arisehrm.test',
    password: 'Lead@1234'
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
        toast.success('Welcome back, Team Leader!', {
          description: 'Access your team management dashboard and performance insights'
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
        background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3Ccircle cx="10" cy="10" r="1"/%3E%3Ccircle cx="50" cy="10" r="1"/%3E%3Ccircle cx="10" cy="50" r="1"/%3E%3Ccircle cx="50" cy="50" r="1"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.4,
        }
      }}
    >
      <Container maxWidth="md">
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
          {/* Left Side - Team Leadership Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ color: 'white', mb: { xs: 4, md: 0 } }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <Group sx={{ fontSize: '2rem', color: 'white' }} />
              </Avatar>

              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Team Leadership
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                Lead your team to success with powerful management tools
              </Typography>

              {/* Team Leader Benefits */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Team Overview Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Monitor team performance, attendance, and productivity metrics
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Leave & Attendance Management
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Approve leave requests and track team attendance patterns
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Performance Reviews
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Conduct reviews and set goals for team members
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Team Analytics & Reports
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Generate insights and performance reports
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
                maxWidth: 500,
                width: '100%',
                ml: { xs: 'auto', md: 0 },
                mr: 'auto',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(37, 99, 235, 0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Bar */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                  p: 2.5,
                  textAlign: 'center'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <Group sx={{ color: 'white', fontSize: '1.5rem' }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                      Team Leader Portal
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Level 60 • Team Management Access
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Team Dashboard Access
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    Login to manage your team and drive performance
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip
                      label="Team Management"
                      size="small"
                      sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                    />
                    <Chip
                      label="Performance Reviews"
                      size="small"
                      sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
                    />
                    <Chip
                      label="Leave Approvals"
                      size="small"
                      sx={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}
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
                  sx={{ mb: 3, borderRadius: 2, backgroundColor: '#e0f2fe', borderColor: '#0369a1' }}
                  action={
                    <Button
                      size="small"
                      onClick={handleDemoLogin}
                      sx={{ textTransform: 'none', color: '#0369a1', fontWeight: 600 }}
                    >
                      Use Demo
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ color: '#0369a1' }}>
                    <strong>Demo Team Leader:</strong> {demoCredentials.email}
                  </Typography>
                </Alert>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Team Leader Email Address"
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
                          borderColor: '#2563eb',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2563eb',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#2563eb' }} />
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
                          borderColor: '#2563eb',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2563eb',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#2563eb' }} />
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
                            color: '#2563eb',
                            '&.Mui-checked': {
                              color: '#2563eb',
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
                        color: '#2563eb',
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
                      background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1d4ed8 30%, #2563eb 90%)',
                        boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    startIcon={<Group />}
                  >
                    {isLoading ? 'Signing In...' : 'Access Team Dashboard'}
                  </Button>

                  {isLoading && (
                    <LinearProgress
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #2563eb 30%, #3b82f6 90%)',
                        }
                      }}
                    />
                  )}

                  {/* Team Management Features */}
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
                            borderColor: '#2563eb',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                          }
                        }}
                      >
                        <People sx={{ color: '#2563eb', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Team Members
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage & monitor your team
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
                            borderColor: '#2563eb',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                          }
                        }}
                      >
                        <TrendingUp sx={{ color: '#2563eb', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Performance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Track team progress
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
                            borderColor: '#2563eb',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                          }
                        }}
                      >
                        <Assignment sx={{ color: '#2563eb', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Approvals
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Leave & request approvals
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
                            borderColor: '#2563eb',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                          }
                        }}
                      >
                        <Analytics sx={{ color: '#2563eb', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Analytics
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Team insights & reports
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Group sx={{ color: '#64748b' }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                      Secure team leadership portal with enhanced management tools
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
              Team Leader Resources
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
                Team Management Guide
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
                Contact HR Support
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default TeamLeaderLogin
