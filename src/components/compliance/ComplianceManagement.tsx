import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  LinearProgress,
  Avatar,
  Stack,
  Paper,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Add as AddIcon,
  Policy as PolicyIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Security as SecurityIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface Policy {
  id: string
  title: string
  description: string
  category: string
  content: string
  version: string
  effective_date: string
  expiry_date?: string
  mandatory: boolean
  target_roles: string[]
  status: 'draft' | 'active' | 'expired'
  created_by: string
  created_at: string
  acknowledgments?: PolicyAcknowledgment[]
}

interface PolicyAcknowledgment {
  id: string
  policy_id: string
  employee_id: string
  acknowledged_at: string
  version: string
  employee?: {
    full_name: string
    department: string
  }
}

const POLICY_CATEGORIES = [
  { value: 'hr', label: 'HR Policies' },
  { value: 'security', label: 'Security & Privacy' },
  { value: 'safety', label: 'Health & Safety' },
  { value: 'code_of_conduct', label: 'Code of Conduct' },
  { value: 'financial', label: 'Financial Policies' },
  { value: 'it', label: 'IT Policies' },
  { value: 'legal', label: 'Legal & Compliance' }
]

const ComplianceManagement: React.FC = () => {
  const { profile } = useAuth()
  const { isHR, isAdmin } = usePermissions()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState(0)
  const [openCreatePolicy, setOpenCreatePolicy] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [policyForm, setPolicyForm] = useState({
    title: '',
    description: '',
    category: 'hr',
    content: '',
    version: '1.0',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    mandatory: true,
    target_roles: [] as string[]
  })

  // Fetch policies from database
  const { data: policies = [], isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await api.get('/policies')
      return (response || []) as Policy[]
    }
  })

  // Fetch my policy acknowledgments from database
  const { data: myAcknowledgments = [] } = useQuery({
    queryKey: ['my-policy-acknowledgments', profile?.employee_id],
    queryFn: async () => {
      const response = await api.get(`/policy-acknowledgments?employee_id=${profile?.employee_id}`)
      return (response || []) as PolicyAcknowledgment[]
    },
    enabled: !!profile?.employee_id
  })

  // Calculate pending acknowledgments
  const pendingAcknowledgments = policies.filter(
    (policy: Policy) => policy.mandatory &&
      policy.status === 'active' &&
      !myAcknowledgments.some((ack: PolicyAcknowledgment) => ack.policy_id === policy.id)
  )

  // Create policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (data: typeof policyForm) => {
      return await api.post('/policies', {
        ...data,
        created_by: profile?.employee_id,
        status: 'draft'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy created successfully')
      setOpenCreatePolicy(false)
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create policy')
    }
  })

  // Acknowledge policy mutation
  const acknowledgePolicyMutation = useMutation({
    mutationFn: async ({ policyId, version }: { policyId: string, version: string }) => {
      return await api.post('/policy-acknowledgments', {
        policy_id: policyId,
        employee_id: profile?.employee_id,
        version: version
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-policy-acknowledgments'] })
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy acknowledged successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to acknowledge policy')
    }
  })

  const resetForm = () => {
    setPolicyForm({
      title: '',
      description: '',
      category: 'hr',
      content: '',
      version: '1.0',
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      mandatory: true,
      target_roles: []
    })
  }

  const handleCreatePolicy = () => {
    createPolicyMutation.mutate(policyForm)
  }

  const handleAcknowledgePolicy = (policyId: string, version: string) => {
    acknowledgePolicyMutation.mutate({ policyId, version })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'error'
      default: return 'default'
    }
  }

  const isAcknowledged = (policyId: string) => {
    return myAcknowledgments.some((ack: PolicyAcknowledgment) => ack.policy_id === policyId)
  }

  const getAcknowledgmentStats = (policy: Policy) => {
    const acknowledged = policy.acknowledgments?.length || 0
    return { acknowledged, total: 'N/A' }
  }

  if (isLoading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading policies...</Typography>
      </Box>
    )
  }

  const renderPoliciesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Company Policies</Typography>
        {isHR() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreatePolicy(true)}
          >
            Create Policy
          </Button>
        )}
      </Box>

      {pendingAcknowledgments.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {pendingAcknowledgments.length} policies requiring acknowledgment
        </Alert>
      )}

      {policies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PolicyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No policies found</Typography>
          <Typography variant="body2" color="text.secondary">
            {isHR() ? 'Create a new policy to get started.' : 'No policies have been published yet.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {policies.map((policy: Policy) => (
            <Grid component="div" size={{ xs: 12 }} key={policy.id}>
              <Card
                sx={{
                  border: policy.mandatory && !isAcknowledged(policy.id) ? '2px solid #ff9800' : 'none',
                  backgroundColor: policy.mandatory && !isAcknowledged(policy.id) ? 'rgba(255, 152, 0, 0.05)' : 'inherit'
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={2} mb={1} flexWrap="wrap">
                        <Typography variant="h6" fontWeight="bold">
                          {policy.title}
                        </Typography>
                        <Chip label={policy.category} color="primary" size="small" />
                        <Chip label={policy.status} color={getStatusColor(policy.status) as any} size="small" />
                        {policy.mandatory && (
                          <Chip icon={<WarningIcon />} label="Mandatory" color="warning" size="small" />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {policy.description}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
                        <Typography variant="body2">
                          Version {policy.version} • Effective: {new Date(policy.effective_date).toLocaleDateString()}
                        </Typography>
                        {policy.expiry_date && (
                          <Typography variant="body2" color="text.secondary">
                            Expires: {new Date(policy.expiry_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" gap={2}>
                        {policy.mandatory && (
                          <>
                            {isAcknowledged(policy.id) ? (
                              <Chip icon={<CheckCircleIcon />} label="Acknowledged" color="success" size="small" />
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => handleAcknowledgePolicy(policy.id, policy.version)}
                                disabled={acknowledgePolicyMutation.isPending}
                              >
                                Acknowledge Required
                              </Button>
                            )}
                          </>
                        )}

                        {isHR() && (
                          <Typography variant="body2" color="text.secondary">
                            {getAcknowledgmentStats(policy).acknowledged} acknowledged
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box display="flex" gap={1}>
                      <IconButton size="small" onClick={() => setSelectedPolicy(policy)}>
                        <ViewIcon />
                      </IconButton>
                      {isHR() && (
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )

  const renderComplianceTab = () => (
    <Box>
      <Typography variant="h6" mb={3}>Compliance Dashboard</Typography>

      <Grid container spacing={3}>
        <Grid component="div" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">Policy Compliance</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {myAcknowledgments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Policies Acknowledged
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <WarningIcon color="warning" />
                <Typography variant="h6">Pending Actions</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {pendingAcknowledgments.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Policies Requiring Action
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div" size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <AssignmentIcon color="success" />
                <Typography variant="h6">Total Policies</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {policies.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Policies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pendingAcknowledgments.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" mb={2}>Action Required</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Policy</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingAcknowledgments.map((policy: Policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {policy.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={policy.category} size="small" />
                    </TableCell>
                    <TableCell>
                      {new Date(policy.effective_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => handleAcknowledgePolicy(policy.id, policy.version)}
                        disabled={acknowledgePolicyMutation.isPending}
                      >
                        Acknowledge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  )

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Compliance Management
      </Typography>

      <Card>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Policies" />
          <Tab label="My Compliance" />
          {isHR() && <Tab label="Reports" />}
        </Tabs>

        <CardContent>
          {activeTab === 0 && renderPoliciesTab()}
          {activeTab === 1 && renderComplianceTab()}
          {activeTab === 2 && isHR() && (
            <Alert severity="info">Compliance reports coming soon...</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create Policy Dialog */}
      <Dialog open={openCreatePolicy} onClose={() => setOpenCreatePolicy(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Policy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid component="div" size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Policy Title"
                value={policyForm.title}
                onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={policyForm.description}
                onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Policy Content"
                value={policyForm.content}
                onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={policyForm.category}
                  label="Category"
                  onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                >
                  {POLICY_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Version"
                value={policyForm.version}
                onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Effective Date"
                InputLabelProps={{ shrink: true }}
                value={policyForm.effective_date}
                onChange={(e) => setPolicyForm({ ...policyForm, effective_date: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Expiry Date (Optional)"
                InputLabelProps={{ shrink: true }}
                value={policyForm.expiry_date}
                onChange={(e) => setPolicyForm({ ...policyForm, expiry_date: e.target.value })}
              />
            </Grid>
            <Grid component="div" size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={policyForm.mandatory}
                    onChange={(e) => setPolicyForm({ ...policyForm, mandatory: e.target.checked })}
                  />
                }
                label="Mandatory Acknowledgment"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreatePolicy(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePolicy}
            variant="contained"
            disabled={!policyForm.title || !policyForm.content || createPolicyMutation.isPending}
          >
            {createPolicyMutation.isPending ? 'Creating...' : 'Create Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Policy View Dialog */}
      <Dialog open={!!selectedPolicy} onClose={() => setSelectedPolicy(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedPolicy?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedPolicy?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPolicy(null)}>Close</Button>
          {selectedPolicy?.mandatory && !isAcknowledged(selectedPolicy.id) && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                handleAcknowledgePolicy(selectedPolicy.id, selectedPolicy.version)
                setSelectedPolicy(null)
              }}
            >
              Acknowledge
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ComplianceManagement
