import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Bell, LogOut,
  Clock, FileText, ChevronRight, TrendingUp,
  Users, AlertCircle, Loader2, Radio, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sesjeApi, ROLA_LABEL, type Session } from '../api/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_SESJI: Record<string, { label: string; cls: string }> = {
  PLANNED:  { label: 'Nadchodząca', cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  ACTIVE:   { label: 'W trakcie',   cls: 'bg-blue-50   text-blue-700   border-blue-200'  },
  FINISHED: { label: 'Zakończona',  cls: 'bg-slate-100 text-slate-600  border-slate-200' },
};

function KartaSesji({ sesja }: { sesja: Session }) {
  const cfg = STATUS_SESJI[sesja.status] ?? STATUS_SESJI.PLANNED;
  const punktow = sesja.agendaItems?.length ?? 0;
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:border-slate-300 ${sesja.status === 'ACTIVE' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-bold text-slate-900 text-sm leading-snug">{sesja.title}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 border ${cfg.cls}`}>{cfg.label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatDate(sesja.scheduledAt)}</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatTime(sesja.scheduledAt)}</span>
        {punktow > 0 && <span className="flex items-center gap-1.5 col-span-2"><FileText className="w-3.5 h-3.5" />{punktow} pkt. agendy</span>}
      </div>
      <div className="flex gap-2 mt-3">
        {sesja.status === 'ACTIVE' && (
          <Link to={`/live/${sesja.id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> Dołącz do głosowania
          </Link>
        )}
        <Link to={`/sesja/${sesja.id}`} className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 ml-auto">
          Szczegóły <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

type Tab = 'dashboard' | 'sesje' | 'powiadomienia';

export default function PanelRadnego() {
  const { uzytkownik, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sesje,   setSesje]   = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const mozeTworzyc = hasRole('PRZEWODNICZACY', 'ADMINISTRATOR');

  useEffect(() => {
    sesjeApi.list()
      .then(data => setSesje(data))
      .catch(err => setError(err.message ?? 'Błąd pobierania sesji'))
      .finally(() => setLoading(false));
  }, []);

  if (!uzytkownik) return null;

  const aktywne     = sesje.filter(s => s.status === 'ACTIVE');
  const nadchodzace = sesje.filter(s => s.status === 'PLANNED');
  const zakonczone  = sesje.filter(s => s.status === 'FINISHED');

  const tabs = [
    { id: 'dashboard'     as Tab, label: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sesje'         as Tab, label: 'Sesje',        icon: <CalendarDays    className="w-4 h-4" /> },
    { id: 'powiadomienia' as Tab, label: 'Powiadomienia',icon: <Bell            className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[80vh] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">{uzytkownik.inicjaly}</div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{uzytkownik.imieNazwisko}</p>
              <p className="text-xs text-slate-400">{ROLA_LABEL[uzytkownik.rola]}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium">
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
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
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Witaj, {uzytkownik.firstName}</h1>
                <p className="text-slate-500 text-sm mt-1">Panel · e-Sesja: Cyfrowa Rada Gminy</p>
              </div>
              {/* Przycisk nowej sesji — tylko dla Przewodniczącego i Admina */}
              {mozeTworzyc && (
                <Link to="/sesja/nowa"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm">
                  <Plus className="w-4 h-4" /> Nowa sesja
                </Link>
              )}
            </div>

            {/* Statystyki */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <CalendarDays className="w-5 h-5" />, label: 'Sesji łącznie', value: sesje.length,      bg: 'bg-blue-50',    ic: 'text-blue-600'    },
                { icon: <Radio        className="w-5 h-5" />, label: 'Aktywne',       value: aktywne.length,    bg: 'bg-emerald-50', ic: 'text-emerald-600' },
                { icon: <Clock        className="w-5 h-5" />, label: 'Nadchodzące',   value: nadchodzace.length,bg: 'bg-amber-50',   ic: 'text-amber-600'   },
                { icon: <TrendingUp   className="w-5 h-5" />, label: 'Zakończone',    value: zakonczone.length, bg: 'bg-slate-100',  ic: 'text-slate-600'   },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.ic}`}>{s.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{s.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none">{loading ? '–' : s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Pobieranie sesji...</span>
              </div>
            )}

            {aktywne.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Radio className="w-4 h-4 text-blue-600" /> Sesja w toku</h2>
                <div className="space-y-3">{aktywne.map(s => <KartaSesji key={s.id} sesja={s} />)}</div>
              </div>
            )}

            {nadchodzace.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-600" /> Nadchodzące sesje</h2>
                  <button onClick={() => setActiveTab('sesje')} className="text-xs text-blue-600 font-semibold hover:underline">Zobacz wszystkie →</button>
                </div>
                <div className="space-y-3">{nadchodzace.slice(0, 3).map(s => <KartaSesji key={s.id} sesja={s} />)}</div>
              </div>
            )}

            {/* Panel zarządzania dla Przewodniczącego/Admina */}
            {mozeTworzyc && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Zarządzanie
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Link to="/sesja/nowa"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                    <Plus className="w-4 h-4" /> Nowa sesja
                  </Link>
                  <Link to="/komisje"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
                    <Users className="w-4 h-4" /> Komisje i członkowie
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SESJE */}
        {activeTab === 'sesje' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wszystkie sesje</h1>
              {mozeTworzyc && (
                <Link to="/sesja/nowa"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition">
                  <Plus className="w-4 h-4" /> Nowa sesja
                </Link>
              )}
            </div>
            {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>}
            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>}
            {!loading && !error && sesje.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Brak sesji w systemie</p>
                {mozeTworzyc && (
                  <Link to="/sesja/nowa" className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-blue-600 hover:underline">
                    <Plus className="w-4 h-4" /> Utwórz pierwszą sesję
                  </Link>
                )}
              </div>
            )}
            <div className="space-y-3">{sesje.map(s => <KartaSesji key={s.id} sesja={s} />)}</div>
          </div>
        )}

        {/* POWIADOMIENIA */}
        {activeTab === 'powiadomienia' && (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Brak nowych powiadomień</p>
            <p className="text-sm mt-1">Powiadomienia będą dostępne po implementacji WebSocket</p>
          </div>
        )}
      </div>
    </div>
  );
}
