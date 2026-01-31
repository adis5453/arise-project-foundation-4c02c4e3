'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Tooltip,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Autocomplete,
} from '@mui/material'
import {
  PersonAdd,
  Edit,
  Delete,
  Visibility,
  Message,
  Save,
  Cancel,
  Upload,
  Download,
  Search,
  FilterList,
  ExpandMore,
  Business,
  Email,
  Phone,
  LocationOn,
  Work,
  CalendarToday,
  School,
  Star,
  Security,
  Badge,
  PhotoCamera,
  CloudUpload,
  Assignment,
  Group,
  Timeline,
  Analytics,
  Print,
  Share,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  Close,
  Add,
  Remove,
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker as XDatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { useResponsive } from '../../hooks/useResponsive'
import DatabaseService from '../../services/databaseService'
import EmployeeProfile from './EmployeeProfile'
import EmployeeEditForm from './EmployeeEditForm'
import MessageCenter from '../common/MessageCenter'
import AnalyticsDashboard from '../analytics/AnalyticsDashboard'
import ImportExportDialog from './ImportExportDialog'
import { Employee } from '../../types/employee.types';

interface Team {
  id: string
  name: string
  department_id: string
}

interface Department {
  id: string
  name: string
  code: string
  manager_id?: string
}

interface Position {
  id: string
  title: string
  department_id: string
  level?: string
  min_salary?: number
  max_salary?: number
}

interface Role {
  id: number
  name: string
  display_name: string
  level: number
}

const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'default' },
  { value: 'on_leave', label: 'On Leave', color: 'warning' },
  { value: 'terminated', label: 'Terminated', color: 'error' },
]

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]

const SKILLS_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java',
  'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 'MongoDB', 'PostgreSQL',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'Testing',
  'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication', 'Problem Solving'
]

export default function EmployeeManagement() {
  const { profile } = useAuth()
  const responsive = useResponsive()

  // State
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMessageCenter, setShowMessageCenter] = useState(false)
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee>>({})
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')
  const [activeStep, setActiveStep] = useState(0)
  const [activeTab, setActiveTab] = useState(0)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Load data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [employeesData, departmentsData, positionsData, teamsData] = await Promise.all([
        DatabaseService.getUserProfiles({ isActive: true }),
        DatabaseService.getDepartments(),
        DatabaseService.getPositions(),
        DatabaseService.getTeams(),
      ])

      if (employeesData) {
        setEmployees(employeesData as Employee[])
      }
      if (departmentsData) {
        setDepartments(departmentsData as Department[])
      }
      if (teamsData) {
        setTeams(teamsData as Team[])
      }
      if (positionsData) {
        setPositions(positionsData as Position[])
      }

      // Load demo roles
      setRoles([
        { id: 1, name: 'admin', display_name: 'Administrator', level: 6 },
        { id: 2, name: 'hr_manager', display_name: 'HR Manager', level: 5 },
        { id: 3, name: 'manager', display_name: 'Manager', level: 4 },
        { id: 4, name: 'team_lead', display_name: 'Team Lead', level: 3 },
        { id: 5, name: 'senior', display_name: 'Senior Employee', level: 2 },
        { id: 6, name: 'employee', display_name: 'Employee', level: 1 },
        { id: 7, name: 'intern', display_name: 'Intern', level: 0 },
      ])

      toast.success('Employee data loaded successfully')
    } catch (error) {
      toast.error('Failed to load employee data')
    } finally {
      setLoading(false)
    }
  }

  // Performance optimization: Create lookup maps to avoid expensive find() operations
  const departmentMap = useMemo(() => {
    return departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name
      return acc
    }, {} as Record<string, string>)
  }, [departments])

  const positionMap = useMemo(() => {
    return positions.reduce((acc, pos) => {
      acc[pos.id] = pos.title
      return acc
    }, {} as Record<string, string>)
  }, [positions])

  const statusConfigMap = useMemo(() => {
    return EMPLOYMENT_STATUSES.reduce((acc, status) => {
      acc[status.value] = status
      return acc
    }, {} as Record<string, any>)
  }, [])

  // Employee CRUD operations
  const handleCreateEmployee = () => {
    setEditMode('create')
    setSelectedEmployee(null)
    setShowEditForm(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditMode('edit')
    setSelectedEmployee(employee)
    setShowEditForm(true)
  }

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowProfileDialog(true)
  }

  const handleEditFromProfile = (employee: Employee) => {
    setShowProfileDialog(false)
    setTimeout(() => {
      setEditMode('edit')
      setSelectedEmployee(employee)
      setShowEditForm(true)
    }, 100)
  }

  const handleSendMessage = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowMessageCenter(true)
  }

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    if (!employeeData.first_name || !employeeData.last_name || !employeeData.email) {
      toast.error('Please fill in all required fields')
      return // Exit early instead of throwing
    }

    setSaving(true)
    try {
      if (editMode === 'create') {
        const result = await DatabaseService.createUserProfile({
          ...employeeData,
          auth_user_id: crypto.randomUUID(), // In real app, this would come from auth
        } as any)

        if (result) {
          setEmployees(prev => [...prev, result as Employee])
          toast.success('Employee created successfully')
        }
      } else if (editMode === 'edit' && selectedEmployee) {
        const result = await DatabaseService.updateUserProfile(
          selectedEmployee.employee_id,
          employeeData as any
        )

        if (result) {
          setEmployees(prev =>
            prev.map(emp =>
              emp.employee_id === selectedEmployee.employee_id
                ? { ...emp, ...employeeData }
                : emp
            )
          )
          toast.success('Employee updated successfully')
        }
      }

      setShowEditForm(false)
      setSelectedEmployee(null)
    } catch (error) {
      toast.error('Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return

    setSaving(true)
    try {
      // In a real app, you might want to soft delete or deactivate
      const result = await DatabaseService.updateUserProfile(
        selectedEmployee.employee_id,
        { is_active: false, employment_status: 'terminated' } as any
      )

      if (result) {
        setEmployees(prev =>
          prev.filter(emp => emp.employee_id !== selectedEmployee.employee_id)
        )
        toast.success('Employee removed successfully')
      }

      setShowDeleteDialog(false)
      setSelectedEmployee(null)
    } catch (error) {
      toast.error('Failed to remove employee')
    } finally {
      setSaving(false)
    }
  }

  // Form helpers
  const updateEmployeeField = (field: keyof Employee, value: any) => {
    setEditingEmployee(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = (skill: string) => {
    if (skill && !editingEmployee.skills?.includes(skill)) {
      updateEmployeeField('skills', [...(editingEmployee.skills || []), skill])
    }
  }

  const removeSkill = (skillToRemove: string) => {
    updateEmployeeField('skills', editingEmployee.skills?.filter(skill => skill !== skillToRemove) || [])
  }

  const addCertification = () => {
    const newCert = {
      name: '',
      issuer: '',
      date: dayjs().format('YYYY-MM-DD'),
    }
    updateEmployeeField('certifications', [...(editingEmployee.certifications || []), newCert])
  }

  const updateCertification = (index: number, field: string, value: string) => {
    const certs = [...(editingEmployee.certifications || [])]
    certs[index] = { ...certs[index], [field]: value }
    updateEmployeeField('certifications', certs)
  }

  const removeCertification = (index: number) => {
    updateEmployeeField('certifications', editingEmployee.certifications?.filter((_, i) => i !== index) || [])
  }

  const addEmergencyContact = () => {
    const newContact = {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
    updateEmployeeField('emergency_contacts', [...(editingEmployee.emergency_contacts || []), newContact])
  }

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const contacts = [...(editingEmployee.emergency_contacts || [])]
    contacts[index] = { ...contacts[index], [field]: value }
    updateEmployeeField('emergency_contacts', contacts)
  }

  const removeEmergencyContact = (index: number) => {
    updateEmployeeField('emergency_contacts', editingEmployee.emergency_contacts?.filter((_, i) => i !== index) || [])
  }

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchQuery ||
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || employee.employment_status === statusFilter
    const matchesDepartment = !departmentFilter || employee.department_id === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  // Stepper content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfoStep()
      case 1:
        return renderEmploymentStep()
      case 2:
        return renderSkillsStep()
      case 3:
        return renderContactsStep()
      default:
        return null
    }
  }

  const renderBasicInfoStep = () => (
    <Grid container spacing={responsive.getSpacing(2, 3)}>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="First Name"
          value={editingEmployee.first_name || ''}
          onChange={(e) => updateEmployeeField('first_name', e.target.value)}
          required
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Last Name"
          value={editingEmployee.last_name || ''}
          onChange={(e) => updateEmployeeField('last_name', e.target.value)}
          required
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Employee ID"
          value={editingEmployee.employee_id || ''}
          onChange={(e) => updateEmployeeField('employee_id', e.target.value)}
          required
          disabled={dialogMode === 'view' || dialogMode === 'edit'}
          size={responsive.getInputSize()}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={editingEmployee.email || ''}
          onChange={(e) => updateEmployeeField('email', e.target.value)}
          required
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Phone"
          value={editingEmployee.phone || ''}
          onChange={(e) => updateEmployeeField('phone', e.target.value)}
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Profile Photo URL"
          value={editingEmployee.profile_photo_url || ''}
          onChange={(e) => updateEmployeeField('profile_photo_url', e.target.value)}
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <PhotoCamera />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  )

  const renderEmploymentStep = () => (
    <Grid container spacing={responsive.getSpacing(2, 3)}>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Department</InputLabel>
          <Select
            value={editingEmployee.department_id || ''}
            label="Department"
            onChange={(e) => updateEmployeeField('department_id', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid {...responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Team</InputLabel>
          <Select
            value={editingEmployee.team_id || ''}
            label="Team"
            onChange={(e) => updateEmployeeField('team_id', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {teams
              .filter(team => !editingEmployee.department_id || team.department_id === editingEmployee.department_id)
              .map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Position</InputLabel>
          <Select
            value={editingEmployee.position_id || ''}
            label="Position"
            onChange={(e) => updateEmployeeField('position_id', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            {positions
              .filter(pos => !editingEmployee.department_id || pos.department_id === editingEmployee.department_id)
              .map((pos) => (
                <MenuItem key={pos.id} value={pos.id}>
                  {pos.title}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Role</InputLabel>
          <Select
            value={editingEmployee.role_id || ''}
            label="Role"
            onChange={(e) => updateEmployeeField('role_id', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Employment Status</InputLabel>
          <Select
            value={editingEmployee.employment_status || ''}
            label="Employment Status"
            onChange={(e) => updateEmployeeField('employment_status', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            {EMPLOYMENT_STATUSES.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Employment Type</InputLabel>
          <Select
            value={editingEmployee.employment_type || ''}
            label="Employment Type"
            onChange={(e) => updateEmployeeField('employment_type', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <FormControl fullWidth size={responsive.getInputSize()}>
          <InputLabel>Shift</InputLabel>
          <Select
            value={editingEmployee.shift || 'morning'}
            label="Shift"
            onChange={(e) => updateEmployeeField('shift', e.target.value)}
            disabled={dialogMode === 'view'}
          >
            <MenuItem value="morning">Morning (9:00 AM - 5:00 PM)</MenuItem>
            <MenuItem value="evening">Evening (2:00 PM - 10:00 PM)</MenuItem>
            <MenuItem value="night">Night (10:00 PM - 6:00 AM)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <XDatePicker
            label="Hire Date"
            value={editingEmployee.hire_date ? dayjs(editingEmployee.hire_date) : null}
            onChange={(date) => updateEmployeeField('hire_date', date?.format('YYYY-MM-DD') || '')}
            disabled={dialogMode === 'view'}
            slotProps={{
              textField: {
                fullWidth: true,
                size: responsive.getInputSize(),
              }
            }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Salary"
          type="number"
          value={editingEmployee.salary || ''}
          onChange={(e) => updateEmployeeField('salary', parseFloat(e.target.value) || 0)}
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>
          }}
        />
      </Grid>
      <Grid size={responsive.getGridColumns(12, 6)}>
        <TextField
          fullWidth
          label="Work Location"
          value={editingEmployee.work_location || ''}
          onChange={(e) => updateEmployeeField('work_location', e.target.value)}
          disabled={dialogMode === 'view'}
          size={responsive.getInputSize()}
        />
      </Grid>
    </Grid >
  )

  const renderSkillsStep = () => (
    <Stack spacing={responsive.getSpacing(2, 3)}>
      <Box>
        <Typography variant="h6" gutterBottom>Skills</Typography>
        {dialogMode !== 'view' && (
          <Autocomplete
            options={SKILLS_OPTIONS}
            value=""
            onChange={(_, value) => value && addSkill(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Add Skill"
                size={responsive.getInputSize()}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <IconButton onClick={() => addSkill(String(params.inputProps.value || ''))}>
                        <Add />
                      </IconButton>
                    </>
                  )
                }}
              />
            )}
          />
        )}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {editingEmployee.skills?.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={dialogMode !== 'view' ? () => removeSkill(skill) : undefined}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      <Divider />

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">Certifications</Typography>
          {dialogMode !== 'view' && (
            <Button startIcon={<Add />} onClick={addCertification} size={responsive.getButtonSize()}>
              Add Certification
            </Button>
          )}
        </Stack>
        <Stack spacing={2}>
          {editingEmployee.certifications?.map((cert, index) => (
            <Card key={index} variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={responsive.getGridColumns(12, 6)}>
                    <TextField
                      fullWidth
                      label="Certification Name"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      disabled={dialogMode === 'view'}
                      size={responsive.getInputSize()}
                    />
                  </Grid>
                  <Grid size={responsive.getGridColumns(12, 6)}>
                    <TextField
                      fullWidth
                      label="Issuer"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      disabled={dialogMode === 'view'}
                      size={responsive.getInputSize()}
                    />
                  </Grid>
                  <Grid size={responsive.getGridColumns(12, 6)}>
                    <TextField
                      fullWidth
                      label="Date Obtained"
                      type="date"
                      value={cert.date}
                      onChange={(e) => updateCertification(index, 'date', e.target.value)}
                      disabled={dialogMode === 'view'}
                      size={responsive.getInputSize()}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={responsive.getGridColumns(12, 6)}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        fullWidth
                        label="Expires (Optional)"
                        type="date"
                        value={cert.expires || ''}
                        onChange={(e) => updateCertification(index, 'expires', e.target.value)}
                        disabled={dialogMode === 'view'}
                        size={responsive.getInputSize()}
                        InputLabelProps={{ shrink: true }}
                      />
                      {dialogMode !== 'view' && (
                        <IconButton onClick={() => removeCertification(index)} color="error">
                          <Remove />
                        </IconButton>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    </Stack>
  )

  const renderContactsStep = () => (
    <Stack spacing={responsive.getSpacing(2, 3)}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Emergency Contacts</Typography>
        {dialogMode !== 'view' && (
          <Button startIcon={<Add />} onClick={addEmergencyContact} size={responsive.getButtonSize()}>
            Add Contact
          </Button>
        )}
      </Stack>
      <Stack spacing={2}>
        {editingEmployee.emergency_contacts?.map((contact, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={responsive.getGridColumns(12, 6)}>
                  <TextField
                    fullWidth
                    label="Contact Name"
                    value={contact.name}
                    onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                    disabled={dialogMode === 'view'}
                    size={responsive.getInputSize()}
                  />
                </Grid>
                <Grid size={responsive.getGridColumns(12, 6)}>
                  <TextField
                    fullWidth
                    label="Relationship"
                    value={contact.relationship}
                    onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                    disabled={dialogMode === 'view'}
                    size={responsive.getInputSize()}
                  />
                </Grid>
                <Grid size={responsive.getGridColumns(12, 6)}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={contact.phone}
                    onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                    disabled={dialogMode === 'view'}
                    size={responsive.getInputSize()}
                  />
                </Grid>
                <Grid size={responsive.getGridColumns(12, 6)}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      label="Email (Optional)"
                      type="email"
                      value={contact.email || ''}
                      onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                      disabled={dialogMode === 'view'}
                      size={responsive.getInputSize()}
                    />
                    {dialogMode !== 'view' && (
                      <IconButton onClick={() => removeEmergencyContact(index)} color="error">
                        <Remove />
                      </IconButton>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: responsive.getPadding(2, 3) }}>
        {/* Header */}
        <Stack
          direction={responsive.getFlexDirection('column', 'row')}
          justifyContent="space-between"
          alignItems={responsive.isMobile ? "stretch" : "center"}
          spacing={responsive.getSpacing(2, 0)}
          sx={{ mb: responsive.getSpacing(2, 3) }}
        >
          <Box>
            <Typography
              variant={responsive.getVariant('h5', 'h4')}
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Employee Management
            </Typography>
            <Typography
              variant={responsive.getVariant('body2', 'body1')}
              color="text.secondary"
            >
              Create, edit, and manage employee profiles and information
            </Typography>
          </Box>

          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            spacing={responsive.getSpacing(1, 2)}
            sx={{ width: responsive.isMobile ? '100%' : 'auto' }}
          >
            <Button
              variant="outlined"
              startIcon={<Upload />}
              size={responsive.getButtonSize()}
              fullWidth={responsive.isMobile}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.csv'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const rows = text.split(/\r?\n/).filter(Boolean)
                    const [header, ...data] = rows
                    const headers = header.split(',').map(h => h.trim().toLowerCase())
                    const imported: Employee[] = data.map((row) => {
                      const cols = row.split(',')
                      const obj: any = {}
                      headers.forEach((h, i) => (obj[h] = cols[i]))
                      obj.is_active = obj.is_active !== 'false'
                      return obj as Employee
                    })
                    setEmployees(prev => [...imported, ...prev])
                    toast.success(`Imported ${imported.length} employees`)
                  } catch {
                    toast.error('Failed to import CSV')
                  }
                }
                input.click()
              }}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              size={responsive.getButtonSize()}
              fullWidth={responsive.isMobile}
              onClick={() => {
                try {
                  const csv = ['employee_id,first_name,last_name,email,department_id,position_id,status']
                  employees.forEach(e => {
                    csv.push([e.employee_id, e.first_name, e.last_name, e.email, e.department_id || '', e.position_id || '', e.employment_status].join(','))
                  })
                  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success('Employees exported')
                } catch {
                  toast.error('Export failed')
                }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              size={responsive.getButtonSize()}
              fullWidth={responsive.isMobile}
              onClick={handleCreateEmployee}
            >
              Add Employee
            </Button>
          </Stack>
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: responsive.getPadding(2, 3), mb: responsive.getSpacing(2, 3), borderRadius: 3 }}>
          <Stack spacing={responsive.getSpacing(2, 3)}>
            <Stack
              direction={responsive.getFlexDirection('column', 'row')}
              spacing={responsive.getSpacing(2, 2)}
              alignItems={responsive.isMobile ? "stretch" : "center"}
            >
              <TextField
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size={responsive.getInputSize()}
                sx={{
                  minWidth: responsive.isMobile ? '100%' : 300,
                  maxWidth: responsive.isMobile ? '100%' : 400
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                size={responsive.getButtonSize()}
              >
                {responsive.isSmallMobile ? 'Filters' : 'Advanced Filters'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadInitialData}
                size={responsive.getButtonSize()}
                disabled={loading}
              >
                Refresh
              </Button>
            </Stack>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Grid container spacing={responsive.getSpacing(2, 2)} sx={{ pt: 2 }}>
                    <Grid size={responsive.getGridColumns(12, 6, 4)}>
                      <FormControl fullWidth size={responsive.getInputSize()}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          label="Status"
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <MenuItem value="">All Statuses</MenuItem>
                          {EMPLOYMENT_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={responsive.getGridColumns(12, 6, 4)}>
                      <FormControl fullWidth size={responsive.getInputSize()}>
                        <InputLabel>Department</InputLabel>
                        <Select
                          value={departmentFilter}
                          label="Department"
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                          <MenuItem value="">All Departments</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={responsive.getGridColumns(12, 12, 4)}>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setStatusFilter('')
                            setDepartmentFilter('')
                            setSearchQuery('')
                          }}
                          size={responsive.getButtonSize()}
                          fullWidth
                        >
                          Clear Filters
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </Paper>

        {/* Employee List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              // Fix table responsiveness
              maxWidth: '100%',
              '& .MuiTable-root': {
                minWidth: responsive.isMobile ? '100%' : 800,
              },
              // Better mobile scrollbar
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 4,
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.3)',
                },
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  {!responsive.isMobile && <TableCell>Department</TableCell>}
                  {!responsive.isSmallMobile && <TableCell>Position</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.employee_id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewEmployee(employee)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={employee.profile_photo_url}
                          sx={{
                            width: responsive.isSmallMobile ? 32 : 40,
                            height: responsive.isSmallMobile ? 32 : 40
                          }}
                        >
                          {employee.first_name[0]}{employee.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {employee.first_name} {employee.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.employee_id}
                          </Typography>
                          {responsive.isMobile && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {employee.department_id ? departmentMap[employee.department_id] : 'No Department'}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    {!responsive.isMobile && (
                      <TableCell>
                        {employee.department_id ? departmentMap[employee.department_id] : 'No Department'}
                      </TableCell>
                    )}
                    {!responsive.isSmallMobile && (
                      <TableCell>
                        {employee.position_id ? positionMap[employee.position_id] : 'No Position'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={employee.employment_status ? (statusConfigMap[employee.employment_status]?.label || employee.employment_status) : (employee.status || 'Unknown')}
                        color={employee.employment_status ? (statusConfigMap[employee.employment_status]?.color as any || 'default') : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Profile">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewEmployee(employee)
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Employee">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEmployee(employee)
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Send Message">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendMessage(employee)
                            }}
                          >
                            <Message />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEmployee(employee)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Employee Dialog */}
        <Dialog
          open={showEmployeeDialog}
          onClose={() => setShowEmployeeDialog(false)}
          maxWidth={responsive.getDialogMaxWidth()}
          fullWidth
          fullScreen={responsive.getDialogFullScreen()}
          PaperProps={{
            sx: {
              borderRadius: responsive.getDialogFullScreen() ? 0 : 3,
              minHeight: responsive.getDialogFullScreen() ? '100vh' : 600
            }
          }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {dialogMode === 'create' ? 'Add New Employee' :
                  dialogMode === 'edit' ? 'Edit Employee' : 'Employee Details'}
              </Typography>
              <IconButton onClick={() => setShowEmployeeDialog(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent>
            {dialogMode !== 'view' && (
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                <Step>
                  <StepLabel>Basic Info</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Employment</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Skills & Certs</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Contacts</StepLabel>
                </Step>
              </Stepper>
            )}

            {dialogMode === 'view' ? (
              <Box>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                  <Tab label="Overview" />
                  <Tab label="Employment" />
                  <Tab label="Skills" />
                  <Tab label="Contacts" />
                </Tabs>
                <Box sx={{ mt: 3 }}>
                  {activeTab === 0 && renderBasicInfoStep()}
                  {activeTab === 1 && renderEmploymentStep()}
                  {activeTab === 2 && renderSkillsStep()}
                  {activeTab === 3 && renderContactsStep()}
                </Box>
              </Box>
            ) : (
              getStepContent(activeStep)
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            {dialogMode !== 'view' && (
              <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                {activeStep > 0 && (
                  <Button onClick={() => setActiveStep(activeStep - 1)}>
                    Back
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button onClick={() => setShowEmployeeDialog(false)}>
                  Cancel
                </Button>
                {activeStep < 3 ? (
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(activeStep + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => handleSaveEmployee(editingEmployee)}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  >
                    {dialogMode === 'create' ? 'Create Employee' : 'Update Employee'}
                  </Button>
                )}
              </Stack>
            )}
            {dialogMode === 'view' && (
              <Button onClick={() => setShowEmployeeDialog(false)}>
                Close
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Are you sure you want to remove this employee? This action will deactivate their account.
            </Alert>
            {selectedEmployee && (
              <Typography>
                <strong>{selectedEmployee.first_name} {selectedEmployee.last_name}</strong>
                <br />
                {selectedEmployee.employee_id}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteEmployee}
              color="error"
              variant="contained"
              disabled={saving}
            >
              Remove Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Employee Profile Dialog */}
        {selectedEmployee && (
          <EmployeeProfile
            open={showProfileDialog}
            employee={selectedEmployee as any}
            onClose={() => setShowProfileDialog(false)}
            onEdit={handleEditFromProfile as any}
          />
        )}

        {/* Employee Edit Form */}
        <EmployeeEditForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          employee={selectedEmployee as any}
          mode={editMode}
          onSave={handleSaveEmployee as any}
          departments={departments as any}
          positions={positions as any}
          roles={roles as any}
        />

        {/* Message Center */}
        <MessageCenter
          open={showMessageCenter}
          onClose={() => setShowMessageCenter(false)}
        />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard
          open={showAnalyticsDashboard}
          onClose={() => setShowAnalyticsDashboard(false)}
        />

        {/* Import Dialog */}
        <ImportExportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          mode="import"
        />

        {/* Export Dialog */}
        <ImportExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          mode="export"
        />

        {/* Speed Dial */}
        <SpeedDial
          ariaLabel="Employee Actions"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<PersonAdd />}
            tooltipTitle="Add Employee"
            onClick={handleCreateEmployee}
          />
          <SpeedDialAction
            icon={<Upload />}
            tooltipTitle="Import Employees"
            onClick={() => setShowImportDialog(true)}
          />
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Export Employees"
            onClick={() => setShowExportDialog(true)}
          />
          <SpeedDialAction
            icon={<Analytics />}
            tooltipTitle="View Analytics"
            onClick={() => setShowAnalyticsDashboard(true)}
          />
        </SpeedDial>
      </Box>
    </LocalizationProvider>
  )
}
