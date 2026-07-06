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
    id:        user.id,
    email:     user.email ?? user.login,
    firstName: user.firstName,
    lastName:  user.lastName,
    fullName:  getFullName(user),
    initials:  getInitials(user),
    role:      user.role,
  };
}

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
  const [isLoading,   setIsLoading]   = useState(true);

  // Przy starcie aplikacji próbuj odtworzyć sesję przez Refresh Token (HttpOnly Cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await authApi.refresh();
        if (res.success && res.accessToken) {
          setAccessToken(res.accessToken);
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      setAccessToken(res.accessToken);
      setCurrentUser(mapUser(res.user));
      return;
    }
    throw new Error('Nieprawidłowy e-mail lub hasło');
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
