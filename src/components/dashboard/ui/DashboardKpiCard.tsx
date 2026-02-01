import React from 'react'

import { Box, Stack, Typography, useTheme, alpha } from '@mui/material'

import { AnimatedCounter } from '@/components/common'
import { DarkSpotlightCard } from '@/components/common/SpotlightCard'

interface DashboardKpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  hint?: string
}

export function DashboardKpiCard({ label, value, icon, hint }: DashboardKpiCardProps) {
  const theme = useTheme()

  return (
    <DarkSpotlightCard
      sx={{
        height: '100%',
        p: 2.5,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.72)} 0%, ${alpha(theme.palette.background.default, 0.55)} 100%)`,
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ letterSpacing: 0.8, color: 'text.secondary' }}>
            {label}
          </Typography>
          <AnimatedCounter value={value} variant="h3" gradient sx={{ mt: 0.25 }} />
          {hint ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {hint}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.22)} 0%, ${alpha(theme.palette.primary.dark, 0.18)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
            color: 'text.primary',
            flexShrink: 0,
            '& svg': { fontSize: 22 },
          }}
        >
          {icon}
        </Box>
      </Stack>
    </DarkSpotlightCard>
  )
}
