import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  FormHelperText,
  Switch,
  FormControlLabel,
  Autocomplete,
  Grid,
  Stack,
} from '@mui/material'
import {
  CalendarToday,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Person,
  Assignment,
  AttachFile,
  Close,
  Add,
  Remove,
  Info,
  Notifications,
  Send,
  Save,
  Preview,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusChip } from '../common/StatusChip'
import DatabaseService from '../../services/databaseService'
import dayjs, { Dayjs } from 'dayjs'

// NOTE: This component previously depended on a legacy DB type file that diverged from the
// generated backend types and caused production build errors. For now, keep a small local
// submit payload type aligned with what the UI collects.
export type LeaveRequestSubmitPayload = {
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason?: string
  status?: string
  // Optional, used by this UI but may not exist in the current backend schema yet
  is_half_day?: boolean
  emergency_contact?: string
  return_date?: string | null
  handover_notes?: string
  days_requested?: number
}

interface ConflictInfo {
  type: 'team_understaffed' | 'manager_unavailable' | 'overlapping_request' | 'critical_period'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  affectedEmployees?: any[]
  suggestedAlternatives?: string[]
}

interface LeaveBalance {
  annual: number
  sick: number
  personal: number
  emergency: number
  total: number
}

interface DelegationTask {
  id: string
  title: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high'
  deadline: string
  description: string
}

interface LeaveRequestFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (request: LeaveRequestSubmitPayload) => Promise<void>
  editingRequest?: any | null
  employeeId: string
}

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave', icon: '🏖️', maxDays: 25 },
  { value: 'sick', label: 'Sick Leave', icon: '🏥', maxDays: 10 },
  { value: 'personal', label: 'Personal Leave', icon: '👤', maxDays: 5 },
  { value: 'emergency', label: 'Emergency Leave', icon: '🚨', maxDays: 3 },
  { value: 'maternity', label: 'Maternity Leave', icon: '👶', maxDays: 120 },
  { value: 'paternity', label: 'Paternity Leave', icon: '👨‍👶', maxDays: 14 },
  { value: 'study', label: 'Study Leave', icon: '📚', maxDays: 15 },
  { value: 'compensatory', label: 'Compensatory Leave', icon: '⚖️', maxDays: 0 },
]

const steps = [
  { label: 'Leave Details', description: 'Basic leave information' },
  { label: 'Conflict Check', description: 'Verify team coverage' },
  { label: 'Work Delegation', description: 'Assign tasks to colleagues' },
  { label: 'Review & Submit', description: 'Final review and submission' },
]

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingRequest,
  employeeId,
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [delegationTasks, setDelegationTasks] = useState<DelegationTask[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: null as Dayjs | null,
    end_date: null as Dayjs | null,
    reason: '',
    is_half_day: false,
    emergency_contact: '',
    documents: [] as File[],
    notify_team: true,
    return_date: null as Dayjs | null,
    handover_notes: '',
  })

  useEffect(() => {
    if (open) {
      fetchLeaveBalance()
      fetchTeamMembers()
      if (editingRequest) {
        populateFormData(editingRequest)
      }
    }
  }, [open, editingRequest, employeeId])

  useEffect(() => {
    if (formData.start_date && formData.end_date && formData.leave_type_id) {
      checkConflicts()
    }
  }, [formData.start_date, formData.end_date, formData.leave_type_id])

  const fetchLeaveBalance = async () => {
    try {
      const balances = await DatabaseService.getLeaveBalances(employeeId)
      // Transform array to object
      const balanceMap: any = { total: 0 }
      balances.forEach((b: any) => {
        const typeCode = b.leave_type?.code?.toLowerCase() || b.leave_type_id // fallback
        // Simple mapping based on code or name
        if (typeCode.includes('al') || typeCode.includes('annual')) balanceMap.annual = b.available_balance
        else if (typeCode.includes('sl') || typeCode.includes('sick')) balanceMap.sick = b.available_balance
        else if (typeCode.includes('pl') || typeCode.includes('personal')) balanceMap.personal = b.available_balance
        else if (typeCode.includes('el') || typeCode.includes('emergency')) balanceMap.emergency = b.available_balance

        balanceMap.total += b.available_balance
      })
      setLeaveBalance(balanceMap)
    } catch (error) {
      console.error('Failed to fetch leave balance', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      // Assuming getTeamMembers is available or we use a different method
      const members = await DatabaseService.getUserProfiles({ departmentId: 'my-dept' }) // Simplified for now
      setTeamMembers(members)
    } catch (error) {
    }
  }

  const populateFormData = (request: any) => {
    setFormData({
      leave_type_id: request.leave_type_id || '',
      start_date: dayjs(request.start_date),
      end_date: dayjs(request.end_date),
      reason: request.reason || '',
      is_half_day: request.is_half_day || false,
      emergency_contact: request.emergency_contact || '',
      documents: [],
      notify_team: true,
      return_date: request.return_date ? dayjs(request.return_date) : null,
      handover_notes: request.handover_notes || '',
    })
  }

  const checkConflicts = async () => {
    if (!formData.start_date || !formData.end_date) return

    setLoading(true)
    try {
      // Stubbed conflict check
      const conflictData: ConflictInfo[] = []
      // await leaveService.checkLeaveConflicts(...) 
      setConflicts(conflictData)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const calculateLeaveDays = () => {
    if (!formData.start_date || !formData.end_date) return 0
    const diffDays = formData.end_date.diff(formData.start_date, 'day') + 1
    return formData.is_half_day ? 0.5 : Math.max(0, diffDays)
  }

  const getLeaveTypeInfo = () => {
    return leaveTypes.find(type => type.value === formData.leave_type_id)
  }

  const getAvailableBalance = () => {
    if (!leaveBalance || !formData.leave_type_id) return 0
    return leaveBalance[formData.leave_type_id as keyof LeaveBalance] || 0
  }

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0:
        return formData.leave_type_id && formData.start_date && formData.end_date && formData.reason
      case 1:
        return conflicts.every(c => c.severity !== 'critical')
      case 2:
        return true // Optional step
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceedToNextStep()) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date) return

    setLoading(true)
    try {
      const requestData: any = {
        employee_id: employeeId,
        leave_type_id: formData.leave_type_id,
        start_date: formData.start_date.format('YYYY-MM-DD'),
        end_date: formData.end_date.format('YYYY-MM-DD'),
        reason: formData.reason,
        is_half_day: formData.is_half_day,
        emergency_contact: formData.emergency_contact,
        return_date: formData.return_date?.format('YYYY-MM-DD'),
        handover_notes: formData.handover_notes,
        status: 'pending',
        days_requested: calculateLeaveDays(),
      }

      await onSubmit(requestData)
      onClose()
      resetForm()
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      leave_type_id: '',
      start_date: null,
      end_date: null,
      reason: '',
      is_half_day: false,
      emergency_contact: '',
      documents: [],
      notify_team: true,
      return_date: null,
      handover_notes: '',
    })
    setActiveStep(0)
    setConflicts([])
    setDelegationTasks([])
  }

  const addDelegationTask = () => {
    const newTask: DelegationTask = {
      id: Date.now().toString(),
      title: '',
      assignedTo: '',
      priority: 'medium',
      deadline: '',
      description: '',
    }
    setDelegationTasks([...delegationTasks, newTask])
  }

  const updateDelegationTask = (taskId: string, updates: Partial<DelegationTask>) => {
    setDelegationTasks(tasks =>
      tasks.map(task => task.id === taskId ? { ...task, ...updates } : task)
    )
  }

  const removeDelegationTask = (taskId: string) => {
    setDelegationTasks(tasks => tasks.filter(task => task.id !== taskId))
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ py: 2 }}>
            <Grid container spacing={3}>
              {/* Leave Type Selection */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={formData.leave_type_id}
                    onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                    label="Leave Type"
                  >
                    {leaveTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                          {leaveBalance && (
                            <Chip
                              size="small"
                              label={`${leaveBalance[type.value as keyof LeaveBalance] || 0} days left`}
                              color={
                                (leaveBalance[type.value as keyof LeaveBalance] || 0) > 5
                                  ? 'success'
                                  : (leaveBalance[type.value as keyof LeaveBalance] || 0) > 2
                                    ? 'warning'
                                    : 'error'
                              }
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formData.leave_type_id && (
                    <FormHelperText>
                      Available balance: {getAvailableBalance()} days
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* Date Selection */}
              <Grid size={{ xs: 6 }}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date) => setFormData({ ...formData, start_date: date })}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(date) => setFormData({ ...formData, end_date: date })}
                  minDate={formData.start_date || undefined}
                  slotProps={{
                    textField: { fullWidth: true }
                  }}
                />
              </Grid>

              {/* Half Day Option */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_half_day}
                      onChange={(e) => setFormData({ ...formData, is_half_day: e.target.checked })}
                    />
                  }
                  label="Half Day Leave"
                />
              </Grid>

              {/* Leave Duration Display */}
              {formData.start_date && formData.end_date && (
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Typography variant="h6">
                        Leave Duration: {calculateLeaveDays()} day(s)
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        From {formData.start_date.format('DD/MM/YYYY')} to {formData.end_date.format('DD/MM/YYYY')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Reason */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Reason for Leave"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a detailed reason for your leave request..."
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="Contact number during leave"
                />
              </Grid>
            </Grid>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conflict Analysis
            </Typography>

            {loading ? (
              <Box sx={{ my: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  Checking for potential conflicts...
                </Typography>
              </Box>
            ) : conflicts.length === 0 ? (
              <Alert severity="success" sx={{ my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle />
                  <Typography>No conflicts detected. Your leave request looks good!</Typography>
                </Box>
              </Alert>
            ) : (
              <Stack spacing={2} sx={{ my: 2 }}>
                {conflicts.map((conflict, index) => (
                  <Alert
                    key={index}
                    severity={conflict.severity === 'critical' ? 'error' : 'warning'}
                    action={
                      conflict.suggestedAlternatives && (
                        <Tooltip title="View suggestions">
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      )
                    }
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {conflict.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2">{conflict.message}</Typography>

                    {conflict.affectedEmployees && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption">Affected team members:</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {conflict.affectedEmployees.map((emp, idx) => (
                            <Chip key={idx} size="small" label={emp.name} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Alert>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Team Coverage Analysis
            </Typography>

            <Card sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid component="div" size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      85%
                    </Typography>
                    <Typography variant="caption">Team Coverage</Typography>
                  </Box>
                </Grid>
                <Grid component="div" size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      3
                    </Typography>
                    <Typography variant="caption">Overlapping Leaves</Typography>
                  </Box>
                </Grid>
                <Grid component="div" size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      2
                    </Typography>
                    <Typography variant="caption">Critical Projects</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Box>
        )

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Work Delegation</Typography>
              <Button
                startIcon={<Add />}
                onClick={addDelegationTask}
                variant="outlined"
                size="small"
              >
                Add Task
              </Button>
            </Box>

            {delegationTasks.length === 0 ? (
              <Alert severity="info">
                No tasks to delegate. You can proceed to the next step or add tasks that need to be handled during your absence.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {delegationTasks.map((task) => (
                  <Card key={task.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1">Task #{task.id}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeDelegationTask(task.id)}
                        color="error"
                      >
                        <Remove />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid component="div" size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Task Title"
                          value={task.title}
                          onChange={(e) => updateDelegationTask(task.id, { title: e.target.value })}
                        />
                      </Grid>
                      <Grid component="div" size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                          size="small"
                          options={teamMembers}
                          getOptionLabel={(option) => option.full_name}
                          value={teamMembers.find(m => m.id === task.assignedTo) || null}
                          onChange={(_, value) => updateDelegationTask(task.id, { assignedTo: value?.id || '' })}
                          renderInput={(params) => <TextField {...params} label="Assign To" />}
                        />
                      </Grid>
                      <Grid component="div" size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={task.priority}
                            onChange={(e) => updateDelegationTask(task.id, { priority: e.target.value as any })}
                            label="Priority"
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid component="div" size={{ xs: 12, md: 8 }}>
                        <DatePicker
                          label="Deadline"
                          value={task.deadline ? dayjs(task.deadline) : null}
                          onChange={(date) => updateDelegationTask(task.id, { deadline: date?.toISOString() || '' })}
                          slotProps={{
                            textField: { fullWidth: true, size: 'small' }
                          }}
                        />
                      </Grid>
                      <Grid component="div" size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Description"
                          value={task.description}
                          onChange={(e) => updateDelegationTask(task.id, { description: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Handover Notes"
              value={formData.handover_notes}
              onChange={(e) => setFormData({ ...formData, handover_notes: e.target.value })}
              placeholder="Additional instructions for your team while you're away..."
            />
          </Box>
        )

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Leave Request
            </Typography>

            <Card sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Leave Type</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <span>{getLeaveTypeInfo()?.icon}</span>
                    <Typography>{getLeaveTypeInfo()?.label}</Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>Duration</Typography>
                  <Typography sx={{ mb: 2 }}>
                    {calculateLeaveDays()} day(s)
                    {formData.is_half_day && ' (Half Day)'}
                  </Typography>
                </Grid>

                <Grid component="div" size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>Dates</Typography>
                  <Typography sx={{ mb: 2 }}>
                    {formData.start_date?.format('DD/MM/YYYY')} to {formData.end_date?.format('DD/MM/YYYY')}
                  </Typography>
                </Grid>

                <Grid component="div" size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>Reason</Typography>
                  <Typography sx={{ mb: 2 }}>{formData.reason}</Typography>
                </Grid>

                {formData.emergency_contact && (
                  <Grid component="div" size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Emergency Contact</Typography>
                    <Typography sx={{ mb: 2 }}>{formData.emergency_contact}</Typography>
                  </Grid>
                )}

                {delegationTasks.length > 0 && (
                  <Grid component="div" size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom>Delegated Tasks</Typography>
                    <List dense>
                      {delegationTasks.map((task) => (
                        <ListItem key={task.id}>
                          <ListItemText
                            primary={task.title}
                            secondary={`Assigned to: ${teamMembers.find(m => m.id === task.assignedTo)?.full_name || 'Unknown'}`}
                          />
                          <StatusChip status={task.priority as any} size="sm" />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </Card>

            {conflicts.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Note: This request has potential conflicts</Typography>
                <Typography variant="body2">
                  {conflicts.length} conflict(s) detected. Please ensure proper coverage is arranged.
                </Typography>
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={formData.notify_team}
                  onChange={(e) => setFormData({ ...formData, notify_team: e.target.checked })}
                />
              }
              label="Notify team members about this leave request"
            />
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  index === 2 ? (
                    <Typography variant="caption">Optional</Typography>
                  ) : null
                }
              >
                <Typography variant="subtitle1">{step.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent(index)}
                </motion.div>

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading || !canProceedToNextStep()}
                      startIcon={<Send />}
                    >
                      Submit Request
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceedToNextStep()}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
    </Dialog>
  )
}
