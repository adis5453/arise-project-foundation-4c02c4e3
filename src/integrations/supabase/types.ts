export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          budget: number | null
          created_at: string
          description: string | null
          id: string
          manager_id: string | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_fk"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_teams: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          joined_at: string
          role: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          joined_at?: string
          role?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_teams_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          employee_code: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          hire_date: string | null
          id: string
          manager_id: string | null
          position_id: string | null
          salary: number | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          employee_code?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          position_id?: string | null
          salary?: number | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department_id?: string | null
          employee_code?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          position_id?: string | null
          salary?: number | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          read_at: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_locations: {
        Row: {
          address: Json | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_headquarters: boolean
          name: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_headquarters?: boolean
          name: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_headquarters?: boolean
          name?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          level: string | null
          max_salary: number | null
          min_salary: number | null
          name: string
          requirements: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          level?: string | null
          max_salary?: number | null
          min_salary?: number | null
          name: string
          requirements?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          level?: string | null
          max_salary?: number | null
          min_salary?: number | null
          name?: string
          requirements?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          name: string
          team_lead_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name: string
          team_lead_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          name?: string
          team_lead_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_hr: { Args: { _user_id: string }; Returns: boolean }
      is_manager_of_employee: {
        Args: { _employee_id: string }
        Returns: boolean
      }
      is_own_employee_id: { Args: { _employee_id: string }; Returns: boolean }
      is_same_department: { Args: { _employee_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "hr_manager"
        | "hr_staff"
        | "department_head"
        | "team_lead"
        | "employee"
        | "intern"
      approval_status: "pending" | "approved" | "rejected" | "cancelled"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "on_leave"
        | "holiday"
        | "weekend"
      employment_status:
        | "active"
        | "on_leave"
        | "terminated"
        | "resigned"
        | "retired"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "intern"
        | "temporary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "hr_manager",
        "hr_staff",
        "department_head",
        "team_lead",
        "employee",
        "intern",
      ],
      approval_status: ["pending", "approved", "rejected", "cancelled"],
      attendance_status: [
        "present",
        "absent",
        "late",
        "on_leave",
        "holiday",
        "weekend",
      ],
      employment_status: [
        "active",
        "on_leave",
        "terminated",
        "resigned",
        "retired",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "intern",
        "temporary",
      ],
    },
  },
} as const
