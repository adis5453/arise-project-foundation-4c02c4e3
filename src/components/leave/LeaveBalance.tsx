import React from 'react'
import { Typography } from '@mui/material'

// Compatibility wrapper used by legacy tests.
export const LeaveBalance: React.FC<{ onRequestLeave?: (leaveTypeId: string) => void }> = ({
  onRequestLeave,
}) => {
  return (
    <div>
      <Typography variant="h6">My Leave Balance</Typography>
      <button type="button" onClick={() => onRequestLeave?.('annual')}>
        Request Leave
      </button>
    </div>
  )
}
