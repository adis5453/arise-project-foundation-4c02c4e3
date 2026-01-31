import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Stack,
  Avatar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Autocomplete,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  PhotoCamera,
  Close,
  Save,
  Cancel,
  Person,
  Work,
  ContactPhone,
  School,
  Security,
  Add,
  Delete,
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { toast } from 'sonner'
import { useResponsive } from '../../hooks/useResponsive'

// Local type definitions - using generic types for form compatibility
interface Employee {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  date_of_birth?: string | null
  address?: string
  employee_id?: string
  department_id?: string
  position_id?: string
  employment_status?: string
  employment_type?: string
  hire_date?: string
  salary?: string | number
  is_active?: boolean
  skills?: string[]
  certifications?: string[]
  emergency_contacts?: Array<{ name: string; relationship: string; phone: string; email: string }>
  profile_photo_url?: string
}

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
}

interface Role {
  id: string
  name: string
}

interface EmployeeEditFormProps {
  open: boolean
  onClose: () => void
  employee?: Employee | null
  mode: 'create' | 'edit'
  onSave: (employee: Partial<Employee>) => Promise<void>
  departments: Department[]
  positions: Position[]
  roles: Role[]
}

const EmployeeEditForm: React.FC<EmployeeEditFormProps> = ({
  open,
  onClose,
  employee,
  mode,
  onSave,
  departments,
  positions,
  roles
}) => {
  const responsive = useResponsive()
  const [activeStep, setActiveStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<Employee>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: null,
    address: '',
    employee_id: '',
    department_id: '',
    position_id: '',
    employment_status: 'active',
    employment_type: 'full_time',
    hire_date: dayjs().format('YYYY-MM-DD'),
    salary: '',
    is_active: true,
    skills: [],
    certifications: [],
    emergency_contacts: [],
    profile_photo_url: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newSkill, setNewSkill] = useState('')
  const [newCertification, setNewCertification] = useState('')

  const steps = [
    'Personal Information',
    'Employment Details',
    'Contact Information',
    'Skills & Certifications',
    'Review & Save'
  ]

  useEffect(() => {
    if (employee && mode === 'edit') {
      setFormData({
        ...employee,
        date_of_birth: employee.date_of_birth || null,
        skills: employee.skills || [],
        certifications: employee.certifications || [],
        emergency_contacts: employee.emergency_contacts || []
      })
    } else if (mode === 'create') {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: null,
        address: '',
        employee_id: `EMP${Date.now().toString().slice(-6)}`,
        department_id: '',
        position_id: '',
        employment_status: 'active',
        employment_type: 'full_time',
        hire_date: dayjs().format('YYYY-MM-DD'),
        salary: '',
        is_active: true,
        skills: [],
        certifications: [],
        emergency_contacts: [],
        profile_photo_url: ''
      })
    }
  }, [employee, mode, open])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 0: // Personal Information
        if (!formData.first_name?.trim()) newErrors.first_name = 'First name is required'
        if (!formData.last_name?.trim()) newErrors.last_name = 'Last name is required'
        if (!formData.email?.trim()) newErrors.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format'
        break

      case 1: // Employment Details
        if (!formData.employee_id?.trim()) newErrors.employee_id = 'Employee ID is required'
        if (!formData.department_id) newErrors.department_id = 'Department is required'
        if (!formData.position_id) newErrors.position_id = 'Position is required'
        break

      case 2: // Contact Information
        if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
          newErrors.phone = 'Invalid phone number format'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  const handleSave = async () => {
    if (!validateStep(activeStep)) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
      setActiveStep(0)
      toast.success(`Employee ${mode === 'create' ? 'created' : 'updated'} successfully`)
    } catch (error) {
      toast.error(`Failed to ${mode} employee`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Employee) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target ? event.target.value : event
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleDateChange = (field: keyof Employee) => (date: Dayjs | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.format('YYYY-MM-DD') : null
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove)
    }))
  }

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications?.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), newCertification.trim()]
      }))
      setNewCertification('')
    }
  }

  const removeCertification = (certToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter(cert => cert !== certToRemove)
    }))
  }

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: [
        ...(prev.emergency_contacts || []),
        { name: '', relationship: '', phone: '', email: '' }
      ]
    }))
  }

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts?.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts?.filter((_, i) => i !== index)
    }))
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Personal Information
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }} sx={{ textAlign: 'center', mb: 2 }}>
              <Avatar
                src={formData.profile_photo_url}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              >
                {formData.first_name?.[0]}{formData.last_name?.[0]}
              </Avatar>
              <IconButton component="label" color="primary">
                <PhotoCamera />
                <input type="file" hidden accept="image/*" />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                Upload Profile Photo
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.first_name || ''}
                onChange={handleInputChange('first_name')}
                error={!!errors.first_name}
                helperText={errors.first_name}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.last_name || ''}
                onChange={handleInputChange('last_name')}
                error={!!errors.last_name}
                helperText={errors.last_name}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.date_of_birth ? dayjs(formData.date_of_birth) : null}
                  onChange={handleDateChange('date_of_birth')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.date_of_birth,
                      helperText: errors.date_of_birth
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address || ''}
                onChange={handleInputChange('address')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        )

      case 1: // Employment Details
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employee_id || ''}
                onChange={handleInputChange('employee_id')}
                error={!!errors.employee_id}
                helperText={errors.employee_id}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.department_id} required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department_id || ''}
                  onChange={handleInputChange('department_id')}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.position_id} required>
                <InputLabel>Position</InputLabel>
                <Select
                  value={formData.position_id || ''}
                  onChange={handleInputChange('position_id')}
                  label="Position"
                >
                  {positions.map((pos) => (
                    <MenuItem key={pos.id} value={pos.id}>
                      {pos.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  value={formData.employment_status || 'active'}
                  onChange={handleInputChange('employment_status')}
                  label="Employment Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="terminated">Terminated</MenuItem>
                  <MenuItem value="on_leave">On Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employment_type || 'full_time'}
                  onChange={handleInputChange('employment_type')}
                  label="Employment Type"
                >
                  <MenuItem value="full_time">Full Time</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="intern">Intern</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Hire Date"
                  value={formData.hire_date ? dayjs(formData.hire_date) : dayjs()}
                  onChange={handleDateChange('hire_date')}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Salary"
                value={formData.salary || ''}
                onChange={handleInputChange('salary')}
                type="number"
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                }
                label="Active Employee"
              />
            </Grid>
          </Grid>
        )

      case 2: // Contact Information
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone || ''}
                onChange={handleInputChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
                placeholder="+1 (555) 123-4567"
              />
            </Grid>

            {/* Emergency Contacts */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">Emergency Contacts</Typography>
                  <Button startIcon={<Add />} onClick={addEmergencyContact}>
                    Add Contact
                  </Button>
                </Stack>

                {formData.emergency_contacts?.map((contact, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">Contact {index + 1}</Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEmergencyContact(index)}
                        >
                          <Delete />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={contact.name || ''}
                            onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Relationship"
                            value={contact.relationship || ''}
                            onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={contact.phone || ''}
                            onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          </Grid>
        )

      case 3: // Skills & Certifications
        return (
          <Grid container spacing={3}>
            {/* Skills */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Skills</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <Button onClick={addSkill} variant="outlined">
                  <Add />
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {formData.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => removeSkill(skill)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Grid>

            {/* Certifications */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Certifications</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add certification"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                />
                <Button onClick={addCertification} variant="outlined">
                  <Add />
                </Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {formData.certifications?.map((cert, index) => (
                  <Chip
                    key={index}
                    label={cert}
                    onDelete={() => removeCertification(cert)}
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        )

      case 4: // Review & Save
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Information</Typography>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{formData.first_name} {formData.last_name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{formData.email}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Employment Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                    <Typography variant="body1">{formData.employee_id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body1">{formData.employment_status}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
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
      maxWidth="lg"
      fullWidth
      fullScreen={responsive.isMobile}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Person />
            <Typography variant="h6">
              {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper
          activeStep={activeStep}
          sx={{ mb: 4 }}
          alternativeLabel={!responsive.isMobile}
          orientation={responsive.isMobile ? 'vertical' : 'horizontal'}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={saving}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained">
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : `${mode === 'create' ? 'Create' : 'Update'} Employee`}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default EmployeeEditForm