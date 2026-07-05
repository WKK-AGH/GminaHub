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
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

function mapUser(user: UserResponse): CurrentUser {
  return {
    id: user.id,
    email: user.email ?? user.login,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: getFullName(user),
    initials: getInitials(user),
    role: user.role,
  };
}

// Fallback accounts used when backend is unavailable (demo / development)
const MOCK_USERS: Record<string, { password: string; user: UserResponse }> = {
  'admin': {
    password: 'Admin123!',
    user: { id: '1', firstName: 'Administrator', lastName: '', role: 'ADMINISTRATOR', login: 'admin' },
  },
  'radny': {
    password: 'Radny123!',
    user: { id: '2', firstName: 'Jan', lastName: 'Kowalski', role: 'RADNY', login: 'radny' },
  },
  'przewodniczacy': {
    password: 'Przew123!',
    user: { id: '3', firstName: 'Anna', lastName: 'Wiśniewska', role: 'PRZEWODNICZACY', login: 'przewodniczacy' },
  },
};


// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getInitialsFromNames(firstName: string, lastName: string): string {
  const f = firstName.trim()[0] ?? '';
  const l = lastName.trim()[0]  ?? '';
  return (f + l).toUpperCase() || '??';
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true); // true — czeka na refresh

  // Przy starcie aplikacji próbuj odtworzyć sesję przez Refresh Token (HttpOnly Cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await authApi.refresh();
        if (res.success && res.accessToken) {
          setAccessToken(res.accessToken);
          // Pobierz dane użytkownika po odświeżeniu tokenu
          // Backend powinien zwrócić user w refresh response
          // Jeśli nie — spróbuj pobrać przez /api/users/me (jeśli istnieje)
          const decoded = parseJwt(res.accessToken);
          if (decoded) {
            setCurrentUser({
              id:        decoded.userId ?? decoded.id ?? '',
              email:     decoded.email,
              firstName: decoded.firstName ?? '',
              lastName:  decoded.lastName  ?? '',
              fullName:  `${decoded.firstName ?? ''} ${decoded.lastName ?? ''}`.trim(),
              initials:  getInitialsFromNames(decoded.firstName ?? '', decoded.lastName ?? ''),
              role:      decoded.role as UserRole,
            });
          }
        }
      } catch {
        // Brak ważnego refresh tokenu — użytkownik musi się zalogować
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const handler = () => { setCurrentUser(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (loginStr: string, password: string) => {
    // Try real backend first
    try {
      const res = await authApi.login({ email: loginStr, password });
      if (res.success) {
        setAccessToken(res.accessToken);
        setCurrentUser(mapUser(res.user));
        return;
      }
    } catch {
      // Backend unavailable — fall through to mock
    }

    // Mock fallback
    const mock = MOCK_USERS[loginStr];
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
