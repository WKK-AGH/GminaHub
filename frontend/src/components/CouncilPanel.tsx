import {
    AlertCircle,
    BarChart2,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    LogOut,
    Plus,
    Radio,
    Search,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_LABEL, sessionsApi, type Session } from '../api/api';
import { useAuth } from '../context/AuthContext';
import AddToCalendar from './AddToCalendar';

// ─── SKELETON ────────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-white border border-slate-200 rounded p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-5 bg-slate-100 rounded w-20" />
            </div>
            <div className="flex gap-4 mb-3">
                <div className="h-3 bg-slate-100 rounded w-28" />
                <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
            <div className="border-t border-slate-100 pt-2">
                <div className="h-3 bg-slate-100 rounded w-16 ml-auto" />
            </div>
        </div>
    );
}

function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-slate-200 rounded" />
                        <div className="space-y-1.5">
                            <div className="h-2.5 bg-slate-100 rounded w-16" />
                            <div className="h-5 bg-slate-200 rounded w-8" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── POWIADOMIENIE ────────────────────────────────────────────────────────────

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
    time: string;
    read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [];

// ─── KARTA SESJI ──────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PLANNED: { label: 'Zaplanowana', className: 'text-amber-700 bg-amber-50 border-amber-300' },
    ACTIVE: { label: 'W trakcie', className: 'text-[#B91C1C] bg-red-50  border-red-300' },
    FINISHED: { label: 'Zakończona', className: 'text-slate-500 bg-slate-100 border-slate-300' },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function SessionCard({ session }: { session: Session }) {
    const cfg = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.PLANNED;
    const itemCount = session.agendaItems?.length ?? 0;
    return (
        <div
            className={`bg-white border rounded p-4 hover:border-slate-300 transition ${session.status === 'ACTIVE' ? 'border-l-4 border-l-[#B91C1C] border-slate-200' : 'border-slate-200'}`}
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-slate-900 text-sm leading-snug">{session.title}</p>
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${cfg.className}`}
                >
                    {cfg.label}
                </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(
                        session.scheduledAt ??
                            session.scheduledDate ??
                            session.scheduled_date ??
                            session.date ??
                            '',
                    )}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(
                        session.scheduledAt ??
                            session.scheduledDate ??
                            session.scheduled_date ??
                            session.date ??
                            '',
                    )}
                </span>
                {itemCount > 0 && (
                    <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {itemCount} pkt. agendy
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
                {session.status === 'ACTIVE' && (
                    <Link
                        to={`/live/${session.id}`}
                        className="text-xs font-semibold text-[#B91C1C] hover:underline flex items-center gap-1"
                    >
                        <Radio className="w-3.5 h-3.5" /> Dołącz do głosowania
                    </Link>
                )}
                {session.status === 'SCHEDULED' && (
                    <AddToCalendar session={session} variant="link" />
                )}
                <Link
                    to={`/sesja/${session.id}`}
                    className="text-xs font-semibold text-slate-500 hover:text-[#B91C1C] flex items-center gap-1 ml-auto"
                >
                    Szczegóły <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

type ActiveTab = 'dashboard' | 'sessions' | 'notifications';

export default function CouncilPanel() {
    const { currentUser, logout, hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);

    const canManage = hasRole('CHAIRPERSON', 'ADMIN');
    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        sessionsApi
            .list()
            .then((data) => setSessions(data))
            .catch((err) => setError(err.message ?? 'Błąd pobierania sesji'))
            .finally(() => setLoading(false));
    }, []);

    if (!currentUser) return null;

    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
    const plannedSessions = sessions.filter((s) => s.status === 'SCHEDULED');
    const finishedSessions = sessions.filter((s) => s.status === 'CONCLUDED');

    // Filtrowanie i wyszukiwanie
    const filteredSessions = useMemo(() => {
        return sessions.filter((s) => {
            const matchesQuery = s.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
            return matchesQuery && matchesStatus;
        });
    }, [sessions, searchQuery, statusFilter]);

    const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const markRead = (id: string) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    const tabs = [
        { id: 'dashboard' as ActiveTab, label: 'Pulpit' },
        { id: 'sessions' as ActiveTab, label: 'Sesje' },
        {
            id: 'notifications' as ActiveTab,
            label: (
                <span className="flex items-center gap-1.5">
                    Powiadomienia
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-[#B91C1C] text-white text-[10px] font-bold rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </span>
            ),
        },
    ];

    return (
        <div className="min-h-[80vh] bg-slate-50">
            {/* Nagłówek */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#B91C1C] flex items-center justify-center text-white font-bold text-sm">
                            {currentUser.initials}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 text-sm">
                                {currentUser.fullName}
                            </p>
                            <p className="text-xs text-slate-400">{ROLE_LABEL[currentUser.role]}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-50 transition"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Wyloguj</span>
                    </button>
                </div>
            </div>

            {/* Zakładki */}
            <div className="bg-white border-b border-slate-200 px-4">
                <div className="max-w-5xl mx-auto flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-[#B91C1C] text-[#B91C1C]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-7">
                {/* ── PULPIT ── */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-7">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-xl font-bold text-[#B91C1C]">
                                    Dzień dobry, {currentUser.firstName}
                                </h1>
                            </div>
                            {canManage && (
                                <Link
                                    to="/sesja/nowa"
                                    className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold px-4 py-2 rounded text-sm transition"
                                >
                                    <Plus className="w-4 h-4" /> Nowa sesja
                                </Link>
                            )}
                        </div>

                        {loading ? (
                            <SkeletonStats />
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    {
                                        label: 'Sesji łącznie',
                                        value: sessions.length,
                                        icon: <CalendarDays className="w-4 h-4" />,
                                    },
                                    {
                                        label: 'Aktywne',
                                        value: activeSessions.length,
                                        icon: <Radio className="w-4 h-4" />,
                                    },
                                    {
                                        label: 'Nadchodzące',
                                        value: plannedSessions.length,
                                        icon: <Clock className="w-4 h-4" />,
                                    },
                                    {
                                        label: 'Zakończone',
                                        value: finishedSessions.length,
                                        icon: <BarChart2 className="w-4 h-4" />,
                                    },
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="bg-white border border-slate-200 rounded p-4 flex items-center gap-3"
                                    >
                                        <div className="text-[#B91C1C] opacity-70">{stat.icon}</div>
                                        <div>
                                            <p className="text-xs text-slate-500">{stat.label}</p>
                                            <p className="text-xl font-bold text-[#B91C1C]">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {loading && (
                            <div className="space-y-2">
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        )}

                        {!loading && activeSessions.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-[#B91C1C]" /> Sesja w toku
                                </h2>
                                <div className="space-y-2">
                                    {activeSessions.map((s) => (
                                        <SessionCard key={s.id} session={s} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loading && plannedSessions.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-[#B91C1C]" />{' '}
                                        Nadchodzące sesje
                                    </h2>
                                    <button
                                        onClick={() => setActiveTab('sessions')}
                                        className="text-xs text-[#B91C1C] font-semibold hover:underline"
                                    >
                                        Wszystkie →
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {plannedSessions.slice(0, 3).map((s) => (
                                        <SessionCard key={s.id} session={s} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {canManage && (
                            <div className="bg-white border border-slate-200 rounded p-4">
                                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-[#B91C1C]" /> Zarządzanie
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        to="/sesja/nowa"
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-2 rounded transition"
                                    >
                                        <Plus className="w-4 h-4" /> Nowa sesja
                                    </Link>
                                    <Link
                                        to="/komisje"
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C] border border-[#B91C1C] hover:bg-red-50 px-4 py-2 rounded transition"
                                    >
                                        <Users className="w-4 h-4" /> Komisje
                                    </Link>
                                    {hasRole('ADMIN') && (
                                        <Link
                                            to="/uzytkownicy"
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded transition"
                                        >
                                            <Users className="w-4 h-4" /> Użytkownicy
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {!loading && sessions.length === 0 && !error && (
                            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded bg-white">
                                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">Brak sesji w systemie</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── SESJE + WYSZUKIWARKA ── */}
                {activeTab === 'sessions' && (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h1 className="text-xl font-bold text-[#B91C1C]">Wszystkie sesje</h1>
                            {canManage && (
                                <Link
                                    to="/sesja/nowa"
                                    className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold px-4 py-2 rounded text-sm transition"
                                >
                                    <Plus className="w-4 h-4" /> Nowa sesja
                                </Link>
                            )}
                        </div>

                        {/* Wyszukiwarka i filtry */}
                        <div className="bg-white border border-slate-200 rounded p-4 mb-4 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Szukaj sesji po nazwie..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { value: 'ALL', label: 'Wszystkie' },
                                    { value: 'ACTIVE', label: 'W trakcie' },
                                    { value: 'PLANNED', label: 'Zaplanowane' },
                                    { value: 'FINISHED', label: 'Zakończone' },
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setStatusFilter(f.value)}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded border transition ${statusFilter === f.value ? 'bg-[#B91C1C] text-white border-[#B91C1C]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#B91C1C] hover:text-[#B91C1C]'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading && (
                            <div className="space-y-2">
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        )}
                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                                {error}
                            </div>
                        )}

                        {!loading && filteredSessions.length === 0 && (
                            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded bg-white">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">
                                    {searchQuery
                                        ? `Brak wyników dla „${searchQuery}"`
                                        : 'Brak sesji w systemie'}
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setStatusFilter('ALL');
                                        }}
                                        className="text-xs text-[#B91C1C] font-semibold mt-2 hover:underline"
                                    >
                                        Wyczyść filtry
                                    </button>
                                )}
                            </div>
                        )}

                        {!loading && filteredSessions.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-400 mb-3">
                                    Znaleziono: {filteredSessions.length}{' '}
                                    {filteredSessions.length === 1 ? 'sesja' : 'sesji'}
                                </p>
                                <div className="space-y-2">
                                    {filteredSessions.map((s) => (
                                        <SessionCard key={s.id} session={s} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── POWIADOMIENIA ── */}
                {activeTab === 'notifications' && (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h1 className="text-xl font-bold text-[#B91C1C]">Powiadomienia</h1>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs font-semibold text-[#B91C1C] hover:underline"
                                >
                                    Oznacz wszystkie jako przeczytane
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded bg-white">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">Brak powiadomień</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`bg-white border rounded p-4 transition ${n.read ? 'border-slate-200' : 'border-l-4 border-l-[#B91C1C] border-slate-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-[#B91C1C]'}`}
                                                />
                                                <div>
                                                    <p
                                                        className={`text-sm font-semibold ${n.read ? 'text-slate-600' : 'text-slate-900'}`}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {n.time}
                                                    </p>
                                                </div>
                                            </div>
                                            {!n.read && (
                                                <button
                                                    onClick={() => markRead(n.id)}
                                                    className="text-xs text-slate-400 hover:text-[#B91C1C] shrink-0 flex items-center gap-1"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
