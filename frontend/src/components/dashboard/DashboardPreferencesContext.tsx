'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface DashboardPreferencesContextType {
  preferences: any
  updatePreferences: (newPrefs: any) => void
  resetToDefaults: () => void
  getWidgetsForRole: (role: string) => any[]
}

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | undefined>(undefined)

export function DashboardPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [preferences, setPreferences] = useState(null)

  const roleBasedWidgets = {
    admin: [
      'overview', 'employee-count', 'attendance-today', 'performance-metrics',
      'payroll-summary', 'security-dashboard', 'reports-center'
    ],
    hr: [
      'overview', 'employee-count', 'attendance-today', 'performance-metrics',
      'payroll-summary', 'reports-center'
    ],
    manager: [
      'overview', 'team-analytics', 'attendance-today', 'performance-metrics',
      'reports-center'
    ],
    team_lead: [
      'team-analytics', 'attendance-today', 'performance-metrics'
    ],
    employee: [
      'overview', 'attendance-today'
    ]
  }

  const getWidgetsForRole = (role: string) => {
    return roleBasedWidgets[role as keyof typeof roleBasedWidgets] || roleBasedWidgets.employee
  }

  const updatePreferences = (newPrefs: any) => {
    setPreferences(newPrefs)
    localStorage.setItem(`dashboard-prefs-${profile?.id}`, JSON.stringify(newPrefs))
  }

  const resetToDefaults = () => {
    const defaultPrefs = {
      widgets: getWidgetsForRole(profile?.role?.name || 'employee').map(id => ({
        id,
        enabled: true
      })),
      theme: 'dark',
      layout: 'grid',
      refreshInterval: 30000,
      showWelcome: true,
      showNotifications: true,
    }
    updatePreferences(defaultPrefs)
  }

  useEffect(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`dashboard-prefs-${profile.id}`)
      if (saved) {
        setPreferences(JSON.parse(saved))
      } else {
        resetToDefaults()
      }
    }
  }, [profile])

  return (
    <DashboardPreferencesContext.Provider value={{
      preferences,
      updatePreferences,
      resetToDefaults,
      getWidgetsForRole
    }}>
      {children}
    </DashboardPreferencesContext.Provider>
  )
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext)
  if (!context) {
    throw new Error('useDashboardPreferences must be used within DashboardPreferencesProvider')
  }
  return context
}
