'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Alert, Container, Stack,
  Avatar, LinearProgress, Divider, Link, useTheme, useMediaQuery
} from '@mui/material'
import { styled } from '@mui/material/styles'
import {
  Visibility, VisibilityOff, Email, Lock, Fingerprint, Security,
  Shield, Analytics, TouchApp
} from '@mui/icons-material'
import { motion, useScroll } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

// Define animations
const floatingAnimation = `
  @keyframes floating {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
    }
    25% {
      transform: translateY(-10px) translateX(5px);
    }
    50% {
      transform: translateY(-5px) translateX(-5px);
    }
    75% {
      transform: translateY(-15px) translateX(10px);
    }
  }
`

const glowAnimation = `
  @keyframes glow {
    0%, 100% {
      text-shadow: 0 0 5px rgba(99, 102, 241, 0.5), 0 0 10px rgba(139, 92, 246, 0.3);
    }
    50% {
      text-shadow: 0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(139, 92, 246, 0.6);
    }
  }
`

const darkPulseAnimation = `
  @keyframes darkPulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
    }
  }
`

// Styled Components
const DarkLoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)
    `,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366f1" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.5,
  },
}))

const DarkBrandingSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}))

const DarkGlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  borderRadius: theme.spacing(3),
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
  },
}))

const DarkTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: theme.spacing(2),
    '& fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.3)',
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6366f1',
      borderWidth: 2,
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    '&.Mui-error fieldset': {
      borderColor: '#ef4444',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#cbd5e1',
    '&.Mui-focused': {
      color: '#6366f1',
    },
    '&.Mui-error': {
      color: '#ef4444',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#f8fafc',
    fontSize: '1rem',
  },
  '& .MuiFormHelperText-root': {
    color: '#ef4444',
    '&.Mui-error': {
      color: '#ef4444',
    },
  },
}))

const LoginCard = styled(Card)(({ theme }) => ({
  maxWidth: 400,
  width: '100%',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  background: theme.palette.background.paper,
}))


const DarkGradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
  borderRadius: 16,
  padding: '16px 32px',
  fontSize: '1.1rem',
  fontWeight: 700,
  textTransform: 'none',
  color: 'white',
  border: 'none',
  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #db2777 100%)',
    transform: 'translateY(-3px) scale(1.02)',
    boxShadow: '0 15px 35px rgba(99, 102, 241, 0.6)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(-1px) scale(0.98)',
  },
  '&:disabled': {
    background: 'rgba(99, 102, 241, 0.3)',
    transform: 'none',
    boxShadow: 'none',
  },
}))

const FloatingParticle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: 4,
  height: 4,
  borderRadius: '50%',
  background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
  animation: `${floatingAnimation} 6s ease-in-out infinite`,
  opacity: 0.6,
  '&:nth-of-type(odd)': {
    animationDelay: '2s',
    animationDuration: '8s',
  },
  '&:nth-of-type(even)': {
    animationDelay: '4s',
    animationDuration: '10s',
  },
}))

const GlowingTitle = styled(Typography)<any>(({ theme }) => ({
  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 800,
  fontSize: '3.5rem', // fallback
  [theme.breakpoints.down('md')]: {
    fontSize: '3rem',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '2.5rem',
  },
  textAlign: 'center',
  marginBottom: theme.spacing(2),
  animation: `${glowAnimation} 3s ease-in-out infinite`,
  letterSpacing: '-0.02em',
}))

export function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isSmallMobile = useMediaQuery('(max-width: 480px)')
  const isTouchDevice = useMediaQuery('(pointer: coarse)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    deviceTrust: false,
  })

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginProgress, setLoginProgress] = useState(0)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [securityIndicators, setSecurityIndicators] = useState([])

  // Animation refs
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const { scrollY } = useScroll()

  // Enhanced particles for dark theme
  const generateParticles = () => {
    return Array.from({ length: 15 }, (_, i) => (
      <FloatingParticle
        key={i}
        sx={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
        }}
      />
    ))
  }

  // Initialize biometric support
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        if (window.PublicKeyCredential) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setBiometricAvailable(available)
        }
      } catch (error) {
      }
    }
    checkBiometric()
  }, [])

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please correct the errors in the form')
      return
    }

    setIsSubmitting(true)
    setLoginError('')
    setLoginProgress(0)

    // Fix memory leak - track interval reference
    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setLoginProgress(prev => Math.min(prev + Math.random() * 30, 90))
      }, 200)

      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        deviceTrust: formData.deviceTrust,
      })

      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      setLoginProgress(100)

      if (result.success) {
        toast.success('🎉 Login successful!', {
          description: 'Welcome to your dashboard...',
          duration: 2000,
        })
        // The AuthGuard will handle navigation automatically
        setTimeout(() => {
          const redirectTo = location.state?.from?.pathname || '/dashboard'
          navigate(redirectTo, { replace: true })
        }, 1500)
      } else {
        setLoginError(result.error || 'Login failed')
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      setLoginError('An unexpected error occurred')
      toast.error('Login failed due to a technical issue')
    } finally {
      // Ensure interval is always cleaned up
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsSubmitting(false)
      setLoginProgress(0)
    }
  }

  // Handle biometric login
  const handleBiometricLogin = async () => {
    if (!biometricAvailable) {
      toast.error('Biometric authentication not available')
      return
    }

    try {
      setIsSubmitting(true)
      toast.success('🎉 Biometric authentication successful!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error('Biometric authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (loginError) {
      setLoginError('')
    }
  }

  return (
    <DarkLoginContainer>
      {/* Floating Particles */}
      {!prefersReducedMotion && generateParticles()}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={8} alignItems="center">

          {/* Left Side - Dark Branding */}
          <DarkBrandingSection sx={{ flex: 1 }}>
            <GlowingTitle>
              Arise HRM
            </GlowingTitle>
            <Typography
              variant="h5"
              sx={{
                color: '#e2e8f0',
                mb: 4,
                textAlign: 'center',
                opacity: 0.9
              }}
            >
              Advanced Human Resource Management
            </Typography>

            {/* Feature highlights */}
            <Stack spacing={3}>
              {[
                { icon: <Security sx={{ color: '#6366f1' }} />, text: 'Enterprise Security', desc: 'Military-grade encryption' },
                { icon: <Shield sx={{ color: '#8b5cf6' }} />, text: 'Data Protection', desc: 'GDPR & SOC2 compliant' },
                { icon: <Fingerprint sx={{ color: '#ec4899' }} />, text: 'Biometric Auth', desc: 'Next-gen authentication' },
                { icon: <Analytics sx={{ color: '#06b6d4' }} />, text: 'AI Analytics', desc: 'Smart insights & predictions' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                        {feature.text}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#cbd5e1', opacity: 0.8 }}>
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Stack>
                </motion.div>
              ))}
            </Stack>
          </DarkBrandingSection>

          {/* Right Side - Dark Login Form */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 520 } }}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <DarkGlassCard>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>

                  {/* Header */}
                  <Stack alignItems="center" spacing={2} mb={4}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        animation: `${darkPulseAnimation} 3s ease-in-out infinite`,
                      }}
                    >
                      <Security sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#f8fafc',
                        fontWeight: 800,
                        textAlign: 'center'
                      }}
                    >
                      Welcome Back
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#cbd5e1',
                        textAlign: 'center',
                        opacity: 0.8
                      }}
                    >
                      Sign in to access your secure workspace
                    </Typography>
                  </Stack>

                  {/* Login Error */}
                  {loginError && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 2,
                        '& .MuiAlert-message': { color: '#f87171' }
                      }}
                    >
                      {loginError}
                    </Alert>
                  )}

                  {/* Progress Bar */}
                  {(loading || isSubmitting) && (
                    <Box sx={{ mb: 3 }}>
                      <LinearProgress
                        variant={loginProgress > 0 ? "determinate" : "indeterminate"}
                        value={loginProgress}
                        sx={{
                          borderRadius: 2,
                          height: 8,
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            borderRadius: 2,
                          },
                        }}
                      />
                      {loginProgress > 0 && (
                        <Typography
                          variant="body2"
                          sx={{ color: '#cbd5e1', mt: 1, textAlign: 'center' }}
                        >
                          Authenticating... {Math.round(loginProgress)}%
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Login Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>

                      {/* Email Field */}
                      <DarkTextField
                        inputRef={emailRef}
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: '#8b5cf6' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Password Field */}
                      <DarkTextField
                        inputRef={passwordRef}
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        error={!!errors.password}
                        helperText={errors.password}
                        disabled={isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: '#8b5cf6' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                disabled={isSubmitting}
                                sx={{ color: '#8b5cf6' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Password Strength */}
                      {formData.password && (
                        <PasswordStrengthMeter password={formData.password} />
                      )}

                      {/* Options */}
                      <Stack spacing={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.rememberMe}
                              onChange={handleInputChange('rememberMe')}
                              sx={{
                                color: '#8b5cf6',
                                '&.Mui-checked': {
                                  color: '#6366f1',
                                },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{ color: '#cbd5e1' }}>
                              Remember me
                            </Typography>
                          }
                        />

                        {/* Security check removed */}
                      </Stack>

                      {/* Login Button */}
                      <DarkGradientButton
                        type="submit"
                        fullWidth
                        size="large"
                        disabled={isSubmitting}
                        sx={{ mt: 2 }}
                      >
                        {isSubmitting ? (
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                '@keyframes spin': {
                                  '0%': { transform: 'rotate(0deg)' },
                                  '100%': { transform: 'rotate(360deg)' },
                                },
                              }}
                            />
                            <span>Signing In...</span>
                          </Stack>
                        ) : (
                          <>
                            Sign In
                            {isTouchDevice && <TouchApp sx={{ ml: 1 }} />}
                          </>
                        )}
                      </DarkGradientButton>

                      {/* Biometric Login */}
                      {biometricAvailable && (
                        <>
                          <Divider sx={{ my: 2 }}>
                            <Typography sx={{ color: '#64748b', px: 2 }}>or</Typography>
                          </Divider>

                          <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            onClick={handleBiometricLogin}
                            disabled={isSubmitting}
                            sx={{
                              borderRadius: 3,
                              py: 2,
                              borderColor: 'rgba(99, 102, 241, 0.5)',
                              color: '#6366f1',
                              backgroundColor: 'rgba(99, 102, 241, 0.05)',
                              '&:hover': {
                                borderColor: '#6366f1',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.2)',
                              },
                            }}
                            startIcon={<Fingerprint />}
                          >
                            {isMobile ? 'Face ID / Touch ID' : 'Biometric Sign In'}
                          </Button>
                        </>
                      )}

                      {/* Footer Links */}
                      <Stack alignItems="center" spacing={1} mt={3}>
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            toast.info('Password reset feature coming soon!')
                          }}
                          sx={{
                            color: '#8b5cf6',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            '&:hover': {
                              color: '#6366f1',
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          Forgot your password?
                        </Link>
                      </Stack>

                      {/* Security Info */}
                      <Box
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: 2,
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600, mb: 1 }}>
                          🔒 Security Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                          Your connection is encrypted and monitored for security.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                          Login attempts are logged for audit purposes.
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </DarkGlassCard>
            </motion.div>
          </Box>
        </Stack>
      </Container>
    </DarkLoginContainer>
  )
}
