import { ThemeOptions } from '@mui/material/styles'
import { alpha } from '@mui/material/styles'

/**
 * NOTE: The file name is kept for backwards compatibility.
 * This theme now follows the orange/blue + warm-paper token system used in styles/index.css.
 */

export const brandColors = {
  primary: {
    50: '#fff3ec',
    100: '#ffe1d1',
    200: '#ffc2a3',
    300: '#ffa574',
    400: '#ff7c3c',
    500: '#ff5600',
    600: '#e64d00',
    700: '#cc4400',
    800: '#a33600',
    900: '#7a2900',
    950: '#4d1900',
  },
  accent: {
    50: '#eef0ff',
    100: '#d6d9ff',
    200: '#b0b6ff',
    300: '#8a93ff',
    400: '#4d59ff',
    500: '#000ce1',
    600: '#000bbf',
    700: '#00099d',
    800: '#00077a',
    900: '#000558',
    950: '#000334',
  },
} as const

// Back-compat export name (previously the denim blue palette)
export const denimColors = brandColors.accent

// Semantic color mapping
export const semanticColors = {
  primary: brandColors.primary[500],
  primaryLight: brandColors.primary[300],
  primaryDark: brandColors.primary[700],
  primaryContrast: '#ffffff',

  secondary: brandColors.accent[500],
  secondaryLight: brandColors.accent[300],
  secondaryDark: brandColors.accent[700],
  secondaryContrast: '#ffffff',

  background: {
    light: '#f4f3ec',
    main: '#ffffff',
    dark: '#17100e',
    paper: '#ffffff',
    paperDark: '#080e1c',
  },

  text: {
    primary: '#17100e',
    secondary: '#6a6462',
    disabled: '#a9a3a1',
    primaryDark: '#f4f3ec',
    secondaryDark: '#dddbe0',
  },

  divider: alpha('#17100e', 0.12),
  dividerDark: alpha('#ffffff', 0.18),

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: brandColors.accent[500],
} as const

// Gradient definitions
export const denimGradients = {
  primary: `linear-gradient(135deg, ${brandColors.primary[500]} 0%, ${brandColors.primary[600]} 100%)`,
  light: `linear-gradient(135deg, ${brandColors.primary[200]} 0%, ${brandColors.primary[300]} 100%)`,
  dark: `linear-gradient(135deg, ${brandColors.accent[600]} 0%, ${brandColors.accent[700]} 100%)`,
  ultraDark: `linear-gradient(135deg, ${semanticColors.background.dark} 0%, ${semanticColors.background.paperDark} 100%)`,

  // Special gradients
  hero: `linear-gradient(135deg, ${brandColors.accent[500]} 0%, ${brandColors.accent[600]} 45%, ${brandColors.primary[500]} 100%)`,
  card: `linear-gradient(145deg, ${alpha(semanticColors.primary, 0.05)} 0%, ${alpha(semanticColors.secondary, 0.02)} 100%)`,
  sidebar: `linear-gradient(180deg, ${brandColors.accent[600]} 0%, ${brandColors.accent[700]} 50%, ${semanticColors.background.paperDark} 100%)`,
  button: `linear-gradient(45deg, ${brandColors.primary[500]} 30%, ${brandColors.primary[600]} 90%)`,

  // Role-specific gradients
  employee: `linear-gradient(135deg, ${brandColors.accent[300]} 0%, ${brandColors.accent[500]} 100%)`,
  teamLead: `linear-gradient(135deg, ${brandColors.accent[500]} 0%, ${brandColors.accent[600]} 100%)`,
  manager: `linear-gradient(135deg, ${brandColors.accent[600]} 0%, ${brandColors.accent[700]} 100%)`,
  hr: `linear-gradient(135deg, ${brandColors.accent[700]} 0%, ${brandColors.accent[800]} 100%)`,
  admin: `linear-gradient(135deg, ${brandColors.accent[800]} 0%, ${brandColors.accent[900]} 100%)`,
  superAdmin: `linear-gradient(135deg, ${brandColors.accent[900]} 0%, ${brandColors.accent[950]} 100%)`,
} as const

// Box shadows with denim colors
export const denimShadows = {
  small: `0 2px 8px ${alpha('#000000', 0.10)}`,
  medium: `0 4px 16px ${alpha('#000000', 0.14)}`,
  large: `0 8px 32px ${alpha('#000000', 0.18)}`,
  xlarge: `0 12px 48px ${alpha('#000000', 0.22)}`,

  // Interactive shadows
  hover: `0 10px 40px ${alpha('#000000', 0.22)}`,
  active: `0 4px 16px ${alpha('#000000', 0.18)}`,

  // Role-specific shadows
  employee: `0 4px 16px ${alpha(brandColors.accent[400], 0.18)}`,
  manager: `0 4px 16px ${alpha(brandColors.accent[600], 0.18)}`,
  admin: `0 4px 16px ${alpha(brandColors.accent[800], 0.18)}`,
} as const

// Status color mapping with denim integration
export const statusColors = {
  success: {
    main: '#10b981',
    light: '#6ee7b7',
    dark: '#047857',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    contrastText: '#ffffff',
  },
  info: {
    main: brandColors.accent[500],
    light: brandColors.accent[300],
    dark: brandColors.accent[700],
    contrastText: '#ffffff',
  },
} as const

// Create MUI theme options with denim colors
export const createDenimThemeOptions = (isDark: boolean): ThemeOptions => ({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      50: brandColors.primary[50],
      100: brandColors.primary[100],
      200: brandColors.primary[200],
      300: brandColors.primary[300],
      400: brandColors.primary[400],
      500: brandColors.primary[500],
      600: brandColors.primary[600],
      700: brandColors.primary[700],
      800: brandColors.primary[800],
      900: brandColors.primary[900],
      main: brandColors.primary[500],
      light: brandColors.primary[300],
      dark: brandColors.primary[700],
      contrastText: semanticColors.primaryContrast,
    },
    secondary: {
      50: brandColors.accent[50],
      100: brandColors.accent[100],
      200: brandColors.accent[200],
      300: brandColors.accent[300],
      400: brandColors.accent[400],
      500: brandColors.accent[500],
      600: brandColors.accent[600],
      700: brandColors.accent[700],
      800: brandColors.accent[800],
      900: brandColors.accent[900],
      main: brandColors.accent[500],
      light: brandColors.accent[300],
      dark: brandColors.accent[700],
      contrastText: semanticColors.secondaryContrast,
    },
    success: statusColors.success,
    warning: statusColors.warning,
    error: statusColors.error,
    info: statusColors.info,
    background: {
      default: isDark ? semanticColors.background.dark : semanticColors.background.light,
      paper: isDark ? semanticColors.background.paperDark : semanticColors.background.paper,
    },
    text: {
      primary: isDark ? semanticColors.text.primaryDark : semanticColors.text.primary,
      secondary: isDark ? semanticColors.text.secondaryDark : semanticColors.text.secondary,
      disabled: isDark ? alpha(semanticColors.text.primaryDark, 0.45) : alpha(semanticColors.text.primary, 0.45),
    },
    divider: isDark ? semanticColors.dividerDark : semanticColors.divider,
    action: {
      active: isDark ? brandColors.accent[200] : brandColors.accent[700],
      hover: isDark ? alpha('#ffffff', 0.06) : alpha('#17100e', 0.04),
      selected: isDark ? alpha('#ffffff', 0.10) : alpha('#17100e', 0.08),
      disabled: isDark ? alpha('#ffffff', 0.30) : alpha('#17100e', 0.30),
      disabledBackground: isDark ? alpha('#ffffff', 0.08) : alpha('#17100e', 0.06),
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    denimShadows.small,
    denimShadows.small,
    denimShadows.medium,
    denimShadows.medium,
    denimShadows.large,
    denimShadows.large,
    denimShadows.xlarge,
    denimShadows.xlarge,
    `0 16px 64px ${alpha('#000000', 0.20)}`,
    `0 20px 80px ${alpha('#000000', 0.22)}`,
    `0 24px 96px ${alpha('#000000', 0.24)}`,
    `0 28px 112px ${alpha('#000000', 0.26)}`,
    `0 32px 128px ${alpha('#000000', 0.28)}`,
    `0 36px 144px ${alpha('#000000', 0.30)}`,
    `0 40px 160px ${alpha('#000000', 0.32)}`,
    `0 44px 176px ${alpha('#000000', 0.34)}`,
    `0 48px 192px ${alpha('#000000', 0.36)}`,
    `0 52px 208px ${alpha('#000000', 0.38)}`,
    `0 56px 224px ${alpha('#000000', 0.40)}`,
    `0 60px 240px ${alpha('#000000', 0.42)}`,
    `0 64px 256px ${alpha('#000000', 0.44)}`,
    `0 68px 272px ${alpha('#000000', 0.46)}`,
    `0 72px 288px ${alpha('#000000', 0.48)}`,
    `0 76px 304px ${alpha('#000000', 0.50)}`,
  ],
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      color: isDark ? semanticColors.text.primaryDark : semanticColors.text.primary,
    },
    h2: {
      fontWeight: 700,
      color: isDark ? semanticColors.text.primaryDark : semanticColors.text.primary,
    },
    h3: {
      fontWeight: 600,
      color: isDark ? semanticColors.text.primaryDark : semanticColors.text.primary,
    },
    h4: {
      fontWeight: 600,
      color: isDark ? semanticColors.text.primaryDark : semanticColors.text.primary,
    },
    h5: {
      fontWeight: 600,
      color: isDark ? semanticColors.text.secondaryDark : semanticColors.text.secondary,
    },
    h6: {
      fontWeight: 600,
      color: isDark ? semanticColors.text.secondaryDark : semanticColors.text.secondary,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${isDark ? alpha('#ffffff', 0.14) : alpha('#17100e', 0.10)}`,
          backgroundColor: isDark ? semanticColors.background.paperDark : semanticColors.background.paper,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: isDark ? alpha(semanticColors.secondary, 0.45) : alpha(semanticColors.secondary, 0.25),
            boxShadow: denimShadows.hover,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          background: denimGradients.button,
          color: '#ffffff',
          '&:hover': {
            background: `linear-gradient(45deg, ${brandColors.primary[600]} 30%, ${brandColors.primary[700]} 90%)`,
          },
          '&:active': {
            background: `linear-gradient(45deg, ${brandColors.primary[700]} 30%, ${brandColors.primary[800]} 90%)`,
          },
        },
        outlined: {
          borderColor: alpha(semanticColors.secondary, 0.35),
          color: semanticColors.secondary,
          '&:hover': {
            borderColor: alpha(semanticColors.secondary, 0.55),
            backgroundColor: alpha(semanticColors.secondary, 0.06),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '& fieldset': {
              borderColor: isDark ? alpha('#ffffff', 0.22) : alpha('#17100e', 0.16),
            },
            '&:hover fieldset': {
              borderColor: isDark ? alpha('#ffffff', 0.34) : alpha('#17100e', 0.24),
            },
            '&.Mui-focused fieldset': {
              borderColor: semanticColors.secondary,
            },
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: semanticColors.secondary,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        colorPrimary: {
          backgroundColor: semanticColors.primary,
          color: '#ffffff',
        },
        colorSecondary: {
          backgroundColor: semanticColors.secondary,
          color: '#ffffff',
        },
        outlined: {
          borderColor: alpha(semanticColors.secondary, 0.35),
          color: semanticColors.secondary,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: isDark ? alpha('#ffffff', 0.12) : alpha('#17100e', 0.08),
        },
        bar: {
          borderRadius: 10,
          backgroundColor: semanticColors.primary,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: semanticColors.secondary,
          color: '#ffffff',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: denimGradients.button,
          '&:hover': {
            background: `linear-gradient(45deg, ${brandColors.primary[600]} 30%, ${brandColors.primary[700]} 90%)`,
          },
        },
      },
    },
  },
})

// CSS Custom Properties for denim theme
export const denimCSSVariables = `
  /* Denim Color Palette */
  --denim-50: ${brandColors.accent[50]};
  --denim-100: ${brandColors.accent[100]};
  --denim-200: ${brandColors.accent[200]};
  --denim-300: ${brandColors.accent[300]};
  --denim-400: ${brandColors.accent[400]};
  --denim-500: ${brandColors.accent[500]};
  --denim-600: ${brandColors.accent[600]};
  --denim-700: ${brandColors.accent[700]};
  --denim-800: ${brandColors.accent[800]};
  --denim-900: ${brandColors.accent[900]};
  --denim-950: ${brandColors.accent[950]};
  
  /* Semantic Colors */
  --denim-primary: ${semanticColors.primary};
  --denim-primary-light: ${semanticColors.primaryLight};
  --denim-primary-dark: ${semanticColors.primaryDark};
  --denim-secondary: ${semanticColors.secondary};
  --denim-secondary-light: ${semanticColors.secondaryLight};
  --denim-secondary-dark: ${semanticColors.secondaryDark};
  
  /* Background Colors */
  --denim-background: ${semanticColors.background.light};
  --denim-background-dark: ${semanticColors.background.dark};
  --denim-paper: ${semanticColors.background.paper};
  --denim-paper-dark: ${semanticColors.background.paperDark};
  
  /* Text Colors */
  --denim-text-primary: ${semanticColors.text.primary};
  --denim-text-secondary: ${semanticColors.text.secondary};
  --denim-text-disabled: ${semanticColors.text.disabled};
  --denim-text-primary-dark: ${semanticColors.text.primaryDark};
  --denim-text-secondary-dark: ${semanticColors.text.secondaryDark};
  
  /* Gradients */
  --denim-gradient-primary: ${denimGradients.primary};
  --denim-gradient-light: ${denimGradients.light};
  --denim-gradient-dark: ${denimGradients.dark};
  --denim-gradient-hero: ${denimGradients.hero};
  --denim-gradient-sidebar: ${denimGradients.sidebar};
  --denim-gradient-button: ${denimGradients.button};
  
  /* Shadows */
  --denim-shadow-small: ${denimShadows.small};
  --denim-shadow-medium: ${denimShadows.medium};
  --denim-shadow-large: ${denimShadows.large};
  --denim-shadow-hover: ${denimShadows.hover};
  
  /* Role Colors */
  --denim-role-employee: ${brandColors.accent[300]};
  --denim-role-team-lead: ${brandColors.accent[500]};
  --denim-role-manager: ${brandColors.accent[600]};
  --denim-role-hr: ${brandColors.accent[700]};
  --denim-role-admin: ${brandColors.accent[800]};
  --denim-role-super-admin: ${brandColors.accent[900]};
`

// Utility functions
export const getDenimColor = (shade: keyof typeof denimColors) => denimColors[shade];
export const getDenimGradient = (type: keyof typeof denimGradients) => denimGradients[type];
export const getDenimShadow = (type: keyof typeof denimShadows) => denimShadows[type];

// Role-based color helper
export const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'employee': return brandColors.accent[300];
    case 'senior_employee': return brandColors.accent[400];
    case 'team_lead':
    case 'team_leader': return brandColors.accent[500];
    case 'department_manager':
    case 'manager': return brandColors.accent[600];
    case 'hr_manager':
    case 'hr': return brandColors.accent[700];
    case 'admin':
    case 'administrator': return brandColors.accent[800];
    case 'super_admin':
    case 'super_administrator': return brandColors.accent[900];
    default: return brandColors.accent[500];
  }
}

// Status color helper with denim integration
export const getStatusColor = (status: string, variant: 'main' | 'light' | 'dark' = 'main') => {
  const statusKey = status.toLowerCase();

  // For denim-specific statuses
  if (statusKey.includes('active') || statusKey.includes('present')) {
    return statusColors.success[variant];
  }
  if (statusKey.includes('pending') || statusKey.includes('review')) {
    return statusColors.warning[variant];
  }
  if (statusKey.includes('rejected') || statusKey.includes('error')) {
    return statusColors.error[variant];
  }

  // Default to denim info color
  return statusColors.info[variant];
}

export default denimColors
