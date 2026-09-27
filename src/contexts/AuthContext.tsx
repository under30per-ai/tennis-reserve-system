'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/types';
import {
  login as loginAction,
  logout as logoutAction,
  getAuthUser,
} from '@/app/actions/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: 'member' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string, role: 'member' | 'admin'): Promise<boolean> => {
      const loggedInUser = await loginAction(email, password, role);
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
