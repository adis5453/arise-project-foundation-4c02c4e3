import api from '../lib/api'
import { Database } from '../types/database'
import { toast } from 'sonner'

type Tables = Database['public']['Tables']

export class DatabaseService {

  // User Profiles
  static async getUserProfiles(filters?: {
    isActive?: boolean
    departmentId?: string
    employmentStatus?: string[]
    search?: string
    limit?: number
    offset?: number
  }) {
    // Map filters to API params
    const apiFilters: any = {}
    if (filters?.search) apiFilters.search = filters.search
    if (filters?.departmentId) apiFilters.departmentId = filters.departmentId
    if (filters?.employmentStatus?.length) apiFilters.status = filters.employmentStatus[0] // API currently supports single status

    try {
      const data = await api.getEmployees(apiFilters);

      // Handle paginated response ({ items: [], total: ... }) or flat array
      if (data && data.items && Array.isArray(data.items)) {
        return data.items;
      }

      // Backend returns array, frontend expects array. 
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Failed to fetch employees', error);
      return [];
    }
  }

  static async getUserProfile(employeeId: string) {
    try {
      const data = await api.getEmployee(employeeId);
      return data;
    } catch (error) {
      console.error('Failed to fetch employee', error);
      return null;
    }
  }

  static async updateUserProfile(employeeId: string, updates: Partial<Tables['user_profiles']['Update']>) {
    try {
      const data = await api.updateEmployee(employeeId, updates);
      return data;
    } catch (error) {
      console.error('Failed to update employee', error);
      throw error;
    }
  }

  static async createUserProfile(profile: Tables['user_profiles']['Insert']) {
    try {
      const data = await api.createEmployee(profile);
      return data;
    } catch (error) {
      console.error('Failed to create employee', error);
      throw error;
    }
  }

  // Departments
  static async getDepartments(includeInactive = false) {
    try {
      const data = await api.getDepartments();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch departments', error);
      return [];
    }
  }

  static async getDepartmentStats() {
    return []
  }

  static async createDepartment(data: any) {
    try {
      const res = await api.createDepartment(data);
      return res;
    } catch (error) {
      console.error('Failed to create department', error);
      throw error;
    }
  }

  static async updateDepartment(id: string, data: any) {
    try {
      const res = await api.request(`/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res;
    } catch (error) {
      console.error('Failed to update department', error);
      throw error;
    }
  }

  static async deleteDepartment(id: string) {
    try {
      const res = await api.request(`/departments/${id}`, {
        method: 'DELETE'
      });
      return res;
    } catch (error) {
      console.error('Failed to delete department', error);
      throw error;
    }
  }

  // Roles
  static async getRoles() {
    try {
      const data = await api.getRoles();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch roles', error);
      return [];
    }
  }

  // Positions
  static async getPositions(departmentId?: string) {
    try {
      const data = await api.getPositions(departmentId);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch positions', error);
      return [];
    }
  }

  static async createPosition(data: any) {
    try {
      const res = await api.createPosition(data);
      return res;
    } catch (error) {
      console.error('Failed to create position', error);
      throw error;
    }
  }

  static async updatePosition(id: string, data: any) {
    try {
      const res = await api.request(`/departments/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res;
    } catch (error) {
      console.error('Failed to update position', error);
      throw error;
    }
  }

  static async deletePosition(id: string) {
    try {
      const res = await api.request(`/departments/positions/${id}`, {
        method: 'DELETE'
      });
      return res;
    } catch (error) {
      console.error('Failed to delete position', error);
      throw error;
    }
  }

  static async deleteTeam(id: string) {
    try {
      const res = await api.request(`/departments/teams/${id}`, {
        method: 'DELETE'
      });
      return res;
    } catch (error) {
      console.error('Failed to delete team', error);
      throw error;
    }
  }

  static async getProjects() {
    return api.getProjects();
  }

  static async createProject(data: any) {
    return api.createProject(data);
  }

  static async updateProject(id: string, data: any) {
    return api.updateProject(id, data);
  }

  static async deleteProject(id: string) {
    return api.deleteProject(id);
  }

  // Attendance Records
  static async getAttendanceRecords(filters?: {
    employeeId?: string
    startDate?: string
    endDate?: string
    status?: string[]
    limit?: number
  }) {
    try {
      const apiFilters: any = {}
      if (filters?.employeeId) apiFilters.employeeId = filters.employeeId
      if (filters?.startDate) apiFilters.startDate = filters.startDate
      if (filters?.endDate) apiFilters.endDate = filters.endDate
      if (filters?.status?.length) apiFilters.status = filters.status[0]

      const data = await api.getAttendance(apiFilters);

      // Map backend columns to frontend model
      return (data || []).map((record: any) => ({
        ...record,
        clock_in_time: record.check_in,
        clock_out_time: record.check_out,
        location_data: record.location_check_in,
        notes: record.notes
      }));
    } catch (error) {
      console.error('Failed to fetch attendance', error);
      return [];
    }
  }

  static async createAttendanceRecord(record: { latitude?: number; longitude?: number; clock_in_type?: string; notes?: string }) {
    try {
      const data = await api.clockIn(record);
      return data;
    } catch (error) {
      console.error('Failed to create attendance', error);
      throw error;
    }
  }

  static async clockOut(data: { latitude?: number; longitude?: number; notes?: string }) {
    try {
      const result = await api.clockOut(data);
      return result;
    } catch (error) {
      console.error('Failed to clock out', error);
      throw error;
    }
  }

  static async updateAttendanceRecord(id: string, updates: Record<string, any>) {
    try {
      const res = await api.request(`/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return res;
    } catch (error) {
      console.error('Failed to update attendance record', error);
      throw error;
    }
  }

  // Leave Requests
  static async getLeaveRequests(filters?: {
    employeeId?: string
    status?: string[]
    startDate?: string
    endDate?: string
    approverId?: string
    limit?: number
    leaveTypeId?: string
    isEmergency?: boolean
    search?: string
  }) {
    try {
      const apiFilters: any = {}
      if (filters?.employeeId) apiFilters.employeeId = filters.employeeId
      if (filters?.startDate) apiFilters.startDate = filters.startDate
      if (filters?.endDate) apiFilters.endDate = filters.endDate
      if (filters?.status?.length) apiFilters.status = filters.status[0]
      if (filters?.search) apiFilters.search = filters.search
      if (filters?.leaveTypeId) apiFilters.leaveTypeId = filters.leaveTypeId
      if (filters?.isEmergency !== undefined) apiFilters.isEmergency = filters.isEmergency

      const data = await api.getLeaves(apiFilters);
      // Handle both paginated response {items: [...]} and array response
      return Array.isArray(data) ? data : (data?.items || []);
    } catch (error) {
      console.error('Failed to fetch leaves', error);
      return [];
    }
  }

  static async createLeaveRequest(request: Tables['leave_requests']['Insert']) {
    try {
      const data = await api.createLeaveRequest(request);
      return data;
    } catch (error) {
      console.error('Failed to create leave', error);
      throw error;
    }
  }

  static async updateLeaveRequestStatus(
    id: string,
    status: string,
    approverId?: string,
    comments?: string
  ) {
    try {
      const data = await api.updateLeaveStatus(id, { status, manager_comments: comments });
      return data;
    } catch (error) {
      console.error('Failed to update leave status', error);
      throw error;
    }
  }

  static async updateLeaveRequest(id: string, data: any) {
    try {
      const res = await api.updateLeaveRequest(id, data);
      return res;
    } catch (error) {
      console.error('Failed to update leave request', error);
      throw error;
    }
  }

  static async deleteLeaveRequest(id: string) {
    try {
      await api.deleteLeaveRequest(id);
      return true;
    } catch (error) {
      console.error('Failed to delete leave request', error);
      throw error;
    }
  }

  static async cancelLeaveRequest(id: string, reason: string) {
    try {
      const res = await api.request(`/leaves/requests/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason })
      });
      return res;
    } catch (error) {
      console.error('Failed to cancel leave request', error);
      throw error;
    }
  }

  // Leave Types
  static async getLeaveTypes() {
    try {
      const data = await api.getLeaveTypes();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch leave types', error);
      return [];
    }
  }

  static async createLeaveType(data: any) {
    try {
      const res = await api.createLeaveType(data);
      return res;
    } catch (error) {
      console.error('Failed to create leave type', error);
      throw error;
    }
  }

  static async updateLeaveType(id: string, data: any) {
    try {
      const res = await api.updateLeaveType(id, data);
      return res;
    } catch (error) {
      console.error('Failed to update leave type', error);
      throw error;
    }
  }

  static async deleteLeaveType(id: string) {
    try {
      await api.deleteLeaveType(id);
      return true;
    } catch (error) {
      console.error('Failed to delete leave type', error);
      throw error;
    }
  }

  static async getLeaveBalances(employeeId?: string) {
    try {
      const data = await api.getLeaveBalances(employeeId);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch leave balances', error);
      return [];
    }
  }

  // Teams
  static async getTeams(departmentId?: string) {
    try {
      const query = departmentId ? `?departmentId=${departmentId}` : '';
      const data = await api.request(`/teams${query}`);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch teams', error);
      return [];
    }
  }

  static async createTeam(data: any) {
    try {
      const res = await api.request('/teams', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res;
    } catch (error) {
      console.error('Failed to create team', error);
      throw error;
    }
  }

  static async updateTeam(id: string, data: any) {
    try {
      const res = await api.request(`/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res;
    } catch (error) {
      console.error('Failed to update team', error);
      throw error;
    }
  }

  // Count operations
  static async getEmployeeCount(): Promise<number> {
    const emps = await this.getUserProfiles();
    return emps.length;
  }

  static async getActiveEmployeeCount(): Promise<number> {
    const emps = await this.getUserProfiles({ isActive: true });
    return emps.length;
  }

  static async getDepartmentCount(): Promise<number> {
    const depts = await this.getDepartments();
    return depts.length;
  }



  // Analytics
  static async getDashboardMetrics(employeeId?: string, dateRange?: { start: string; end: string }) {
    const totalEmployees = await this.getEmployeeCount();
    const activeEmployees = await this.getActiveEmployeeCount();
    const depts = await this.getDepartmentCount();

    const today = new Date().toISOString().split('T')[0];

    // Fetch today's attendance
    const attendanceToday = await this.getAttendanceRecords({
      startDate: today,
      endDate: today
    });

    // Fetch approved leaves overlapping today
    const leavesToday = await this.getLeaveRequests({
      startDate: today,
      endDate: today,
      status: ['approved']
    });

    // Fetch pending leaves
    const pendingLeaves = await this.getLeaveRequests({
      status: ['pending']
    });

    const presentToday = attendanceToday.length;
    const lateToday = attendanceToday.filter((rec: any) => {
      // Assuming check_in is a timestamp string
      if (!rec.check_in) return false;
      const checkInTime = new Date(rec.check_in);
      return checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30);
    }).length;

    const avgAttendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;

    return {
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      onLeaveToday: leavesToday.length,
      pendingLeaveRequests: pendingLeaves.length,
      totalDepartments: depts,
      avgAttendanceRate,
      lastUpdated: new Date().toISOString()
    };
  }

  // Search
  static async globalSearch(query: string, filters?: {
    type?: 'employees' | 'departments' | 'teams' | 'all'
    limit?: number
  }) {
    const employees = await this.getUserProfiles({ search: query });
    return {
      employees: employees,
      departments: [],
      teams: []
    }
  }

  // Bulk operations
  static async bulkUpdateEmployees(updates: Array<{ employee_id: string; data: Partial<Tables['user_profiles']['Update']> }>) {
    const results = [];
    let successful = 0;
    let failed = 0;
    for (const update of updates) {
      try {
        const res = await this.updateUserProfile(update.employee_id, update.data);
        results.push({ status: 'fulfilled', value: res });
        successful++;
      } catch (e) {
        results.push({ status: 'rejected', reason: e });
        failed++;
      }
    }
    return { successful, failed, results };
  }

  // Validation
  static async validateEmployeeId(employeeId: string): Promise<boolean> {
    const emp = await this.getUserProfile(employeeId);
    return !!emp;
  }

  static async validateEmail(email: string, excludeEmployeeId?: string): Promise<boolean> {
    return true;
  }

  // Team Hierarchy
  static async getTeamMembers(teamId: string) {
    try {
      const data = await api.request(`/teams/${teamId}/members`);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch team members', error);
      return [];
    }
  }

  static async getDepartmentHierarchy(departmentId: string) { return [] }
  static async getTeamLeaders() { return [] }
  static async assignTeamLeader(teamMemberIds: string[], teamLeaderId: string) { return null }
  static async getTeamStructure(employeeId?: string) { return { leaders: [], departments: {}, teams: {} } }
  // Payroll Settings
  static async getPayrollSettings() {
    try {
      const data = await api.request('/payroll/settings');
      return data;
    } catch (error) {
      console.error('Failed to fetch payroll settings', error);
      throw error;
    }
  }

  static async updatePayrollSettings(settings: { tax_rate: number; allowance_rate: number }) {
    try {
      const data = await api.request('/payroll/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      return data;
    } catch (error) {
      console.error('Failed to update payroll settings', error);
      throw error;
    }
  }

  static async getTeamMetrics(teamLeaderId: string) {
    try {
      const members = await this.getManageableTeamMembers(teamLeaderId);
      return {
        teamSize: members.length,
        presentToday: 0, // Could fetch attendance for them
        pendingLeaveRequests: 0,
        avgWeeklyHours: 40,
        teamMembers: members,
        attendanceData: [],
        leaveRequests: []
      };
    } catch (e) {
      return {
        teamSize: 0,
        presentToday: 0,
        pendingLeaveRequests: 0,
        avgWeeklyHours: 0,
        teamMembers: [],
        attendanceData: [],
        leaveRequests: []
      };
    }
  }

  static async getManageableTeamMembers(currentEmployeeId: string) {
    try {
      const data = await api.request('/teams/my-team/members');
      return data || [];
    } catch (error) {
      console.error('Failed to fetch my team', error);
      return [];
    }
  }

  // Hiring Management
  static async getJobPostings() {
    try {
      const data = await api.getJobPostings();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch job postings', error);
      return [];
    }
  }

  static async createJobPosting(data: any) {
    try {
      const res = await api.createJobPosting(data);
      return res;
    } catch (error) {
      console.error('Failed to create job posting', error);
      throw error;
    }
  }

  static async updateJobPosting(id: string, data: any) {
    try {
      const res = await api.updateJobPosting(id, data);
      return res;
    } catch (error) {
      console.error('Failed to update job posting', error);
      throw error;
    }
  }

  static async deleteJobPosting(id: string) {
    try {
      await api.deleteJobPosting(id);
      return true;
    } catch (error) {
      console.error('Failed to delete job posting', error);
      throw error;
    }
  }

  static async getJobApplications() {
    try {
      const data = await api.getJobApplications();
      return data || [];
    } catch (error) {
      console.error('Failed to fetch job applications', error);
      return [];
    }
  }

  static async createJobApplication(data: any) {
    try {
      const res = await api.createJobApplication(data);
      return res;
    } catch (error) {
      console.error('Failed to create job application', error);
      throw error;
    }
  }

  static async updateJobApplication(id: string, data: any) {
    try {
      const res = await api.updateJobApplication(id, data);
      return res;
    } catch (error) {
      console.error('Failed to update job application', error);
      throw error;
    }
  }

  static async deleteJobApplication(id: string) {
    try {
      await api.deleteJobApplication(id);
      return true;
    } catch (error) {
      console.error('Failed to delete job application', error);
      throw error;
    }
  }

  // Payroll
  static async getPayrollRecords(filters?: {
    employeeId?: string
    status?: string
    periodStart?: string
    periodEnd?: string
  }) {
    try {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append('employee_id', filters.employeeId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.periodStart) params.append('period_start', filters.periodStart)
      if (filters?.periodEnd) params.append('period_end', filters.periodEnd)

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/payroll/records${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch payroll records', error)
      return []
    }
  }

  static async getMyPayslips() {
    try {
      const data = await api.request('/payroll/my-payslips')
      return data || []
    } catch (error) {
      console.error('Failed to fetch payslips', error)
      return []
    }
  }

  static async getPayrollRecord(id: string) {
    try {
      const data = await api.request(`/payroll/records/${id}`)
      return data
    } catch (error) {
      console.error('Failed to fetch payroll record', error)
      throw error
    }
  }

  static async generatePayroll(data: { period_start: string; period_end: string; employee_ids?: string[] }) {
    try {
      const res = await api.request('/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to generate payroll', error)
      throw error
    }
  }

  static async updatePayrollRecord(id: string, updates: any) {
    try {
      const res = await api.request(`/payroll/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update payroll record', error)
      throw error
    }
  }

  static async getPayrollStats() {
    try {
      const data = await api.request('/payroll/stats')
      return data
    } catch (error) {
      console.error('Failed to fetch payroll stats', error)
      throw error
    }
  }

  static async getSalaryComponents() {
    try {
      const data = await api.request('/payroll/components')
      return data || []
    } catch (error) {
      console.error('Failed to fetch salary components', error)
      return []
    }
  }

  // Performance
  // Performance
  static async getPerformanceReviews(filters?: {
    employeeId?: string
    status?: string
    year?: number
  }) {
    try {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append('employee_id', filters.employeeId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.year) params.append('year', filters.year.toString())

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/performance/reviews${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch performance reviews', error)
      return []
    }
  }

  static async getPerformanceReview(id: string) {
    try {
      const data = await api.request(`/performance/reviews/${id}`)
      return data
    } catch (error) {
      console.error('Failed to fetch performance review', error)
      throw error
    }
  }

  static async createPerformanceReview(data: any) {
    try {
      const res = await api.request('/performance/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to create performance review', error)
      throw error
    }
  }

  static async updatePerformanceReview(id: string, updates: any) {
    try {
      const res = await api.request(`/performance/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update performance review', error)
      throw error
    }
  }

  static async getPerformanceGoals(filters?: {
    employeeId?: string
    status?: string
    category?: string
  }) {
    try {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append('employee_id', filters.employeeId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.category) params.append('category', filters.category)

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/performance/goals${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch performance goals', error)
      return []
    }
  }

  static async createPerformanceGoal(data: any) {
    try {
      const res = await api.request('/performance/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to create performance goal', error)
      throw error
    }
  }

  static async updatePerformanceGoal(id: string, updates: any) {
    try {
      const res = await api.request(`/performance/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update performance goal', error)
      throw error
    }
  }

  static async deletePerformanceGoal(id: string) {
    try {
      await api.request(`/performance/goals/${id}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('Failed to delete performance goal', error)
      throw error
    }
  }

  static async getPerformanceStats() {
    try {
      const data = await api.request('/performance/stats')
      return data
    } catch (error) {
      console.error('Failed to fetch performance stats', error)
      return null
    }
  }

  // Deprecated shim for compatibility if needed, otherwise removed
  static async getPerformanceMetrics(employeeId?: string) {
    return this.getPerformanceStats();
  }


  // AI Features
  static async chatWithAI(message: string) {
    try {
      const res = await api.chatWithAI(message);
      return res;
    } catch (error) {
      console.error('Failed to chat with AI', error);
      throw error;
    }
  }

  static async generateJobDescription(data: { title: string, department: string, requirements: string }) {
    try {
      const res = await api.generateJobDescription(data);
      return res;
    } catch (error) {
      console.error('Failed to generate job description', error);
      throw error;
    }
  }

  static async analyzeResume(resumeText: string, jobDescription: string) {
    try {
      const res = await api.analyzeResume(resumeText, jobDescription);
      return res;
    } catch (error) {
      console.error('Failed to analyze resume', error);
      throw error;
    }
  }

  static async uploadResume(file: File, jobDescription: string) {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const res = await api.uploadResume(formData);
      return res;
    } catch (error) {
      console.error('Failed to upload and analyze resume', error);
      throw error;
    }
  }



  // Get all employees (for real-time dashboards)
  static async getAllEmployees() {
    try {
      const data = await api.getEmployees({});
      return data || [];
    } catch (error) {
      console.error('Failed to fetch all employees', error);
      return [];
    }
  }

  // Expense Claims
  static async getExpenseClaims(filters?: { employeeId?: string; status?: string }) {
    try {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append('employeeId', filters.employeeId)
      if (filters?.status) params.append('status', filters.status)
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/expenses${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch expense claims', error)
      return []
    }
  }

  static async getPendingExpenseApprovals() {
    try {
      const data = await api.request('/expenses?status=submitted')
      return data || []
    } catch (error) {
      console.error('Failed to fetch pending expense approvals', error)
      return []
    }
  }

  static async createExpenseClaim(claim: any) {
    try {
      const data = await api.request('/expenses', {
        method: 'POST',
        body: JSON.stringify(claim)
      })
      return data
    } catch (error) {
      console.error('Failed to create expense claim', error)
      throw error
    }
  }

  static async updateExpenseStatus(expenseId: string, status: string, additionalData?: any) {
    try {
      const data = await api.request(`/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...additionalData })
      })
      return data
    } catch (error) {
      console.error('Failed to update expense status', error)
      throw error
    }
  }
  // Benefits
  static async getBenefitPlans(filters?: { type?: string; activeOnly?: boolean }) {
    try {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.activeOnly) params.append('active_only', 'true')

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/benefits/plans${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch benefit plans', error)
      return []
    }
  }

  static async getBenefitPlan(id: string) {
    try {
      const data = await api.request(`/benefits/plans/${id}`)
      return data
    } catch (error) {
      console.error('Failed to fetch benefit plan', error)
      throw error
    }
  }

  static async createBenefitPlan(data: any) {
    try {
      const res = await api.request('/benefits/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to create benefit plan', error)
      throw error
    }
  }

  static async updateBenefitPlan(id: string, updates: any) {
    try {
      const res = await api.request(`/benefits/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update benefit plan', error)
      throw error
    }
  }

  static async getMyBenefits() {
    try {
      const data = await api.request('/benefits/my-benefits')
      return data || []
    } catch (error) {
      console.error('Failed to fetch my benefits', error)
      return []
    }
  }

  static async getBenefitEnrollments(filters?: { employeeId?: string; planId?: string; status?: string }) {
    try {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append('employee_id', filters.employeeId)
      if (filters?.planId) params.append('plan_id', filters.planId)
      if (filters?.status) params.append('status', filters.status)

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/benefits/enrollments${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch enrollments', error)
      return []
    }
  }

  static async enrollBenefit(data: { benefit_plan_id: number; coverage_level?: string; dependents?: any[] }) {
    try {
      const res = await api.request('/benefits/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to enroll in benefit', error)
      throw error
    }
  }

  static async cancelBenefitEnrollment(id: string) {
    try {
      const res = await api.request(`/benefits/enrollments/${id}`, {
        method: 'DELETE'
      })
      return res
    } catch (error) {
      console.error('Failed to cancel enrollment', error)
      throw error
    }
  }

  static async getBenefitsStats() {
    try {
      const data = await api.request('/benefits/stats')
      return data
    } catch (error) {
      console.error('Failed to fetch benefits stats', error)
      return null
    }
  }

  // Onboarding
  static async getOnboardingTemplates() {
    try {
      const data = await api.request('/onboarding/templates')
      return data || []
    } catch (error) {
      console.error('Failed to fetch onboarding templates', error)
      return []
    }
  }

  static async createOnboardingTemplate(data: any) {
    try {
      const res = await api.request('/onboarding/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to create onboarding template', error)
      throw error
    }
  }

  static async updateOnboardingTemplate(id: string, updates: any) {
    try {
      const res = await api.request(`/onboarding/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update onboarding template', error)
      throw error
    }
  }

  static async getOnboardingProcesses(filters?: { status?: string; employeeId?: string }) {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.employeeId) params.append('employee_id', filters.employeeId)

      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await api.request(`/onboarding/processes${query}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch onboarding processes', error)
      return []
    }
  }

  static async getMyOnboarding() {
    try {
      const data = await api.request('/onboarding/my-onboarding')
      return data
    } catch (error) {
      console.error('Failed to fetch my onboarding', error)
      return null
    }
  }

  static async startOnboarding(data: { employee_id: string; template_id?: number; assigned_buddy_id?: string; expected_end_date?: string }) {
    try {
      const res = await api.request('/onboarding/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return res
    } catch (error) {
      console.error('Failed to start onboarding', error)
      throw error
    }
  }

  static async getOnboardingTasks(employeeId: string) {
    try {
      const data = await api.request(`/onboarding/tasks/${employeeId}`)
      return data || []
    } catch (error) {
      console.error('Failed to fetch onboarding tasks', error)
      return []
    }
  }

  static async updateOnboardingTask(id: string, updates: { status?: string; notes?: string }) {
    try {
      const res = await api.request(`/onboarding/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      return res
    } catch (error) {
      console.error('Failed to update onboarding task', error)
      throw error
    }
  }

  static async getOnboardingStats() {
    try {
      const data = await api.request('/onboarding/stats')
      return data
    } catch (error) {
      console.error('Failed to fetch onboarding stats', error)
      return null
    }
  }

  // Reports
  static async getReportsDashboard() {
    // In a real app, this would aggregate data from multiple tables
    // For now, we return mock data structure expected by the frontend
    return {
      summary: [
        { id: '1', name: 'Total Employees', value: 156, change: 12, trend: 'up' },
        { id: '2', name: 'Active Today', value: 142, change: 5, trend: 'up' },
        { id: '3', name: 'Attendance Rate', value: 92, change: -1, trend: 'down' },
        { id: '4', name: 'Avg Performance', value: 4.2, change: 0, trend: 'stable' }
      ],
      employees: [
        { id: '1', name: 'Alice Johnson', department: 'Engineering', attendanceRate: 98, performanceScore: 95, status: 'active' },
        { id: '2', name: 'Bob Smith', department: 'Marketing', attendanceRate: 85, performanceScore: 78, status: 'active' },
        { id: '3', name: 'Charlie Brown', department: 'Sales', attendanceRate: 92, performanceScore: 88, status: 'on_leave' },
        { id: '4', name: 'Diana Ross', department: 'HR', attendanceRate: 100, performanceScore: 92, status: 'active' },
        { id: '5', name: 'Edward Norton', department: 'Engineering', attendanceRate: 75, performanceScore: 65, status: 'inactive' }
      ]
    }
  }
}


export default DatabaseService
