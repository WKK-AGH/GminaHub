import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authApi, setAccessToken,
  type Rola, type UserResponse, fullName, initials,
} from '../api/api';

// ─── TYPY ────────────────────────────────────────────────────────────────────

export interface Uzytkownik {
  id: string;
  login?: string;
  firstName: string;
  lastName: string;
  imieNazwisko: string;   // firstName + lastName — wygoda w UI
  inicjaly: string;       // np. "JK"
  rola: Rola;             // 'RADNY' | 'PRZEWODNICZACY' | 'ADMINISTRATOR'
}

interface AuthContextType {
  uzytkownik: Uzytkownik | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...role: Rola[]) => boolean;
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function mapUser(user: UserResponse): Uzytkownik {
  return {
    id:           user.id,
    login:        user.login,
    firstName:    user.firstName,
    lastName:     user.lastName,
    imieNazwisko: fullName(user),
    inicjaly:     initials(user),
    rola:         user.role,
  };
}

// ─── KONTEKST ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  return ctx;
}

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [uzytkownik, setUzytkownik] = useState<Uzytkownik | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);

  // Przy starcie — próba odświeżenia przez HttpOnly cookie
  // /refresh zwraca tylko { success, accessToken } — bez danych usera
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await authApi.refresh();
        if (res.success && res.accessToken) {
          setAccessToken(res.accessToken);
          // TODO: gdy backend doda GET /api/auth/me → pobierz i ustaw usera
        }
      } catch {
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  // Globalne wylogowanie (emitowane przez apiFetch przy 401)
  useEffect(() => {
    const handler = () => { setUzytkownik(null); setAccessToken(null); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  const login = useCallback(async (loginStr: string, password: string) => {
    const res = await authApi.login({ login: loginStr, password });
    if (!res.success) throw new Error('Logowanie nie powiodło się');
    setAccessToken(res.accessToken);
    setUzytkownik(mapUser(res.user));
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally {
      setAccessToken(null);
      setUzytkownik(null);
    }
  }, []);

  const hasRole = useCallback((...roles: Rola[]) => {
    if (!uzytkownik) return false;
    return roles.includes(uzytkownik.rola);
  }, [uzytkownik]);

  return (
    <AuthContext.Provider value={{ uzytkownik, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
