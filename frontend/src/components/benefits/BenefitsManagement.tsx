'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  LinearProgress,
  useTheme,
  alpha,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  Checkbox,
  Switch,
  Slider,
} from '@mui/material'
import {
  AttachMoney,
  HealthAndSafety,
  DirectionsCar,
  Restaurant,
  FitnessCenter,
  School,
  Savings,
  LocalHospital,
  Visibility,
  Edit,
  Delete,
  Add,
  Download,
  Upload,
  Share,
  Analytics,
  History,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  Person,
  Group,
  Business,
  Security,
  Settings,
  Notifications,
  CheckCircle,
  Warning,
  Error,
  Info,
  Close,
  ExpandMore,
  MonetizationOn,
  CreditCard,
  AccountBalance,
  Receipt,
  Assignment,
  Calculate,
  VerifiedUser,
  Shield,
  FamilyRestroom,
  ChildCare,
  Elderly,
  MedicalServices,
  Psychology,
  SportsTennis,
  FlightTakeoff,
  Timer,
  Percent,
  PieChart,
  BarChart,
  ShowChart,
  CompareArrows,
  Refresh,
  FilterList,
  Sort,
  Search,
  MoreVert,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useResponsive } from '../../hooks/useResponsive'
import { MetricCard } from '../common/MetricCard'
import { StatusChip } from '../common/StatusChip'
import { NumberTicker } from '../common/NumberTicker'
import DatabaseService from '../../services/databaseService'

// Types
interface BenefitPlan {
  id: string
  name: string
  category: 'health' | 'dental' | 'vision' | 'life' | 'disability' | 'retirement' | 'pto' | 'other'
  type: 'insurance' | 'savings' | 'time_off' | 'wellness' | 'financial' | 'family'
  description: string
  provider: string
  cost: {
    employee: number
    employer: number
    total: number
    frequency: 'monthly' | 'annual' | 'per_paycheck'
  }
  coverage: {
    individual: boolean
    family: boolean
    dependent: boolean
  }
  eligibility: {
    employeeTypes: string[]
    minimumTenure: number // in months
    fullTimeOnly: boolean
  }
  details: {
    deductible?: number
    copay?: number
    coinsurance?: number
    outOfPocketMax?: number
    coverage?: string[]
    exclusions?: string[]
  }
  enrollmentPeriod: {
    start: string
    end: string
    effectiveDate: string
  }
  isActive: boolean
  popularity: number
  rating: number
  reviews: number
}

interface EmployeeBenefit {
  id: string
  employeeId: string
  planId: string
  plan: BenefitPlan
  status: 'active' | 'pending' | 'cancelled' | 'expired'
  enrolledAt: string
  effectiveDate: string
  terminationDate?: string
  coverage: 'individual' | 'family' | 'employee_spouse' | 'employee_children'
  dependents: Dependent[]
  cost: {
    employeeContribution: number
    employerContribution: number
    total: number
  }
  payrollDeduction: number
  claims?: BenefitClaim[]
}

interface Dependent {
  id: string
  name: string
  relationship: 'spouse' | 'child' | 'domestic_partner' | 'other'
  dateOfBirth: string
  ssn?: string
  isStudent?: boolean
}

interface BenefitClaim {
  id: string
  type: string
  amount: number
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'paid'
  submittedAt: string
  processedAt?: string
  description: string
}

interface CompensationRecord {
  id: string
  employeeId: string
  type: 'salary' | 'bonus' | 'commission' | 'overtime' | 'adjustment'
  amount: number
  frequency: 'hourly' | 'monthly' | 'annual' | 'one_time'
  effectiveDate: string
  endDate?: string
  reason: string
  approvedBy: {
    id: string
    name: string
    approvedAt: string
  }
  isActive: boolean
  currency: string
}

interface SalaryBand {
  id: string
  title: string
  level: number
  department: string
  minSalary: number
  midSalary: number
  maxSalary: number
  currency: string
  lastUpdated: string
}

interface BenefitsStats {
  totalEnrollments: number
  totalBenefitCost: number
  employerContribution: number
  employeeContribution: number
  utilizationRate: number
  popularPlans: string[]
  upcomingRenewals: number
  pendingEnrollments: number
  averageBenefitValue: number
  costPerEmployee: number
}

const BenefitsManagement: React.FC = () => {
  const { profile } = useAuth()
  const theme = useTheme()
  const responsive = useResponsive()

  // State
  const [activeTab, setActiveTab] = useState(0)
  const [benefitPlans, setBenefitPlans] = useState<BenefitPlan[]>([])
  const [employeeBenefits, setEmployeeBenefits] = useState<EmployeeBenefit[]>([])
  const [compensationRecords, setCompensationRecords] = useState<CompensationRecord[]>([])
  const [salaryBands, setSalaryBands] = useState<SalaryBand[]>([])
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null)
  const [showPlanDialog, setShowPlanDialog] = useState(false)
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BenefitsStats>({
    totalEnrollments: 0,
    totalBenefitCost: 0,
    employerContribution: 0,
    employeeContribution: 0,
    utilizationRate: 0,
    popularPlans: [],
    upcomingRenewals: 0,
    pendingEnrollments: 0,
    averageBenefitValue: 0,
    costPerEmployee: 0,
  })
  const [filters, setFilters] = useState({
    category: 'all',
    type: 'all',
    status: 'all',
    search: '',
  })

  // Load real data
  useEffect(() => {
    loadBenefitsData()
  }, [])

  const loadBenefitsData = async () => {
    try {
      const [plansResult, statsData, myBenefits] = await Promise.all([
        DatabaseService.getBenefitPlans({}),
        DatabaseService.getBenefitsStats(),
        DatabaseService.getMyBenefits()
      ])

      setBenefitPlans(plansResult || [])
      if (statsData) {
        setStats(statsData as unknown as BenefitsStats)
      }
      setEmployeeBenefits(myBenefits || [])
    } catch (error) {
      console.error('Failed to load benefits data', error)
      setBenefitPlans([])
      setEmployeeBenefits([])
    } finally {
      setLoading(false)
    }
  }

  const getBenefitIcon = (category: string) => {
    switch (category) {
      case 'health': return <LocalHospital />
      case 'dental': return <MedicalServices />
      case 'vision': return <Visibility />
      case 'life': return <VerifiedUser />
      case 'disability': return <Shield />
      case 'retirement': return <Savings />
      case 'pto': return <FlightTakeoff />
      default: return <HealthAndSafety />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const BenefitPlanCard: React.FC<{ plan: BenefitPlan }> = ({ plan }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          height: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
        }}
        onClick={() => {
          setSelectedPlan(plan)
          setShowPlanDialog(true)
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {getBenefitIcon(plan.category)}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {plan.provider}
                </Typography>
                <Chip
                  label={plan.category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Stack>

            {/* Description */}
            <Typography variant="body2" color="text.secondary">
              {plan.description}
            </Typography>

            {/* Cost breakdown */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Monthly Cost
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(plan.cost.employee)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Employer
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(plan.cost.employer)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(plan.cost.total)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Coverage options */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Coverage Options
              </Typography>
              <Stack direction="row" spacing={1}>
                {plan.coverage.individual && (
                  <Chip label="Individual" size="small" variant="outlined" />
                )}
                {plan.coverage.family && (
                  <Chip label="Family" size="small" variant="outlined" />
                )}
                {plan.coverage.dependent && (
                  <Chip label="Dependent" size="small" variant="outlined" />
                )}
              </Stack>
            </Box>

            {/* Popularity and rating */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                <Typography variant="caption">
                  {plan.popularity}% enrolled
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption">
                  {plan.rating}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({plan.reviews} reviews)
                </Typography>
              </Stack>
            </Stack>

            {/* Action buttons */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{ borderRadius: 2 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowEnrollmentDialog(true)
                }}
              >
                Enroll
              </Button>
              <Button
                variant="contained"
                size="small"
                fullWidth
                sx={{ borderRadius: 2 }}
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                Details
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  )

  const CompensationHistoryTable: React.FC = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Frequency</TableCell>
            <TableCell>Effective Date</TableCell>
            <TableCell>Approved By</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {compensationRecords.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>
                <Chip
                  label={record.type}
                  size="small"
                  color={record.type === 'salary' ? 'primary' :
                    record.type === 'bonus' ? 'success' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(record.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {record.frequency}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(record.effectiveDate).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {record.approvedBy.name}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip
                  status={record.isActive ? 'active' : 'inactive'}
                  size="sm"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small">
                  <Visibility />
                </IconButton>
                <IconButton size="small">
                  <Edit />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Benefits & Compensation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage employee benefits, compensation, and salary structures
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Analytics />}>
            Analytics
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Add Benefit
          </Button>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Enrollments"
            value={stats.totalEnrollments}
            icon={<Group />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Benefit Cost"
            value={formatCurrency(stats.totalBenefitCost)}
            icon={<AttachMoney />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Utilization Rate"
            value={`${stats.utilizationRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Cost Per Employee"
            value={formatCurrency(stats.costPerEmployee)}
            icon={<Person />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Benefit Plans" />
        <Tab label="Employee Benefits" />
        <Tab label="Compensation" />
        <Tab label="Salary Bands" />
        <Tab label="Analytics" />
      </Tabs>

      {/* Benefit Plans Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search benefit plans..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    <MenuItem value="health">Health</MenuItem>
                    <MenuItem value="dental">Dental</MenuItem>
                    <MenuItem value="vision">Vision</MenuItem>
                    <MenuItem value="retirement">Retirement</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    label="Type"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="insurance">Insurance</MenuItem>
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="wellness">Wellness</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<FilterList />} size="small">
                    More Filters
                  </Button>
                  <Button variant="outlined" startIcon={<Sort />} size="small">
                    Sort
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Benefit Plans Grid */}
          <Grid container spacing={3}>
            {benefitPlans.map((plan) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={plan.id}>
                <BenefitPlanCard plan={plan} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Employee Benefits Tab */}
      {activeTab === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            <Typography variant="body2">
              Employee benefits enrollment and management features coming soon!
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Compensation Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Compensation History
          </Typography>
          <CompensationHistoryTable />
        </Box>
      )}

      {/* Salary Bands Tab */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Salary Bands
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Min Salary</TableCell>
                  <TableCell>Mid Salary</TableCell>
                  <TableCell>Max Salary</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salaryBands.map((band) => (
                  <TableRow key={band.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {band.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={`L${band.level}`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {band.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(band.minSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(band.midSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(band.maxSalary)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(band.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Analytics Tab */}
      {activeTab === 4 && (
        <Box>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Typography variant="body2">
              Advanced benefits analytics and reporting features coming soon!
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Benefit Plan Detail Dialog */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedPlan && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  >
                    {getBenefitIcon(selectedPlan.category)}
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {selectedPlan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPlan.provider}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => setShowPlanDialog(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                <Typography variant="body1">
                  {selectedPlan.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedPlan.category}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedPlan.type}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Provider
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedPlan.provider}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Enrollment Rate
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedPlan.popularity}%
                    </Typography>
                  </Grid>
                </Grid>

                {selectedPlan.details.coverage && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Coverage Details
                    </Typography>
                    <Stack spacing={0.5}>
                      {selectedPlan.details.coverage.map((item, index) => (
                        <Stack key={index} direction="row" alignItems="center" spacing={1}>
                          <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />
                          <Typography variant="body2">
                            {item}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPlanDialog(false)}>
                Close
              </Button>
              <Button variant="outlined" startIcon={<Share />}>
                Share
              </Button>
              <Button variant="contained" startIcon={<Assignment />}>
                Enroll
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="Benefits Actions"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Add />}
          tooltipTitle="Add Benefit Plan"
        />
        <SpeedDialAction
          icon={<Upload />}
          tooltipTitle="Import Data"
        />
        <SpeedDialAction
          icon={<Analytics />}
          tooltipTitle="View Analytics"
          onClick={() => setActiveTab(4)}
        />
      </SpeedDial>
    </Box>
  )
}

export default BenefitsManagement
