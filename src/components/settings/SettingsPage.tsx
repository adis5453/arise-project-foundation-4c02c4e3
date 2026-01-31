import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  Paper,
  Stack,
  CircularProgress,
  IconButton,
  Grid,
  Alert
} from '@mui/material'
import {
  Person,
  Notifications,
  Palette,
  Security,
  ChevronRight,
  Upload,
  DarkMode,
  LightMode,
  SettingsSystemDaydream,
  LocationOn
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useThemeMode } from '../../contexts/ThemeContext' // Fixed Import
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

// --- Types ---
type SectionId = 'profile' | 'appearance' | 'notifications' | 'security' | 'attendance';

interface SettingSection {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: SettingSection[] = [
  { id: 'profile', label: 'Profile', icon: <Person />, description: 'Manage your personal information' },
  { id: 'appearance', label: 'Appearance', icon: <Palette />, description: 'Customize the look and feel' },
  { id: 'attendance', label: 'Attendance', icon: <LocationOn />, description: 'Office location & geofencing' },
  { id: 'notifications', label: 'Notifications', icon: <Notifications />, description: 'Control how you get notified' },
  { id: 'security', label: 'Security', icon: <Security />, description: 'Password, session, and access' },
]

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const { themeMode, setThemeMode } = useThemeMode() // Hook for real-time theme
  const theme = useTheme()

  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // System Settings State
  const [sysSettings, setSysSettings] = useState({
    office_lat: '',
    office_lng: '',
    office_radius: ''
  });

  // Local state for form fields (excluding theme which is global)
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    emailNotifications: true,
    pushNotifications: true,
    avatarUrl: ''
  })

  // Load Data
  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadSystemSettings();
    }
  }, [user?.id])

  const loadSystemSettings = async () => {
    try {
      const data = await api.getSystemSettings();
      setSysSettings({
        office_lat: data.office_lat || '',
        office_lng: data.office_lng || '',
        office_radius: data.office_radius || ''
      });
    } catch (error) {
      // console.error("Failed to load system settings", error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getEmployee(user!.id)
      const prefs = data.preferences || {}

      setSettings({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone_number || '',
        avatarUrl: data.avatar_url || data.profile_photo_url || '',
        emailNotifications: prefs.notifications?.email ?? true,
        pushNotifications: prefs.notifications?.push ?? true,
      })

      // Sync global theme if stored in prefs
      if (prefs.theme && prefs.theme !== themeMode) {
        setThemeMode(prefs.theme)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const handleSave = async () => {
    try {
      setLoading(true)

      if (activeSection === 'attendance') {
        await api.updateSystemSettings(sysSettings);
        toast.success('Attendance settings updated');
        return;
      }

      const updates = {
        first_name: settings.firstName,
        last_name: settings.lastName,
        phone_number: settings.phone,
        preferences: {
          notifications: {
            email: settings.emailNotifications,
            push: settings.pushNotifications
          },
          theme: themeMode // Save current global theme to DB
        }
      }
      await api.updateEmployee(user!.id, updates)
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('avatar', e.target.files[0])
      const res = await api.uploadAvatar(formData)
      setSettings(prev => ({ ...prev, avatarUrl: res.url }))
      toast.success('Photo updated')
      // Force reload to update header avatar for now
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // --- Render Sections ---

  const renderContent = () => {
    switch (activeSection) {
      // 1. Profile
      case 'profile':
        return (
          <Stack spacing={4}>
            {/* Avatar Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, boxShadow: theme.shadows[3] }}
                src={settings.avatarUrl ? (settings.avatarUrl.startsWith('http') ? settings.avatarUrl : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${settings.avatarUrl}`) : undefined}
              >
                {settings.firstName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6">Profile Photo</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Accepts JPG, PNG up to 5MB
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
                  disabled={uploading}
                >
                  Upload New
                  <input hidden type="file" accept="image/*" onChange={handleAvatarUpload} />
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Fields */}
            <Typography variant="h6">Personal Details</Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <TextField
                  fullWidth label="First Name"
                  value={settings.firstName}
                  onChange={(e) => setSettings({ ...settings, firstName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <TextField
                  fullWidth label="Last Name"
                  value={settings.lastName}
                  onChange={(e) => setSettings({ ...settings, lastName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }} component="div">
                <TextField
                  fullWidth label="Email Address"
                  value={settings.email}
                  disabled
                  helperText="Contact Admin to change email"
                />
              </Grid>
              <Grid size={{ xs: 12 }} component="div">
                <TextField
                  fullWidth label="Phone Number"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        )

      // 2. Appearance
      case 'appearance':
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" gutterBottom>Interface Theme</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select your preferred interface theme. This setting is saved to your profile.
              </Typography>

              <Stack direction="row" spacing={2}>
                {[
                  { mode: 'light', icon: <LightMode />, label: 'Light' },
                  { mode: 'dark', icon: <DarkMode />, label: 'Dark' },
                  { mode: 'system', icon: <SettingsSystemDaydream />, label: 'System' },
                ].map((opt) => (
                  <Paper
                    key={opt.mode}
                    onClick={() => setThemeMode(opt.mode as any)}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      p: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      borderColor: themeMode === opt.mode ? 'primary.main' : 'divider',
                      bgcolor: themeMode === opt.mode ? (theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light') : 'transparent',
                      color: themeMode === opt.mode ? 'primary.contrastText' : 'text.primary',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                  >
                    {opt.icon}
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>{opt.label}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        )

      // 3. Attendance (New)
      case 'attendance':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6">Office Location</Typography>
              <Typography variant="body2" color="text.secondary">
                Set the coordinates for geofencing attendance (Check-in allowed within radius).
              </Typography>
            </Box>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }} component="div">
                    <TextField
                      fullWidth
                      label="Latitude"
                      value={sysSettings.office_lat}
                      onChange={(e) => setSysSettings({ ...sysSettings, office_lat: e.target.value })}
                      helperText="e.g. 28.6139"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} component="div">
                    <TextField
                      fullWidth
                      label="Longitude"
                      value={sysSettings.office_lng}
                      onChange={(e) => setSysSettings({ ...sysSettings, office_lng: e.target.value })}
                      helperText="e.g. 77.2090"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} component="div">
                    <TextField
                      fullWidth
                      label="Radius (Meters)"
                      type="number"
                      value={sysSettings.office_radius}
                      onChange={(e) => setSysSettings({ ...sysSettings, office_radius: e.target.value })}
                      helperText="Maximum distance allowed for check-in"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }} component="div" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="outlined" onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((pos) => {
                          setSysSettings({
                            ...sysSettings,
                            office_lat: pos.coords.latitude.toString(),
                            office_lng: pos.coords.longitude.toString()
                          });
                          toast.success("Used current location");
                        });
                      } else {
                        toast.error("Geolocation not supported");
                      }
                    }}>
                      Use Current Location
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => handleSave()}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>

                    {sysSettings.office_lat && sysSettings.office_lng && (
                      <Button
                        variant="text"
                        color="info"
                        onClick={() => window.open(`https://www.google.com/maps?q=${sysSettings.office_lat},${sysSettings.office_lng}`, '_blank')}
                      >
                        View on Map
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        )

      // 4. Notifications
      case 'notifications':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Alert Preferences</Typography>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2">Email Notifications</Typography>
                        <Typography variant="caption" color="text.secondary">Receive updates about requests and announcements</Typography>
                      </Box>
                    }
                  />
                  <Divider />
                  <FormControlLabel
                    control={<Switch checked={settings.pushNotifications} onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2">Push Notifications</Typography>
                        <Typography variant="caption" color="text.secondary">Real-time alerts for urgent items</Typography>
                      </Box>
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )

      // 5. Security
      case 'security':
        return (
          <Stack spacing={3}>
            <Typography variant="h6">Account Security</Typography>
            <Button variant="outlined" color="primary" startIcon={<Security />} sx={{ justifyContent: 'flex-start' }}>
              Change Password
            </Button>
            <Alert severity="info" sx={{ mt: 2 }} icon={<Security fontSize="inherit" />}>
              Two-factor authentication is currently enforced by your organization policy.
            </Alert>
          </Stack>
        )

      default:
        return null
    }
  }

  // --- Main Layout ---
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>Settings</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your preferences and account settings
      </Typography>

      <Grid container spacing={4}>
        {/* Sidebar Nav */}
        <Grid size={{ xs: 12, md: 3 }} component="div">
          <Paper elevation={0} variant="outlined" sx={{ overflow: 'hidden' }}>
            <List component="nav" sx={{ p: 0 }}>
              {SECTIONS.map((section) => (
                <ListItemButton
                  key={section.id}
                  selected={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                  sx={{
                    py: 2,
                    borderLeft: activeSection === section.id ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                    '&.Mui-selected': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: activeSection === section.id ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.label}
                    secondary={section.description}
                    primaryTypographyProps={{ fontWeight: activeSection === section.id ? 600 : 400 }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      sx: { display: { xs: 'none', lg: 'block' } }
                    }}
                  />
                  {activeSection === section.id && <ChevronRight fontSize="small" color="primary" />}
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: 9 }} component="div">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper elevation={0} variant="outlined" sx={{ p: 4, minHeight: 400 }}>
              {renderContent()}

              {/* Global Save Button (only for forms that need it) */}
              {(activeSection === 'profile' || activeSection === 'notifications') && (
                <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSave}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingsPage
