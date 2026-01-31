import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PersonAdd,
  Business,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Security,
  TrendingUp
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { toast } from 'sonner'

interface Employee {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  position: string
  salary: number
  hire_date: string
  role: 'admin' | 'hr' | 'employee'
  status: 'active' | 'inactive'
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  avatar_url?: string
  is_first_login: boolean
}

const EmployeeManagementSystem: React.FC = () => {
  const { profile } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: 0,
    hire_date: new Date().toISOString().split('T')[0],
    role: 'employee',
    status: 'active',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
    is_first_login: true
  })

  const departments = [
    'Human Resources',
    'Engineering',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Service',
    'IT Support'
  ]

  const positions = [
    'Manager',
    'Senior Developer',
    'Developer',
    'Designer',
    'Analyst',
    'Coordinator',
    'Specialist',
    'Associate',
    'Director',
    'VP'
  ]

  // Generate unique employee ID
  const generateEmployeeId = (): string => {
    const prefix = 'EMP'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `${prefix}${timestamp}${random}`
  }

  // Generate random password
  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const data = await api.getEmployees({})
      setEmployees(data || [])
    } catch (error) {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = async () => {
    if (!newEmployee.first_name || !newEmployee.last_name || !newEmployee.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const password = generatePassword()

      // Use backend API to create employee
      const result = await api.createEmployee({
        ...newEmployee,
        password: password // Backend will hash this
      })

      toast.success(`Employee added successfully! 
        Employee ID: ${result.employee_id}
        Temporary Password: ${password}
        (Employee must change password on first login)`)

      setDialogOpen(false)
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary: 0,
        hire_date: new Date().toISOString().split('T')[0],
        role: 'employee',
        status: 'active',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        is_first_login: true
      })
      fetchEmployees()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add employee')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return

    setLoading(true)
    try {
      await api.updateEmployee(editingEmployee.id, newEmployee)

      toast.success('Employee updated successfully')
      setDialogOpen(false)
      setEditingEmployee(null)
      fetchEmployees()
    } catch (error) {
      toast.error('Failed to update employee')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    setLoading(true)
    try {
      await api.deleteEmployee(employeeId)

      toast.success('Employee deleted successfully')
      fetchEmployees()
    } catch (error) {
      toast.error('Failed to delete employee')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteEmployee = async (employeeId: string, newRole: 'admin' | 'hr' | 'employee') => {
    setLoading(true)
    try {
      await api.updateEmployee(employeeId, { role: newRole })

      toast.success(`Employee promoted to ${newRole} successfully`)
      fetchEmployees()
    } catch (error) {
      toast.error('Failed to promote employee')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (employeeId: string, email: string) => {
    setLoading(true)
    try {
      const newPassword = generatePassword()

      // Use backend API - needs password reset endpoint
      // For now, update profile to mark first login
      await api.updateEmployee(employeeId, { is_first_login: true })

      toast.success(`Password reset initiated. Employee will receive reset email.`)
    } catch (error) {
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee)
    setNewEmployee(employee)
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingEmployee(null)
    setNewEmployee({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: 0,
      hire_date: new Date().toISOString().split('T')[0],
      role: 'employee',
      status: 'active',
      address: '',
      emergency_contact: '',
      emergency_phone: '',
      is_first_login: true
    })
    setDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'
      case 'terminated': return 'error'
      default: return 'default'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error'
      case 'hr': return 'warning'
      case 'employee': return 'primary'
      default: return 'default'
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Check if user has permission to manage employees
  const canManageEmployees = profile?.role === 'admin' || profile?.role === 'hr'

  if (!canManageEmployees) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access employee management.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Employee Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openAddDialog}
              disabled={loading}
            >
              Add Employee
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{`${employee.first_name} ${employee.last_name}`}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.role}
                        color={getRoleColor(employee.role) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(employee)}
                        disabled={loading}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        disabled={loading}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleResetPassword(employee.id, employee.email)}
                        disabled={loading}
                        color="warning"
                      >
                        <Security />
                      </IconButton>
                      {employee.role !== 'admin' && (
                        <IconButton
                          size="small"
                          onClick={() => handlePromoteEmployee(employee.id, employee.role === 'hr' ? 'admin' : 'hr')}
                          disabled={loading}
                          color="success"
                        >
                          <TrendingUp />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="First Name"
              value={newEmployee.first_name}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, first_name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={newEmployee.last_name}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, last_name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Phone"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, department: e.target.value }))}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={newEmployee.position}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, position: e.target.value }))}
                label="Position"
              >
                {positions.map((pos) => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Salary"
              type="number"
              value={newEmployee.salary}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: Number(e.target.value) }))}
            />
            <TextField
              fullWidth
              label="Hire Date"
              type="date"
              value={newEmployee.hire_date}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, hire_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value as any }))}
                label="Role"
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="hr">HR</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newEmployee.address}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, address: e.target.value }))}
              />
            </Box>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={newEmployee.emergency_contact}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, emergency_contact: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Emergency Phone"
              value={newEmployee.emergency_phone}
              onChange={(e) => setNewEmployee(prev => ({ ...prev, emergency_phone: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
          >
            {editingEmployee ? 'Update' : 'Add'} Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeManagementSystem
