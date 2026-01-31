# HRM System Deployment Guide

## Prerequisites

- PostgreSQL database access
- Node.js backend server access
- Ability to restart backend server
- Admin credentials for testing

---

## Step 1: Apply Database Schema Enhancements

### 1.1 Backup Current Database

```bash
# Create backup before making changes
pg_dump -U postgres arise_hrm > arise_hrm_backup_$(date +%Y%m%d).sql
```

### 1.2 Apply Schema Enhancements

```bash
# Navigate to backend directory
cd d:/New folder/arise_hrm/Arise/backend

# Apply the schema enhancements
psql -U postgres -d arise_hrm -f schema-enhancements.sql
```

### 1.3 Verify Tables Created

```sql
-- Connect to database
psql -U postgres -d arise_hrm

-- Check new tables
\dt payroll_records
\dt system_settings
\dt performance_goals
\dt performance_reviews
\dt projects

-- Check triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN ('attendance_hours_trigger', 'leave_balance_trigger', 'check_leave_overlap');

-- Check system settings
SELECT * FROM system_settings;
```

Expected output: All tables should exist, triggers should be listed, system settings should have 7 default entries.

---

## Step 2: Integrate Backend Routes

### 2.1 Add Supplementary Routes to index.js

Open `backend/index.js` and add the routes from `backend/routes-supplement.js`:

**Option A: Manual Integration**
- Copy the leave balance routes (around line 470, after existing leave-balances route)
- Copy the payroll calculation routes (around line 950, after existing payroll routes)
- Copy the helper functions to the top of the file

**Option B: Module Import** (Recommended)
Add at the top of `index.js`:
```javascript
// Load supplementary routes
require('./routes-supplement')(app, pool, authenticateToken);
```

Then wrap the routes in `routes-supplement.js`:
```javascript
module.exports = (app, pool, authenticateToken) => {
    // ... all the routes here
};
```

### 2.2 Restart Backend Server

```bash
# Stop current server (Ctrl+C if running in terminal)

# Restart server
cd d:/New folder/arise_hrm/Arise/backend
node index.js

# Or if using nodemon
nodemon index.js
```

### 2.3 Verify New Endpoints

```bash
# Test attendance summary (replace with valid token and employee ID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/attendance/summary?startDate=2025-01-01&endDate=2025-01-31"

# Test system settings
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/settings/system"
```

---

## Step 3: Frontend Deployment

### 3.1 Verify API Client Updated

The file `frontend/src/lib/api.ts` has already been updated with new methods. No additional changes needed.

### 3.2 Rebuild Frontend

```bash
cd d:/New folder/arise_hrm/Arise/frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Or start dev server
npm run dev
```

---

## Step 4: Initialize Data

### 4.1 Initialize Leave Balances for Existing Employees

```bash
# Using curl (replace with admin token)
curl -X POST http://localhost:3001/api/leave-balances/initialize \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "EMPLOYEE_UUID"}'
```

Or use SQL directly:
```sql
-- Initialize for all active employees
DO $$
DECLARE
    emp RECORD;
BEGIN
    FOR emp IN SELECT id FROM user_profiles WHERE status = 'active'
    LOOP
        PERFORM initialize_employee_leave_balances(emp.id);
    END LOOP;
END $$;
```

### 4.2 Verify Leave Balances Created

```sql
SELECT 
    u.first_name,
    u.last_name,
    lt.name as leave_type,
    elb.current_balance,
    elb.year
FROM employee_leave_balances elb
JOIN user_profiles u ON elb.employee_id = u.id
JOIN leave_types lt ON elb.leave_type_id = lt.id
ORDER BY u.last_name, lt.name;
```

---

## Step 5: Testing & Validation

### 5.1 Test Attendance Hours Calculation

1. Clock in as an employee
2. Clock out after a few hours
3. Verify `total_hours` is automatically calculated
4. Check if overtime is calculated (if > 8 hours)

```sql
-- Check recent attendance records
SELECT 
    employee_id,
    date,
    check_in,
    check_out,
    total_hours,
    overtime_hours,
    status
FROM attendance_records
WHERE date = CURRENT_DATE
ORDER BY check_in DESC;
```

### 5.2 Test Leave Balance Updates

1. Submit a leave request as an employee
2. Approve it as admin/manager
3. Check that balance is deducted

```sql
-- Check leave balance before and after
SELECT * FROM employee_leave_balances 
WHERE employee_id = 'YOUR_EMPLOYEE_UUID';

-- Check leave request
SELECT * FROM leave_requests 
WHERE employee_id = 'YOUR_EMPLOYEE_UUID' 
ORDER BY created_at DESC LIMIT 1;
```

### 5.3 Test Overlapping Leave Prevention

1. Submit a leave request for dates Jan 10-15
2. Try to submit another request for Jan 12-17
3. Should receive error: "Overlapping leave request exists"

### 5.4 Test Payroll Calculation

```bash
# Calculate payroll for January 2025
curl -X POST http://localhost:3001/api/payroll/calculate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2025-01-01",
    "period_end": "2025-01-31"
  }'
```

Verify:
- Attendance data is included
- Leave days are counted
- Tax and allowances are applied
- Net salary is calculated correctly

---

## Step 6: Configure System Settings (Optional)

Adjust system settings as per your organization's policies:

```sql
-- Update tax rate to 20%
UPDATE system_settings 
SET setting_value = '0.20' 
WHERE setting_key = 'payroll_tax_rate';

-- Update allowance rate to 15%
UPDATE system_settings 
SET setting_value = '0.15' 
WHERE setting_key = 'payroll_allowance_rate';

-- Update late arrival threshold to 10:00 AM
UPDATE system_settings 
SET setting_value = '10:00:00' 
WHERE setting_key = 'late_arrival_threshold';

-- Update leave accrual rate (e.g., 2 days per month = 24 days/year)
UPDATE system_settings 
SET setting_value = '2.0' 
WHERE setting_key = 'leave_accrual_rate';
```

---

## Step 7: Setup Automated Jobs (Optional)

### 7.1 Monthly Leave Accrual Cron Job

Create a cron job to run monthly leave accrual:

```bash
# Edit crontab
crontab -e

# Add this line to run on 1st of every month at 1 AM
0 1 1 * * curl -X POST http://localhost:3001/api/leave-balances/accrue \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Or use a Node.js scheduler like `node-cron`:

```javascript
const cron = require('node-cron');

// Run on 1st of every month at 1 AM
cron.schedule('0 1 1 * *', async () => {
    console.log('Running monthly leave accrual...');
    // Call accrual endpoint
});
```

---

## Rollback Procedure

If issues occur, rollback using the backup:

```bash
# Drop current database
dropdb -U postgres arise_hrm

# Restore from backup
createdb -U postgres arise_hrm
psql -U postgres arise_hrm < arise_hrm_backup_YYYYMMDD.sql
```

---

## Troubleshooting

### Issue: Triggers not firing

**Solution**: Check trigger status
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%attendance%';
```

If missing, re-run the trigger creation section from `schema-enhancements.sql`.

### Issue: Leave balance not updating

**Solution**: Check trigger and balance record exists
```sql
-- Check if balance record exists
SELECT * FROM employee_leave_balances 
WHERE employee_id = 'UUID' AND leave_type_id = 'UUID';

-- If missing, initialize
SELECT initialize_employee_leave_balances('EMPLOYEE_UUID');
```

### Issue: Payroll calculation returns 0 hours

**Solution**: Verify attendance records exist
```sql
SELECT * FROM attendance_records 
WHERE employee_id = 'EMPLOYEE_ID' 
AND date BETWEEN 'START_DATE' AND 'END_DATE';
```

### Issue: API endpoints return 404

**Solution**: Verify routes are loaded
- Check `backend/index.js` includes the new routes
- Restart backend server
- Check server logs for errors

---

## Post-Deployment Checklist

- [ ] Database backup created
- [ ] Schema enhancements applied successfully
- [ ] All triggers created and active
- [ ] System settings populated
- [ ] Backend routes integrated
- [ ] Backend server restarted
- [ ] Frontend rebuilt/redeployed
- [ ] Leave balances initialized for all employees
- [ ] Attendance hours calculation tested
- [ ] Leave balance update tested
- [ ] Overlapping leave prevention tested
- [ ] Payroll calculation tested
- [ ] System settings configured
- [ ] Automated jobs setup (if applicable)
- [ ] Team trained on new features

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Run leave accrual (if not automated)
2. **Monthly**: Process payroll for previous month
3. **Quarterly**: Review and adjust system settings
4. **Annually**: Review leave carryover policies

### Monitoring

Monitor these metrics:
- Leave balance accuracy
- Attendance hour calculations
- Payroll calculation errors
- Late arrival trends

### Logs to Check

- Backend server logs: `backend/logs/`
- Database logs: PostgreSQL logs
- Frontend errors: Browser console

---

## Contact & Resources

- **Implementation Plan**: [implementation_plan.md](file:///C:/Users/adis5/.gemini/antigravity/brain/823bb371-3ea0-44e7-99db-ff6812f43a2a/implementation_plan.md)
- **Walkthrough**: [walkthrough.md](file:///C:/Users/adis5/.gemini/antigravity/brain/823bb371-3ea0-44e7-99db-ff6812f43a2a/walkthrough.md)
- **Task Checklist**: [task.md](file:///C:/Users/adis5/.gemini/antigravity/brain/823bb371-3ea0-44e7-99db-ff6812f43a2a/task.md)
