import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Bell, LogOut,
  Clock, FileText, ChevronRight, TrendingUp,
  Users, AlertCircle, Loader2, Radio, Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionsApi, ROLE_LABEL, type Session } from '../api/api';

function formatujDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatujCzas(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_SESJI: Record<string, { etykieta: string; klasa: string }> = {
  PLANNED:  { etykieta: 'Nadchodząca', klasa: 'bg-amber-50  text-amber-700  border-amber-200' },
  ACTIVE:   { etykieta: 'W trakcie',   klasa: 'bg-blue-50   text-blue-700   border-blue-200'  },
  FINISHED: { etykieta: 'Zakończona',  klasa: 'bg-slate-100 text-slate-600  border-slate-200' },
};

function KartaSesji({ sesja }: { sesja: Session }) {
  const cfg = STATUS_SESJI[sesja.status] ?? STATUS_SESJI.PLANNED;
  const liczbaPunktow = sesja.agendaItems?.length ?? 0;
  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all hover:border-slate-300 ${sesja.status === 'ACTIVE' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-bold text-slate-900 text-sm leading-snug">{sesja.title}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 border ${cfg.klasa}`}>{cfg.etykieta}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{formatujDate(sesja.scheduledAt)}</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatujCzas(sesja.scheduledAt)}</span>
        {liczbaPunktow > 0 && <span className="flex items-center gap-1.5 col-span-2"><FileText className="w-3.5 h-3.5" />{liczbaPunktow} pkt. agendy</span>}
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

type AktywnaZakladka = 'dashboard' | 'sesje' | 'powiadomienia';

export default function CouncilPanel() {
  const { currentUser, logout, hasRole } = useAuth();
  const [aktywnaZakladka, setAktywnaZakladka] = useState<AktywnaZakladka>('dashboard');
  const [sesje,     setSesje]     = useState<Session[]>([]);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad,      setBlad]      = useState<string | null>(null);

  const mozeZarzadzac = hasRole('PRZEWODNICZACY', 'ADMINISTRATOR');

  useEffect(() => {
    sessionsApi.list()
      .then(data => setSesje(data))
      .catch(err  => setBlad(err.message ?? 'Błąd pobierania sesji'))
      .finally(()  => setLadowanie(false));
  }, []);

  if (!currentUser) return null;

  const aktywne     = sesje.filter(s => s.status === 'ACTIVE');
  const nadchodzace = sesje.filter(s => s.status === 'PLANNED');
  const zakonczone  = sesje.filter(s => s.status === 'FINISHED');

  const zakladki = [
    { id: 'dashboard'     as AktywnaZakladka, etykieta: 'Dashboard',     ikona: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sesje'         as AktywnaZakladka, etykieta: 'Sesje',          ikona: <CalendarDays    className="w-4 h-4" /> },
    { id: 'powiadomienia' as AktywnaZakladka, etykieta: 'Powiadomienia',  ikona: <Bell            className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-[80vh] bg-slate-50">
      {/* Nagłówek */}
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
            <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>
      </div>

      {/* Zakładki */}
      <div className="bg-white border-b border-slate-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {zakladki.map(z => (
            <button key={z.id} onClick={() => setAktywnaZakladka(z.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${aktywnaZakladka === z.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
              {z.ikona}{z.etykieta}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* DASHBOARD */}
        {aktywnaZakladka === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Witaj, {currentUser.firstName}</h1>
                <p className="text-slate-500 text-sm mt-1">Panel · e-Sesja: Cyfrowa Rada Gminy</p>
              </div>
              {mozeZarzadzac && (
                <Link to="/sesja/nowa" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-sm">
                  <Plus className="w-4 h-4" /> Nowa sesja
                </Link>
              )}
            </div>

            {/* Statystyki */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { ikona: <CalendarDays className="w-5 h-5" />, etykieta: 'Sesji łącznie',  wartosc: sesje.length,        bg: 'bg-blue-50',    tc: 'text-blue-600'    },
                { ikona: <Radio        className="w-5 h-5" />, etykieta: 'Aktywne',        wartosc: aktywne.length,      bg: 'bg-emerald-50', tc: 'text-emerald-600' },
                { ikona: <Clock        className="w-5 h-5" />, etykieta: 'Nadchodzące',    wartosc: nadchodzace.length,  bg: 'bg-amber-50',   tc: 'text-amber-600'   },
                { ikona: <TrendingUp   className="w-5 h-5" />, etykieta: 'Zakończone',     wartosc: zakonczone.length,   bg: 'bg-slate-100',  tc: 'text-slate-600'   },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.tc}`}>{s.ikona}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{s.etykieta}</p>
                    <p className="text-2xl font-extrabold text-slate-900 leading-none">{ladowanie ? '–' : s.wartosc}</p>
                  </div>
                </div>
              ))}
            </div>

            {blad && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{blad}
              </div>
            )}

            {ladowanie && (
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
                  <button onClick={() => setAktywnaZakladka('sesje')} className="text-xs text-blue-600 font-semibold hover:underline">Zobacz wszystkie →</button>
                </div>
                <div className="space-y-3">{nadchodzace.slice(0, 3).map(s => <KartaSesji key={s.id} sesja={s} />)}</div>
              </div>
            )}

            {mozeZarzadzac && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Zarządzanie</h2>
                <div className="flex flex-wrap gap-3">
                  <Link to="/sesja/nowa" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                    <Plus className="w-4 h-4" /> Nowa sesja
                  </Link>
                  <Link to="/komisje" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
                    <Users className="w-4 h-4" /> Komisje
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SESJE */}
        {aktywnaZakladka === 'sesje' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Wszystkie sesje</h1>
              {mozeZarzadzac && (
                <Link to="/sesja/nowa" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition">
                  <Plus className="w-4 h-4" /> Nowa sesja
                </Link>
              )}
            </div>
            {ladowanie && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Ładowanie...</div>}
            {blad && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">{blad}</div>}
            {!ladowanie && !blad && sesje.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Brak sesji w systemie</p>
                {mozeZarzadzac && (
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
        {aktywnaZakladka === 'powiadomienia' && (
          <div className="text-center py-16 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Brak nowych powiadomień</p>
            <p className="text-sm mt-1">Powiadomienia pojawią się tutaj po wdrożeniu WebSocket</p>
          </div>
        )}
      </div>
    </div>
  );
}
