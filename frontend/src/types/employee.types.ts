/**
 * CANONICAL EMPLOYEE TYPE DEFINITION
 * Aligned with backend user_profiles table schema
 * Date: 2025-12-20
 * 
 * This is the authoritative Employee type for the entire frontend.
 * All other Employee interfaces should import from here.
 */

// Core employee status types
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated' | 'probation'
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated'
export type TaxRegime = 'old' | 'new'
export type ShiftPattern = 'fixed' | 'rotating' | 'flexible'
export type AccountType = 'savings' | 'current'

// Nested types for complex data
export interface Department {
    id: string
    name: string
    code?: string
}

export interface Team {
    id: string
    name: string
    department_id?: string
}

export interface Position {
    id: string
    name: string
    code?: string
    department_id?: string
}

export interface Role {
    id: string
    name: string
    permissions?: string[]
}

export interface Shift {
    id: string
    name: string
    code: string
    start_time: string
    end_time: string
    break_duration_minutes?: number
    grace_period_minutes?: number
    is_night_shift?: boolean
}

export interface EducationQualification {
    degree: string
    institution: string
    year: number
    percentage?: number
    specialization?: string
}

export interface PreviousEmployment {
    company: string
    position: string
    from_date: string
    to_date: string
    reason_for_leaving?: string
    experience_letter?: string
}

/**
 * Complete Employee Interface
 * Matches backend user_profiles table exactly
 */
export interface Employee {
    // Core Identity
    id: string
    employee_id: string  // e.g., "EMP-2025-0001"

    // Basic Information
    first_name: string
    last_name: string
    middle_name?: string
    preferred_name?: string
    email: string
    personal_email?: string
    phone_number?: string
    phone?: string  // Alias for phone_number (backward compatibility)
    alternate_phone?: string

    // Personal Details
    date_of_birth?: string
    gender?: Gender
    marital_status?: MaritalStatus
    blood_group?: string
    nationality?: string

    // Organizational Hierarchy
    department_id?: string
    team_id?: string
    position_id?: string
    role_id?: string
    reporting_manager_id?: string

    // Joined objects (from backend joins)
    department?: Department
    departments?: Department  // Backend sends this name
    team?: Team
    teams?: Team              // Backend sends this name
    position?: Position
    positions?: Position      // Backend sends this name
    role?: Role
    roles?: Role              // Backend sends this name
    department_name?: string  // Flat join result
    team_name?: string
    position_name?: string
    role_name?: string

    // Employment Status
    status: EmployeeStatus
    employment_status?: EmployeeStatus  // Alias for status (backward compatibility)
    employment_type?: EmploymentType
    employee_category?: string
    is_active?: boolean

    // Dates
    hire_date?: string
    joining_date?: string
    confirmation_date?: string
    probation_period_months?: number
    resignation_date?: string
    last_working_date?: string
    exit_date?: string
    exit_reason?: string
    contract_start_date?: string
    contract_end_date?: string

    // Work Schedule
    default_shift_id?: string
    default_shift?: Shift
    shift?: string  // Legacy field
    shift_pattern?: ShiftPattern
    work_hours_per_day?: number
    work_days_per_week?: number
    work_location?: string
    overtime_eligible?: boolean
    flexible_hours_allowed?: boolean
    remote_work_allowed?: boolean
    weekend_days?: number[]

    // Indian Compliance Fields (CRITICAL)
    pan_number?: string
    aadhaar_number?: string  // Encrypted in DB
    uan_number?: string
    esi_number?: string
    pf_account_number?: string
    previous_pf_account?: string
    pan_aadhaar_linked?: boolean
    pan_linked_date?: string
    tax_regime?: TaxRegime
    professional_tax_applicable?: boolean

    // Salary & Compensation (OLD - Single field)
    salary?: number

    // Salary Components (NEW - Detailed breakdown)
    basic_salary?: number
    hra?: number
    special_allowance?: number
    transport_allowance?: number
    medical_allowance?: number
    dearness_allowance?: number
    other_allowances?: Record<string, number>
    gross_salary?: number
    net_salary?: number

    // Deductions
    pf_contribution?: number
    esi_contribution?: number
    professional_tax?: number
    tds_amount?: number

    // Variable Compensation
    annual_bonus?: number
    performance_bonus?: Record<string, any>
    variable_pay_percentage?: number

    // Bank Details
    bank_name?: string
    bank_account_number?: string  // Encrypted in DB
    bank_ifsc_code?: string
    bank_branch?: string
    account_holder_name?: string
    account_type?: AccountType
    payment_method?: string
    currency_code?: string

    // Benefits
    gratuity_applicable?: boolean
    gratuity_eligible_from?: string
    leave_policy_id?: string
    health_insurance_number?: string
    health_insurance_provider?: string
    health_insurance_expiry?: string

    // Identity Documents
    passport_number?: string
    passport_expiry_date?: string
    passport_country?: string
    driving_license_number?: string
    driving_license_expiry?: string
    voter_id?: string

    // Additional Information (JSONB)
    address?: Record<string, any> | string
    education_qualifications?: EducationQualification[]
    previous_employment?: PreviousEmployment[]

    // Extended Fields (Component-specific)
    skills?: string[]
    certifications?: Array<{
        name: string
        issuer: string
        date: string
        expires?: string
    }>
    emergency_contacts?: Array<{
        name: string
        relationship: string
        phone: string
        email?: string
    }>

    // Profile Completion
    profile_completion_percentage?: number
    profile_sections_completed?: Record<string, boolean> | string
    profile_deadline?: string

    // System Fields
    created_at?: string
    updated_at?: string
    password_hash?: string  // Should not be sent to frontend
    auth_user_id?: string

    // Flags
    rehire_eligible?: boolean
    notice_period_days?: number

    // Legacy/Additional Fields (for backward compatibility)
    avatar?: string
    profile_photo_url?: string
    manager?: string
    location?: string
    startDate?: string  // Camel case version
}

/**
 * Employee creation DTO (Data Transfer Object)
 * Used when creating a new employee
 */
export interface CreateEmployeeDTO {
    // Required fields
    first_name: string
    last_name: string
    email: string

    // Optional but common
    employee_id?: string  // Auto-generated if not provided
    middle_name?: string
    phone_number?: string
    department_id?: string
    team_id?: string
    position_id?: string
    role_id?: string
    hire_date?: string
    employment_type?: EmploymentType
    password?: string  // Defaults to 'password123' if not provided

    // Additional fields
    [key: string]: any
}

/**
 * Employee update DTO
 * All fields optional except id
 */
export interface UpdateEmployeeDTO extends Partial<Omit<Employee, 'id' | 'created_at'>> {
    // Can update any field except id and created_at
}

/**
 * Employee list filters
 */
export interface EmployeeFilters {
    search?: string
    department?: string
    departmentId?: string
    status?: EmployeeStatus | EmployeeStatus[]
    employment_type?: EmploymentType
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
}

/**
 * Employee API response
 */
export interface EmployeeResponse {
    items?: Employee[]  // For paginated lists
    data?: Employee | Employee[]  // For single or bulk operations
    total?: number
    page?: number
    page_size?: number
    total_pages?: number
}
