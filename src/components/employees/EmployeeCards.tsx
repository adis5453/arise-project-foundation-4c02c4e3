'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Stack,
  Grid,
  Button,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Zoom,
  CircularProgress
} from '@mui/material'
import SimpleOptimizedImage from '../common/SimpleOptimizedImage'
import {
  Email,
  Phone,
  LocationOn,
  MoreVert,
  Star,
  TrendingUp,
  WorkOutline,
  CalendarToday,
  Groups
} from '@mui/icons-material'
// Removed framer-motion animations for better performance
import { NumberTicker } from '../common/NumberTicker'
import { useResponsive } from '../../hooks/useResponsive'

// Import canonical Employee type
import type { Employee } from '../../types/employee.types'
import api from '../../lib/api'
import { useQuery } from '@tanstack/react-query'

// NOTE: This component uses a simplified subset of Employee fields for UI display
// The canonical Employee type has 80+ fields with nested objects

// Helper type for display (what the EmployeeCard component expects)
interface EmployeeCardData {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  avatar?: string
  location: string
  joinDate: string
  performance: number
  projects: number
  isOnline: boolean
  salary?: number
  skills: string[]
}

// Helper function to transform canonical Employee to card display format
const transformEmployeeForCard = (emp: Employee): EmployeeCardData => ({
  id: emp.id,
  name: `${emp.first_name} ${emp.last_name}`,
  position: typeof emp.position === 'object' ? emp.position?.name || 'N/A' : emp.position_name || 'N/A',
  department: typeof emp.department === 'object' ? emp.department?.name || 'N/A' : emp.department_name || 'N/A',
  email: emp.email,
  phone: emp.phone_number || emp.phone || 'N/A',
  avatar: emp.profile_photo_url,
  location: emp.location || 'N/A',
  joinDate: emp.hire_date || emp.created_at || new Date().toISOString(),
  performance: 0, // TODO: Add performance_score to Employee type
  projects: 0, // TODO: Add projects_count to Employee type
  isOnline: emp.status === 'active',
  salary: emp.salary || emp.basic_salary,
  skills: emp.skills || []
})

// Animated Employee Card Component (ReactBits inspired)
const EmployeeCard = ({ employee, delay = 0 }: { employee: EmployeeCardData; delay?: number }) => {
  const theme = useTheme()
  const responsive = useResponsive()
  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Design': theme.palette.secondary.main,
      'Engineering': theme.palette.primary.main,
      'Marketing': theme.palette.warning.main,
      'HR': theme.palette.info.main,
      'Sales': theme.palette.success.main,
    }
    return colors[department as keyof typeof colors] || theme.palette.grey[500]
  }

  return (
    <div>
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, 
            ${alpha(getDepartmentColor(employee.department), 0.08)} 0%, 
            ${alpha(getDepartmentColor(employee.department), 0.02)} 100%)`,
          border: `1px solid ${alpha(getDepartmentColor(employee.department), 0.2)}`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${getDepartmentColor(employee.department)} 0%, ${alpha(getDepartmentColor(employee.department), 0.6)} 100%)`
          },
          '&:hover': {
            boxShadow: `0 20px 40px ${alpha(getDepartmentColor(employee.department), 0.15)}`,
          }
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent sx={{ p: responsive.getPadding(2, 2.5, 3), pb: responsive.getPadding(1.5, 2, 2) }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: employee.isOnline ? 'success.main' : 'grey.400',
                    border: `2px solid ${theme.palette.background.paper}`
                  }}
                />
              }
            >
              {employee.avatar ? (
                <SimpleOptimizedImage
                  src={employee.avatar}
                  alt={employee.name}
                  width={responsive.isMobile ? 50 : 60}
                  height={responsive.isMobile ? 50 : 60}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  priority={false}
                />
              ) : (
                <Avatar
                  sx={{
                    width: responsive.isMobile ? 50 : 60,
                    height: responsive.isMobile ? 50 : 60,
                    background: `linear-gradient(45deg, ${getDepartmentColor(employee.department)} 30%, ${alpha(getDepartmentColor(employee.department), 0.8)} 90%)`,
                    fontSize: responsive.isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
              )}
            </Badge>

            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <MoreVert />
            </IconButton>
          </Stack>

          {/* Employee Info */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {employee.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {employee.position}
          </Typography>

          <Chip
            label={employee.department}
            size="small"
            sx={{
              backgroundColor: alpha(getDepartmentColor(employee.department), 0.1),
              color: getDepartmentColor(employee.department),
              fontWeight: 'medium',
              mb: 2
            }}
          />

          {/* Performance Metrics */}
          <Stack direction="row" spacing={2} mb={2}>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                <NumberTicker value={employee.performance} />%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Performance
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" fontWeight="bold" color="success.main">
                <NumberTicker value={employee.projects} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Projects
              </Typography>
            </Box>
          </Stack>

          {/* Skills */}
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              Top Skills:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {employee.skills.slice(0, 2).map((skill, index) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', height: 'auto', py: 0.5 }}
                />
              ))}
              {employee.skills.length > 2 && (
                <Chip
                  label={`+${employee.skills.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', height: 'auto', py: 0.5 }}
                />
              )}
            </Stack>
          </Box>

          {/* Quick Actions */}
          {isHovered && (
            <div>
              <Stack direction="row" spacing={1} justifyContent="center">
                <Tooltip title="Send Email">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <Email fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Call">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.2),
                      }
                    }}
                  >
                    <Phone fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Profile">
                  <IconButton
                    size="small"
                    sx={{
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.info.main, 0.2),
                      }
                    }}
                  >
                    <Star fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </div>
          )}

          {/* Detailed Info */}
          {showDetails && (
            <div>
              <Box mt={2} pt={2} borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="caption">{employee.email}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="caption">{employee.phone}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="caption">{employee.location}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarToday fontSize="small" color="action" />
                    <Typography variant="caption">
                      Joined {new Date(employee.joinDate).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main Component
const EmployeeCards = () => {
  // Fetch live employees from database
  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees-cards'],
    queryFn: () => api.getEmployees({ status: 'active' }),
  })

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading employees...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Failed to load employees</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f8fe 0%, #deedfb 50%, #c4e2f9 100%)',
      py: 6,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(rgba(73, 151, 232, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{
            background: 'linear-gradient(135deg, #264882 0%, #4997e8 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          👥 Team Members
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          {employees.length} active team member{employees.length !== 1 ? 's' : ''}
        </Typography>
      </div>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3,
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px'
        }}
      >
        {employees.map((employee: Employee, index: number) => (
          <EmployeeCard
            key={employee.id}
            employee={transformEmployeeForCard(employee)}
            delay={index}
          />
        ))}
      </Box>
    </Box>
  )
}

export default EmployeeCards
