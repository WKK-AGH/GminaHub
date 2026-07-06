const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:5000';

// ─── TYPY PODSTAWOWE ──────────────────────────────────────────────────────────

export interface ApiError { message: string; status: number; }

export type UserRole      = 'MEMBER' | 'CHAIRPERSON' | 'ADMIN';
export type SessionStatus = 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED';
export type VotingStatus  = 'PENDING' | 'OPEN' | 'CLOSED';
export type VoteValue     = 'FOR' | 'AGAINST' | 'ABSTAIN';

export const ROLE_LABEL: Record<UserRole, string> = {
  MEMBER:         'Radny',
  CHAIRPERSON:    'Przewodniczący',
  ADMIN:          'Administrator',
};

export const VOTE_LABEL: Record<VoteValue, string> = {
  FOR:     'ZA',
  AGAINST: 'PRZECIW',
  ABSTAIN: 'WSTRZYMUJĘ',
};

export const SESSION_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Nadchodząca',
  ACTIVE:    'W trakcie',
  CONCLUDED: 'Zakończona',
};

export const VOTING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Oczekuje',
  OPEN:    'Aktywne',
  CLOSED:  'Zakończone',
};

// ─── MODELE — Użytkownik ──────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  login?: string;
  email?: string;
}

export interface UserListItem {
  id: string;
  login: string;
  email?: string;
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

export interface LoginPayload    { email: string; password: string; }
export interface LoginResponse   { success: boolean; accessToken: string; user: UserResponse; }
export interface RefreshResponse { success: boolean; accessToken: string; }

export interface RegisterPayload {
  email: string; password: string;
  firstName: string; lastName: string;
  role: UserRole;
}

// ─── MODELE — Sesja ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  title: string;
  status: SessionStatus;
  // Backend może zwracać różne nazwy pola daty
  scheduledAt?: string;
  scheduledDate?: string;
  scheduled_date?: string;
  date?: string;
  // Dodatkowe pola z ERD
  committeeId?: string | null;
  committee_id?: string | null;
  chairUserId?: string | null;
  quorumRequired?: number;
  currentAgendaItemId?: string | null;
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
  order?: number;       // Prisma/camelCase
  position?: number;    // SQL/snake_case z ERD
  sessionId?: string;
  session_id?: string;
  documents: SessionDocument[];
  voting: Voting[];
  status?: string;
}

export interface SessionDocument {
  id: string;
  title?: string;       // alias
  fileName?: string;    // Prisma camelCase
  file_name?: string;   // SQL snake_case z ERD
  fileUrl?: string;
  file_url?: string;    // SQL snake_case z ERD
  agendaItemId?: string;
  agenda_item_id?: string;
  uploadedAt?: string;
  fileSize?: number;
  mimeType?: string;
  deletedAt?: string | null;
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
  agendaItemId?: string;
  agenda_item_id?: string;
  startedAt?: string;
  endedAt?: string;
  totalEligibleVoters?: number;
  totalVotesCast?: number;
  isValid?: boolean | null;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  value?: VoteValue;    // Prisma camelCase
  choice?: VoteValue;   // SQL snake_case z ERD
  votingId?: string;
  voting_id?: string;
  userId?: string;
  user_id?: string;
  user?: UserListItem;
  votedAt?: string;
}

export interface CastVotePayload { value?: VoteValue; choice?: VoteValue; }

// ─── MODELE — Podsumowanie / Logi ─────────────────────────────────────────────

export interface SessionSummary {
  id?: string;
  sessionId?: number | string;
  session_id?: number | string;
  attendanceCount?: number;
  notes?: string;
  content?: string;     // używane przez frontend
  pdfExportUrl?: string;
  pdf_export_url?: string;
  createdAt?: string;
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
  list:         ()                               => apiData<Session[]>('/sessions'),
  getById:      (id: string)                     => apiData<Session>(`/sessions/${id}`),
  create:       (payload: CreateSessionPayload)  => apiData<Session>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: string)     => apiData<Session>(`/sessions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  addAgenda:    (id: string, payload: { title: string; order: number }) => apiData<AgendaItem>(`/sessions/${id}/agenda`, { method: 'POST', body: JSON.stringify(payload) }),
  getStatistics:(id: string)                     => apiData<unknown>(`/sessions/${id}/statistics`),
  createSummary:(id: string, content: string)    => apiData<unknown>(`/sessions/${id}/summary`, { method: 'POST', body: JSON.stringify({ content }) }),
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

// ─── DOKUMENTY API ────────────────────────────────────────────────────────────

export const documentsApi = {
  upload: async (agendaItemId: string, file: File): Promise<SessionDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/agenda-items/${agendaItemId}/documents`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      let message = `Błąd ${res.status}`;
      try { const body = await res.json(); message = body.message ?? message; } catch { /* ignoruj */ }
      throw { message, status: res.status } as ApiError;
    }

    const data = await res.json();
    return data.data as SessionDocument;
  },

  delete: (documentId: string) => apiData<void>(`/documents/${documentId}`, { method: 'DELETE' }),
};
