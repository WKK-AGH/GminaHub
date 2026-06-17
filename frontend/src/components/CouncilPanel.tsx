import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Bell, LogOut,
  Clock, FileText, ChevronRight, TrendingUp,
  Users, AlertCircle, Loader2, Radio, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionsApi, ROLE_LABEL, type Session } from '../api/api';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const SESSION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PLANNED:  { label: 'Upcoming',  className: 'bg-amber-50  text-amber-700  border-amber-200' },
  ACTIVE:   { label: 'Active',    className: 'bg-blue-50   text-blue-700   border-blue-200'  },
  FINISHED: { label: 'Finished',  className: 'bg-slate-100 text-slate-600  border-slate-200' },
};

// ─── SESSION CARD ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const config   = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.PLANNED;
  const itemCount = session.agendaItems?.length ?? 0;

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:border-slate-300 ${
      session.status === 'ACTIVE' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-bold text-slate-900 text-sm leading-snug">{session.title}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 border ${config.className}`}>
          {config.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(session.scheduledAt)}</span>
        <span className="flex items-center gap-1.5"><Clock        className="w-3.5 h-3.5" />{formatTime(session.scheduledAt)}</span>
        {itemCount > 0 && (
          <span className="flex items-center gap-1.5 col-span-2">
            <FileText className="w-3.5 h-3.5" />{itemCount} agenda items
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        {session.status === 'ACTIVE' && (
          <Link to={`/live/${session.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> Join voting
          </Link>
        )}
        <Link to={`/session/${session.id}`} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 ml-auto">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type ActiveTab = 'dashboard' | 'sessions' | 'notifications';

export default function CouncilPanel() {
  const { currentUser, logout, hasRole } = useAuth();
  const [activeTab,  setActiveTab]  = useState<ActiveTab>('dashboard');
  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const canManage = hasRole('PRZEWODNICZACY', 'ADMINISTRATOR');

  // Fetch sessions from API: GET /api/sessions
  useEffect(() => {
    sessionsApi.list()
      .then(data => setSessions(data))
      .catch(err  => setError(err.message ?? 'Failed to load sessions'))
      .finally(()  => setIsLoading(false));
  }, []);

  if (!currentUser) return null;

  const activeSessions   = sessions.filter(s => s.status === 'ACTIVE');
  const upcomingSessions = sessions.filter(s => s.status === 'PLANNED');
  const finishedSessions = sessions.filter(s => s.status === 'FINISHED');

  const tabs = [
    { id: 'dashboard'     as ActiveTab, label: 'Dashboard',     icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sessions'      as ActiveTab, label: 'Sessions',       icon: <CalendarDays    className="w-4 h-4" /> },
    { id: 'notifications' as ActiveTab, label: 'Notifications',  icon: <Bell            className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[80vh] bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
              {currentUser.initials}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{currentUser.fullName}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[currentUser.role]}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome, {currentUser.firstName}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Panel · e-Session: Digital Municipal Council</p>
              </div>
              {canManage && (
                <Link to="/session/new"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm">
                  <Plus className="w-4 h-4" /> New session
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <CalendarDays className="w-5 h-5" />, label: 'Total sessions',  value: sessions.length,        bg: 'bg-blue-50',    tc: 'text-blue-600'    },
                { icon: <Radio        className="w-5 h-5" />, label: 'Active',          value: activeSessions.length,  bg: 'bg-emerald-50', tc: 'text-emerald-600' },
                { icon: <Clock        className="w-5 h-5" />, label: 'Upcoming',        value: upcomingSessions.length,bg: 'bg-amber-50',   tc: 'text-amber-600'   },
                { icon: <TrendingUp   className="w-5 h-5" />, label: 'Finished',        value: finishedSessions.length,bg: 'bg-slate-100',  tc: 'text-slate-600'   },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.tc}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none">{isLoading ? '–' : stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading sessions...</span>
              </div>
            )}

            {activeSessions.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-blue-600" /> Session in progress
                </h2>
                <div className="space-y-3">{activeSessions.map(s => <SessionCard key={s.id} session={s} />)}</div>
              </div>
            )}

            {upcomingSessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" /> Upcoming sessions
                  </h2>
                  <button onClick={() => setActiveTab('sessions')} className="text-xs text-blue-600 font-semibold hover:underline">
                    View all →
                  </button>
                </div>
                <div className="space-y-3">{upcomingSessions.slice(0, 3).map(s => <SessionCard key={s.id} session={s} />)}</div>
              </div>
            )}

            {canManage && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Management
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link to="/session/new"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                    <Plus className="w-4 h-4" /> New session
                  </Link>
                  <Link to="/committees"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
                    <Users className="w-4 h-4" /> Committees & members
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SESSIONS */}
        {activeTab === 'sessions' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All sessions</h1>
              {canManage && (
                <Link to="/session/new"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition">
                  <Plus className="w-4 h-4" /> New session
                </Link>
              )}
            </div>
            {isLoading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>}
            {error    && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>}
            {!isLoading && !error && sessions.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No sessions in the system</p>
                {canManage && (
                  <Link to="/session/new" className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-blue-600 hover:underline">
                    <Plus className="w-4 h-4" /> Create first session
                  </Link>
                )}
              </div>
            )}
            <div className="space-y-3">{sessions.map(s => <SessionCard key={s.id} session={s} />)}</div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No new notifications</p>
            <p className="text-sm mt-1">Notifications will be available after WebSocket implementation</p>
          </div>
        )}
      </div>
    </div>
  );
}
