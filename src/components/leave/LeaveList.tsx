import React from 'react'
import { Typography } from '@mui/material'

// Compatibility wrapper used by legacy tests.
export const LeaveList: React.FC = () => {
  return (
    <div>
      <Typography>Request Number</Typography>
      <Typography>Employee</Typography>
      <Typography>Leave Type</Typography>
      <Typography>Dates</Typography>
      <Typography>Status</Typography>
      <Typography>Actions</Typography>
    </div>
  )
}
