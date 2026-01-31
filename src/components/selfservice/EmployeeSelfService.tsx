'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  Stack,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tab,
  Tabs,
  useTheme,
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from '@mui/material'
import {
  Person,
  Edit,
  Save,
  Cancel,
  Upload,
  Notifications,
  Security,
  Work,
  Assignment,
  Description,
  CheckCircle,
  Pending,
  Info,
  Error,
  Close,
  Add,
  Visibility,
  CloudUpload,
  GetApp,
  Email,
  Phone,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useResponsive } from '../../hooks/useResponsive'
import { toast } from 'sonner'
import { api } from '../../lib/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`self-service-tabpanel-${index}`}
      aria-labelledby={`self-service-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export function EmployeeSelfService() {
  const { user } = useAuth()
  const theme = useTheme()
  const responsive = useResponsive()

  // State
  const [activeTab, setActiveTab] = useState(0)
  const [editMode, setEditMode] = useState<string | null>(null)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestType, setRequestType] = useState('')
  const [loading, setLoading] = useState(false)

  // Real Data State
  const [employeeData, setEmployeeData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      }
    },
    professional: {
      employeeId: '',
      position: '',
      department: '',
      manager: '',
      startDate: '',
      employmentType: '',
    },
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      language: 'English',
      timezone: 'UTC',
    }
  })

  const [requests, setRequests] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [empData, leavesData] = await Promise.all([
        api.getEmployee(user!.id),
        api.getLeaves({ employeeId: user!.id })
      ])

      let address = empData.address || ''
      if (typeof address === 'object') address = JSON.stringify(address)

      let emergency = empData.emergency_contact || { name: '', relationship: '', phone: '' }

      setEmployeeData({
        personal: {
          firstName: empData.first_name || '',
          lastName: empData.last_name || '',
          email: empData.email || '',
          phone: empData.phone_number || '',
          address: address,
          emergencyContact: emergency
        },
        professional: {
          employeeId: empData.employee_id || empData.employee_code || 'N/A',
          position: empData.position_name || '',
          department: empData.department_name || '',
          manager: empData.manager_id ? 'Manager Assigned' : 'Unassigned',
          startDate: empData.hire_date ? new Date(empData.hire_date).toLocaleDateString() : '',
          employmentType: empData.employment_type || '',
        },
        preferences: {
          notifications: empData.preferences?.notifications || { email: true, sms: false, push: true },
          language: empData.preferences?.language || 'English',
          timezone: empData.preferences?.timezone || 'UTC'
        }
      })

      // Handle both paginated response {items: [...]} and array response
      const leavesArray = Array.isArray(leavesData) ? leavesData : (leavesData?.items || [])
      setRequests(leavesArray)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleEditToggle = (section: string) => {
    setEditMode(editMode === section ? null : section)
  }

  const handleSave = async (section: string) => {
    try {
      const updates: any = {}
      if (section === 'personal') {
        updates.first_name = employeeData.personal.firstName
        updates.last_name = employeeData.personal.lastName
        updates.phone_number = employeeData.personal.phone
        updates.address = JSON.stringify(employeeData.personal.address || '')
        updates.emergency_contact = employeeData.personal.emergencyContact
      }
      if (section === 'preferences') {
        updates.preferences = {
          notifications: employeeData.preferences.notifications,
          language: employeeData.preferences.language,
          timezone: employeeData.preferences.timezone
        }
      }

      await api.updateEmployee(user!.id, updates)
      toast.success("Profile updated")
      setEditMode(null)
    } catch (e: any) {
      console.error(e)
      const errMsg = e.message || "Failed to update profile";
      toast.error(errMsg)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const formData = new FormData()
        formData.append('avatar', e.target.files[0])
        await api.uploadAvatar(formData)
        toast.success("Avatar updated")
        setTimeout(() => window.location.reload(), 1000)
      } catch (err) {
        toast.error("Upload failed")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  // Personal Information Tab
  const PersonalInfoTab = () => (
    <Grid container spacing={responsive.getSpacing(2, 3, 4)}>
      <Grid size={{ xs: 12, lg: 8 }} component="div">
        <Typography variant="h6" gutterBottom>Request History</Typography>
        <Card sx={{ textAlign: 'center', p: responsive.getPadding(2, 3) }}>
          <Avatar
            sx={{
              width: responsive.isMobile ? 80 : 120,
              height: responsive.isMobile ? 80 : 120,
              mx: 'auto',
              mb: responsive.getSpacing(1, 2)
            }}
            src={(user as any)?.avatar_url || (user as any)?.profile_photo_url ? ((user as any).avatar_url?.startsWith('http') ? (user as any).avatar_url : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${(user as any).avatar_url}`) : undefined}
          >
            {employeeData.personal.firstName[0]}{employeeData.personal.lastName[0]}
          </Avatar>
          <Typography variant={responsive.getVariant('subtitle1', 'h6') as any} gutterBottom>
            {employeeData.personal.firstName} {employeeData.personal.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {employeeData.professional.position}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }} gutterBottom>
            {employeeData.professional.employeeId}
          </Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            fullWidth
            size={responsive.getButtonSize()}
            sx={{ mt: responsive.getSpacing(1, 2) }}
          >
            Update Photo
            <input hidden accept="image/*" type="file" onChange={handleAvatarUpload} />
          </Button>
        </Card>
      </Grid>

      <Grid component="div" size={responsive.getGridColumns(12, 12, 8)}>
        <Card sx={{ p: responsive.getPadding(2, 3) }}>
          <Stack
            direction={responsive.getFlexDirection('column', 'row')}
            justifyContent="space-between"
            alignItems={responsive.isMobile ? "stretch" : "center"}
            spacing={responsive.getSpacing(2, 0)}
            sx={{ mb: responsive.getSpacing(2, 3) }}
          >
            <Typography variant={responsive.getVariant('subtitle1', 'h6') as any}>Personal Information</Typography>
            <Button
              startIcon={editMode === 'personal' ? <Save /> : <Edit />}
              onClick={() => editMode === 'personal' ? handleSave('personal') : handleEditToggle('personal')}
              variant={editMode === 'personal' ? 'contained' : 'outlined'}
              size={responsive.getButtonSize()}
              fullWidth={responsive.isMobile}
            >
              {editMode === 'personal' ? 'Save' : 'Edit'}
            </Button>
          </Stack>

          <Grid container spacing={responsive.getSpacing(2, 3)}>
            <Grid component="div" size={responsive.getGridColumns(12, 6)}>
              <TextField
                fullWidth
                label="First Name"
                value={employeeData.personal.firstName}
                disabled={editMode !== 'personal'}
                size={responsive.getInputSize()}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, firstName: e.target.value }
                }))}
              />
            </Grid>
            <Grid component="div" size={responsive.getGridColumns(12, 6)}>
              <TextField
                fullWidth
                label="Last Name"
                value={employeeData.personal.lastName}
                disabled={editMode !== 'personal'}
                size={responsive.getInputSize()}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, lastName: e.target.value }
                }))}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }} component="div">
              <Stack spacing={4}>
                <Card elevation={0} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>My Leave Balance</Typography>
                    {/* {loadingLeaves ? ( */}
                    <TextField
                      fullWidth
                      label="Email"
                      size={responsive.getInputSize()}
                      value={employeeData.personal.email}
                      disabled // Email usually can't be changed by user directly
                      type="email"
                    />
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={employeeData.personal.phone}
                disabled={editMode !== 'personal'}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={employeeData.personal.address}
                disabled={editMode !== 'personal'}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: { ...prev.personal, address: e.target.value }
                }))}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Emergency Contact
          </Typography>
          <Grid container spacing={3}>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Name"
                value={employeeData.personal.emergencyContact.name}
                disabled={editMode !== 'personal'}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    emergencyContact: { ...prev.personal.emergencyContact, name: e.target.value }
                  }
                }))}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Relationship"
                value={employeeData.personal.emergencyContact.relationship}
                disabled={editMode !== 'personal'}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    emergencyContact: { ...prev.personal.emergencyContact, relationship: e.target.value }
                  }
                }))}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Emergency Phone"
                value={employeeData.personal.emergencyContact.phone}
                disabled={editMode !== 'personal'}
                onChange={(e) => setEmployeeData(prev => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    emergencyContact: { ...prev.personal.emergencyContact, phone: e.target.value }
                  }
                }))}
              />
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  )

  // Professional Information Tab
  const ProfessionalInfoTab = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Professional Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your professional details. Contact HR to make changes.
      </Typography>

      <Grid container spacing={3}>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Employee ID / Code"
            value={employeeData.professional.employeeId}
            disabled
          />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Position"
            value={employeeData.professional.position}
            disabled
          />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Department"
            value={employeeData.professional.department}
            disabled
          />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Manager"
            value={employeeData.professional.manager}
            disabled
          />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Start Date"
            value={employeeData.professional.startDate}
            disabled
          />
        </Grid>
        <Grid component="div" size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Employment Type"
            value={employeeData.professional.employmentType}
            disabled
          />
        </Grid>
      </Grid>
    </Card>
  )

  // Requests Tab
  const RequestsTab = () => (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">My Requests</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowRequestDialog(true)}
        >
          New Request
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {requests.length === 0 && <Grid size={{ xs: 12 }} component="div"><Typography>No requests found.</Typography></Grid>}
        {requests.map((request) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} component="div" key={request.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                      {request.leave_type?.name || request.type || 'Leave Request'}
                    </Typography>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {request.reason || request.description || 'No description'}
                  </Typography>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Dates:</strong> {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )

  // Documents Tab
  const DocumentsTab = () => (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">My Documents</Typography>
        <Button variant="contained" startIcon={<CloudUpload />} disabled>
          Upload Document (Coming Soon)
        </Button>
      </Stack>
      <Typography variant="body1">No documents found.</Typography>
    </Stack>
  )

  // Preferences Tab
  const PreferencesTab = () => (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">Preferences</Typography>
        <Button
          startIcon={<Save />}
          variant="contained"
          onClick={() => handleSave('preferences')}
        >
          Save Changes
        </Button>
      </Stack>

      <Stack spacing={4}>
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><Email /></ListItemIcon>
              <ListItemText primary="Email Notifications" />
              <ListItemSecondaryAction>
                <Switch
                  checked={employeeData.preferences.notifications.email}
                  onChange={(e) => setEmployeeData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: { ...prev.preferences.notifications, email: e.target.checked }
                    }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {/* Other notifications */}
          </List>
        </Box>
      </Stack>
    </Card>
  )

  // New Request Dialog
  const NewRequestDialog = () => (
    <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>New Request</DialogTitle>
      <DialogContent>
        <Typography sx={{ pt: 2 }}>Use the "Leave Management" page to submit leave requests. Other request types coming soon.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowRequestDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  )

  if (loading) return <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>

  return (
    <Box sx={{ p: responsive.getPadding(2, 3) }}>
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontWeight: 700 }}>Employee Self-Service</Typography>
        <Typography color="text.secondary">Manage your profile and information</Typography>
      </Stack>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant={responsive.isMobile ? 'scrollable' : 'fullWidth'}>
          <Tab icon={<Person />} label="Personal" />
          <Tab icon={<Work />} label="Professional" />
          <Tab icon={<Assignment />} label="Requests" />
          <Tab icon={<Description />} label="Documents" />
          <Tab icon={<Security />} label="Preferences" />
        </Tabs>

        <TabPanel value={activeTab} index={0}><PersonalInfoTab /></TabPanel>
        <TabPanel value={activeTab} index={1}><ProfessionalInfoTab /></TabPanel>
        <TabPanel value={activeTab} index={2}><RequestsTab /></TabPanel>
        <TabPanel value={activeTab} index={3}><DocumentsTab /></TabPanel>
        <TabPanel value={activeTab} index={4}><PreferencesTab /></TabPanel>
      </Paper>
      <NewRequestDialog />
    </Box>
  )
}
