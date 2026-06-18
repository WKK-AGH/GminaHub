const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:5000';

// ─── TYPY PODSTAWOWE ──────────────────────────────────────────────────────────

export interface ApiError { message: string; status: number; }

export type UserRole     = 'RADNY' | 'PRZEWODNICZACY' | 'ADMINISTRATOR';
export type SessionStatus = 'PLANNED' | 'ACTIVE' | 'FINISHED';
export type VotingStatus  = 'PENDING' | 'ACTIVE' | 'COMPLETED';
export type VoteValue     = 'YES' | 'NO' | 'ABSTAIN';

export const ROLE_LABEL: Record<UserRole, string> = {
  RADNY:          'Radny',
  PRZEWODNICZACY: 'Przewodniczący',
  ADMINISTRATOR:  'Administrator',
};

export const VOTE_LABEL: Record<VoteValue, string> = {
  YES:     'ZA',
  NO:      'PRZECIW',
  ABSTAIN: 'WSTRZYMUJĘ',
};

export const SESSION_STATUS_LABEL: Record<string, string> = {
  PLANNED:  'Nadchodząca',
  ACTIVE:   'W trakcie',
  FINISHED: 'Zakończona',
};

export const VOTING_STATUS_LABEL: Record<string, string> = {
  PENDING:   'Oczekuje',
  ACTIVE:    'Aktywne',
  COMPLETED: 'Zakończone',
};

// ─── MODELE — Użytkownik ──────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  login?: string;
}

export interface UserListItem {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: { name: UserRole };
}

export function getFullName(user: UserResponse | UserListItem): string {
  return `${user.firstName} ${user.lastName}`;
}

export function getInitials(user: UserResponse | UserListItem): string {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

// ─── MODELE — Auth ────────────────────────────────────────────────────────────

export interface LoginPayload    { login: string; password: string; }
export interface LoginResponse   { success: boolean; accessToken: string; user: UserResponse; }
export interface RefreshResponse { success: boolean; accessToken: string; }

export interface RegisterPayload {
  login: string; password: string;
  firstName: string; lastName: string;
  role: UserRole;
}

// ─── MODELE — Sesja ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  title: string;
  status: SessionStatus;
  scheduledAt: string;
  committeeId: string | null;
  committee: Committee | null;
  agendaItems?: AgendaItem[];
  summary?: SessionSummary | null;
}

export interface CreateSessionPayload {
  title: string;
  scheduledAt: string;
  committeeId?: string;
}

// ─── MODELE — Punkt agendy ────────────────────────────────────────────────────

export interface AgendaItem {
  id: string;
  title: string;
  order: number;
  sessionId: string;
  documents: SessionDocument[];
  voting: Voting[];
}

export interface SessionDocument {
  id: string;
  title: string;
  fileUrl: string;
  agendaItemId: string;
}

// ─── MODELE — Komisja ─────────────────────────────────────────────────────────

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

// ─── MODELE — Głosowanie ──────────────────────────────────────────────────────

export interface Voting {
  id: string;
  title: string;
  status: VotingStatus;
  agendaItemId: string;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  value: VoteValue;
  votingId: string;
  userId: string;
  user?: UserListItem;
}

export interface CastVotePayload { value: VoteValue; }

// ─── MODELE — Podsumowanie / Logi ─────────────────────────────────────────────

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

// ─── TOKEN ────────────────────────────────────────────────────────────────────

let _accessToken: string | null = null;
export function setAccessToken(token: string | null) { _accessToken = token; }
export function getAccessToken() { return _accessToken; }

// ─── REFRESH ──────────────────────────────────────────────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async res => {
      if (!res.ok) throw new Error('Refresh nieudany');
      const data: RefreshResponse = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch(() => { setAccessToken(null); return null; })
    .finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

// ─── KLIENT HTTP ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, options, false);
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw { message: 'Sesja wygasła. Zaloguj się ponownie.', status: 401 } as ApiError;
  }

  if (!res.ok) {
    let message = `Błąd ${res.status}`;
    try { const body = await res.json(); message = body.message ?? message; } catch { /* ignoruj */ }
    throw { message, status: res.status } as ApiError;
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                => apiFetch<T>(path),
  post:   <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown)=> apiFetch<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)               => apiFetch<T>(path, { method: 'DELETE' }),
};

// ─── WRAPPER BACKENDU ─────────────────────────────────────────────────────────

interface BackendResponse<T> { success: boolean; data: T; message?: string; }

async function apiData<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch<BackendResponse<T>>(path, options);
  return res.data;
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login:    (payload: LoginPayload)    => apiFetch<LoginResponse>('/auth/login',    { method: 'POST', body: JSON.stringify(payload) }),
  logout:   ()                         => apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  refresh:  ()                         => apiFetch<RefreshResponse>('/auth/refresh', { method: 'POST' }),
  register: (payload: RegisterPayload) => apiFetch<{ success: boolean; user: UserResponse }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
};

// ─── SESJE API ────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list:    ()                               => apiData<Session[]>('/sessions'),
  getById: (id: string)                    => apiData<Session>(`/sessions/${id}`),
  create:  (payload: CreateSessionPayload) => apiData<Session>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
};

// ─── GŁOSOWANIA API ───────────────────────────────────────────────────────────

export const votingsApi = {
  start:   (votingId: string)                           => apiData<Voting>(`/votings/${votingId}/start`,   { method: 'PATCH' }),
  end:     (votingId: string)                           => apiData<Voting>(`/votings/${votingId}/end`,     { method: 'PATCH' }),
  vote:    (votingId: string, payload: CastVotePayload) => apiData<void>(`/votings/${votingId}/vote`,      { method: 'POST', body: JSON.stringify(payload) }),
  results: (votingId: string)                           => apiData<Voting>(`/votings/${votingId}/results`),
};

// ─── UŻYTKOWNICY API ──────────────────────────────────────────────────────────

export const usersApi = {
  list: () => apiData<UserListItem[]>('/users'),
};
