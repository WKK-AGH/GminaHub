import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, setAccessToken, type UserRole, type UserResponse, getFullName, getInitials } from '../api/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  login?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function mapUser(user: UserResponse): CurrentUser {
  return {
    id:       user.id,
    login:    user.login,
    firstName:user.firstName,
    lastName: user.lastName,
    fullName: getFullName(user),
    initials: getInitials(user),
    role:     user.role,
  };
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);


  useEffect(() => {
    authApi.refresh()
      .then(res => { if (res.success) setAccessToken(res.accessToken); })
      .catch(() => setAccessToken(null))
      .finally(() => setIsLoading(false));
  }, []);

 
  useEffect(() => {
    const handler = () => { setCurrentUser(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (loginStr: string, password: string) => {
    const res = await authApi.login({ login: loginStr, password });
    if (!res.success) throw new Error('Login failed');
    setAccessToken(res.accessToken);
    setCurrentUser(mapUser(res.user));
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally {
      setAccessToken(null);
      setCurrentUser(null);
    }
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
