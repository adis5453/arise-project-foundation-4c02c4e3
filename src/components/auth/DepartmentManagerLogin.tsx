import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, Business,
  TrendingUp, Assessment, MonetizationOn, ArrowBack, Info,
  CheckCircle, People, Assignment, Analytics, Group, BarChart
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const DepartmentManagerLogin: React.FC = () => {
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
    email: 'manager@arisehrm.com',
    password: 'manager123'
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
        toast.success('Welcome, Department Manager!', {
          description: 'Access your department management dashboard and strategic insights'
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
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Crect width="40" height="40" x="20" y="20"/%3E%3Crect width="20" height="20" x="30" y="30"/%3E%3C/g%3E%3C/svg%3E")',
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
          {/* Left Side - Department Management Info */}
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
                <Business sx={{ fontSize: '2.5rem', color: 'white' }} />
              </Avatar>

              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Strategic Leadership
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                Department-wide management with strategic oversight and budget control
              </Typography>

              {/* Department Manager Benefits */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Department Operations Control
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Complete oversight of department performance, goals, and strategic initiatives
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Budget & Resource Management
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Manage department budget, allocate resources, and track financial performance
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Strategic Planning & Analytics
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Drive strategic planning with data-driven insights and forecasting
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Cross-functional Collaboration
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Coordinate with other departments and drive organizational alignment
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
                border: '1px solid rgba(220, 38, 38, 0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Bar */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                  p: 2.5,
                  textAlign: 'center'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <Business sx={{ color: 'white', fontSize: '1.5rem' }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                      Department Manager Portal
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Level 70 • Strategic Department Management Access
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Strategic Command Center
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    Drive department success with strategic management tools
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip
                      label="Strategic Planning"
                      size="small"
                      sx={{ backgroundColor: '#fecaca', color: '#dc2626', fontWeight: 600 }}
                    />
                    <Chip
                      label="Budget Control"
                      size="small"
                      sx={{ backgroundColor: '#fecaca', color: '#dc2626', fontWeight: 600 }}
                    />
                    <Chip
                      label="Performance Analytics"
                      size="small"
                      sx={{ backgroundColor: '#fecaca', color: '#dc2626', fontWeight: 600 }}
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
                  sx={{ mb: 3, borderRadius: 2, backgroundColor: '#fecaca', borderColor: '#dc2626' }}
                  action={
                    <Button
                      size="small"
                      onClick={handleDemoLogin}
                      sx={{ textTransform: 'none', color: '#dc2626', fontWeight: 600 }}
                    >
                      Use Demo
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ color: '#dc2626' }}>
                    <strong>Demo Department Manager:</strong> {demoCredentials.email}
                  </Typography>
                </Alert>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Department Manager Email Address"
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
                          borderColor: '#dc2626',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#dc2626',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#dc2626' }} />
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
                          borderColor: '#dc2626',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#dc2626',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#dc2626' }} />
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
                            color: '#dc2626',
                            '&.Mui-checked': {
                              color: '#dc2626',
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
                        color: '#dc2626',
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
                      background: 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #b91c1c 30%, #dc2626 90%)',
                        boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    startIcon={<Business />}
                  >
                    {isLoading ? 'Signing In...' : 'Access Strategic Dashboard'}
                  </Button>

                  {isLoading && (
                    <LinearProgress
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)',
                        }
                      }}
                    />
                  )}

                  {/* Department Management Features */}
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
                            borderColor: '#dc2626',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                          }
                        }}
                      >
                        <MonetizationOn sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Budget Control
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manage department finances
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
                            borderColor: '#dc2626',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                          }
                        }}
                      >
                        <BarChart sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Strategic Analytics
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Performance insights
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
                            borderColor: '#dc2626',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                          }
                        }}
                      >
                        <Group sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Team Leadership
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Department coordination
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
                            borderColor: '#dc2626',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                          }
                        }}
                      >
                        <TrendingUp sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Growth Planning
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Strategic initiatives
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Business sx={{ color: '#64748b' }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                      Secure department management portal with strategic oversight tools
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
              Management Resources & Support
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
                Strategic Planning Guide
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
                Executive Support
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default DepartmentManagerLogin
