import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, Typography, Grid, Button, Container,
  Avatar, Stack, Chip, Divider, Paper, useTheme, Fade, Zoom
} from '@mui/material'
import {
  Person, Group, Business, People, AdminPanelSettings,
  SupervisorAccount, Security, Star, School, Work,
  TrendingUp, ManageAccounts, Shield, Assignment
} from '@mui/icons-material'
import { getDenimGradient, getRoleColor, denimColors } from '../../styles/denimTheme'

interface RoleOption {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  colorCode: string
  icon: React.ReactElement
  features: string[]
  loginPath: string
  demoCredentials: {
    email: string
    password: string
  }
  permissions: string[]
}

// Serializable version for router state (excludes React elements)
interface SerializableRoleData {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  colorCode: string
  features: string[]
  loginPath: string
  permissions: string[]
}

const roleOptions: RoleOption[] = [
  {
    id: 'employee',
    name: 'employee',
    displayName: 'Employee',
    description: 'Standard employee access for daily tasks and personal information',
    level: 40,
    colorCode: denimColors[400],
    icon: <Person />,
    features: ['View Profile', 'Clock In/Out', 'Request Leave', 'View Payslips'],
    loginPath: '/login/employee',
    demoCredentials: {
      email: 'employee@arisehrm.test',
      password: 'Emp@1234'
    },
    permissions: ['dashboard.view', 'employees.view_own', 'attendance.clock_in_out', 'leaves.apply']
  },
  {
    id: 'contractor',
    name: 'contractor',
    displayName: 'Contractor',
    description: 'External contractor with limited access and project-specific permissions',
    level: 30,
    colorCode: denimColors[300] || denimColors[400],
    icon: <Work />,
    features: ['View Projects', 'Submit Timesheets', 'Access Resources', 'Contract Details'],
    loginPath: '/login/employee',
    demoCredentials: {
      email: 'contractor@arisehrm.test',
      password: 'Contract@123'
    },
    permissions: ['dashboard.view', 'projects.view_assigned', 'timesheets.submit']
  },
  {
    id: 'intern',
    name: 'intern',
    displayName: 'Intern',
    description: 'Intern with supervised access and learning-focused features',
    level: 20,
    colorCode: denimColors[300] || denimColors[400],
    icon: <School />,
    features: ['Learning Resources', 'Basic Profile', 'Supervised Tasks', 'Mentorship'],
    loginPath: '/login/employee',
    demoCredentials: {
      email: 'intern@arisehrm.test',
      password: 'Intern@123'
    },
    permissions: ['dashboard.view', 'learning.access', 'profile.view_limited']
  },
  {
    id: 'team_lead',
    name: 'team_lead',
    displayName: 'Team Lead',
    description: 'Team leadership with direct report management and team oversight',
    level: 60,
    colorCode: denimColors[500],
    icon: <Group />,
    features: ['Manage Team', 'Approve Leaves', 'Performance Reviews', 'Team Reports'],
    loginPath: '/login/team-leader',
    demoCredentials: {
      email: 'team.lead@arisehrm.test',
      password: 'Lead@1234'
    },
    permissions: ['employees.view_team', 'leaves.approve_team', 'performance.review_team', 'teams.manage_own']
  },
  {
    id: 'department_manager',
    name: 'department_manager',
    displayName: 'Department Head',
    description: 'Department-wide management with strategic oversight and budget control',
    level: 70,
    colorCode: denimColors[600],
    icon: <Business />,
    features: ['Department Control', 'Budget Management', 'Strategic Planning', 'Resource Allocation'],
    loginPath: '/login/department-manager',
    demoCredentials: {
      email: 'dept.manager@arisehrm.test',
      password: 'Dept@1234'
    },
    permissions: ['employees.view_department', 'leaves.approve_department', 'reports.create', 'teams.assign_members']
  },
  {
    id: 'hr_manager',
    name: 'hr_manager',
    displayName: 'HR Manager',
    description: 'Human Resources management with full employee lifecycle control',
    level: 80,
    colorCode: denimColors[700],
    icon: <People />,
    features: ['Employee Lifecycle', 'Policy Management', 'Compliance', 'Recruitment'],
    loginPath: '/login/hr-manager',
    demoCredentials: {
      email: 'hr.manager@arisehrm.test',
      password: 'Hr@1234'
    },
    permissions: ['employees.view_all', 'leaves.manage_types', 'payroll.process', 'departments.manage']
  },
  {
    id: 'super_admin',
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Ultimate system access with complete platform control and database administration',
    level: 100,
    colorCode: denimColors[900],
    icon: <SupervisorAccount />,
    features: ['Complete Control', 'System Architecture', 'Database Access', 'All Permissions'],
    loginPath: '/login/super-admin',
    demoCredentials: {
      email: 'superadmin@arisehrm.test',
      password: 'Test@1234'
    },
    permissions: ['*']
  }
]

// Export the serializable interface for use in other components
export type { SerializableRoleData }

export const RoleBasedLoginSelector: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role.id)
    // Navigate to specific role login page
    setTimeout(() => {
      // Create serializable role data (exclude React elements)
      const serializableRoleData = {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        level: role.level,
        colorCode: role.colorCode,
        features: role.features,
        loginPath: role.loginPath,
        permissions: role.permissions
      }

      navigate(role.loginPath, {
        state: {
          roleData: serializableRoleData,
          demoCredentials: role.demoCredentials
        }
      })
    }, 300)
  }

  const getRoleCardElevation = (roleId: string) => {
    if (selectedRole === roleId) return 12
    if (hoveredRole === roleId) return 8
    return 3
  }

  const getRoleCardScale = (roleId: string) => {
    if (selectedRole === roleId) return 'scale(0.98)'
    if (hoveredRole === roleId) return 'scale(1.02)'
    return 'scale(1)'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: getDenimGradient('hero'),
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
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
        }
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 3,
                  background: getDenimGradient('primary'),
                  fontSize: '3rem',
                  fontWeight: 'bold'
                }}
              >
                A
              </Avatar>

              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  mb: 2
                }}
              >
                Arise HRM
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 1,
                  fontWeight: 300
                }}
              >
                Choose Your Role to Continue
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                Access your personalized dashboard with role-specific features and permissions
              </Typography>
            </Box>

            {/* Role Selection Grid */}
            <Grid container spacing={3} justifyContent="center">
              {roleOptions.map((role, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={role.id}>
                  <Zoom in timeout={600 + index * 100}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: getRoleCardScale(role.id),
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: selectedRole === role.id
                          ? `2px solid ${role.colorCode}`
                          : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          background: role.colorCode,
                          transform: selectedRole === role.id ? 'scaleX(1)' : 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 0.3s ease'
                        },
                        '&:hover': {
                          '&::before': {
                            transform: 'scaleX(1)'
                          }
                        }
                      }}
                      elevation={getRoleCardElevation(role.id)}
                      onMouseEnter={() => setHoveredRole(role.id)}
                      onMouseLeave={() => setHoveredRole(null)}
                      onClick={() => handleRoleSelect(role)}
                    >
                      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Role Header */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              mx: 'auto',
                              mb: 2,
                              backgroundColor: role.colorCode,
                              color: 'white',
                              fontSize: '1.5rem'
                            }}
                          >
                            {role.icon}
                          </Avatar>

                          <Typography
                            variant="h6"
                            component="h2"
                            gutterBottom
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary'
                            }}
                          >
                            {role.displayName}
                          </Typography>

                          <Chip
                            label={`Level ${role.level}`}
                            size="small"
                            sx={{
                              backgroundColor: role.colorCode,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>

                        {/* Role Description */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 3,
                            textAlign: 'center',
                            lineHeight: 1.6,
                            flex: 1
                          }}
                        >
                          {role.description}
                        </Typography>

                        {/* Key Features */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              mb: 1,
                              display: 'block'
                            }}
                          >
                            Key Features
                          </Typography>
                          <Stack spacing={1}>
                            {role.features.slice(0, 4).map((feature, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: role.colorCode,
                                    flexShrink: 0
                                  }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {feature}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Demo Credentials */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              mb: 1,
                              display: 'block'
                            }}
                          >
                            Demo Login
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Email: {role.demoCredentials.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Password: {role.demoCredentials.password}
                          </Typography>
                        </Box>

                        {/* Login Button */}
                        <Button
                          fullWidth
                          variant="contained"
                          size="large"
                          sx={{
                            py: 1.5,
                            backgroundColor: role.colorCode,
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            boxShadow: `0 4px 12px ${role.colorCode}40`,
                            '&:hover': {
                              backgroundColor: role.colorCode,
                              filter: 'brightness(0.9)',
                              boxShadow: `0 6px 16px ${role.colorCode}60`,
                            },
                            mt: 'auto'
                          }}
                          startIcon={role.icon}
                        >
                          Login as {role.displayName}
                        </Button>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* Additional Information */}
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
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                  <Security sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Secure Role-Based Access
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
                  Each role provides tailored access to relevant features and data. Demo credentials are provided for testing purposes.
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  <Chip
                    label="Enterprise Security"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Chip
                    label="Role-Based Permissions"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Chip
                    label="Real-time Updates"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Stack>
              </Paper>
            </Box>

            {/* Quick Access */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                Quick Access for Testing
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login/employee', {
                    state: {
                      autoFill: true,
                      demoCredentials: { email: 'employee@arisehrm.test', password: 'Emp@1234' }
                    }
                  })}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Employee Demo
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login/team-leader', {
                    state: {
                      autoFill: true,
                      demoCredentials: { email: 'team.lead@arisehrm.test', password: 'Lead@1234' }
                    }
                  })}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Team Leader Demo
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login/super-admin', {
                    state: {
                      autoFill: true,
                      demoCredentials: { email: 'superadmin@arisehrm.test', password: 'Test@1234' }
                    }
                  })}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Super Admin Demo
                </Button>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  )
}

export default RoleBasedLoginSelector
