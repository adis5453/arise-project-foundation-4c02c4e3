'use client'

import React from 'react'
import { Box, Typography, Paper, Alert } from '@mui/material'
import { Analytics } from '@mui/icons-material'

interface AnalyticsDashboardProps {
    open?: boolean
    onClose?: () => void
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ open, onClose }) => {
    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Analytics color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h5">Analytics Dashboard</Typography>
            </Box>
            <Alert severity="info">
                Analytics features coming soon. This will include employee performance metrics,
                attendance trends, leave patterns, and more.
            </Alert>
        </Paper>
    )
}

export default AnalyticsDashboard
