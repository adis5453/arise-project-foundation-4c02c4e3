'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  Paper,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Star,
  Assignment,
  Timeline,
  People,
  EmojiEvents,
  School,
  TrackChanges as Target,
  Assessment,
  Comment,
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Schedule,
  Flag,
  Psychology,
  Groups,
  WorkspacePremium,
  Analytics,
  Insights,
  BarChart,
  PieChart
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { NumberTicker } from '../common/NumberTicker'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useResponsive } from '../../hooks/useResponsive'
import { PermissionGuard } from '../auth/PermissionGuard'

import DatabaseService from '../../services/databaseService'

// Types
interface PerformanceReview {
  id: string
  employeeId: string
  employeeName: string
  reviewPeriod: string
  status: 'draft' | 'in_progress' | 'completed' | 'approved'
  overallRating: number
  goals: Goal[]
  competencies: Competency[]
  reviewerName: string
  dueDate: string
  avatar?: string
  department: string
}

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  targetDate: string
  priority: 'low' | 'medium' | 'high'
}

interface Competency {
  id: string
  name: string
  rating: number
  category: 'technical' | 'leadership' | 'communication' | 'problem_solving'
  description: string
}

interface PerformanceStats {
  totalReviews: number
  completedReviews: number
  avgRating: number
  improvementRate: number
  highPerformers: number
  needsAttention: number
}

// Animated Performance Card
const PerformanceCard = ({
  review,
  delay = 0
}: {
  review: PerformanceReview
  delay?: number
}) => {
  const theme = useTheme()
  const responsive = useResponsive()
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusConfig = (status: PerformanceReview['status']) => {
    switch (status) {
      case 'completed':
        return { color: 'success', label: 'Completed', icon: <CheckCircle /> }
      case 'in_progress':
        return { color: 'warning', label: 'In Progress', icon: <Schedule /> }
      case 'approved':
        return { color: 'info', label: 'Approved', icon: <Flag /> }
      default:
        return { color: 'default', label: 'Draft', icon: <Edit /> }
    }
  }

  const statusConfig = getStatusConfig(review.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.6,
        delay: delay * 0.1,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.08)} 0%, 
            ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.6)} 100%)`
          },
          '&:hover': {
            boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
          }
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent sx={{ p: responsive.getPadding(2, 3) }}>
          {/* Header */}
          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            justifyContent="space-between"
            alignItems={responsive.isMobile ? "stretch" : "flex-start"}
            spacing={responsive.getSpacing(1, 0)}
            mb={responsive.getSpacing(1.5, 2)}
          >
            <Stack direction="row" alignItems="center" spacing={responsive.getSpacing(1, 2)}>
              <Avatar
                src={review.avatar}
                sx={{
                  width: responsive.isMobile ? 40 : 50,
                  height: responsive.isMobile ? 40 : 50,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                }}
              >
                {review.employeeName[0]}
              </Avatar>
              <Box>
                <Typography
                  variant={responsive.getVariant('subtitle1', 'h6')}
                  fontWeight="bold"
                >
                  {review.employeeName}
                </Typography>
                <Typography
                  variant={responsive.getVariant('caption', 'body2')}
                  color="text.secondary"
                >
                  {review.department} • {review.reviewPeriod}
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={statusConfig.icon}
              label={statusConfig.label}
              color={statusConfig.color as any}
              variant="outlined"
            />
          </Stack>

          {/* Rating */}
          <Box mb={responsive.getSpacing(1.5, 2)}>
            <Stack
              direction={responsive.getFlexDirection('column', 'row')}
              alignItems={responsive.isMobile ? "flex-start" : "center"}
              spacing={responsive.getSpacing(1, 2)}
            >
              <Typography
                variant={responsive.getVariant('h5', 'h4')}
                fontWeight="bold"
                color="primary.main"
              >
                <NumberTicker value={review.overallRating} formatValue={(val) => val.toFixed(1)} />
              </Typography>
              <Rating
                value={review.overallRating}
                readOnly
                precision={0.1}
                size={responsive.isMobile ? "small" : "medium"}
              />
              <Typography
                variant={responsive.getVariant('caption', 'body2')}
                color="text.secondary"
              >
                Overall Rating
              </Typography>
            </Stack>
          </Box>

          {/* Progress Summary */}
          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            spacing={responsive.getSpacing(2, 3)}
            mb={responsive.getSpacing(1.5, 2)}
            justifyContent={responsive.isMobile ? "flex-start" : "space-around"}
          >
            <Box textAlign={responsive.isMobile ? "left" : "center"}>
              <Typography
                variant={responsive.getVariant('subtitle1', 'h6')}
                fontWeight="bold"
                color="success.main"
              >
                <NumberTicker value={review.goals.length} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Goals
              </Typography>
            </Box>
            <Box textAlign={responsive.isMobile ? "left" : "center"}>
              <Typography
                variant={responsive.getVariant('subtitle1', 'h6')}
                fontWeight="bold"
                color="info.main"
              >
                <NumberTicker value={review.competencies.length} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Skills
              </Typography>
            </Box>
            <Box textAlign={responsive.isMobile ? "left" : "center"}>
              <Typography
                variant={responsive.getVariant('subtitle1', 'h6')}
                fontWeight="bold"
                color="warning.main"
              >
                {new Date(review.dueDate).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Due Date
              </Typography>
            </Box>
          </Stack>

          {/* Actions */}
          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            spacing={responsive.getSpacing(1, 1)}
            justifyContent={responsive.isMobile ? "stretch" : "flex-end"}
          >
            <Button
              size={responsive.getButtonSize()}
              startIcon={<Visibility />}
              fullWidth={responsive.isMobile}
            >
              View
            </Button>
            <Button
              size={responsive.getButtonSize()}
              startIcon={<Edit />}
              variant="outlined"
              fullWidth={responsive.isMobile}
            >
              Edit
            </Button>
          </Stack>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Divider sx={{ my: responsive.getSpacing(1.5, 2) }} />

                {/* Goals Progress */}
                {review.goals.length > 0 && (
                  <Box mb={responsive.getSpacing(1.5, 2)}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Goals
                    </Typography>
                    {review.goals.map((goal) => (
                      <Box key={goal.id} mb={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2">{goal.title}</Typography>
                          <Typography variant="caption">{goal.progress}%</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={goal.progress}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Reviewer Info */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Reviewer:</strong> {review.reviewerName}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Main Performance Dashboard

// ...

export function PerformanceReviewDashboard() {
  const { profile } = useAuth()
  const permissions = usePermissions()
  const theme = useTheme()
  const responsive = useResponsive()

  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PerformanceStats>({
    totalReviews: 0,
    completedReviews: 0,
    avgRating: 0,
    improvementRate: 0,
    highPerformers: 0,
    needsAttention: 0
  })
  const [selectedTab, setSelectedTab] = useState(0)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reviewsData, statsData] = await Promise.all([
          DatabaseService.getPerformanceReviews(),
          DatabaseService.getPerformanceStats()
        ]);

        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData);
        }

        if (statsData) {
          setStats(statsData);
        }
      } catch (error) {
        console.error("Failed to fetch performance data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const canManageReviews = permissions.hasPermission('performance.review_team')
  const canViewAllReviews = permissions.hasPermission('performance.view_all')

  return (
    <PermissionGuard permissions={['performance.view_own', 'performance.view_all']} anyPermission>
      <Box sx={{ p: responsive.getPadding(2, 3), background: theme.palette.background.default, minHeight: '100vh' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            justifyContent="space-between"
            alignItems={responsive.isMobile ? "stretch" : "center"}
            spacing={responsive.getSpacing(2, 0)}
            mb={responsive.getSpacing(3, 4)}
          >
            <Box>
              <Typography
                variant={responsive.getVariant('h5', 'h4')}
                fontWeight="bold"
                gutterBottom
              >
                🎯 Performance Reviews
              </Typography>
              <Typography
                variant={responsive.getVariant('body2', 'body1')}
                color="text.secondary"
              >
                Track employee performance, goals, and professional development
              </Typography>
            </Box>

            <Stack
              direction={responsive.getFlexDirection('column', 'row')}
              spacing={responsive.getSpacing(1, 2)}
              sx={{ width: responsive.isMobile ? '100%' : 'auto' }}
            >
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                size={responsive.getButtonSize()}
                fullWidth={responsive.isMobile}
              >
                Analytics
              </Button>

              {canManageReviews && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setReviewDialogOpen(true)}
                  size={responsive.getButtonSize()}
                  fullWidth={responsive.isMobile}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  }}
                >
                  New Review
                </Button>
              )}
            </Stack>
          </Stack>
        </motion.div>

        {/* Stats Cards */}
        <Grid container spacing={responsive.getSpacing(2, 3, 4)} mb={responsive.getSpacing(3, 4)}>
          <Grid component="div" size={responsive.getGridColumns(12, 6, 3)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={responsive.getSpacing(1, 2)} mb={responsive.getSpacing(1, 2)}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                      <Assignment color="primary" />
                    </Box>
                    <Typography variant={responsive.getVariant('h5', 'h4')} fontWeight="bold" color="primary.main">
                      <NumberTicker value={stats.totalReviews} />
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Total Reviews
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid component="div" size={responsive.getGridColumns(12, 6, 3)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={responsive.getSpacing(1, 2)} mb={responsive.getSpacing(1, 2)}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                      <Star color="success" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      <NumberTicker value={stats.avgRating} formatValue={(val) => val.toFixed(1)} />
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid component="div" size={responsive.getGridColumns(12, 6, 3)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={responsive.getSpacing(1, 2)} mb={responsive.getSpacing(1, 2)}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                      <EmojiEvents color="warning" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      <NumberTicker value={stats.highPerformers} />
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    High Performers
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid component="div" size={responsive.getGridColumns(12, 6, 3)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={responsive.getSpacing(1, 2)} mb={responsive.getSpacing(1, 2)}>
                    <Box sx={{ p: 1, borderRadius: 2, backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                      <TrendingUp color="info" />
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      <NumberTicker value={stats.improvementRate} formatValue={(val) => `${val}%`} />
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Improvement Rate
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                📋 Performance Reviews
              </Typography>

              <Grid container spacing={responsive.getSpacing(2, 3, 4)}>
                {reviews.map((review, index) => (
                  <Grid component="div" size={responsive.getGridColumns(12, 6, 4)} key={review.id}>
                    <PerformanceCard review={review} delay={index} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Review Dialog */}
        <Dialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          maxWidth={responsive.getDialogMaxWidth()}
          fullWidth
          fullScreen={responsive.isMobile}
          PaperProps={{ sx: { borderRadius: responsive.isMobile ? 0 : 3 } }}
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Assignment color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Create New Performance Review
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={responsive.getSpacing(2, 3)} mt={responsive.getSpacing(1, 2)}>
              <TextField
                label="Employee Name"
                fullWidth
                placeholder="Select employee..."
                size={responsive.getInputSize()}
              />
              <TextField
                label="Review Period"
                fullWidth
                placeholder="Q1 2025"
                size={responsive.getInputSize()}
              />
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                size={responsive.getInputSize()}
              />
              <TextField
                label="Review Notes"
                multiline
                rows={responsive.isMobile ? 3 : 4}
                fullWidth
                placeholder="Enter initial review notes..."
                size={responsive.getInputSize()}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: responsive.getPadding(2, 3) }}>
            <Stack
              direction={responsive.getFlexDirection('column-reverse', 'row')}
              spacing={responsive.getSpacing(1, 2)}
              sx={{ width: responsive.isMobile ? '100%' : 'auto' }}
            >
              <Button
                onClick={() => setReviewDialogOpen(false)}
                size={responsive.getButtonSize()}
                fullWidth={responsive.isMobile}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                size={responsive.getButtonSize()}
                fullWidth={responsive.isMobile}
              >
                Create Review
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      </Box>
    </PermissionGuard>
  )
}

export default PerformanceReviewDashboard
