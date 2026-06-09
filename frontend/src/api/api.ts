// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ─── TYPY — dopasowane do schematu Prisma i odpowiedzi backendu ───────────────

export interface ApiError {
  message: string;
  status: number;
}

// Role dokładnie jak w bazie danych
export type Rola = 'RADNY' | 'PRZEWODNICZACY' | 'ADMINISTRATOR';

// Mapowanie ról backend → etykiety PL do wyświetlania w UI
export const ROLA_LABEL: Record<Rola, string> = {
  RADNY:          'Radny',
  PRZEWODNICZACY: 'Przewodniczący',
  ADMINISTRATOR:  'Administrator',
};

// Głosy dokładnie jak w bazie (value: 'YES' | 'NO' | 'ABSTAIN')
export type WartoscGlosu = 'YES' | 'NO' | 'ABSTAIN';

// Mapowanie wartości głosu → etykiety PL
export const GLOS_LABEL: Record<WartoscGlosu, string> = {
  YES:     'ZA',
  NO:      'PRZECIW',
  ABSTAIN: 'WSTRZYMUJĘ',
};

// Statusy sesji dokładnie jak w bazie
export type StatusSesji = 'PLANNED' | 'ACTIVE' | 'FINISHED';

// Statusy głosowania dokładnie jak w bazie
export type StatusGlosowania = 'PENDING' | 'ACTIVE' | 'COMPLETED';

// ─── MODELE — User ────────────────────────────────────────────────────────────

// Odpowiedź backendu z auth.controller.ts (login / register / refresh)
export interface UserResponse {
  id: string;          // UUID
  firstName: string;
  lastName: string;
  role: Rola;          // nazwa roli np. 'RADNY'
  login?: string;      // tylko w /register
}

// Odpowiedź z users.controller.ts (getAllUsers)
export interface UserListItem {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: { name: Rola };
}

// Helper — pełne imię i nazwisko
export function fullName(user: UserResponse | UserListItem): string {
  return `${user.firstName} ${user.lastName}`;
}

// Helper — inicjały
export function initials(user: UserResponse | UserListItem): string {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

// ─── MODELE — Auth ────────────────────────────────────────────────────────────

export interface LoginPayload {
  login: string;      // WAŻNE: backend używa 'login', nie 'email'!
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: UserResponse;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
  // UWAGA: /refresh nie zwraca user — tylko nowy accessToken
}

export interface RegisterPayload {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Rola;
}

// ─── MODELE — Session ─────────────────────────────────────────────────────────

export interface Session {
  id: string;           // UUID
  title: string;        // np. 'XXXIV Sesja Zwyczajna Rady Gminy'
  status: StatusSesji;  // 'PLANNED' | 'ACTIVE' | 'FINISHED'
  scheduledAt: string;  // ISO date string
  committeeId: string | null;
  committee: Committee | null;
  agendaItems?: AgendaItem[];
  summary?: SessionSummary | null;
}

export interface CreateSessionPayload {
  title: string;
  scheduledAt: string;      // ISO date string, musi być w przyszłości
  committeeId?: string;     // opcjonalne UUID komisji
}

// ─── MODELE — AgendaItem ──────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  title: string;
  order: number;        // kolejność punktu w agendzie
  sessionId: string;
  documents: Document[];
  voting: Voting[];     // tablica — jeden punkt może mieć wiele głosowań
}

export interface Document {
  id: string;
  title: string;
  fileUrl: string;
  agendaItemId: string;
}

// ─── MODELE — Committee ───────────────────────────────────────────────────────

export interface Committee {
  id: string;
  name: string;
  members?: CommitteeMember[];
  sessions?: Session[];
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  userId: string;
  user?: UserListItem;
}

// ─── MODELE — Voting / Vote ───────────────────────────────────────────────────

export interface Voting {
  id: string;
  title: string;
  status: StatusGlosowania;   // 'PENDING' | 'ACTIVE' | 'COMPLETED'
  agendaItemId: string;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  value: WartoscGlosu;   // 'YES' | 'NO' | 'ABSTAIN'
  votingId: string;
  userId: string;
  user?: UserListItem;
}

export interface CastVotePayload {
  value: WartoscGlosu;   // 'YES' | 'NO' | 'ABSTAIN'
}

// ─── MODELE — SessionSummary / SystemLog ──────────────────────────────────────

export interface SessionSummary {
  id: string;
  content: string;
  createdAt: string;
  sessionId: string;
}

export interface SystemLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  userId: string | null;
  user?: UserListItem | null;
}

// ─── TOKEN STORAGE ────────────────────────────────────────────────────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

// ─── REFRESH (singleton — zapobiega wyścigowi wielu requestów) ────────────────

let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',   // wysyła HttpOnly cookie z refreshToken
  })
    .then(async res => {
      if (!res.ok) throw new Error('Refresh failed');
      const data: RefreshResponse = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}

// ─── KLIENT HTTP ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, options, false);
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw { message: 'Sesja wygasła. Zaloguj się ponownie.', status: 401 } as ApiError;
  }

  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch { /* ignoruj */ }
    throw { message, status: res.status } as ApiError;
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                 => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown)  => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)  => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                 => apiFetch<T>(path, { method: 'DELETE' }),
};

// ─── BACKEND WRAPPER ──────────────────────────────────────────────────────────
// Backend zwraca { success: true, data: T } — ten wrapper wyciąga samo data

interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function apiData<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch<BackendResponse<T>>(path, options);
  return res.data;
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────
// Ścieżki z auth.routes.ts: POST /login, POST /logout, POST /refresh, POST /register

export const authApi = {
  // POST /api/auth/login — body: { login, password }
  login: (payload: LoginPayload) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // POST /api/auth/logout — czyści cookie refreshToken
  logout: () =>
    apiFetch<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' }),

  // POST /api/auth/refresh — używa HttpOnly cookie, zwraca { success, accessToken }
  refresh: () =>
    apiFetch<RefreshResponse>('/auth/refresh', { method: 'POST' }),

  // POST /api/auth/register — tylko ADMINISTRATOR, wymaga JWT
  register: (payload: RegisterPayload) =>
    apiFetch<{ success: boolean; message: string; user: UserResponse }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(payload) }
    ),
};

// ─── SESSIONS API ─────────────────────────────────────────────────────────────
// Ścieżki z sessions.routes.ts: GET /, POST /
// UWAGA: backend zwraca { success: true, data: sessions[] }

export const sesjeApi = {
  // GET /api/sessions — publiczne, bez autoryzacji
  list: () => apiData<Session[]>('/sessions'),

  // POST /api/sessions — wymaga JWT + rola ADMINISTRATOR lub PRZEWODNICZACY
  create: (payload: CreateSessionPayload) =>
    apiData<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── USERS API ────────────────────────────────────────────────────────────────
// Ścieżki z users.routes.ts: GET /
// Zwraca listę użytkowników z { id, login, firstName, lastName, role: { name } }

export const uzytkownicyApi = {
  // GET /api/users — wymaga JWT + rola ADMINISTRATOR lub PRZEWODNICZACY
  list: () => apiData<UserListItem[]>('/users'),
};
