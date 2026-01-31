/**
 * TYPE-SAFE API CLIENT
 * Wraps the base API client with proper TypeScript types
 * Ensures backend-frontend contract alignment
 */

import { Employee, EmployeeFilters, CreateEmployeeDTO, UpdateEmployeeDTO } from '../types/employee.types'

// Re-export base client
import { default as baseApi } from './api'

// ====================================
// LEAVE MANAGEMENT TYPES
// ====================================

export interface LeaveType {
    id: string
    name: string
    code: string
    description?: string
    color?: string
    icon?: string
    max_days_per_year?: number
    accrual_method?: string
    is_active?: boolean
    is_paid?: boolean
    allow_half_day?: boolean
    allow_carryover?: boolean
    max_carryover_days?: number
    requires_document_after_days?: number
    applicable_gender?: 'M' | 'F' | 'ALL'
    min_service_months?: number
    created_at?: string
    category?: string
}

export interface LeaveBalance {
    id: string
    employee_id: string
    leave_type_id: string
    current_balance: number
    accrued_balance: number
    used_balance: number
    pending_balance: number
    year: number
    leave_type_name?: string
    leave_type_code?: string
    color_code?: string
    leave_type?: LeaveType
    created_at?: string
    updated_at?: string
}

export interface LeaveRequest {
    id: string
    employee_id: string
    leave_type_id: string
    start_date: string
    end_date: string
    days_requested: number
    reason?: string
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    manager_comments?: string
    rejection_reason?: string
    reviewed_by?: string
    reviewed_at?: string
    cancelled_at?: string
    cancelled_by?: string
    cancellation_reason?: string
    created_at?: string
    updated_at?: string
    total_days?: number
    // Joined objects from backend
    employee?: {
        first_name: string
        last_name: string
        employee_id: string
        avatar_url?: string
    }
    leave_type?: {
        name: string
        code: string
        color?: string
    }
}

export interface LeaveRequestFilters {
    employeeId?: string
    employee_id?: string
    status?: string
    startDate?: string
    start_date?: string
    endDate?: string
    end_date?: string
    page?: number
    limit?: number
}

// ====================================
// ATTENDANCE TYPES
// ====================================

export interface AttendanceRecord {
    id: string
    employee_id: string
    date: string
    check_in?: string
    check_out?: string
    break_start?: string
    break_end?: string
    status?: 'pending' | 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'wfh'
    total_hours?: number
    overtime_hours?: number
    location_check_in?: {
        latitude: number
        longitude: number
        address?: string
    }
    location_check_out?: {
        latitude: number
        longitude: number
        address?: string
    }
    photos?: string[]
    ip_address?: string
    device_info?: Record<string, any>
    created_at?: string
    updated_at?: string
}

export interface AttendanceFilters {
    employeeId?: string
    employee_id?: string
    startDate?: string
    start_date?: string
    endDate?: string
    end_date?: string
    status?: string
    page?: number
    limit?: number
}

// ====================================
// API RESPONSE WRAPPERS
// ====================================

export interface ApiResponse<T> {
    data?: T
    items?: T[]
    total?: number
    page?: number
    page_size?: number
    total_pages?: number
    message?: string
    error?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

// ====================================
// TYPE-SAFE API CLIENT CLASS
// ====================================

class TypeSafeApiClient {
    // ===================
    // EMPLOYEE APIs
    // ===================

    async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
        const response = await baseApi.getEmployees(filters || {})
        // Handle both old array format and new paginated format
        if (Array.isArray(response)) {
            return response
        }
        if (response && response.items) {
            return response.items
        }
        return []
    }

    async getEmployeesPaginated(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
        const response = await baseApi.getEmployeesPaginated(filters || {})
        return response as PaginatedResponse<Employee>
    }

    async getEmployee(id: string): Promise<Employee> {
        return await baseApi.getEmployee(id)
    }

    async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
        return await baseApi.createEmployee(data)
    }

    async updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<Employee> {
        return await baseApi.updateEmployee(id, data)
    }

    async deleteEmployee(id: string): Promise<{ message: string }> {
        return await baseApi.deleteEmployee(id)
    }

    // ===================
    // LEAVE APIs
    // ===================

    async getLeaveTypes(): Promise<LeaveType[]> {
        const response = await baseApi.getLeaveTypes()
        return Array.isArray(response) ? response : []
    }

    async createLeaveType(data: Partial<LeaveType>): Promise<LeaveType> {
        return await baseApi.createLeaveType(data)
    }

    async updateLeaveType(id: string, data: Partial<LeaveType>): Promise<LeaveType> {
        return await baseApi.updateLeaveType(id, data)
    }

    async deleteLeaveType(id: string): Promise<{ message: string }> {
        return await baseApi.deleteLeaveType(id)
    }

    async getLeaveBalances(employeeId?: string): Promise<LeaveBalance[]> {
        const response = await baseApi.getLeaveBalances(employeeId)
        return Array.isArray(response) ? response : []
    }

    async getLeaveRequests(filters?: LeaveRequestFilters): Promise<LeaveRequest[]> {
        // Backend expects /leaves/requests with snake_case params
        const params: any = {}
        if (filters) {
            if (filters.employeeId || filters.employee_id) {
                params.employeeId = filters.employeeId || filters.employee_id
            }
            if (filters.status) params.status = filters.status
            if (filters.startDate || filters.start_date) {
                params.startDate = filters.startDate || filters.start_date
            }
            if (filters.endDate || filters.end_date) {
                params.endDate = filters.endDate || filters.end_date
            }
        }

        const response = await baseApi.get('/leaves/requests', { params })
        return Array.isArray(response) ? response : []
    }

    async createLeaveRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
        return await baseApi.post('/leaves/requests', data)
    }

    async updateLeaveRequest(id: string, data: Partial<LeaveRequest>): Promise<LeaveRequest> {
        return await baseApi.put(`/leaves/requests/${id}`, data)
    }

    async deleteLeaveRequest(id: string): Promise<{ message: string }> {
        return await baseApi.delete(`/leaves/requests/${id}`)
    }

    async cancelLeaveRequest(id: string, reason: string): Promise<{ message: string; leave: LeaveRequest }> {
        return await baseApi.post(`/leaves/requests/${id}/cancel`, { cancellation_reason: reason })
    }

    // ===================
    // ATTENDANCE APIs
    // ===================

    async getAttendance(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
        const response = await baseApi.getAttendance(filters || {})
        return Array.isArray(response) ? response : []
    }

    async clockIn(data: {
        employee_id?: string
        latitude?: number
        longitude?: number
        address?: string
        photo?: string | null
        clock_in_type?: string
    }): Promise<AttendanceRecord> {
        return await baseApi.clockIn(data)
    }

    async clockOut(data: {
        employee_id?: string
        latitude?: number
        longitude?: number
        address?: string
    }): Promise<AttendanceRecord> {
        return await baseApi.clockOut(data)
    }

    async toggleBreak(action: 'start' | 'end', employeeId: string): Promise<any> {
        return await baseApi.toggleBreak(action, employeeId)
    }

    // ===================
    // DEPARTMENT & ORG APIs
    // ===================

    async getDepartments(): Promise<any[]> {
        const response = await baseApi.getDepartments()
        return Array.isArray(response) ? response : []
    }

    async getRoles(): Promise<any[]> {
        const response = await baseApi.getRoles()
        return Array.isArray(response) ? response : []
    }

    async getPositions(departmentId?: string): Promise<any[]> {
        const response = await baseApi.getPositions(departmentId)
        return Array.isArray(response) ? response : []
    }

    // ===================
    // PROJECT APIs
    // ===================

    async getProjects(): Promise<any[]> {
        const response = await baseApi.getProjects()
        return Array.isArray(response) ? response : []
    }

    async createProject(data: any): Promise<any> {
        return await baseApi.createProject(data)
    }

    async updateProject(id: string, data: any): Promise<any> {
        return await baseApi.updateProject(id, data)
    }

    async deleteProject(id: string): Promise<{ message: string }> {
        return await baseApi.deleteProject(id)
    }

    // ===================
    // AUTH APIs
    // ===================

    async login(credentials: { email: string; password: string }): Promise<{ token: string; user: any }> {
        return await baseApi.login(credentials)
    }

    async logout(): Promise<void> {
        return await baseApi.logout()
    }

    async getUser(): Promise<any> {
        return await baseApi.getUser()
    }

    // Pass through base client for other methods
    get base() {
        return baseApi
    }
}

// Export singleton instance
export const api = new TypeSafeApiClient()
export default api
