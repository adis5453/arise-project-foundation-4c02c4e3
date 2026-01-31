import DatabaseService from './databaseService'
import OfflineDataService from './offlineDataService'
import api from '../lib/api'
import { toast } from 'sonner'

/**
 * Real Data Service - Replaces all dummy data with actual database queries
 * This service provides real data from your database schema via the API
 */
export class RealDataService {

  // Employee Management
  static async getEmployeeDirectory(filters?: {
    search?: string
    department?: string
    status?: string[]
    page?: number
    pageSize?: number
  }) {
    try {
      const { search, department, status, page = 1, pageSize = 50 } = filters || {}
      const offset = (page - 1) * pageSize

      const employees = await DatabaseService.getUserProfiles({
        search,
        departmentId: department,
        employmentStatus: status,
        limit: pageSize,
        offset,
        isActive: true
      })

      // Transform data to ensure consistent structure
      const transformedEmployees = (employees || []).map((emp: any) => ({
        ...emp,
        department: emp.department || { name: 'Unknown', code: 'UNK' },
        position: emp.position || { title: 'Unknown', code: 'UNK' },
        role: emp.role || { name: 'employee', display_name: 'Employee' }
      }))

      return {
        data: transformedEmployees,
        pagination: {
          page,
          pageSize,
          total: transformedEmployees.length,
          hasMore: transformedEmployees.length === pageSize
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || ''
      if (errorMessage.toLowerCase().includes('failed to fetch') ||
        errorMessage.toLowerCase().includes('network')) {
        return OfflineDataService.getEmployeeDirectory()
      }
      return { data: [], pagination: { page: 1, pageSize: 50, total: 0, hasMore: false } }
    }
  }

  static async getEmployeeStats() {
    try {
      const metrics = await DatabaseService.getDashboardMetrics()
      const departments = await DatabaseService.getDepartments()

      return {
        totalEmployees: metrics?.totalEmployees || 0,
        activeEmployees: metrics?.activeEmployees || 0,
        presentToday: metrics?.presentToday || 0,
        lateToday: metrics?.lateToday || 0,
        onLeaveToday: metrics?.onLeaveToday || 0,
        totalDepartments: departments?.length || 0,
        avgAttendanceRate: metrics?.avgAttendanceRate || 0,
        lastUpdated: new Date().toISOString()
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.toLowerCase().includes('failed to fetch') ||
        errorMessage.toLowerCase().includes('network')) {
        return OfflineDataService.getEmployeeStats()
      }
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        presentToday: 0,
        lateToday: 0,
        onLeaveToday: 0,
        totalDepartments: 0,
        avgAttendanceRate: 0,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  // Attendance Management
  static async getAttendanceData(employeeId?: string, dateRange?: { start: string; end: string }) {
    try {
      const filters: any = {}
      if (employeeId) filters.employeeId = employeeId
      if (dateRange) {
        filters.startDate = dateRange.start
        filters.endDate = dateRange.end
      }

      const records = await DatabaseService.getAttendanceRecords(filters)

      return {
        records: records || [],
        summary: {
          totalDays: records?.length || 0,
          presentDays: records?.filter((r: any) => r.status === 'present').length || 0,
          lateDays: records?.filter((r: any) => r.status === 'late').length || 0,
          absentDays: records?.filter((r: any) => r.status === 'absent').length || 0,
          avgHours: records?.reduce((acc: number, r: any) => acc + (r.total_hours || 0), 0) / (records?.length || 1) || 0
        }
      }
    } catch (error) {
      return { records: [], summary: { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, avgHours: 0 } }
    }
  }

  static async clockIn(employeeId: string, location?: { latitude: number; longitude: number }) {
    try {
      const clockInData = {
        employee_id: employeeId,
        date: new Date().toISOString().split('T')[0],
        clock_in_time: new Date().toISOString(),
        status: 'present' as const,
        clock_in_latitude: location?.latitude,
        clock_in_longitude: location?.longitude,
        location_verified: !!location
      }

      const result = await DatabaseService.createAttendanceRecord(clockInData as any)

      if (result) {
        toast.success('Clocked in successfully!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to clock in' }
    } catch (error) {
      toast.error('Failed to clock in')
      return { success: false, error: 'Clock in failed' }
    }
  }

  static async clockOut(employeeId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]
      // Use pending/DatabaseService or api to find the record
      const records = await api.getAttendance({
        employeeId,
        startDate: today,
        endDate: today
      })

      if (!records || records.length === 0) {
        toast.error('No clock-in record found for today')
        return { success: false, error: 'No clock-in found' }
      }

      // Assume the last record is the active one if multiple exist (though likely unique per day)
      const record = records[0]
      const clockOutTime = new Date()
      const clockInTime = new Date(record.clock_in_time!)
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

      const result = await DatabaseService.updateAttendanceRecord(record.id, {
        clock_out_time: clockOutTime.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
        regular_hours: Math.min(totalHours, 8),
        overtime_hours: Math.max(0, totalHours - 8)
      })

      if (result) {
        toast.success('Clocked out successfully!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to clock out' }
    } catch (error) {
      toast.error('Failed to clock out')
      return { success: false, error: 'Clock out failed' }
    }
  }

  // Leave Management
  static async getLeaveRequests(filters?: {
    employeeId?: string
    status?: string[]
    dateRange?: { start: string; end: string }
  }) {
    try {
      const leaveFilters: any = {}
      if (filters?.employeeId) leaveFilters.employeeId = filters.employeeId
      if (filters?.status) leaveFilters.status = filters.status
      if (filters?.dateRange) {
        leaveFilters.startDate = filters.dateRange.start
        leaveFilters.endDate = filters.dateRange.end
      }

      const requests = await DatabaseService.getLeaveRequests(leaveFilters)

      return {
        requests: requests || [],
        summary: {
          total: requests?.length || 0,
          pending: requests?.filter((r: any) => r.status === 'pending').length || 0,
          approved: requests?.filter((r: any) => r.status === 'approved').length || 0,
          rejected: requests?.filter((r: any) => r.status === 'rejected').length || 0
        }
      }
    } catch (error) {
      return { requests: [], summary: { total: 0, pending: 0, approved: 0, rejected: 0 } }
    }
  }

  static async submitLeaveRequest(requestData: any) {
    try {
      const leaveRequest = {
        ...requestData,
        status: 'pending' as const,
        submitted_at: new Date().toISOString()
      }
      const result = await DatabaseService.createLeaveRequest(leaveRequest)
      if (result) {
        toast.success('Leave request submitted successfully!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to submit leave request' }
    } catch (error) {
      toast.error('Failed to submit leave request')
      return { success: false, error: 'Submission failed' }
    }
  }

  static async approveLeaveRequest(requestId: string, approverId: string, comments?: string) {
    try {
      const result = await DatabaseService.updateLeaveRequestStatus(requestId, 'approved', approverId, comments)
      if (result) {
        toast.success('Leave request approved!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to approve request' }
    } catch (error) {
      toast.error('Failed to approve leave request')
      return { success: false, error: 'Approval failed' }
    }
  }

  static async rejectLeaveRequest(requestId: string, approverId: string, reason?: string) {
    try {
      const result = await DatabaseService.updateLeaveRequestStatus(requestId, 'rejected', approverId, reason)
      if (result) {
        toast.success('Leave request rejected')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to reject request' }
    } catch (error) {
      toast.error('Failed to reject leave request')
      return { success: false, error: 'Rejection failed' }
    }
  }

  // Department Management
  static async getDepartments() {
    try {
      const departments = await DatabaseService.getDepartments()
      return departments || []
    } catch (error) {
      return []
    }
  }

  static async getTeams(departmentId?: string) {
    try {
      const teams = await DatabaseService.getTeams(departmentId)
      return teams || []
    } catch (error) {
      return []
    }
  }

  // Analytics and Dashboard
  static async getDashboardData() {
    try {
      const [metrics, departments, leaveRequests, attendanceToday] = await Promise.all([
        this.getEmployeeStats(),
        this.getDepartments(),
        this.getLeaveRequests({ status: ['pending'] }),
        this.getAttendanceData(undefined, {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        })
      ])

      return {
        employees: metrics,
        departments: departments.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          code: dept.code,
          headcount: dept.current_headcount || 0,
          budget: dept.budget || 0
        })),
        leaveRequests: leaveRequests.summary,
        attendance: attendanceToday.summary,
        lastUpdated: new Date().toISOString()
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || ''
      if (errorMessage.toLowerCase().includes('failed to fetch') || errorMessage.toLowerCase().includes('network')) {
        return OfflineDataService.getDashboardData()
      }
      return {
        employees: await this.getEmployeeStats(),
        departments: [],
        leaveRequests: { total: 0, pending: 0, approved: 0, rejected: 0 },
        attendance: { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0, avgHours: 0 },
        lastUpdated: new Date().toISOString()
      }
    }
  }

  // Search
  static async globalSearch(query: string) {
    try {
      if (!query.trim()) return { employees: [], departments: [], teams: [] }
      return await DatabaseService.globalSearch(query, { type: 'all', limit: 10 })
    } catch (error) {
      return { employees: [], departments: [], teams: [] }
    }
  }

  // Recruitment Data
  static async getRecruitmentData() {
    try {
      const [positions, applications] = await Promise.all([
        api.getJobPostings(),
        api.getJobApplications()
      ])

      const openPositionsLines: any[] = (positions || []).filter((p: any) => p.status === 'published')
      const applicationsList: any[] = applications || []

      return {
        openPositions: openPositionsLines.length,
        totalApplications: applicationsList.length,
        interviewsScheduled: 0,
        offersExtended: 0,
        newHires: 0,
        positions: openPositionsLines.map((pos: any) => ({
          id: pos.id,
          title: pos.title,
          department: pos.department_name || (pos.departments?.name) || 'Unknown',
          type: pos.location_type || 'office',
          status: 'open',
          applications: applicationsList.filter((a: any) => a.job_posting_id === pos.id).length,
          posted: pos.posted_at || new Date().toISOString()
        }))
      }
    } catch (error) {
      return {
        openPositions: 0,
        totalApplications: 0,
        interviewsScheduled: 0,
        offersExtended: 0,
        newHires: 0,
        positions: []
      }
    }
  }

  // Performance Data
  static async getPerformanceData() {
    try {
      const [employees, reviews, goals] = await Promise.all([
        api.getEmployees({ status: 'active' }),
        api.getPerformanceReviews(),
        api.getPerformanceGoals()
      ])

      const performanceData: any[] = employees || []
      const reviewsList: any[] = reviews || []
      const goalsList: any[] = goals || []

      const validRatings = performanceData.filter((e: any) => e.performance_rating != null)

      const avgRating = validRatings.length ?
        validRatings.reduce((acc: number, emp: any) => acc + (Number(emp.performance_rating) || 0), 0) / validRatings.length : 0

      return {
        averageRating: avgRating,
        topPerformers: performanceData.filter((emp: any) => (Number(emp.performance_rating) || 0) >= 4).length,
        lowPerformers: performanceData.filter((emp: any) => (Number(emp.performance_rating) || 0) <= 2).length,
        engagementScore: performanceData.reduce((acc: number, emp: any) => acc + (Number(emp.engagement_score) || 0), 0) / (performanceData.length || 1),
        reviewsDue: reviewsList.filter((r: any) => r.status === 'pending').length,
        goalsCompleted: goalsList.filter((g: any) => g.status === 'completed').length
      }
    } catch (error) {
      return {
        averageRating: 0,
        topPerformers: 0,
        lowPerformers: 0,
        engagementScore: 0,
        reviewsDue: 0,
        goalsCompleted: 0
      }
    }
  }

  // User Profile
  static async updateUserProfile(employeeId: string, updates: any) {
    try {
      const result = await DatabaseService.updateUserProfile(employeeId, updates)
      if (result) {
        toast.success('Profile updated successfully!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to update profile' }
    } catch (error) {
      toast.error('Failed to update profile')
      return { success: false, error: 'Update failed' }
    }
  }

  static async createEmployee(employeeData: any) {
    try {
      // ... (as before)
      const result = await DatabaseService.createUserProfile(employeeData)
      if (result) {
        toast.success('Employee created successfully!')
        return { success: true, data: result }
      }
      return { success: false, error: 'Failed to create employee' }
    } catch (error) {
      toast.error('Failed to create employee')
      return { success: false, error: 'Creation failed' }
    }
  }

  static async validateEmployeeId(employeeId: string) {
    return await DatabaseService.validateEmployeeId(employeeId)
  }

  static async validateEmail(email: string, excludeEmployeeId?: string) {
    return await DatabaseService.validateEmail(email, excludeEmployeeId)
  }

  // Placeholder methods for missing/incomplete modules (Returning Empty)
  static async getTrainingCourses(filters = {}) {
    try {
      const courses = await api.getTrainingCourses();
      // Transform DB rows to rich UI objects
      const transformed = (courses || []).map((c: any) => ({
        id: c.id.toString(),
        title: c.title,
        description: c.description || '',
        instructor: {
          id: 'inst1', // Placeholder
          name: c.instructor || 'Unknown Instructor',
          title: 'Course Instructor',
          avatar: ''
        },
        category: 'General',
        level: 'intermediate',
        duration: Number(c.duration_hours) || 0,
        format: 'online',
        status: c.status || 'published',
        thumbnail: c.thumbnail_url,
        tags: ['Training'],
        modules: [],
        enrollments: 0,
        completions: 0,
        rating: 0,
        reviews: 0,
        isFree: true,
        price: 0,
        prerequisites: [],
        learningObjectives: [],
        createdAt: c.created_at || new Date().toISOString(),
        updatedAt: c.updated_at || new Date().toISOString(),
        isBookmarked: false
      }));
      return { data: transformed, total: transformed.length };
    } catch (e) { return { data: [], total: 0 }; }
  }
  static async getTrainingStats() {
    try {
      const [courses, enrollments] = await Promise.all([
        api.getTrainingCourses(),
        api.getMyEnrollments()
      ]);

      const completed = enrollments?.filter((e: any) => e.status === 'completed').length || 0;

      return {
        totalCourses: courses?.length || 0,
        activeEnrollments: enrollments?.filter((e: any) => e.status === 'enrolled' || e.status === 'in_progress').length || 0,
        completedCourses: completed,
        averageRating: 0, // Not implemented yet
        totalHours: enrollments?.reduce((acc: number, e: any) => acc + (Number(e.duration_hours) || 0), 0) || 0,
        certifications: completed
      }
    } catch (e) {
      return { totalCourses: 0, activeEnrollments: 0, completedCourses: 0, averageRating: 0, totalHours: 0, certifications: 0 }
    }
  }
  static async getEmployeeEnrollments(employeeId: string) {
    // Note: API currently gets "my" enrollments, so for a specific employee we might need admin route or assume 'my' if id matches
    // For now, we'll map to getMyEnrollments if it's the current user, or return empty/TODO for others unless we upgrade API
    try {
      const enrollments = await api.getMyEnrollments();
      return enrollments || [];
    } catch (e) { return []; }
  }
  static async getDocuments(filters = {}) {
    try {
      const docs = await api.getDocuments();
      // Transform
      const transformed = (docs || []).map((d: any) => ({
        id: d.id.toString(),
        name: d.name,
        type: d.type,
        extension: d.extension,
        size: d.size,
        mimeType: d.mime_type,
        path: d.path, // UI uses path for folders, backend is simple list for now
        createdBy: { id: d.uploaded_by?.toString(), name: d.uploader_name || 'User' },
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        tags: [],
        category: 'General',
        isStarred: d.is_starred,
        isShared: d.is_shared,
        isLocked: false,
        permissions: { read: ['all'], write: ['owner'], admin: [] },
        version: 1,
        downloadCount: 0,
        fileUrl: d.file_url
      }));
      return { data: transformed, total: transformed.length };
    } catch (e) { return { data: [], total: 0 }; }
  }
  static async getDocumentStats() {
    try {
      const docs = await api.getDocuments();
      const totalSize = docs?.reduce((acc: number, d: any) => acc + (d.size || 0), 0) || 0;
      return {
        totalDocuments: docs?.length || 0,
        totalFolders: 0,
        totalSize: totalSize,
        sharedDocuments: docs?.filter((d: any) => d.is_shared).length || 0,
        starredDocuments: docs?.filter((d: any) => d.is_starred).length || 0,
        recentUploads: 0
      }
    } catch (e) { return { totalDocuments: 0, totalFolders: 0, totalSize: 0, sharedDocuments: 0, starredDocuments: 0, recentUploads: 0 }; }
  }
  static async getBenefitPlans(filters = {}) { return { data: [], total: 0 } }
  static async getBenefitsStats() { return { totalEnrollments: 0, activePlans: 0, totalBenefitValue: 0, utilizationRate: 0, pendingEnrollments: 0, expiringBenefits: 0 } }
  static async getEmployeeBenefits(employeeId?: string) { return [] }
  static async getOnboardingProcesses(filters = {}) { return { data: [], total: 0 } }
  static async getOnboardingStats() { return { totalProcesses: 0, activeProcesses: 0, completedThisMonth: 0, averageCompletionTime: 0, overdueTasks: 0, completionRate: 0 } }
  static async getOnboardingTemplates() { return [] }
}

export default RealDataService
