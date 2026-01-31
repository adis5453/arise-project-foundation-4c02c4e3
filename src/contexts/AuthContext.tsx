import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types/user.types';

import { ROLES } from '../types/permissions';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isLoading: boolean; // Alias for compatibility
  securityContext: any | null; // Placeholder for security context
  sessionHealth: 'healthy' | 'critical' | 'warning'; // Placeholder
  login: (credentials: any) => Promise<{ success: boolean; mfaRequired?: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive profile from user for usage in permissions
  const profile = user ? {
    ...user,
    role: (user.role && ROLES[user.role]) ? ROLES[user.role] : { name: user.role || 'employee', displayName: 'Employee' }
  } : null;

  useEffect(() => {
    // Check for existing session
    const initAuth = async () => {
      try {
        const u = await api.getUser();
        // Backend returns role_name, map to role property if needed or rely on API client
        if (u && (u as any).role_name && !u.role) {
          u.role = (u as any).role_name;
        }
        setUser(u);
      } catch (e) {
        console.error('Auth initialization error', e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await api.login(credentials);

      if (response.mfaRequired) {
        return { success: false, mfaRequired: true };
      }

      if (response.user) {
        const u = response.user;
        if (u && (u as any).role_name && !u.role) {
          u.role = (u as any).role_name;
        }
        setUser(u);
        localStorage.setItem('user_data', JSON.stringify(u));
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('user_data');
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
