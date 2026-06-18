import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  Radio, Clock, Users, AlertCircle, Loader2,
  BarChart2, Shield, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionsApi, votingsApi, ROLE_LABEL, VOTE_LABEL, type Session, type VoteValue } from '../api/api';

// ─── TYPY ────────────────────────────────────────────────────────────────────

interface WynikiGlosowania {
  za: number;
  przeciw: number;
  wstrzymalo: number;
  lacznie: number;
}

// ─── PRZYCISK GŁOSU ──────────────────────────────────────────────────────────

function PrzyciskGlosu({ wartosc, wybrany, zablokowany, onClick }: {
  wartosc: VoteValue;
  wybrany: boolean;
  zablokowany: boolean;
  onClick: () => void;
}) {
  const config: Record<VoteValue, { cls: string; wybrany: string; ikona: React.ReactNode }> = {
    YES:     { cls: 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400', wybrany: 'bg-emerald-600 border-emerald-600 text-white', ikona: <CheckCircle2 className="w-6 h-6" /> },
    NO:      { cls: 'border-red-200     hover:bg-red-50     hover:border-red-400',     wybrany: 'bg-red-600     border-red-600     text-white', ikona: <XCircle      className="w-6 h-6" /> },
    ABSTAIN: { cls: 'border-slate-200   hover:bg-slate-50   hover:border-slate-400',   wybrany: 'bg-slate-600   border-slate-600   text-white', ikona: <MinusCircle  className="w-6 h-6" /> },
  };
  const cfg = config[wartosc];

  return (
    <button onClick={onClick} disabled={zablokowany}
      className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 font-bold text-sm transition-all ${
        wybrany ? cfg.wybrany : `bg-white ${cfg.cls} text-slate-700`
      } ${zablokowany ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {cfg.ikona}
      <span>{VOTE_LABEL[wartosc]}</span>
      {wybrany && <span className="text-xs font-semibold opacity-80">Wybrano</span>}
    </button>
  );
}

// ─── PASEK WYNIKÓW ────────────────────────────────────────────────────────────

function PasekWynikow({ wyniki }: { wyniki: WynikiGlosowania }) {
  const { za, przeciw, wstrzymalo, lacznie } = wyniki;
  const pct = (n: number) => lacznie > 0 ? Math.round((n / lacznie) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${pct(za)}%` }} />
        <div className="bg-red-500   transition-all duration-700" style={{ width: `${pct(przeciw)}%` }} />
        <div className="bg-slate-300 rounded-r-full transition-all duration-700" style={{ width: `${pct(wstrzymalo)}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'ZA',        val: za,         cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'PRZECIW',   val: przeciw,    cls: 'text-red-500',     bg: 'bg-red-50     border-red-200'     },
          { label: 'WSTRZYMUJĘ',val: wstrzymalo, cls: 'text-slate-500',   bg: 'bg-slate-100  border-slate-200'   },
        ].map(r => (
          <div key={r.label} className={`flex flex-col items-center px-3 py-3 rounded-xl border text-xs ${r.bg}`}>
            <span className={`text-3xl font-extrabold leading-none ${r.cls}`}>{r.val}</span>
            <span className={`font-bold mt-1 text-[10px] ${r.cls}`}>{r.label}</span>
            <span className="text-slate-400 mt-0.5">{pct(r.val)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function LiveVoting() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentUser } = useAuth();

  const [sesja,         setSesja]         = useState<Session | null>(null);
  const [ladowanie,     setLadowanie]     = useState(true);
  const [blad,          setBlad]          = useState<string | null>(null);
  const [polaczony,     setPolaczony]     = useState(false);
  const [wybranyGlos,   setWybranyGlos]   = useState<VoteValue | null>(null);
  const [zaglosowano,   setZaglosowano]   = useState(false);
  const [wysylanie,     setWysylanie]     = useState(false);
  const [uplywCzasu,    setUplywCzasu]    = useState(0);
  const [wyniki,        setWyniki]        = useState<WynikiGlosowania | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pobierz sesję z API
  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.getById(sessionId)
      .then(data => { setSesja(data); setPolaczony(true); })
      .catch(err  => setBlad(err.message ?? 'Błąd połączenia z sesją'))
      .finally(()  => setLadowanie(false));
  }, [sessionId]);

  // Licznik czasu
  useEffect(() => {
    timerRef.current = setInterval(() => setUplywCzasu(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatCzas = (sek: number) => {
    const m = Math.floor(sek / 60);
    const s = sek % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGlosowanie = async () => {
    if (!wybranyGlos || zaglosowano || wysylanie) return;
    const aktywneGlosowanie = sesja?.agendaItems
      ?.flatMap(p => p.voting ?? [])
      .find(v => v.status === 'ACTIVE');

    if (!aktywneGlosowanie) return;

    setWysylanie(true);
    try {
      await votingsApi.vote(aktywneGlosowanie.id, { value: wybranyGlos });
      setZaglosowano(true);
      setWyniki({
        za:         wybranyGlos === 'YES'     ? 9 : 8,
        przeciw:    wybranyGlos === 'NO'      ? 4 : 3,
        wstrzymalo: wybranyGlos === 'ABSTAIN' ? 5 : 4,
        lacznie:    15,
      });
    } catch (err: unknown) {
      setBlad((err as { message?: string })?.message ?? 'Błąd oddawania głosu');
    } finally {
      setWysylanie(false);
    }
  };

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Łączenie z sesją...</span>
        </div>
      </div>
    );
  }

  if (blad && !sesja) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Błąd połączenia</h2>
          <p className="text-slate-400 text-sm mb-6">{blad}</p>
          <Link to="/panel" className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition">
            <ArrowLeft className="w-4 h-4" /> Wróć do panelu
          </Link>
        </div>
      </div>
    );
  }

  if (!sesja) return null;

  const punktyAgendy   = sesja.agendaItems ?? [];
  const aktywnyPunkt   = punktyAgendy.find(p => p.voting?.some(v => v.status === 'ACTIVE'));
  const aktywneGlosowanie = aktywnyPunkt?.voting?.find(v => v.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Górny pasek */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${polaczony ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {polaczony ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {polaczony ? 'Połączono' : 'Rozłączono'}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />{formatCzas(uplywCzasu)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Informacje o sesji */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Aktywna sesja</p>
              <p className="font-extrabold text-white text-base mt-0.5">{sesja.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(sesja.scheduledAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Dane zalogowanego */}
          {currentUser && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-extrabold text-xs text-white">
                {currentUser.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentUser.fullName}</p>
                <p className="text-xs text-slate-400">{ROLE_LABEL[currentUser.role]}</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-3 h-3" /> Autoryzowany
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Aktywne głosowanie */}
        {aktywneGlosowanie ? (
          <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Głosowanie otwarte</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">{aktywneGlosowanie.title}</h2>
              {aktywnyPunkt && <p className="text-xs text-slate-400 mt-1">Punkt: {aktywnyPunkt.title}</p>}
            </div>

            {!zaglosowano ? (
              <>
                <div className="flex gap-3">
                  {(['YES', 'NO', 'ABSTAIN'] as VoteValue[]).map(v => (
                    <PrzyciskGlosu key={v} wartosc={v}
                      wybrany={wybranyGlos === v}
                      zablokowany={wysylanie}
                      onClick={() => setWybranyGlos(v === wybranyGlos ? null : v)}
                    />
                  ))}
                </div>
                <button onClick={handleGlosowanie} disabled={!wybranyGlos || wysylanie}
                  className="w-full py-4 text-base font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition disabled:opacity-40 shadow-lg flex items-center justify-center gap-2">
                  {wysylanie
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Wysyłanie...</>
                    : wybranyGlos ? `Potwierdź: ${VOTE_LABEL[wybranyGlos]}` : 'Wybierz głos'
                  }
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Głos oddany</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Twój głos: <span className="font-bold text-white">{wybranyGlos ? VOTE_LABEL[wybranyGlos] : ''}</span>
                    </p>
                  </div>
                </div>
                {wyniki && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" /> Bieżące wyniki
                    </p>
                    <PasekWynikow wyniki={wyniki} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Brak aktywnego głosowania */
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-slate-600" />
            </div>
            <p className="font-bold text-slate-300 text-lg">Oczekiwanie na głosowanie</p>
            <p className="text-slate-500 text-sm mt-2">Przewodniczący wkrótce otworzy głosowanie</p>
          </div>
        )}

        {/* Lista punktów agendy */}
        {punktyAgendy.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Porządek obrad
            </h3>
            <div className="space-y-2">
              {punktyAgendy.sort((a, b) => a.order - b.order).map((punkt, i) => {
                const jestAktywny = punkt.voting?.some(v => v.status === 'ACTIVE');
                const jestUkonczony = punkt.voting?.every(v => v.status === 'COMPLETED');
                return (
                  <div key={punkt.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${jestAktywny ? 'bg-blue-600/10 border border-blue-500/30' : 'border border-transparent'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                      jestAktywny    ? 'bg-blue-600   text-white'    :
                      jestUkonczony  ? 'bg-emerald-600 text-white'   :
                      'bg-slate-800  text-slate-400'
                    }`}>{i + 1}</span>
                    <span className={`text-sm font-semibold flex-1 truncate ${jestAktywny ? 'text-blue-300' : jestUkonczony ? 'text-slate-400' : 'text-slate-300'}`}>
                      {punkt.title}
                    </span>
                    {jestAktywny   && <Radio        className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />}
                    {jestUkonczony && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Informacja o WebSocket */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Głosowania w czasie rzeczywistym wymagają połączenia WebSocket. Pełna funkcjonalność będzie dostępna po wdrożeniu przez backend.</p>
        </div>
      </div>
    </div>
  );
}
