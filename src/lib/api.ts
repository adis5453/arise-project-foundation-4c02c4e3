import { supabase } from '@/integrations/supabase/client'
import { User } from '../types/user.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Cloud-first: in hosted preview/build, localhost backends are unreachable.
const USE_CLOUD_BACKEND = !import.meta.env.VITE_API_URL || /localhost|127\.0\.0\.1/i.test(import.meta.env.VITE_API_URL)

type CloudRequestOptions = {
  method: string
  body?: any
  params?: Record<string, any>
}

async function cloudRequest(endpoint: string, options: CloudRequestOptions) {
  const method = (options.method || 'GET').toUpperCase()
  const params = options.params ?? {}
  const body = options.body

  // Auth/user
  if (endpoint === '/auth/me' && method === 'GET') {
    const { data: auth } = await supabase.auth.getUser()
    const authUser = auth.user
    if (!authUser) return { user: null }

    await supabase.from('profiles').upsert({ id: authUser.id, email: authUser.email ?? null }, { onConflict: 'id' })
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    ])

    return {
      user: {
        id: authUser.id,
        email: authUser.email,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: roles?.[0]?.role ?? 'employee',
        role_name: roles?.[0]?.role ?? 'employee',
      },
    }
  }

  // Employees
  if (endpoint === '/employees' && method === 'GET') {
    let q = supabase.from('employees').select('*')
    if (params.status) q = q.eq('status', params.status)
    if (params.departmentId) q = q.eq('department_id', params.departmentId)
    if (params.limit) q = q.limit(Number(params.limit))
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint.startsWith('/employees/') && method === 'GET') {
    const id = endpoint.split('/')[2]
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint === '/employees' && method === 'POST') {
    const { data, error } = await supabase.from('employees').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/employees/') && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const { data, error } = await supabase.from('employees').update(body).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/employees/') && method === 'DELETE') {
    const id = endpoint.split('/')[2]
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // Departments
  if (endpoint === '/departments' && method === 'GET') {
    const { data, error } = await supabase.from('departments').select('*').order('name')
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint === '/departments' && method === 'POST') {
    const { data, error } = await supabase.from('departments').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/departments/') && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const { data, error } = await supabase.from('departments').update(body).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/departments/') && method === 'DELETE') {
    const id = endpoint.split('/')[2]
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // Positions
  if (endpoint.startsWith('/positions') && method === 'GET') {
    let q = supabase.from('positions').select('*').order('name')
    if (params.departmentId) q = q.eq('department_id', params.departmentId)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint === '/positions' && method === 'POST') {
    const { data, error } = await supabase.from('positions').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  // Teams
  if (endpoint.startsWith('/teams') && method === 'GET') {
    let q = supabase.from('teams').select('*').order('name')
    if (params.departmentId) q = q.eq('department_id', params.departmentId)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint === '/teams' && method === 'POST') {
    const { data, error } = await supabase.from('teams').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/teams/') && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const { data, error } = await supabase.from('teams').update(body).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  // Projects
  if (endpoint === '/projects' && method === 'GET') {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint === '/projects' && method === 'POST') {
    const { data, error } = await supabase.from('projects').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/projects/') && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const { data, error } = await supabase.from('projects').update(body).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  if (endpoint.startsWith('/projects/') && method === 'DELETE') {
    const id = endpoint.split('/')[2]
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return { success: true }
  }

  // Leave
  if (endpoint.startsWith('/leaves/types') && method === 'GET') {
    const { data, error } = await supabase.from('leave_types').select('*').order('name')
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint.startsWith('/leaves/requests') && method === 'GET') {
    let q = supabase.from('leave_requests').select('*').order('created_at', { ascending: false })
    if (params.employeeId) q = q.eq('employee_id', params.employeeId)
    if (params.status) q = q.eq('status', params.status)
    if (params.startDate) q = q.gte('start_date', params.startDate)
    if (params.endDate) q = q.lte('end_date', params.endDate)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint.startsWith('/leaves/requests') && method === 'POST') {
    const { data, error } = await supabase.from('leave_requests').insert(body).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  // Attendance
  if (endpoint.startsWith('/attendance') && method === 'GET') {
    // maps old /attendance?employeeId&startDate&endDate&status to attendance_records
    let q = supabase.from('attendance_records').select('*').order('date', { ascending: false })
    if (params.employeeId) q = q.eq('employee_id', params.employeeId)
    if (params.status) q = q.eq('status', params.status)
    if (params.startDate) q = q.gte('date', params.startDate)
    if (params.endDate) q = q.lte('date', params.endDate)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return data ?? []
  }

  if (endpoint === '/attendance/clock-in' && method === 'POST') {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Not authenticated')
    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', auth.user.id).maybeSingle()
    if (!emp?.id) throw new Error('No employee record for user')

    const today = new Date().toISOString().slice(0, 10)
    const payload = {
      employee_id: emp.id,
      date: today,
      clock_in: new Date().toISOString(),
      notes: body?.notes ?? null,
      location: body?.latitude || body?.longitude ? { latitude: body.latitude, longitude: body.longitude } : null,
      status: 'present' as const,
    }
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert([payload], { onConflict: 'employee_id,date' })
      .select('*')
    if (error) throw new Error(error.message)
    return (data ?? [])[0] ?? null
  }

  if (endpoint === '/attendance/clock-out' && method === 'POST') {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Not authenticated')
    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', auth.user.id).maybeSingle()
    if (!emp?.id) throw new Error('No employee record for user')
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('attendance_records')
      .update({ clock_out: new Date().toISOString(), notes: body?.notes ?? null })
      .eq('employee_id', emp.id)
      .eq('date', today)
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data
  }

  // Dashboard
  if (endpoint === '/dashboard/context' && method === 'GET') {
    const { data: auth } = await supabase.auth.getUser()
    const authUser = auth.user
    if (!authUser) throw new Error('Not authenticated')

    // Find employee record for the current user (if any)
    const { data: employee, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle()
    if (empErr) throw new Error(empErr.message)

    // Department (best-effort)
    let department: any | null = null
    if (employee?.department_id) {
      const { data: dept, error: deptErr } = await supabase
        .from('departments')
        .select('id,name,manager_id')
        .eq('id', employee.department_id)
        .maybeSingle()
      if (deptErr) throw new Error(deptErr.message)

      let manager_fname = ''
      let manager_lname = ''
      if (dept?.manager_id) {
        const { data: mgr, error: mgrErr } = await supabase
          .from('profiles')
          .select('first_name,last_name')
          .eq('id', dept.manager_id)
          .maybeSingle()
        if (!mgrErr && mgr) {
          manager_fname = mgr.first_name ?? ''
          manager_lname = mgr.last_name ?? ''
        }
      }

      department = {
        id: dept?.id,
        name: dept?.name,
        manager_fname,
        manager_lname,
      }
    }

    // Team (best-effort)
    let team: any | null = null
    if ((employee as any)?.team_id) {
      const { data: t, error: teamErr } = await supabase
        .from('teams')
        .select('id,name')
        .eq('id', (employee as any).team_id)
        .maybeSingle()
      if (teamErr) throw new Error(teamErr.message)

      team = {
        id: t?.id,
        name: t?.name,
        type: 'team',
        lead_fname: '',
        lead_lname: '',
      }
    }

    // Colleagues: optional (can be enhanced once teams/employee relations are finalized)
    const colleagues: any[] = []

    return {
      user: { id: authUser.id, email: authUser.email },
      team,
      department,
      colleagues,
      stats: {
        projects: 0,
        leaves_pending: 0,
      },
    }
  }

  // Profile completion
  if (endpoint.startsWith('/profile/completion/') && method === 'GET') {
    const { data: auth } = await supabase.auth.getUser()
    const authUser = auth.user
    if (!authUser) throw new Error('Not authenticated')

    // For safety, only allow computing completion for the logged-in user.
    const requestedId = endpoint.split('/')[3]
    if (requestedId && requestedId !== authUser.id) {
      throw new Error('Forbidden')
    }

    await supabase
      .from('profiles')
      .upsert({ id: authUser.id, email: authUser.email ?? null }, { onConflict: 'id' })

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,email,first_name,last_name,phone_number')
      .eq('id', authUser.id)
      .maybeSingle()
    if (error) throw new Error(error.message)

    const fields = [
      { name: 'first_name', weight: 30, filled: !!profile?.first_name },
      { name: 'last_name', weight: 30, filled: !!profile?.last_name },
      { name: 'email', weight: 25, filled: !!(profile?.email ?? authUser.email) },
      { name: 'phone_number', weight: 15, filled: !!profile?.phone_number },
    ]

    const total = fields.reduce((s, f) => s + f.weight, 0)
    const filled = fields.filter((f) => f.filled).reduce((s, f) => s + f.weight, 0)
    const completion_percentage = total ? Math.round((filled / total) * 100) : 0
    const missing_fields = fields.filter((f) => !f.filled).map((f) => f.name)

    return {
      completion_percentage,
      missing_fields,
      fields,
    }
  }

  // Team leave calendar (best-effort)
  if (endpoint === '/leaves/team-calendar' && method === 'GET') {
    // Return empty list for now (prevents dashboard from erroring).
    // Can be extended to join team members + active leave requests.
    return []
  }

  // System settings: store in system_settings row with key='system'
  if (endpoint === '/settings/system' && method === 'GET') {
    const { data, error } = await supabase.from('system_settings').select('*').eq('key', 'system').maybeSingle()
    if (error) throw new Error(error.message)
    return data?.value ?? {}
  }

  if (endpoint === '/settings/system' && method === 'PUT') {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ key: 'system', value: body }, { onConflict: 'key' })
      .select('*')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data?.value ?? {}
  }

  throw new Error(`Cloud backend: unsupported endpoint ${method} ${endpoint}`)
}

// Extended request options with params support
interface ApiRequestOptions extends RequestInit {
    params?: Record<string, any>;
}

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

class ApiClient {
    private token: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpiry: number | null = null;
    private refreshPromise: Promise<boolean> | null = null;

    constructor() {
        this.token = localStorage.getItem(TOKEN_KEY);
        this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
        this.tokenExpiry = expiryStr ? parseInt(expiryStr, 10) : null;
    }

    setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = Date.now() + (expiresIn * 1000);

        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry.toString());
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem(TOKEN_KEY, token);
    }

    clearToken() {
        this.token = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }

    isTokenExpired(): boolean {
        if (!this.tokenExpiry) return true;
        // Add 30 second buffer before expiry
        return Date.now() > (this.tokenExpiry - 30000);
    }

    private async refreshAccessToken(): Promise<boolean> {
        // If already refreshing, wait for that promise
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        if (!this.refreshToken) {
            return false;
        }

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: this.refreshToken })
                });

                if (!response.ok) {
                    this.clearToken();
                    return false;
                }

                const data = await response.json();
                this.setTokens(data.token, data.refreshToken, data.expiresIn);

                // Update user data if returned
                if (data.user) {
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                }

                return true;
            } catch (error) {
                this.clearToken();
                return false;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    private buildQueryString(params: Record<string, any>): string {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        return searchParams.toString();
    }

    public async request(endpoint: string, options: ApiRequestOptions = {}) {
        const { params, ...fetchOptions } = options;

        if (USE_CLOUD_BACKEND) {
            const body = fetchOptions.body ? JSON.parse(String(fetchOptions.body)) : undefined
            return cloudRequest(endpoint, {
              method: fetchOptions.method || 'GET',
              body,
              params,
            })
        }

        // Auto-refresh token if expired (except for auth endpoints)
        if (!endpoint.startsWith('/auth/') && this.token && this.isTokenExpired()) {
            const refreshed = await this.refreshAccessToken();
            if (!refreshed) {
                throw new Error('Session expired. Please log in again.');
            }
        }

        // Build URL with query params
        let url = `${API_URL}${endpoint}`;
        if (params) {
            const queryString = this.buildQueryString(params);
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Try to refresh token on 401
                if (!endpoint.startsWith('/auth/') && this.refreshToken) {
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        // Retry the request with new token
                        headers['Authorization'] = `Bearer ${this.token}`;
                        const retryResponse = await fetch(url, { ...fetchOptions, headers });
                        if (retryResponse.ok) {
                            return retryResponse.json();
                        }
                    }
                }
                this.clearToken();
            }

            let errorMessage = response.statusText;
            try {
                const errorBody = await response.json();
                if (errorBody.error) {
                    errorMessage = errorBody.error;
                }
            } catch (e) {
                // Failed to parse error body, use statusText
            }

            throw new Error(`API Error: ${errorMessage}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    // Generic methods
    public async get(endpoint: string, options: ApiRequestOptions = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    public async post(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    public async put(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    public async patch(endpoint: string, body: any, options: RequestInit = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    public async delete(endpoint: string, options: RequestInit = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }

    async login(credentials: any) {
        const data = await this.post('/auth/login', credentials);
        if (data.token) {
            this.setTokens(data.token, data.refreshToken, data.expiresIn || 900);
        }
        return data;
    }

    async logout(logoutAll: boolean = false) {
        try {
            // Call logout endpoint to revoke refresh token
            if (this.refreshToken) {
                await this.post('/auth/logout', {
                    refreshToken: this.refreshToken,
                    logoutAll
                });
            }
        } catch (error) {
            // Continue with local cleanup even if server call fails
        }
        this.clearToken();
        localStorage.removeItem('user_data');
        return Promise.resolve();
    }

    async getUser() {
        if (USE_CLOUD_BACKEND) {
            const data = await this.get('/auth/me')
            return data?.user ?? null
        }

        // Try to get from server first
        try {
            if (this.token && !this.isTokenExpired()) {
                const data = await this.get('/auth/me');
                if (data?.user) {
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    return data.user;
                }
            }
        } catch (error) {
            // Fall back to local storage
        }

        // Fallback to local storage
        const userStr = localStorage.getItem('user_data');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Password validation helper
    async validatePassword(password: string) {
        return this.post('/auth/validate-password', { password });
    }

    async getPasswordPolicy() {
        return this.get('/auth/password-policy');
    }

    // Employees
    async getEmployees(filters: any = {}) {
        return this.get('/employees', { params: filters });
    }

    async getEmployeesPaginated(filters: any = {}) {
        // Returns { items, total, page, page_size, total_pages }
        const params: any = {};

        if (filters.search) params.search = filters.search;
        if (filters.departmentId) params.departmentId = filters.departmentId;
        if (filters.department) params.department = filters.department;
        if (filters.status) params.status = filters.status;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.page_size) params.limit = filters.page_size;
        if (filters.sort_by) params.sort_by = filters.sort_by;
        if (filters.sort_order) params.sort_order = filters.sort_order;

        return this.get('/employees', { params });
    }

    async getEmployee(id: string) {
        return this.request(`/employees/${id}`);
    }

    async createEmployee(data: any) {
        return this.request('/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateEmployee(id: string, data: any) {
        return this.request(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteEmployee(id: string) {
        return this.request(`/employees/${id}`, {
            method: 'DELETE',
        });
    }

    // Departments
    async getDepartments() {
        return this.request('/departments');
    }

    async createDepartment(data: any) {
        return this.request('/departments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Roles
    async getRoles() {
        return this.request('/roles');
    }

    // Positions
    async getPositions(departmentId?: string) {
        const query = departmentId ? `?departmentId=${departmentId}` : '';
        return this.request(`/positions${query}`);
    }

    async createPosition(data: any) {
        return this.request('/positions', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Leaves
    async getLeaves(filters: any = {}) {
        const queryParams = new URLSearchParams();
        if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        const queryString = queryParams.toString();
        return this.request(`/leaves/requests${queryString ? '?' + queryString : ''}`);
    }

    async getLeaveTypes() {
        return this.request('/leaves/types');
    }

    async createLeaveType(data: any) {
        return this.request('/leaves/types', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLeaveType(id: string, data: any) {
        return this.request(`/leaves/types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteLeaveType(id: string) {
        return this.request(`/leaves/types/${id}`, {
            method: 'DELETE',
        });
    }

    async getLeaveBalances(employeeId?: string) {
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        return this.request(`/leaves/balances${query}`);
    }

    async createLeaveRequest(data: any) {
        return this.request('/leaves/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLeaveStatus(id: string, data: any) {
        return this.request(`/leaves/requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async updateLeaveRequest(id: string, data: any) {
        return this.request(`/leaves/requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteLeaveRequest(id: string) {
        return this.request(`/leaves/requests/${id}`, {
            method: 'DELETE'
        });
    }

    // Attendance
    async getAttendance(filters: any = {}) {
        const queryParams = new URLSearchParams();
        if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.status) queryParams.append('status', filters.status);

        const queryString = queryParams.toString();
        return this.request(`/attendance?${queryString}`);
    }

    async toggleBreak(action: 'start' | 'end', employeeId: string) {
        return this.request('/attendance/break', {
            method: 'POST',
            body: JSON.stringify({ action, employee_id: employeeId }),
        });
    }

    // Performance
    async getReviews() {
        return this.request('/performance/reviews');
    }

    async createReview(data: any) {
        return this.request('/performance/reviews', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Projects
    async getProjects() {
        return this.request('/projects');
    }

    async createProject(data: any) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProject(id: string, data: any) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProject(id: string) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    // System Settings
    async getSystemSettings() {
        return this.request('/settings/system');
    }

    async updateSystemSettings(data: any) {
        return this.request('/settings/system', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Hiring & Onboarding
    async getJobPostings() {
        return this.request('/job-postings');
    }

    async createJobPosting(data: any) {
        return this.request('/job-postings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateJobPosting(id: string, data: any) {
        return this.request(`/job-postings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteJobPosting(id: string) {
        return this.request(`/job-postings/${id}`, {
            method: 'DELETE',
        });
    }

    async getJobApplications() {
        return this.request('/job-applications');
    }

    async createJobApplication(data: any) {
        return this.request('/job-applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateJobApplication(id: string, data: any) {
        return this.request(`/job-applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteJobApplication(id: string) {
        return this.request(`/job-applications/${id}`, {
            method: 'DELETE',
        });
    }


    async getOnboardingTasks() {
        return this.request('/onboarding-tasks');
    }

    // Payroll
    async getPayroll(period?: string) {
        const query = period ? `?period=${period}` : '';
        return this.request(`/payroll${query}`);
    }

    async processPayroll(period: string) {
        return this.request('/payroll/process', {
            method: 'POST',
            body: JSON.stringify({ period }),
        });
    }

    // Performance
    async getPerformanceGoals(employeeId?: string) {
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        return this.request(`/performance/goals${query}`);
    }

    async createPerformanceGoal(data: any) {
        return this.request('/performance/goals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePerformanceGoal(id: string, data: any) {
        return this.request(`/performance/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async getPerformanceReviews(employeeId?: string) {
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        return this.request(`/performance/reviews${query}`);
    }

    async getPerformanceMetrics(employeeId?: string) {
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        return this.request(`/performance/metrics${query}`);
    }

    // AI Features
    async chatWithAI(message: string) {
        return this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async generateJobDescription(data: { title: string, department: string, requirements: string }) {
        return this.request('/ai/generate-job-description', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async analyzeResume(resumeText: string, jobDescription: string) {
        return this.request('/ai/analyze-resume', {
            method: 'POST',
            body: JSON.stringify({ resumeText, jobDescription })
        });
    }
    async uploadResume(formData: FormData): Promise<any> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/ai/upload-resume`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorBody = await response.json();
                if (errorBody.error) {
                    errorMessage = errorBody.error;
                }
            } catch (e) {
                // Failed to parse error body
            }
            throw new Error(`API Error: ${errorMessage}`);
        }
        return response.json();
    }

    async uploadAvatar(formData: FormData): Promise<any> {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/upload/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const errorBody = await response.json();
                if (errorBody.error) {
                    errorMessage = errorBody.error;
                }
            } catch (e) {
                // Failed to parse error 
            }
            throw new Error(`API Error: ${errorMessage}`);
        }
        return response.json();
    }

    async getReportsDashboard() {
        return this.request('/reports/dashboard');
    }

    // Enhanced Attendance APIs
    async getAttendanceSummary(employeeId?: string, startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (employeeId) params.append('employeeId', employeeId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString();
        return this.request(`/attendance/summary${query ? '?' + query : ''}`);
    }

    async getLateArrivals(startDate?: string, endDate?: string, departmentId?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (departmentId) params.append('departmentId', departmentId);
        const query = params.toString();
        return this.request(`/attendance/late-arrivals${query ? '?' + query : ''}`);
    }

    // Enhanced Leave Balance APIs
    async initializeLeaveBalances(employeeId: string) {
        return this.request('/leave-balances/initialize', {
            method: 'POST',
            body: JSON.stringify({ employeeId })
        });
    }

    async accrueLeaveBalances() {
        return this.request('/leave-balances/accrue', {
            method: 'POST'
        });
    }

    // Enhanced Payroll APIs
    async calculatePayroll(periodStart: string, periodEnd: string, employeeIds?: string[]) {
        return this.request('/payroll/calculate', {
            method: 'POST',
            body: JSON.stringify({
                period_start: periodStart,
                period_end: periodEnd,
                employee_ids: employeeIds
            })
        });
    }

    async getPayrollRecords(filters?: {
        period_start?: string;
        period_end?: string;
        status?: string;
        employee_id?: string;
    }) {
        const params = new URLSearchParams();
        if (filters?.period_start) params.append('period_start', filters.period_start);
        if (filters?.period_end) params.append('period_end', filters.period_end);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.employee_id) params.append('employee_id', filters.employee_id);
        const query = params.toString();
        return this.request(`/payroll/records${query ? '?' + query : ''}`);
    }

    async approvePayroll(recordId: string) {
        return this.request(`/payroll/records/${recordId}/approve`, {
            method: 'PUT'
        });
    }

    async getSalaryComponents(employeeId: string) {
        return this.request(`/payroll/components/${employeeId}`);
    }

    // Training API Methods
    async getTrainingCourses() {
        return this.request('/training/courses');
    }

    async getMyEnrollments() {
        return this.request('/training/my-enrollments');
    }

    async createTrainingCourse(data: any) {
        return this.request('/training/courses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async enrollInCourse(courseId: string | number) {
        return this.request('/training/enroll', {
            method: 'POST',
            body: JSON.stringify({ courseId })
        });
    }

    async updateTrainingProgress(enrollmentId: string | number, progress: number, status: string) {
        return this.request(`/training/progress/${enrollmentId}`, {
            method: 'PUT',
            body: JSON.stringify({ progress, status })
        });
    }

    // Document API Methods
    async getDocuments() {
        return this.request('/documents');
    }

    async uploadDocument(formData: FormData) {
        // Must use raw fetch for FormData to handle boundary
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Content-Type not set, browser does it for FormData
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }
        return response.json();
    }

    async deleteDocument(id: string) {
        return this.request(`/documents/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Announcements ====================
    async getAnnouncements(params: { type?: string; priority?: string; published_only?: boolean } = {}) {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.priority) queryParams.append('priority', params.priority);
        if (params.published_only) queryParams.append('published_only', 'true');
        const queryString = queryParams.toString();
        return this.request(`/announcements${queryString ? `?${queryString}` : ''}`);
    }

    async getAnnouncement(id: string) {
        return this.request(`/announcements/${id}`);
    }

    async createAnnouncement(data: {
        title: string;
        content: string;
        type?: string;
        priority?: string;
        target_audience?: string;
        target_ids?: number[];
        is_pinned?: boolean;
        is_published?: boolean;
        publish_date?: string;
        expire_date?: string;
    }) {
        return this.request('/announcements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAnnouncement(id: string, data: Partial<{
        title: string;
        content: string;
        type: string;
        priority: string;
        target_audience: string;
        target_ids: number[];
        is_pinned: boolean;
        is_published: boolean;
        publish_date: string;
        expire_date: string;
    }>) {
        return this.request(`/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteAnnouncement(id: string) {
        return this.request(`/announcements/${id}`, {
            method: 'DELETE'
        });
    }

    async getAnnouncementStats() {
        return this.request('/announcements/stats/overview');
    }

    // ==================== Messaging ====================
    async getConversations() {
        return this.request('/messaging/conversations');
    }

    async getConversation(id: string) {
        return this.request(`/messaging/conversations/${id}`);
    }

    async getMessages(conversationId: string, params: { limit?: number; before_id?: string } = {}) {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.before_id) queryParams.append('before_id', params.before_id);
        const queryString = queryParams.toString();
        return this.request(`/messaging/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`);
    }

    async createConversation(data: {
        type?: 'direct' | 'group';
        name?: string;
        participant_ids: number[];
        description?: string;
    }) {
        return this.request('/messaging/conversations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async sendMessage(conversationId: string, data: {
        content: string;
        message_type?: string;
        attachment_url?: string;
        attachment_name?: string;
        reply_to_id?: number;
    }) {
        return this.request(`/messaging/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteMessage(messageId: string) {
        return this.request(`/messaging/messages/${messageId}`, {
            method: 'DELETE'
        });
    }

    async getMessagingStats() {
        return this.request('/messaging/stats');
    }

    // ==================== WFH ====================
    async getWFHPolicies() {
        return this.request('/wfh/policies');
    }

    async getMyWFHRequests(params: { status?: string; month?: number; year?: number } = {}) {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.month) queryParams.append('month', params.month.toString());
        if (params.year) queryParams.append('year', params.year.toString());
        const queryString = queryParams.toString();
        return this.request(`/wfh/my-requests${queryString ? `?${queryString}` : ''}`);
    }

    async getWFHRequests(params: { status?: string; employee_id?: string; from_date?: string; to_date?: string } = {}) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v && queryParams.append(k, v));
        const queryString = queryParams.toString();
        return this.request(`/wfh/requests${queryString ? `?${queryString}` : ''}`);
    }

    async createWFHRequest(data: { start_date: string; end_date: string; reason?: string; work_type?: string }) {
        return this.request('/wfh/requests', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async approveWFHRequest(id: string, notes?: string) {
        return this.request(`/wfh/requests/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ notes })
        });
    }

    async rejectWFHRequest(id: string, rejection_reason: string) {
        return this.request(`/wfh/requests/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ rejection_reason })
        });
    }

    async checkWFHDate(date: string, employeeId?: string) {
        const params = employeeId ? `?date=${date}&employee_id=${employeeId}` : `?date=${date}`;
        return this.request(`/wfh/check-date${params}`);
    }

    async getWFHStats(params: { month?: number; year?: number } = {}) {
        const queryParams = new URLSearchParams();
        if (params.month) queryParams.append('month', params.month.toString());
        if (params.year) queryParams.append('year', params.year.toString());
        const queryString = queryParams.toString();
        return this.request(`/wfh/stats${queryString ? `?${queryString}` : ''}`);
    }

    // ==================== Attendance (Enhanced) ====================
    async getOfficeLocations() {
        return this.request('/attendance/locations');
    }

    async getMyTodayAttendance() {
        return this.request('/attendance/my-today');
    }

    async clockIn(data: { latitude?: number; longitude?: number; clock_in_type?: string; notes?: string; photo?: string | null }) {
        return this.request('/attendance/clock-in', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async clockOut(data: { latitude?: number; longitude?: number; notes?: string }) {
        return this.request('/attendance/clock-out', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getAttendanceStats(params: { month?: number; year?: number } = {}) {
        const queryParams = new URLSearchParams();
        if (params.month) queryParams.append('month', params.month.toString());
        if (params.year) queryParams.append('year', params.year.toString());
        const queryString = queryParams.toString();
        return this.request(`/attendance/stats${queryString ? `?${queryString}` : ''}`);
    }
}

export const api = new ApiClient();
export default api;



