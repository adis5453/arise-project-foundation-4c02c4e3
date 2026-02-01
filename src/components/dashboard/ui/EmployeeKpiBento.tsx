import React from 'react'

import { Box, Typography } from '@mui/material'
import { Assignment, EventBusy, Group, WorkOutline } from '@mui/icons-material'

import { BentoGrid, BentoItem } from '@/components/common'
import { DashboardKpiCard } from './DashboardKpiCard'

interface EmployeeKpiBentoProps {
  metrics: {
    projects: number
    colleagues: number
    away: number
    pendingLeaves: number
  }
}

export function EmployeeKpiBento({ metrics }: EmployeeKpiBentoProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={750} sx={{ mb: 2 }}>
        Your day, at a glance
      </Typography>

      <BentoGrid columns={4} gap={16}>
        <BentoItem colSpan={2} rowSpan={1} variant="featured">
          <DashboardKpiCard
            label="Active projects"
            value={metrics.projects}
            icon={<WorkOutline />}
            hint="In progress"
          />
        </BentoItem>

        <BentoItem colSpan={1} rowSpan={1}>
          <DashboardKpiCard
            label="Team"
            value={metrics.colleagues}
            icon={<Group />}
            hint="Colleagues"
          />
        </BentoItem>

        <BentoItem colSpan={1} rowSpan={1}>
          <DashboardKpiCard
            label="Away"
            value={metrics.away}
            icon={<EventBusy />}
            hint="Today"
          />
        </BentoItem>

        <BentoItem colSpan={2} rowSpan={1}>
          <DashboardKpiCard
            label="Pending leave"
            value={metrics.pendingLeaves}
            icon={<Assignment />}
            hint="Waiting on approval"
          />
        </BentoItem>
      </BentoGrid>
    </Box>
  )
}
