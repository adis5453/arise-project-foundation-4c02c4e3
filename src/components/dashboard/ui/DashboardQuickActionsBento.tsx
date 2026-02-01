import React from 'react'

import { Badge, Box, Stack, Typography, useTheme, alpha } from '@mui/material'

import { BentoGrid, BentoItem } from '@/components/common'

export interface DashboardQuickAction {
  id: string
  label: string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  badge?: number
  onClick: () => void
}

export function DashboardQuickActionsBento({ actions }: { actions: DashboardQuickAction[] }) {
  const theme = useTheme()

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={750} sx={{ mb: 1.25 }}>
        Quick actions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Jump into common workflows without breaking focus.
      </Typography>

      <BentoGrid columns={4} gap={16}>
        {actions.slice(0, 8).map((action, idx) => {
          const palette = theme.palette[action.color]
          const isHero = idx === 0

          return (
            <BentoItem
              key={action.id}
              colSpan={isHero ? 2 : 1}
              rowSpan={1}
              variant={isHero ? 'featured' : 'default'}
              onClick={action.onClick}
              sx={{
                cursor: 'pointer',
                p: 2.25,
                '&:active': { transform: 'translateY(-2px) scale(0.995)' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={750} noWrap>
                    {action.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isHero ? 'Primary workflow' : 'Open'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  {(action.badge ?? 0) > 0 ? (
                    <Badge badgeContent={action.badge} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }} />
                  ) : null}

                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2.5,
                      display: 'grid',
                      placeItems: 'center',
                      background: `linear-gradient(135deg, ${alpha(palette.main, 0.22)} 0%, ${alpha(palette.dark, 0.16)} 100%)`,
                      border: `1px solid ${alpha(palette.main, 0.22)}`,
                      '& svg': { color: 'text.primary', fontSize: 22 },
                    }}
                  >
                    {action.icon}
                  </Box>
                </Stack>
              </Stack>
            </BentoItem>
          )
        })}
      </BentoGrid>
    </Box>
  )
}
