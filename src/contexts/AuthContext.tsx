import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { User, UserRole } from '../types/user.types'
import { ROLES } from '../types/permissions'

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isLoading: boolean; // Alias for compatibility
  securityContext: any | null; // Placeholder for security context
  sessionHealth: 'healthy' | 'critical' | 'warning'; // Placeholder
  login: (credentials: any) => Promise<{ success: boolean; redirectTo?: string; mfaRequired?: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getPostLoginRoute = (roleName?: string) => {
    const role = String(roleName || 'employee')
    if (['super_admin', 'hr_manager', 'hr_staff'].includes(role)) return '/dashboard'
    if (['team_lead'].includes(role)) return '/team-leader'
    return '/dashboard'
  }

  const buildUserFromSession = async (session: Session): Promise<User> => {
    const authUser = session.user

    // Ensure a profile exists (no triggers on auth tables).
    // This is safe because profiles has INSERT policy for own id.
    await supabase
      .from('profiles')
      .upsert({ id: authUser.id, email: authUser.email ?? null }, { onConflict: 'id' })

    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', authUser.id),
    ])

    // Active-user enforcement (profile can be deactivated by HR)
    if (profileRow?.is_active === false) {
      await supabase.auth.signOut()
      throw new Error('Your account is inactive. Please contact HR.')
    }

    const role = (roleRows?.[0]?.role ?? 'employee') as UserRole

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      password: '',
      firstName: profileRow?.first_name ?? '',
      lastName: profileRow?.last_name ?? '',
      role,
      department: '',
      position: '',
      avatar: profileRow?.avatar_url ?? undefined,
      isActive: profileRow?.is_active ?? true,
      permissions: [],
      lastLogin: new Date().toISOString(),
      lastPasswordChange: undefined,
      createdAt: profileRow?.created_at ?? new Date().toISOString(),
      updatedAt: profileRow?.updated_at ?? new Date().toISOString(),
    }
  }

  // Derive profile from user for usage in permissions
  const profile = useMemo(() => {
    return user
      ? {
          ...user,
          role:
            user.role && (ROLES as any)[user.role]
              ? (ROLES as any)[user.role]
              : { name: user.role || 'employee', displayName: 'Employee' },
        }
      : null
  }, [user])

  useEffect(() => {
    let mounted = true

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!mounted) return
        if (!session) {
          setUser(null)
          return
        }
        const u = await buildUserFromSession(session)
        setUser(u)
      } catch (e) {
        console.error('Auth state change error', e)
        setUser(null)
      }
    })

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        if (data.session) {
          const u = await buildUserFromSession(data.session)
          setUser(u)
        } else {
          setUser(null)
        }
      } catch (e) {
        console.error('Auth initialization error', e)
        setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, []);

  const login = async (credentials: any) => {
    try {
      const email = String(credentials?.email ?? '')
      const password = String(credentials?.password ?? '')

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { success: false, error: error.message }
      if (!data.session) return { success: false, error: 'No session returned' }

      const u = await buildUserFromSession(data.session)
      setUser(u)
      return { success: true, redirectTo: getPostLoginRoute(u.role) }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLoading: loading, // Alias
      securityContext: null, // Default null for now
      sessionHealth: 'healthy', // Default
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
