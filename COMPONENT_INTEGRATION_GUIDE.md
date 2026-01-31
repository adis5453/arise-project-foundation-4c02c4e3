# Frontend Component Integration Guide

This guide shows how to integrate the new components into your existing HRM application.

## New Components Created

### 1. Attendance Components

#### AttendanceMonthlySummary.tsx
Displays monthly attendance statistics including total days, present days, overtime, etc.

**Usage:**
```tsx
import { AttendanceMonthlySummary } from './components/attendance/AttendanceMonthlySummary';

// In your component
<AttendanceMonthlySummary 
  employeeId={user.id}
  startDate="2025-01-01"
  endDate="2025-01-31"
/>
```

#### LateArrivalsTracker.tsx
Admin/HR component to track and monitor late arrivals.

**Usage:**
```tsx
import { LateArrivalsTracker } from './components/attendance/LateArrivalsTracker';

// In admin dashboard
{user.role === 'admin' && <LateArrivalsTracker />}
```

### 2. Payroll Components

#### PayrollCalculationDialog.tsx
Dialog for calculating payroll for a specific period.

**Usage:**
```tsx
import { PayrollCalculationDialog } from './components/payroll/PayrollCalculationDialog';

const [calcDialogOpen, setCalcDialogOpen] = useState(false);

// Trigger button
<Button onClick={() => setCalcDialogOpen(true)}>Calculate Payroll</Button>

// Dialog
<PayrollCalculationDialog 
  open={calcDialogOpen}
  onClose={() => setCalcDialogOpen(false)}
/>
```

#### SalaryComponents.tsx
Shows detailed salary breakdown for an employee.

**Usage:**
```tsx
import { SalaryComponents } from './components/payroll/SalaryComponents';

<SalaryComponents employeeId={selectedEmployee.id} />
```

---

## Integration Steps

### Step 1: Add to Attendance.tsx

Add the monthly summary to the existing Attendance component:

```tsx
// In Attendance.tsx, add import
import { AttendanceMonthlySummary } from './AttendanceMonthlySummary';
import { LateArrivalsTracker } from './LateArrivalsTracker';

// Add a new tab or section
<Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
  <Tab label="Overview" />
  <Tab label="History" />
  <Tab label="Monthly Summary" /> {/* NEW */}
  {user.role === 'admin' && <Tab label="Late Arrivals" />} {/* NEW */}
</Tabs>

// In tab panels
{selectedTab === 2 && (
  <AttendanceMonthlySummary 
    employeeId={user.id}
    startDate={startOfMonth(new Date())}
    endDate={endOfMonth(new Date())}
  />
)}

{selectedTab === 3 && user.role === 'admin' && (
  <LateArrivalsTracker />
)}
```

### Step 2: Update PayrollDashboard.tsx

Replace mock payroll calculation with real API:

```tsx
// In PayrollDashboard.tsx, add imports
import { PayrollCalculationDialog } from './PayrollCalculationDialog';
import { SalaryComponents } from './SalaryComponents';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// Replace mock data query with real API
const { data: payrollRecords, isLoading } = useQuery({
  queryKey: ['payroll-records', selectedPeriod],
  queryFn: () => api.getPayrollRecords({
    period_start: selectedPeriod.start,
    period_end: selectedPeriod.end
  })
});

// Add calculation dialog state
const [calcDialogOpen, setCalcDialogOpen] = useState(false);

// Add button to trigger calculation
<Button 
  variant="contained" 
  onClick={() => setCalcDialogOpen(true)}
  startIcon={<Calculate />}
>
  Calculate Payroll
</Button>

// Add dialog
<PayrollCalculationDialog 
  open={calcDialogOpen}
  onClose={() => setCalcDialogOpen(false)}
/>

// Show salary breakdown when viewing employee details
{selectedEmployee && (
  <SalaryComponents employeeId={selectedEmployee.id} />
)}
```

### Step 3: Update Leave Management (Optional)

Add leave balance initialization for new employees:

```tsx
// In LeaveManagement.tsx or admin panel
import api from '../../lib/api';

const handleInitializeBalances = async (employeeId: string) => {
  try {
    await api.initializeLeaveBalances(employeeId);
    toast.success('Leave balances initialized');
    queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
  } catch (error) {
    toast.error('Failed to initialize balances');
  }
};

// Add button in employee creation/onboarding flow
<Button onClick={() => handleInitializeBalances(newEmployee.id)}>
  Initialize Leave Balances
</Button>
```

---

## Database Setup Required

Before using these components, ensure the database schema enhancements are applied:

```bash
# Apply schema enhancements
psql -U postgres -d arise_hrm -f backend/schema-enhancements.sql

# Verify tables created
psql -U postgres -d arise_hrm -c "\dt payroll_records"
psql -U postgres -d arise_hrm -c "\dt system_settings"
```

---

## Backend Routes Integration

Ensure the supplementary routes are added to `backend/index.js`:

1. Copy routes from `backend/routes-supplement.js`
2. Add after existing routes in appropriate sections
3. Restart backend server

---

## Testing Checklist

- [ ] Attendance monthly summary displays correct data
- [ ] Late arrivals tracker shows employees late after 9:30 AM
- [ ] Payroll calculation creates records in database
- [ ] Salary components show correct breakdown
- [ ] Leave balance initialization works for new employees
- [ ] All components handle loading and error states
- [ ] Role-based access control works (admin-only features)

---

## Next Steps

1. Apply database schema enhancements
2. Integrate backend routes
3. Add new components to existing pages
4. Test with real data
5. Deploy to production

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](file:///d:/New%20folder/arise_hrm/Arise/DEPLOYMENT_GUIDE.md)
