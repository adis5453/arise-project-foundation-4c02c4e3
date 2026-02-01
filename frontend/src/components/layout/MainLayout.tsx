'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Divider,
  Stack,
  Badge,
  Tooltip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useTheme,
  alpha,
  styled,
  Collapse,
  Card,
  Paper,
  Grid,
  SwipeableDrawer,
  AppBar,
  Drawer,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People,
  Schedule,
  Assignment,
  TrendingUp,
  Notifications,
  Settings,
  Menu,
  Close,
  ExpandLess,
  ExpandMore,
  Logout,
  Group,
  School,
  Folder,
  BarChart,
  MenuOpen,
  LastPage,
  FirstPage,
  Business,
  LocationOn,
  PersonAdd,
  AccountTree,
  EmojiEvents,
  AssignmentTurnedIn,
  AttachMoney,
  Person,
  Psychology,
  SmartToy,
  Assessment,
  CalendarToday,
  Security,
  Analytics,
  Support,
  Campaign as CampaignIcon,
} from '@mui/icons-material'

import { SidebarContent } from './SidebarContent'
import { useResponsive } from '../../hooks/useResponsive'
import { getDenimGradient, denimColors, getDenimShadow } from '../../styles/denimTheme'
import { ThemeToggle } from '../common/ThemeToggle'

// Sidebar width constants
const SIDEBAR_WIDTH = 220
const SIDEBAR_MINI_WIDTH = 70

// Styled Components
const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen' && prop !== 'sidebarMini'
})<{ sidebarOpen: boolean; sidebarMini: boolean }>(({ theme, sidebarOpen, sidebarMini }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  width: sidebarMini ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH,
  background: `linear-gradient(180deg,
    ${alpha(theme.palette.background.paper, 0.78)} 0%,
    ${alpha(theme.palette.background.default, 0.72)} 100%)`,
  color: theme.palette.text.primary,
  zIndex: theme.zIndex.drawer + 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: theme.shadows[10],
  backdropFilter: 'blur(22px)',
  borderRight: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
  transform: sidebarOpen ? 'translateX(0)' : `translateX(-${sidebarMini ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH}px)`,
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'transform',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: 1,
    height: '100%',
    background: alpha(theme.palette.common.white, 0.08),
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: `radial-gradient(600px 260px at 20% 0%, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 60%),
                 radial-gradient(420px 260px at 80% 30%, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 55%)`,
  },
  [theme.breakpoints.down('lg')]: {
    transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
    width: SIDEBAR_WIDTH,
  },
  [theme.breakpoints.down('md')]: {
    transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
    width: SIDEBAR_WIDTH,
    zIndex: theme.zIndex.drawer + 2,
  },
}))

const SidebarToggleButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen' && prop !== 'sidebarMini'
})<{ sidebarOpen: boolean; sidebarMini: boolean }>(({ theme, sidebarOpen, sidebarMini }) => ({
  position: 'fixed',
  top: '50%',
  left: sidebarOpen ?
    (sidebarMini ? SIDEBAR_MINI_WIDTH + 8 : SIDEBAR_WIDTH + 8) :
    16,
  transform: 'translateY(-50%)',
  zIndex: theme.zIndex.drawer + 3,
  backgroundColor: alpha(theme.palette.background.paper, 0.75),
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
  backdropFilter: 'blur(16px)',
  width: 44,
  height: 44,
  borderRadius: '50%',
  boxShadow: theme.shadows[6],
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    transform: 'translateY(-50%) scale(1.05)',
    boxShadow: theme.shadows[8],
  },
  [theme.breakpoints.down('md')]: {
    left: sidebarOpen ? SIDEBAR_WIDTH + 8 : 16,
    width: 40,
    height: 40,
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}))

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarOpen' && prop !== 'sidebarMini'
})<{ sidebarOpen: boolean; sidebarMini: boolean }>(({ theme, sidebarOpen, sidebarMini }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: '100vh',
  backgroundColor: 'transparent',
  flex: 1,
  width: '100%',
  marginLeft: sidebarOpen ?
    (sidebarMini ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH) :
    0,
  position: 'relative',
  overflowX: 'hidden',
  overflowY: 'auto',
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%',
  },
  [theme.breakpoints.between('md', 'lg')]: {
    marginLeft: sidebarOpen ? (sidebarMini ? SIDEBAR_MINI_WIDTH : SIDEBAR_WIDTH) : 0,
  },
  willChange: 'margin-left',
  transformStyle: 'preserve-3d',
}))

const MobileTopBar = styled(AppBar)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    background: alpha(theme.palette.background.paper, 0.72),
    backdropFilter: 'blur(18px)',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
    boxShadow: theme.shadows[6],
  },
}))



interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const responsive = useResponsive()

  const isMobile = responsive.isMobile
  const isTablet = responsive.isTablet

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [sidebarMini, setSidebarMini] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['hr'])
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showHelpCenter, setShowHelpCenter] = useState(false)

  // Determine active navigation
  const selectedNav = useMemo(() => {
    const path = location?.pathname || ''
    if (path.includes('/hr/')) return path.split('/hr/')[1] || 'employees'
    if (path.includes('/leave')) return 'leave'
    if (path.includes('/attendance')) return 'attendance'
    if (path.includes('/payroll')) return 'payroll'
    if (path.includes('/projects')) return 'projects'
    if (path.includes('/reports')) return 'reports'
    return 'dashboard'
  }, [location.pathname])




  // Responsive Sidebar Logic
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
      setSidebarMini(false)
    } else if (isTablet) {
      setSidebarOpen(true)
      setSidebarMini(false)
    } else {
      const saved = localStorage.getItem('sidebarPreferences')
      if (saved) {
        try {
          const prefs = JSON.parse(saved)
          setSidebarOpen(prefs.sidebarOpen ?? true)
          setSidebarMini(prefs.sidebarMini ?? false)
        } catch (error) {
          setSidebarOpen(true)
          setSidebarMini(false)
        }
      } else {
        setSidebarOpen(true)
        setSidebarMini(false)
      }
    }
  }, [isMobile, isTablet])

  useEffect(() => {
    if (!isMobile) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('sidebarPreferences', JSON.stringify({
          sidebarOpen,
          sidebarMini,
          expandedItems,
        }))
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [sidebarOpen, sidebarMini, expandedItems, isMobile])

  const handleNavClick = (itemId: string, path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileDrawerOpen(false)
    }
  }

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId])
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Logout error occurred
    }
  }

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen((prev) => !prev)
    } else {
      setSidebarOpen((prev) => !prev)
    }
  }

  const handleSidebarMiniToggle = () => {
    if (!isMobile) {
      setSidebarMini(!sidebarMini)
    }
  }



  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        background: `radial-gradient(900px 520px at 10% 0%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 60%),
                     radial-gradient(760px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.10)} 0%, transparent 55%)`,
      }}
    >
      {!isMobile && (
        <SidebarContainer sidebarOpen={sidebarOpen} sidebarMini={sidebarMini}>
          <SidebarContent
            mini={sidebarMini}
            expandedItems={expandedItems}
            onExpandClick={handleExpandClick}
            onNavClick={handleNavClick}
            selectedNav={selectedNav}
            onLogout={handleLogout}
            onSettingsClick={() => navigate('/settings')}
            onHelpClick={() => setShowHelpCenter(true)}
            onSidebarMiniToggle={handleSidebarMiniToggle}
          />
        </SidebarContainer>
      )}

      {!isMobile && (
        <SidebarToggleButton sidebarOpen={sidebarOpen} sidebarMini={sidebarMini} onClick={handleSidebarToggle}>
          {!sidebarOpen ? <MenuOpen /> : sidebarMini ? <LastPage /> : <FirstPage />}
        </SidebarToggleButton>
      )}

      {/* Mobile Top Bar */}
      <MobileTopBar position="fixed">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileDrawerOpen(true)}><Menu /></IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>Arise HRM</Typography>
        </Toolbar>
      </MobileTopBar>

      <MainContent sidebarOpen={sidebarOpen} sidebarMini={sidebarMini}>
        <Toolbar sx={{ display: { xs: 'flex', md: 'none' } }} /> {/* Spacer */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </MainContent>

      <SwipeableDrawer
        anchor="bottom"
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        onOpen={() => setShowQuickActions(true)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '70vh',
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(20px)',
            maxWidth: isMobile ? '100%' : '600px',
            margin: isMobile ? 0 : '0 auto',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">Quick Actions</Typography>
            <IconButton onClick={() => setShowQuickActions(false)}><Close /></IconButton>
          </Box>
          <Grid container spacing={2}>
            {[
              { icon: <PersonAdd />, label: 'Add Employee', color: 'primary', action: () => navigate('/hr/employees') },
              { icon: <AssignmentTurnedIn />, label: 'Review Requests', color: 'warning', action: () => navigate('/leave') },
              { icon: <Schedule />, label: 'Attendance', color: 'info', action: () => navigate('/attendance') },
              { icon: <BarChart />, label: 'Analytics', color: 'success', action: () => navigate('/reports') },
              { icon: <Settings />, label: 'Settings', color: 'secondary', action: () => navigate('/settings') },
            ].map((action, index) => (
              <Grid size={{ xs: 6, sm: 4 }} key={index} component="div">
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => { action.action(); setShowQuickActions(false); }}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    height: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    borderColor: alpha((theme.palette[action.color as keyof typeof theme.palette] as any).main, 0.3),
                    color: (theme.palette[action.color as keyof typeof theme.palette] as any).main,
                    '&:hover': {
                      borderColor: (theme.palette[action.color as keyof typeof theme.palette] as any).main,
                      backgroundColor: alpha((theme.palette[action.color as keyof typeof theme.palette] as any).main, 0.05),
                    }
                  }}
                >
                  {React.cloneElement(action.icon as React.ReactElement, { sx: { fontSize: 32 } })}
                  <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 600 }}>{action.label}</Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      </SwipeableDrawer>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            background: alpha(theme.palette.background.paper, 0.78),
            backdropFilter: 'blur(22px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
          }
        }}
      >
        <SidebarContent
          mini={false}
          expandedItems={expandedItems}
          onExpandClick={handleExpandClick}
          onNavClick={handleNavClick}
          selectedNav={selectedNav}
          onLogout={handleLogout}
          onSettingsClick={() => navigate('/settings')}
          onHelpClick={() => setShowHelpCenter(true)}
          onSidebarMiniToggle={() => { }}
        />
      </Drawer>
    </Box>
  )
}
