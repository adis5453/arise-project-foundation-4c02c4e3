'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  Chip
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  Assignment,
  Schedule,
  Analytics,
  StarRate,
  Group,
  Work,
  Today,
  Notifications,
  Refresh,
  MoreHoriz
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { NumberTicker } from '../common/NumberTicker'

interface DashboardStat {
  id: string
  title: string
  value: number
  trend: number
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  prefix?: string
  suffix?: string
  description?: string
  progress?: number
}

// TODO: Connect to /api/dashboard/stats endpoint for live data
// Stats should come from backend API with real-time metrics
const mockStats: DashboardStat[] = []

// Animated Metric Card with ReactBits styling
const AnimatedStatCard = ({
  stat,
  delay = 0,
  onClick
}: {
  stat: DashboardStat
  delay?: number
  onClick?: () => void
}) => {
  const theme = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 100)
    return () => clearTimeout(timer)
  }, [delay])

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -15,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12,
        duration: 0.6
      }
    },
    hover: {
      y: -8,
      rotateY: 2,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      whileHover="hover"
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        perspective: '1000px',
        height: '100%'
      }}
    >
      <Card
        onClick={onClick}
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette[stat.color].main, 0.1)} 0%, 
            ${alpha(theme.palette[stat.color].main, 0.05)} 50%,
            transparent 100%)`,
          border: `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, 
              ${theme.palette[stat.color].main} 0%, 
              ${alpha(theme.palette[stat.color].main, 0.6)} 100%)`
          },
          '&:hover': {
            boxShadow: `0 20px 40px ${alpha(theme.palette[stat.color].main, 0.15)}`,
            borderColor: alpha(theme.palette[stat.color].main, 0.4),
          }
        }}
      >
        <CardContent sx={{ p: 3, height: '100%' }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette[stat.color].main, 0.15)} 0%, 
                  ${alpha(theme.palette[stat.color].main, 0.1)} 100%)`,
                color: theme.palette[stat.color].main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {stat.icon}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {stat.trend !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay * 0.1 + 0.5 }}
                >
                  <Chip
                    icon={stat.trend >= 0 ? <TrendingUp /> : <TrendingDown />}
                    label={`${stat.trend >= 0 ? '+' : ''}${stat.trend}%`}
                    size="small"
                    color={stat.trend >= 0 ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ fontWeight: 'medium' }}
                  />
                </motion.div>
              )}

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <MoreHoriz />
                    </IconButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </Stack>
          </Stack>

          {/* Main Value */}
          <Typography
            variant="h3"
            fontWeight="bold"
            color={`${stat.color}.main`}
            mb={1}
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1
            }}
          >
            {isVisible && (
              <NumberTicker
                value={stat.value}
                formatValue={(val) => `${stat.prefix || ''}${val.toLocaleString()}${stat.suffix || ''}`}
              />
            )}
          </Typography>

          {/* Title and Description */}
          <Typography
            variant="h6"
            fontWeight="medium"
            gutterBottom
            sx={{ fontSize: '1rem' }}
          >
            {stat.title}
          </Typography>

          {stat.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              mb={2}
              sx={{ fontSize: '0.875rem' }}
            >
              {stat.description}
            </Typography>
          )}

          {/* Progress Bar */}
          {stat.progress !== undefined && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: delay * 0.1 + 0.8, duration: 0.8 }}
            >
              <Box mb={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight="medium">
                    {stat.progress}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={stat.progress}
                  color={stat.color}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette[stat.color].main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: `linear-gradient(90deg, 
                        ${theme.palette[stat.color].main} 0%, 
                        ${alpha(theme.palette[stat.color].main, 0.8)} 100%)`
                    }
                  }}
                />
              </Box>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Main Animated Stats Component
export const AnimatedStats = ({
  onStatClick
}: {
  onStatClick?: (stat: DashboardStat) => void
}) => {
  const [stats] = useState<DashboardStat[]>(mockStats)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              📊 Dashboard Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time metrics and key performance indicators
            </Typography>
          </Box>

          <Tooltip title="Refresh Data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                backgroundColor: alpha('#667eea', 0.1),
                color: '#667eea',
                '&:hover': {
                  backgroundColor: alpha('#667eea', 0.2),
                },
                ...(refreshing && {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                })
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </motion.div>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={stat.id}>
            <AnimatedStatCard
              stat={stat}
              delay={index}
              onClick={() => onStatClick?.(stat)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default AnimatedStats
