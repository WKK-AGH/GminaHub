import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, setAccessToken, type UserRole, type UserResponse, getFullName, getInitials } from '../api/api';

export interface CurrentUser {
  id: string; email?: string;
  firstName: string; lastName: string;
  fullName: string; initials: string;
  role: UserRole;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

function mapUser(user: UserResponse): CurrentUser {
  return {
    id: user.id,
    email: user.login,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: getFullName(user),
    initials: getInitials(user),
    role: user.role,
  };
}

// Fallback accounts used when backend is unavailable (demo / development)
const MOCK_USERS: Record<string, { password: string; user: UserResponse }> = {
  'admin@nasza-gmina.pl': {
    password: 'Admin123!',
    user: { id: '1', firstName: 'Administrator', lastName: '', role: 'ADMINISTRATOR', login: 'admin@nasza-gmina.pl' },
  },
  'radny@nasza-gmina.pl': {
    password: 'Radny123!',
    user: { id: '2', firstName: 'Jan', lastName: 'Kowalski', role: 'RADNY', login: 'radny@nasza-gmina.pl' },
  },
  'przewodniczacy@nasza-gmina.pl': {
    password: 'Przew123!',
    user: { id: '3', firstName: 'Anna', lastName: 'Wiśniewska', role: 'PRZEWODNICZACY', login: 'przewodniczacy@nasza-gmina.pl' },
  },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);

  useEffect(() => {
    const handler = () => { setCurrentUser(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Try real backend first
    try {
      const res = await authApi.login({ email, password });
      if (res.success) {
        setAccessToken(res.accessToken);
        setCurrentUser(mapUser(res.user));
        return;
      }
    } catch {
      // Backend unavailable — fall through to mock
    }

    // Mock fallback
    const mock = MOCK_USERS[email];
    if (mock && mock.password === password) {
      setCurrentUser(mapUser(mock.user));
      return;
    }

    throw new Error('Nieprawidłowy login lub hasło');
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    setCurrentUser(null);
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
