'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DatabaseAdminPanel from '../admin/DatabaseAdminPanel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  useTheme,
  alpha,
  Tab,
  Tabs,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge,
  LinearProgress,
  CircularProgress,
} from '@mui/material'
import {
  Settings,
  LocationOn,
  Security,
  Notifications,
  Business,
  Group,
  Schedule,
  AdminPanelSettings,
  Edit,
  Delete,
  Add,
  Save,
  Cancel,
  Warning,
  CheckCircle,
  Info,
  ExpandMore,
  Visibility,
  VisibilityOff,
  Email,
  Sms,
  Phone,
  Language,
  Palette,
  Storage,
  Backup,
  CloudSync,
  VerifiedUser,
  Shield,
  Lock,
  Key,
  GpsFixed,
  Map,
  AccessTime,
  Timer,
  RestartAlt,
  DataUsage,
  NetworkCheck,
  MonetizationOn,
  Receipt,
  Assignment,
  School,
  PersonAdd,
  PersonRemove,
  Close,
  Refresh,
  VpnKey,
  PowerSettingsNew,
  Update,
  Download,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useResponsive } from '../../hooks/useResponsive'
import { api } from '../../lib/api'
import { PermissionGuard } from '../auth/PermissionGuard'
import { MFASetup } from '../auth/MFASetup';
import { SessionManagement } from '../auth/SessionManagement';
import { PasswordChangeDialog } from '../auth/PasswordChangeDialog';

// Types
interface LocationSetting {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number // in meters
  isActive: boolean
  allowedTimeSlots: {
    start: string
    end: string
    days: string[]
  }[]
  createdAt: string
  createdBy: string
}

interface SystemSettings {
  // Company Settings
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  timezone: string
  currency: string
  language: string

  // Attendance Settings
  clockInTolerance: number // minutes
  clockOutTolerance: number
  autoClockOut: boolean
  autoClockOutTime: string
  requireLocationVerification: boolean
  requirePhotoVerification: boolean

  // Leave Settings
  defaultLeaveBalance: number
  carryOverLimit: number
  advanceBookingDays: number

  // Notification Settings
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  reminderSettings: {
    clockInReminder: boolean
    clockOutReminder: boolean
    leaveApproval: boolean
    birthdayReminders: boolean
  }

  // Security Settings
  passwordMinLength: number
  passwordComplexity: boolean
  sessionTimeout: number // minutes
  twoFactorAuth: boolean
  ipWhitelist: string[]

  // System Settings
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  maintenanceMode: boolean
  debugMode: boolean
  apiRateLimit: number
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isEnabled: boolean
}

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  permissions: string[]
  isDefault: boolean
  userCount: number
}

const SettingsDashboard: React.FC = () => {
  const { profile, user } = useAuth()
  const theme = useTheme()
  const responsive = useResponsive()

  // State
  const [activeTab, setActiveTab] = useState(0)
  const [locations, setLocations] = useState<LocationSetting[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: 'Arise HRM',
    companyEmail: 'admin@arisehrm.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Business St, City, State 12345',
    timezone: 'America/New_York',
    currency: 'USD',
    language: 'en',
    clockInTolerance: 15,
    clockOutTolerance: 15,
    autoClockOut: true,
    autoClockOutTime: '18:00',
    requireLocationVerification: true,
    requirePhotoVerification: false,
    defaultLeaveBalance: 20,
    carryOverLimit: 5,
    advanceBookingDays: 30,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    reminderSettings: {
      clockInReminder: true,
      clockOutReminder: true,
      leaveApproval: true,
      birthdayReminders: true
    },
    passwordMinLength: 8,
    passwordComplexity: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    ipWhitelist: [],
    backupFrequency: 'daily',
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000
  })
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationSetting | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Load demo data
  useEffect(() => {
    loadSettingsData()
    loadStoredSettings()
  }, [])

  const loadStoredSettings = () => {
    try {
      const stored = localStorage.getItem('arise_hrm_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        setSystemSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
    }
  }

  const saveSettingsToStorage = (settings: SystemSettings) => {
    try {
      localStorage.setItem('arise_hrm_settings', JSON.stringify(settings))
    } catch (error) {
    }
  }

  const loadSettingsData = () => {
    // TODO: Connect to /api/settings/* endpoints when available
    // Using empty arrays - NO MOCK DATA
    setLocations([])
    setRoles([])
    setPermissions([])
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    const newSettings = { ...systemSettings, [key]: value }
    setSystemSettings(newSettings)
    saveSettingsToStorage(newSettings)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Save to localStorage
      saveSettingsToStorage(systemSettings)

      toast.success('Settings saved successfully!', {
        description: 'Your changes have been applied'
      })
    } catch (error) {
      toast.error('Failed to save settings', {
        description: 'Please try again'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLocationSave = async (locationData?: Partial<LocationSetting>) => {
    setSaving(true)
    try {
      if (selectedLocation) {
        // Update existing location
        setLocations(prev => prev.map(loc =>
          loc.id === selectedLocation.id
            ? { ...loc, ...locationData }
            : loc
        ))
        toast.success('Location updated successfully')
      } else {
        // Add new location with current GPS location
        let coordinates = { latitude: 40.7128, longitude: -74.0060 }

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: true
              })
            })
            coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
            setCurrentLocation({ lat: coordinates.latitude, lng: coordinates.longitude })
            toast.success('Current location detected!')
          } catch (error) {
            toast.warning('Using default location - GPS not available')
          }
        }

        const newLocation: LocationSetting = {
          id: `loc${Date.now()}`,
          name: locationData?.name || 'New Location',
          address: locationData?.address || 'Address to be set',
          ...coordinates,
          radius: locationData?.radius || 100,
          isActive: locationData?.isActive !== false,
          allowedTimeSlots: locationData?.allowedTimeSlots || [
            {
              start: '09:00',
              end: '17:00',
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
          ],
          createdAt: new Date().toISOString(),
          createdBy: profile?.employee_id || 'unknown'
        }
        setLocations(prev => [...prev, newLocation])
        toast.success('Location added successfully')
      }
    } catch (error) {
      toast.error('Failed to save location')
    } finally {
      setSaving(false)
      setShowLocationDialog(false)
      setSelectedLocation(null)
    }
  }

  const handleLocationDelete = (locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId))
    toast.success('Location removed')
  }

  const handleRolePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const permissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(p => p !== permissionId)
          : [...role.permissions, permissionId]
        return { ...role, permissions }
      }
      return role
    }))
    toast.success('Permission updated')
  }

  const testDatabaseConnection = async () => {
    setLoading(true)
    try {
      const response = await api.get('/health')

      toast.success('Database connection successful!', {
        description: `Connected to database - ${response.data?.message || 'System healthy'}`
      })
    } catch (error: any) {
      toast.error('Database connection failed', {
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const resetAllSettings = () => {
    localStorage.removeItem('arise_hrm_settings')
    loadSettingsData()
    toast.success('Settings reset to defaults')
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(systemSettings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `arise-hrm-settings-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast.success('Settings exported successfully')
  }

  // Render functions for each settings section
  const renderGeneralSettings = () => (
    <Stack spacing={responsive.getSpacing(3, 4)}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Company Information
      </Typography>

      <Grid container spacing={responsive.getSpacing(2, 3)}>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <TextField
            fullWidth
            label="Company Name"
            value={systemSettings.companyName}
            onChange={(e) => handleSettingChange('companyName', e.target.value)}
            size={responsive.getInputSize()}
          />
        </Grid>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <TextField
            fullWidth
            label="Company Email"
            type="email"
            value={systemSettings.companyEmail}
            onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
            size={responsive.getInputSize()}
          />
        </Grid>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <TextField
            fullWidth
            label="Company Phone"
            value={systemSettings.companyPhone}
            onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
            size={responsive.getInputSize()}
          />
        </Grid>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <FormControl fullWidth size={responsive.getInputSize()}>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={systemSettings.timezone}
              label="Timezone"
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
            >
              <MenuItem value="America/New_York">Eastern Time</MenuItem>
              <MenuItem value="America/Chicago">Central Time</MenuItem>
              <MenuItem value="America/Denver">Mountain Time</MenuItem>
              <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
              <MenuItem value="UTC">UTC</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }} component="div">
          <TextField
            fullWidth
            label="Company Address"
            multiline
            rows={responsive.isMobile ? 2 : 3}
            value={systemSettings.companyAddress}
            onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
            size={responsive.getInputSize()}
          />
        </Grid>
      </Grid>

      <Divider />

      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        System Preferences
      </Typography>

      <Grid container spacing={responsive.getSpacing(2, 3)}>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <FormControl fullWidth size={responsive.getInputSize()}>
            <InputLabel>Currency</InputLabel>
            <Select
              value={systemSettings.currency}
              label="Currency"
              onChange={(e) => handleSettingChange('currency', e.target.value)}
            >
              <MenuItem value="USD">USD - US Dollar</MenuItem>
              <MenuItem value="EUR">EUR - Euro</MenuItem>
              <MenuItem value="GBP">GBP - British Pound</MenuItem>
              <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
              <MenuItem value="INR">INR - Indian Rupee</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <FormControl fullWidth size={responsive.getInputSize()}>
            <InputLabel>Language</InputLabel>
            <Select
              value={systemSettings.language}
              label="Language"
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="zh">Chinese</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Stack
        direction={responsive.getFlexDirection('column', 'row')}
        spacing={responsive.getSpacing(1, 2)}
        sx={{ justifyContent: 'flex-end', mt: 3 }}
      >
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          size={responsive.getButtonSize()}
          onClick={resetAllSettings}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSaveSettings}
          disabled={saving}
          size={responsive.getButtonSize()}
        >
          Save Changes
        </Button>
      </Stack>
    </Stack>
  )

  const renderLocationSettings = () => (
    <Stack spacing={responsive.getSpacing(3, 4)}>
      <Stack
        direction={responsive.getFlexDirection('column', 'row')}
        justifyContent="space-between"
        alignItems={responsive.isMobile ? "stretch" : "center"}
        spacing={responsive.getSpacing(2, 0)}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Clock-in Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          size={responsive.getButtonSize()}
          fullWidth={responsive.isMobile}
          onClick={() => {
            setSelectedLocation(null)
            setShowLocationDialog(true)
          }}
        >
          Add Location
        </Button>
      </Stack>

      <Grid container spacing={responsive.getSpacing(2, 3)}>
        {locations.map((location) => (
          <Grid component="div" size={responsive.getGridColumns(12, 6)} key={location.id}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack spacing={responsive.getSpacing(2, 2)}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {location.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {location.address}
                      </Typography>
                    </Box>
                    <Chip
                      label={location.isActive ? 'Active' : 'Inactive'}
                      color={location.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GpsFixed fontSize="small" color="action" />
                    <Typography variant="caption">
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • {location.radius}m radius
                    </Typography>
                  </Stack>

                  <Stack
                    direction={responsive.isSmallMobile ? "column" : "row"}
                    spacing={1}
                    sx={{ pt: 1 }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      fullWidth={responsive.isSmallMobile}
                      onClick={() => {
                        setSelectedLocation(location)
                        setShowLocationDialog(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      fullWidth={responsive.isSmallMobile}
                      onClick={() => handleLocationDelete(location.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )

  const renderAttendanceSettings = () => (
    <Stack spacing={responsive.getSpacing(3, 4)}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Attendance Configuration
      </Typography>

      <Grid container spacing={responsive.getSpacing(2, 3)}>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <TextField
            fullWidth
            label="Clock-in Tolerance (minutes)"
            type="number"
            value={systemSettings.clockInTolerance}
            onChange={(e) => handleSettingChange('clockInTolerance', parseInt(e.target.value))}
            helperText="Allow employees to clock in this many minutes early/late"
            size={responsive.getInputSize()}
          />
        </Grid>
        <Grid component="div" size={responsive.getGridColumns(12, 6)}>
          <TextField
            fullWidth
            label="Clock-out Tolerance (minutes)"
            type="number"
            value={systemSettings.clockOutTolerance}
            onChange={(e) => handleSettingChange('clockOutTolerance', parseInt(e.target.value))}
            helperText="Allow employees to clock out this many minutes early/late"
            size={responsive.getInputSize()}
          />
        </Grid>
      </Grid>

      <Stack spacing={responsive.getSpacing(2, 3)}>
        <FormControlLabel
          control={
            <Switch
              checked={systemSettings.autoClockOut}
              onChange={(e) => handleSettingChange('autoClockOut', e.target.checked)}
            />
          }
          label="Auto Clock-out"
        />
        {systemSettings.autoClockOut && (
          <TextField
            label="Auto Clock-out Time"
            type="time"
            value={systemSettings.autoClockOutTime}
            onChange={(e) => handleSettingChange('autoClockOutTime', e.target.value)}
            sx={{ maxWidth: responsive.isMobile ? '100%' : 200 }}
            size={responsive.getInputSize()}
            InputLabelProps={{ shrink: true }}
          />
        )}

        <FormControlLabel
          control={
            <Switch
              checked={systemSettings.requireLocationVerification}
              onChange={(e) => handleSettingChange('requireLocationVerification', e.target.checked)}
            />
          }
          label="Require Location Verification"
        />

        <FormControlLabel
          control={
            <Switch
              checked={systemSettings.requirePhotoVerification}
              onChange={(e) => handleSettingChange('requirePhotoVerification', e.target.checked)}
            />
          }
          label="Require Photo Verification"
        />
      </Stack>

      <Stack
        direction={responsive.getFlexDirection('column', 'row')}
        spacing={responsive.getSpacing(1, 2)}
        sx={{ justifyContent: 'flex-end' }}
      >
        <Button
          variant="outlined"
          startIcon={<Cancel />}
          size={responsive.getButtonSize()}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSaveSettings}
          disabled={saving}
          size={responsive.getButtonSize()}
        >
          Save Changes
        </Button>
      </Stack>
    </Stack>
  )

  const renderPermissionsSettings = () => (
    <Stack spacing={responsive.getSpacing(3, 4)}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Role & Permission Management
      </Typography>

      {roles.map((role) => (
        <Accordion key={role.id}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={responsive.getSpacing(2, 2)}
              sx={{ width: '100%' }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <AdminPanelSettings />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {role.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role.description} • {role.userCount} users
                </Typography>
              </Box>
              <Chip
                label={`Level ${role.level}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={responsive.getSpacing(2, 3)}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Permissions
              </Typography>
              <Grid container spacing={responsive.getSpacing(1, 2)}>
                {permissions.map((permission) => (
                  <Grid component="div" size={responsive.getGridColumns(12, 6, 4)} key={permission.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={role.permissions.includes(permission.id) || role.permissions.includes('all')}
                          onChange={() => handleRolePermissionToggle(role.id, permission.id)}
                          disabled={role.permissions.includes('all')}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {permission.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )

  const renderSecuritySettings = () => (
    <Stack spacing={4}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Security Preferences
      </Typography>

      {/* Password Management */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Password</Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" color="text.secondary">
                Secure your account with a strong password.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last changed: {user?.lastPasswordChange ? new Date(user.lastPasswordChange).toLocaleDateString() : 'Never'}
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<Lock />} onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <MFASetup onComplete={() => toast.success('MFA Setup Complete')} />
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <SessionManagement />
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 600, mt: 4 }}>
        Advanced Security
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Session Timeout (minutes)</InputLabel>
            <Select
              value={systemSettings.sessionTimeout}
              label="Session Timeout (minutes)"
              onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
              <MenuItem value={240}>4 hours</MenuItem>
              <MenuItem value={480}>8 hours</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={
              <Switch
                checked={systemSettings.passwordComplexity}
                onChange={(e) => handleSettingChange('passwordComplexity', e.target.checked)}
              />
            }
            label="Enforce Password Complexity"
          />
          <Typography variant="caption" display="block" color="text.secondary">
            Require strong passwords (uppercase, lowercase, numbers, special characters)
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Stack spacing={2}>
        <Button
          variant="outlined"
          startIcon={<NetworkCheck />}
          onClick={testDatabaseConnection}
          disabled={loading}
        >
          Test Database Connection
        </Button>
      </Stack>
    </Stack>
  )

  return (
    <PermissionGuard permissions={['settings.manage', 'system.admin']} anyPermission>
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
              Settings
            </Typography>
            <Typography
              variant={responsive.getVariant('body2', 'body1')}
              color="text.secondary"
            >
              Configure system settings, locations, and permissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            size={responsive.getButtonSize()}
            fullWidth={responsive.isMobile}
          >
            Refresh
          </Button>
        </Stack>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: responsive.getSpacing(2, 3) }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant={responsive.isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="General" icon={<Settings />} iconPosition={responsive.isMobile ? "top" : "start"} />
            <Tab label="Locations" icon={<LocationOn />} iconPosition={responsive.isMobile ? "top" : "start"} />
            <Tab label="Attendance" icon={<Schedule />} iconPosition={responsive.isMobile ? "top" : "start"} />
            <Tab label="Permissions" icon={<Security />} iconPosition={responsive.isMobile ? "top" : "start"} />
            <Tab label="Security" icon={<Shield />} iconPosition={responsive.isMobile ? "top" : "start"} />
            <Tab label="Database" icon={<Storage />} iconPosition={responsive.isMobile ? "top" : "start"} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Paper sx={{ p: responsive.getPadding(2, 3), borderRadius: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 0 && renderGeneralSettings()}
              {activeTab === 1 && renderLocationSettings()}
              {activeTab === 2 && renderAttendanceSettings()}
              {activeTab === 3 && renderPermissionsSettings()}
              {activeTab === 4 && renderSecuritySettings()}
              {activeTab === 5 && <DatabaseAdminPanel />}
            </motion.div>
          </AnimatePresence>
        </Paper>

        {/* Location Dialog */}
        <Dialog
          open={showLocationDialog}
          onClose={() => setShowLocationDialog(false)}
          maxWidth={responsive.getDialogMaxWidth()}
          fullWidth
          fullScreen={responsive.getDialogFullScreen()}
          PaperProps={{ sx: { borderRadius: responsive.getDialogFullScreen() ? 0 : 3 } }}
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {selectedLocation ? 'Edit Location' : 'Add Location'}
              </Typography>
              <IconButton onClick={() => setShowLocationDialog(false)}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={responsive.getSpacing(2, 3)} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Location Name"
                defaultValue={selectedLocation?.name || ''}
                placeholder="Main Office"
                size={responsive.getInputSize()}
              />
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={responsive.isMobile ? 2 : 3}
                defaultValue={selectedLocation?.address || ''}
                placeholder="123 Business St, City, State 12345"
                size={responsive.getInputSize()}
              />
              <Grid container spacing={responsive.getSpacing(1, 2)}>
                <Grid component="div" size={responsive.getGridColumns(12, 6)}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    defaultValue={selectedLocation?.latitude || currentLocation?.lat || ''}
                    placeholder="40.7128"
                    size={responsive.getInputSize()}
                  />
                </Grid>
                <Grid component="div" size={responsive.getGridColumns(12, 6)}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    defaultValue={selectedLocation?.longitude || currentLocation?.lng || ''}
                    placeholder="-74.0060"
                    size={responsive.getInputSize()}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Radius (meters)"
                type="number"
                defaultValue={selectedLocation?.radius || 100}
                size={responsive.getInputSize()}
              />
              <FormControlLabel
                control={
                  <Switch
                    defaultChecked={selectedLocation?.isActive !== false}
                  />
                }
                label="Active Location"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: responsive.getPadding(2, 3) }}>
            <Button onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleLocationSave()}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Location'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <PasswordChangeDialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        employeeId={profile?.id}
      />
    </PermissionGuard >
  )
}


export default SettingsDashboard

