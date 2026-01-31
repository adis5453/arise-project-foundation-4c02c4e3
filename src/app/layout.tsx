/*
// Unused Next.js layout file - preserved for reference but disabled causing TSC errors in Vite build
'use client'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { denimTheme as theme } from '../styles/denimTheme'
import { AuthProvider } from '../contexts/AuthContext'
import { Toaster } from 'sonner'

// Custom global styles
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              theme="light"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
*/
