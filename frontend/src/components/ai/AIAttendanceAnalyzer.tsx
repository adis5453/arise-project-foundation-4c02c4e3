import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  Warning,
  TrendingDown,
  Schedule,
  Person,
  Analytics,
  Notifications,
  CheckCircle,
  Error,
  Info,
  Close,
  SmartToy
} from '@mui/icons-material'
import { format, subDays, differenceInDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

interface AttendanceRecord {
  id: string
  employee_id: string
  employee_name: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'partial'
  hours_worked: number
  department: string
}

interface AttendanceAnomaly {
  id: string
  employee_id: string
  employee_name: string
  type: 'frequent_late' | 'irregular_hours' | 'long_breaks' | 'weekend_work' | 'consecutive_absences'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  confidence: number
  detected_date: string
  pattern_data: any
  recommendation: string
}

const AIAttendanceAnalyzer: React.FC = () => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AttendanceAnomaly | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch anomalies from backend
  const { data: detectedAnomalies = [], isLoading } = useQuery<AttendanceAnomaly[]>({
    queryKey: ['attendance-anomalies'],
    queryFn: async () => {
      const response = await api.get('/attendance/analysis')
      return response as AttendanceAnomaly[]
    }
  })

  // Helper functions
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, any> = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success'
    }
    return colors[severity] || 'default'
  }

  const getSeverityIcon = (severity: string) => {
    const icons: Record<string, React.ReactNode> = {
      critical: <Error color="error" />,
      high: <Warning color="warning" />,
      medium: <Info color="info" />,
      low: <CheckCircle color="success" />
    }
    return icons[severity] || <Info />
  }

  const getAnomalyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      frequent_late: 'Frequent Lateness',
      irregular_hours: 'Irregular Hours',
      long_breaks: 'Extended Breaks',
      weekend_work: 'Weekend Work',
      consecutive_absences: 'Consecutive Absences'
    }
    return labels[type] || type
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy color="primary" />
        AI Attendance Anomaly Detection
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="error">
              {detectedAnomalies.filter(a => a.severity === 'critical').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Critical Issues
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="warning.main">
              {detectedAnomalies.filter(a => a.severity === 'high').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Priority
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="info.main">
              {detectedAnomalies.filter(a => a.severity === 'medium').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Medium Priority
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="success.main">
              {Math.round((1 - detectedAnomalies.length / 10) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall Health Score
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Anomalies List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detected Anomalies ({detectedAnomalies.length})
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading AI Analysis...</Typography>
            </Box>
          ) : detectedAnomalies.length === 0 ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                No attendance anomalies detected. All employees are following regular attendance patterns.
              </Typography>
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Anomaly Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detectedAnomalies.map((anomaly) => (
                    <TableRow key={anomaly.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {anomaly.employee_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getAnomalyTypeLabel(anomaly.type)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(anomaly.severity) as React.ReactElement}
                          label={anomaly.severity.toUpperCase()}
                          color={getSeverityColor(anomaly.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={anomaly.confidence}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {anomaly.confidence}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {anomaly.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAnomaly(anomaly)
                              setDialogOpen(true)
                            }}
                          >
                            <Analytics />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Anomaly Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnomaly && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Anomaly Details: {selectedAnomaly.employee_name}
                </Typography>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Alert severity={getSeverityColor(selectedAnomaly.severity) as any} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {getAnomalyTypeLabel(selectedAnomaly.type)}
                  </Typography>
                  <Typography variant="body2">
                    {selectedAnomaly.description}
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    label={`${selectedAnomaly.confidence}% Confidence`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Detected: ${format(new Date(selectedAnomaly.detected_date), 'MMM dd, yyyy')}`}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  AI Recommendation
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2">
                    {selectedAnomaly.recommendation}
                  </Typography>
                </Paper>

                {selectedAnomaly.pattern_data && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Pattern Analysis
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <pre style={{ fontSize: '0.875rem', margin: 0 }}>
                        {JSON.stringify(selectedAnomaly.pattern_data, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="contained" color="primary">
                Create Action Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default AIAttendanceAnalyzer
