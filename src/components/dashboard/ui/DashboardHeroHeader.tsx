import React from 'react'

import { Box, Button, Stack, Typography, useTheme, alpha } from '@mui/material'

import { GradientText } from '@/components/common/AnimatedText'

interface DashboardHeroHeaderProps {
  name: string
  subtitle: string
  onRefresh: () => void
  onPrimaryAction: () => void
  primaryActionLabel?: string
}

export function DashboardHeroHeader({
  name,
  subtitle,
  onRefresh,
  onPrimaryAction,
  primaryActionLabel = 'Primary action',
}: DashboardHeroHeaderProps) {
  const theme = useTheme()

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography component="h1" variant="h4" fontWeight={850} sx={{ lineHeight: 1.08 }}>
          <GradientText fontSize="inherit" fontWeight={900} animated>
            {name}
          </GradientText>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 70 }}>
          {subtitle}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          variant="outlined"
          onClick={onRefresh}
          sx={{
            borderRadius: 2,
            px: 2.25,
            py: 1.25,
            borderColor: alpha(theme.palette.divider, 0.6),
          }}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          onClick={onPrimaryAction}
          sx={{
            borderRadius: 2,
            px: 2.25,
            py: 1.25,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          {primaryActionLabel}
        </Button>
      </Stack>
    </Stack>
  )
}
