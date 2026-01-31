// Database table types for PostgreSQL operations
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          auth_user_id: string
          employee_id: string
          first_name: string
          last_name: string
          email: string
          role_id: number
          department_id: string | null
          position_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          profile_photo_url?: string
          phone_number?: string
          date_of_birth?: string
          hire_date?: string
          employment_type?: string
          status?: string
          salary?: number
          manager_id?: string
          emergency_contact?: {
            name: string
            relationship: string
            phone: string
          }
          address?: {
            street: string
            city: string
            state: string
            zip_code: string
            country: string
          }
          address_line1?: string // Added for compatibility
          skills?: string[] // Added for compatibility
          certifications?: string[] // Added for compatibility
          emergency_contacts?: any[] // Added for compatibility
          preferences?: {
            language: string
            timezone: string
            notifications: {
              email: boolean
              sms: boolean
              push: boolean
            }
          }
        }
        Insert: {
          id?: string
          auth_user_id: string
          employee_id: string
          first_name: string
          last_name: string
          email: string
          role_id: number
          department_id?: string | null
          position_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          profile_photo_url?: string
          phone_number?: string
          date_of_birth?: string
          hire_date?: string
          salary?: number
          manager_id?: string
          emergency_contact?: {
            name: string
            relationship: string
            phone: string
          }
          address?: {
            street: string
            city: string
            state: string
            zip_code: string
            country: string
          }
          preferences?: {
            language: string
            timezone: string
            notifications: {
              email: boolean
              sms: boolean
              push: boolean
            }
          }
        }
        Update: {
          id?: string
          auth_user_id?: string
          employee_id?: string
          first_name?: string
          last_name?: string
          email?: string
          role_id?: number
          department_id?: string | null
          position_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          profile_photo_url?: string
          phone_number?: string
          date_of_birth?: string
          hire_date?: string
          salary?: number
          manager_id?: string
          emergency_contact?: {
            name: string
            relationship: string
            phone: string
          }
          address?: {
            street: string
            city: string
            state: string
            zip_code: string
            country: string
          }
          preferences?: {
            language: string
            timezone: string
            notifications: {
              email: boolean
              sms: boolean
              push: boolean
            }
          }
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          employee_id: string
          session_token: string
          device_info: Record<string, any>
          browser_fingerprint: string
          user_agent: string
          device_type: string
          ip_address: string
          country: string
          city: string
          is_trusted_device: boolean
          risk_score: number
          security_flags: string[]
          expires_at: string
          last_activity: string
          created_at: string
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          user_id: string
          employee_id: string
          session_token: string
          device_info?: Record<string, any>
          browser_fingerprint: string
          user_agent: string
          device_type: string
          ip_address: string
          country: string
          city: string
          is_trusted_device?: boolean
          risk_score?: number
          security_flags?: string[]
          expires_at: string
          last_activity: string
          created_at?: string
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string
          session_token?: string
          device_info?: Record<string, any>
          browser_fingerprint?: string
          user_agent?: string
          device_type?: string
          ip_address?: string
          country?: string
          city?: string
          is_trusted_device?: boolean
          risk_score?: number
          security_flags?: string[]
          expires_at?: string
          last_activity?: string
          created_at?: string
          metadata?: Record<string, any>
        }
      }
      failed_login_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string
          user_agent: string
          device_fingerprint: string
          country: string
          attempt_type: string
          failure_reason: string
          risk_indicators: string[]
          is_bot_suspected: boolean
          is_brute_force: boolean
          created_at: string
          metadata: Record<string, any>
        }
        Insert: {
          id?: string
          email: string
          ip_address: string
          user_agent: string
          device_fingerprint: string
          country: string
          attempt_type: string
          failure_reason: string
          risk_indicators?: string[]
          is_bot_suspected?: boolean
          is_brute_force?: boolean
          created_at?: string
          metadata?: Record<string, any>
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string
          user_agent?: string
          device_fingerprint?: string
          country?: string
          attempt_type?: string
          failure_reason?: string
          risk_indicators?: string[]
          is_bot_suspected?: boolean
          is_brute_force?: boolean
          created_at?: string
          metadata?: Record<string, any>
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          employee_id: string
          timezone: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_id: string
          timezone: string
          language: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string
          timezone?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_themes: {
        Row: {
          id: string
          user_id: string
          employee_id: string
          theme: 'light' | 'dark' | 'auto'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_id: string
          theme: 'light' | 'dark' | 'auto'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string
          theme?: 'light' | 'dark' | 'auto'
          created_at?: string
          updated_at?: string
        }
      }

      attendance_records: {
        Row: {
          id: string
          employee_id: string | null
          date: string
          check_in: string | null
          check_out: string | null
          break_start: string | null
          break_end: string | null
          status: string | null
          total_hours: number | null
          overtime_hours: number | null
          location_check_in: any | null
          location_check_out: any | null
          photos: string[] | null
          ip_address: string | null
          device_info: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          date: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          status?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          location_check_in?: any | null
          location_check_out?: any | null
          photos?: string[] | null
          ip_address?: string | null
          device_info?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          date?: string
          check_in?: string | null
          check_out?: string | null
          break_start?: string | null
          break_end?: string | null
          status?: string | null
          total_hours?: number | null
          overtime_hours?: number | null
          location_check_in?: any | null
          location_check_out?: any | null
          photos?: string[] | null
          ip_address?: string | null
          device_info?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string | null
          leave_type_id: string | null
          start_date: string
          end_date: string
          days_requested: number | null
          reason: string | null
          status: string | null
          manager_comments: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          leave_type_id?: string | null
          start_date: string
          end_date: string
          days_requested?: number | null
          reason?: string | null
          status?: string | null
          manager_comments?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          leave_type_id?: string | null
          start_date?: string
          end_date?: string
          days_requested?: number | null
          reason?: string | null
          status?: string | null
          manager_comments?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      job_postings: {
        Row: {
          id: string
          title: string
          department: string | null
          location: string | null
          employment_type: string | null
          description: string | null
          requirements: string[] | null
          benefits: string[] | null
          salary_min: number | null
          salary_max: number | null
          status: string | null
          posted_date: string | null
          closing_date: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          department?: string | null
          location?: string | null
          employment_type?: string | null
          description?: string | null
          requirements?: string[] | null
          benefits?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          status?: string | null
          posted_date?: string | null
          closing_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          department?: string | null
          location?: string | null
          employment_type?: string | null
          description?: string | null
          requirements?: string[] | null
          benefits?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          status?: string | null
          posted_date?: string | null
          closing_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      job_applications: {
        Row: {
          id: string
          job_posting_id: string | null
          candidate_name: string
          candidate_email: string
          candidate_phone: string | null
          resume_url: string | null
          cover_letter: string | null
          status: string | null
          applied_date: string | null
          notes: string | null
          rating: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_posting_id?: string | null
          candidate_name: string
          candidate_email: string
          candidate_phone?: string | null
          resume_url?: string | null
          cover_letter?: string | null
          status?: string | null
          applied_date?: string | null
          notes?: string | null
          rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_posting_id?: string | null
          candidate_name?: string
          candidate_email?: string
          candidate_phone?: string | null
          resume_url?: string | null
          cover_letter?: string | null
          status?: string | null
          applied_date?: string | null
          notes?: string | null
          rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      onboarding_tasks: {
        Row: {
          id: string
          employee_id: string | null
          task_name: string
          description: string | null
          category: string | null
          status: string | null
          assigned_to: string | null
          due_date: string | null
          completed_date: string | null
          priority: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id?: string | null
          task_name: string
          description?: string | null
          category?: string | null
          status?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_date?: string | null
          priority?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string | null
          task_name?: string
          description?: string | null
          category?: string | null
          status?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_date?: string | null
          priority?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}

// Export the database table types
export type Tables = Database['public']['Tables']
// Backward compatibility alias
export type SupabaseDatabase = Tables
