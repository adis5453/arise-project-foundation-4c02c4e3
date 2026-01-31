import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Divider,
  Avatar, Chip, Paper, Stack, Link, Grid, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, Email, Lock, SupervisorAccount,
  Security, Settings, Build, ArrowBack, Info,
  CheckCircle, Shield, Storage, CloudSync, Code, Gavel
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export const SuperAdminLogin: React.FC = () => {
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
    email: 'superadmin@arisehrm.com',
    password: 'superadmin123'
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
        toast.success('Welcome, Super Administrator!', {
          description: 'Ultimate system access granted - handle with care'
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
        background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 50%, #450a0a 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Cpath d="M60,0 L80,40 L120,60 L80,80 L60,120 L40,80 L0,60 L40,40 Z"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
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
          {/* Left Side - Super Admin Info */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ color: 'white', mb: { xs: 4, md: 0 } }}>
              <Avatar
                sx={{
                  width: 110,
                  height: 110,
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <SupervisorAccount sx={{ fontSize: '3.5rem', color: 'white' }} />
              </Avatar>

              <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 800, textShadow: '0 3px 6px rgba(0,0,0,0.4)', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Ultimate Control
              </Typography>

              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                Super Administrator access with complete platform control, system architecture management, and unrestricted permissions
              </Typography>

              {/* Super Administrator Benefits */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Complete System Architecture Control
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Ultimate authority over system design, infrastructure, and platform architecture
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Database & Infrastructure Access
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Direct database access, server management, and infrastructure control
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      All Permissions & Override Capabilities
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Every system permission plus ability to override any restriction or policy
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircle sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Emergency System Control
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Emergency shutdown, disaster recovery, and critical system maintenance
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Warning Notice */}
              <Alert
                severity="warning"
                sx={{
                  mt: 4,
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  '& .MuiAlert-message': { color: '#ffd54f' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ⚠️ CAUTION: Super Administrator Access
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  This level provides unrestricted system access. All actions are logged and monitored.
                </Typography>
              </Alert>
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
                border: '2px solid rgba(220, 38, 38, 0.3)',
                overflow: 'hidden',
                boxShadow: '0 24px 48px rgba(220, 38, 38, 0.2)'
              }}
            >
              {/* Header Bar */}
              <Box
                sx={{
                  background: 'linear-gradient(90deg, #dc2626 0%, #7f1d1d 100%)',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <SupervisorAccount sx={{ color: 'white', fontSize: '1.8rem' }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                      Super Administrator Portal
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Level 100 • Ultimate System Control Access
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Ultimate Command
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
                    Access the highest level of system control and administrative power
                  </Typography>

                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip
                      label="Ultimate Control"
                      size="small"
                      sx={{ backgroundColor: '#fecaca', color: '#dc2626', fontWeight: 600 }}
                    />
                    <Chip
                      label="Database Access"
                      size="small"
                      sx={{ backgroundColor: '#fecaca', color: '#dc2626', fontWeight: 600 }}
                    />
                    <Chip
                      label="All Permissions"
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
                    <strong>Demo Super Administrator:</strong> {demoCredentials.email}
                  </Typography>
                </Alert>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Super Administrator Email Address"
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
                    label="Super Administrator Password"
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
                      Emergency Recovery
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
                      py: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #dc2626 30%, #7f1d1d 90%)',
                      boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)',
                      textTransform: 'none',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #b91c1c 30%, #dc2626 90%)',
                        boxShadow: '0 8px 20px rgba(220, 38, 38, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    startIcon={<SupervisorAccount />}
                  >
                    {isLoading ? 'Authenticating...' : 'Access Ultimate Control'}
                  </Button>

                  {isLoading && (
                    <LinearProgress
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        height: 6,
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #dc2626 30%, #7f1d1d 90%)',
                        }
                      }}
                    />
                  )}

                  {/* Super Administrator Features */}
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
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                          }
                        }}
                      >
                        <Storage sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Database Control
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Direct database access
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
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                          }
                        }}
                      >
                        <CloudSync sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Infrastructure
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Server & cloud management
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
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                          }
                        }}
                      >
                        <Code sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          System Code
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Source code & architecture
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
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                          }
                        }}
                      >
                        <Gavel sx={{ color: '#dc2626', mb: 1, fontSize: '2rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          Override Controls
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Emergency overrides
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <SupervisorAccount sx={{ color: '#64748b' }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: '#64748b' }} textAlign="center">
                      Secure super administrator portal with ultimate system authority
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
              Super Administrator Resources & Critical Support
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
                System Architecture Guide
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
                Critical Incident Response
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default SuperAdminLogin
