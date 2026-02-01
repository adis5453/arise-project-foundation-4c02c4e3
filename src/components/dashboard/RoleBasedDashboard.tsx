import React from 'react'

import { Box } from '@mui/material'

import EmployeeDashboard from './EmployeeDashboard'

/**
 * The routed dashboard entrypoint (/dashboard).
 * For now we render the context-aware dashboard for all roles.
 * (Role-specific variants can be re-enabled once their data sources are fully live.)
 */
const RoleBasedDashboard: React.FC = () => {
  return (
    <Box>
      <EmployeeDashboard />
    </Box>
  )
}

export default RoleBasedDashboard
