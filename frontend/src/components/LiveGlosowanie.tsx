import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Radio, Clock, Users, CheckCircle2, XCircle,
  MinusCircle, Lock, Shield, Crown, BarChart2, Wifi, WifiOff,
  AlertTriangle, RefreshCw, ChevronRight, Eye, EyeOff
} from 'lucide-react';

// ─── TYPY ────────────────────────────────────────────────────────────────────

type WyborGlosu = 'ZA' | 'PRZECIW' | 'WSTRZYMUJĘ';
type RolaUzytkownika = 'przewodniczacy' | 'radny' | 'gosc';
type StatusGlosowania = 'oczekiwanie' | 'aktywne' | 'zakonczone' | 'anulowane';

type WiadomoscWS =
  | { type: 'voting_started';  payload: { votingId: number; title: string; durationSeconds: number } }
  | { type: 'vote_cast';       payload: { za: number; przeciw: number; wstrzymalo: number; nieobecnych: number } }
  | { type: 'voting_ended';    payload: WynikiKoncowe }
  | { type: 'voting_canceled'; payload: { reason: string } }
  | { type: 'tick';            payload: { remaining: number } }
  | { type: 'presence';        payload: { online: number; total: number } };

interface WynikiKoncowe {
  votingId: number;
  title: string;
  za: number;
  przeciw: number;
  wstrzymalo: number;
  nieobecnych: number;
  uchwalona: boolean;
}

interface StanGlosowania {
  id: number | null;
  title: string;
  status: StatusGlosowania;
  mojGlos: WyborGlosu | null;
  wyniki: { za: number; przeciw: number; wstrzymalo: number; nieobecnych: number };
  pozostalo: number;        // sekundy
  maxCzas: number;
  wynikKoncowy: WynikiKoncowe | null;
  tajne: boolean;
}

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const WS_URL = 'ws://localhost:5000/ws/voting';

// Symulacja — w produkcji z AuthContext
const UZYTKOWNIK: { id: number; imie: string; rola: RolaUzytkownika } = {
  id: 2,
  imie: 'Jan Kowalski',
  rola: 'przewodniczacy',   // zmień na 'radny' lub 'gosc' by przetestować inne widoki
};

const SESJA = { id: 34, numer: 'XXXIV', nazwa: 'XXXIV Sesja Zwyczajna Rady Gminy' };

// ─── HOOK: WEBSOCKET ─────────────────────────────────────────────────────────

function useVotingWebSocket(onMessage: (msg: WiadomoscWS) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [polaczony, setPolaczony] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const retryRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // W środowisku demo (bez serwera) WebSocket rzuci błąd — to normalne.
    // Komponent i tak działa dzięki symulacji poniżej.
    try {
      const socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) return;
        setPolaczony(true);
        setReconnecting(false);
        socket.send(JSON.stringify({ type: 'join', sessionId: SESJA.id, userId: UZYTKOWNIK.id }));
      };

      socket.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data) as WiadomoscWS;
          onMessage(msg);
        } catch { /* ignoruj malformed */ }
      };

      socket.onclose = () => {
        if (!mountedRef.current) return;
        setPolaczony(false);
        setReconnecting(true);
        retryRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch { /* WebSocket unavailable */ }
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryRef.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { polaczony, reconnecting, send };
}

// ─── HOOK: SYMULACJA (demo bez serwera) ──────────────────────────────────────

function useSymulacja(onMessage: (msg: WiadomoscWS) => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const votingActive = useRef(false);
  const remainingRef = useRef(0);
  const wynikRef = useRef({ za: 0, przeciw: 0, wstrzymalo: 0 });

  const start = useCallback((title: string, duration: number) => {
    if (votingActive.current) return;
    votingActive.current = true;
    remainingRef.current = duration;
    wynikRef.current = { za: 0, przeciw: 0, wstrzymalo: 0 };

    onMessage({ type: 'voting_started', payload: { votingId: Date.now(), title, durationSeconds: duration } });

    timerRef.current = setInterval(() => {
      remainingRef.current -= 1;

      // Co 3 sekundy — symuluj losowy głos radnego
      if (remainingRef.current % 3 === 0) {
        const roll = Math.random();
        if (roll < 0.65) wynikRef.current.za += 1;
        else if (roll < 0.85) wynikRef.current.przeciw += 1;
        else wynikRef.current.wstrzymalo += 1;

        const oddane = wynikRef.current.za + wynikRef.current.przeciw + wynikRef.current.wstrzymalo;
        onMessage({
          type: 'vote_cast',
          payload: {
            ...wynikRef.current,
            nieobecnych: Math.max(0, 17 - oddane - 1), // -1 bo my jeszcze nie głosowaliśmy
          },
        });
      }

      onMessage({ type: 'tick', payload: { remaining: remainingRef.current } });

      if (remainingRef.current <= 0) {
        clearInterval(timerRef.current);
        votingActive.current = false;
        const { za, przeciw, wstrzymalo } = wynikRef.current;
        const oddane = za + przeciw + wstrzymalo;
        onMessage({
          type: 'voting_ended',
          payload: {
            votingId: Date.now(),
            title,
            za, przeciw, wstrzymalo,
            nieobecnych: 17 - oddane,
            uchwalona: za > (17 / 2),
          },
        });
      }
    }, 1000);
  }, [onMessage]);

  const addVote = useCallback((wybor: WyborGlosu) => {
    if (!votingActive.current) return;
    if (wybor === 'ZA') wynikRef.current.za += 1;
    else if (wybor === 'PRZECIW') wynikRef.current.przeciw += 1;
    else wynikRef.current.wstrzymalo += 1;

    const oddane = wynikRef.current.za + wynikRef.current.przeciw + wynikRef.current.wstrzymalo;
    onMessage({
      type: 'vote_cast',
      payload: { ...wynikRef.current, nieobecnych: Math.max(0, 17 - oddane) },
    });
  }, [onMessage]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { start, addVote };
}

// ─── POMOCNICZE ───────────────────────────────────────────────────────────────

function formatCzas(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function pct(n: number, total: number) {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

// ─── KOMPONENTY UI ────────────────────────────────────────────────────────────

function StatusPill({ status, reconnecting }: { status: boolean; reconnecting: boolean }) {
  if (reconnecting) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <RefreshCw className="w-3 h-3 animate-spin" /> Łączenie...
    </span>
  );
  if (status) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Wifi className="w-3 h-3" /> Połączono
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      <WifiOff className="w-3 h-3" /> Tryb demo
    </span>
  );
}

function TimerRing({ remaining, max }: { remaining: number; max: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const progress = max > 0 ? remaining / max : 0;
  const offset = circ * (1 - progress);
  const urgent = remaining <= 10 && remaining > 0;
  const color = urgent ? '#ef4444' : remaining <= 30 ? '#f59e0b' : '#2563eb';

  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 56 56)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold tabular-nums leading-none ${urgent ? 'text-red-500' : 'text-slate-900'}`}>
          {formatCzas(remaining)}
        </span>
        <span className="text-xs text-slate-400 font-semibold mt-0.5">pozostało</span>
      </div>
    </div>
  );
}

function WynikiBar({ za, przeciw, wstrzymalo, nieobecnych }: { za: number; przeciw: number; wstrzymalo: number; nieobecnych: number }) {
  const oddane = za + przeciw + wstrzymalo;
  const total = oddane + nieobecnych;

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-slate-100">
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${pct(za, total)}%` }} />
        <div className="bg-red-500   transition-all duration-700" style={{ width: `${pct(przeciw, total)}%` }} />
        <div className="bg-slate-400 transition-all duration-700" style={{ width: `${pct(wstrzymalo, total)}%` }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ZA',        val: za,          cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'PRZECIW',   val: przeciw,     cls: 'text-red-500',     bg: 'bg-red-50    border-red-200'    },
          { label: 'WSTRZYM.',  val: wstrzymalo,  cls: 'text-slate-500',   bg: 'bg-slate-100 border-slate-200'  },
          { label: 'NIEOBECNI', val: nieobecnych,  cls: 'text-slate-400',   bg: 'bg-slate-50  border-slate-200'  },
        ].map(({ label, val, cls, bg }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
            <p className={`text-2xl font-extrabold leading-none ${cls}`}>{val}</p>
            <p className={`text-xs font-bold mt-1 ${cls}`}>{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{pct(val, total)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PANEL PRZEWODNICZĄCEGO ───────────────────────────────────────────────────

const TEMATY_DEMO = [
  'Uchwała nr XV/102/26 w sprawie uchwalenia budżetu gminy na rok 2026',
  'Zmiana stawek podatku od nieruchomości',
  'Plan zagospodarowania przestrzennego — działka 412/B',
];

function PanelPrzewodniczacego({
  stan,
  onStart,
  onStop,
}: {
  stan: StanGlosowania;
  onStart: (title: string, duration: number, tajne: boolean) => void;
  onStop: () => void;
}) {
  const [tytul, setTytul] = useState(TEMATY_DEMO[0]);
  const [czas, setCzas] = useState(60);
  const [tajne, setTajne] = useState(false);
  const [customTytul, setCustomTytul] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
        <Crown className="w-4 h-4 text-blue-600" />
        Panel zarządzania głosowaniem
      </h2>

      {stan.status === 'aktywne' ? (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="relative flex h-2.5 w-2.5 mt-1 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
            </span>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Głosowanie w toku</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-snug">{stan.title}</p>
            </div>
          </div>
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition active:scale-[0.98]"
          >
            <AlertTriangle className="w-4 h-4" /> Zakończ głosowanie przedwcześnie
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Wybór tematu */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Temat głosowania</label>
            {!customTytul ? (
              <div className="space-y-1.5">
                {TEMATY_DEMO.map(t => (
                  <button
                    key={t}
                    onClick={() => setTytul(t)}
                    className={`w-full text-left text-sm px-3 py-2.5 rounded-lg border transition flex items-center gap-2 ${
                      tytul === t ? 'border-blue-300 bg-blue-50 text-blue-800 font-semibold' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${tytul === t ? 'text-blue-600' : 'text-slate-300'}`} />
                    <span className="truncate">{t}</span>
                  </button>
                ))}
                <button onClick={() => setCustomTytul(true)} className="text-xs text-blue-500 font-semibold hover:underline mt-1">
                  + Wpisz własny temat
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tytul}
                  onChange={e => setTytul(e.target.value)}
                  placeholder="Wpisz temat głosowania..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button onClick={() => setCustomTytul(false)} className="text-xs text-slate-400 font-semibold hover:underline">
                  ← Wróć do listy
                </button>
              </div>
            )}
          </div>

          {/* Czas */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Czas głosowania: <span className="text-slate-700">{czas}s</span>
            </label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map(s => (
                <button
                  key={s}
                  onClick={() => setCzas(s)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                    czas === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          {/* Tryb tajny */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setTajne(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${tajne ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${tajne ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              {tajne ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
              Głosowanie {tajne ? 'tajne' : 'jawne'}
            </span>
          </label>

          <button
            onClick={() => tytul.trim() && onStart(tytul, czas, tajne)}
            disabled={!tytul.trim() || stan.status === 'zakonczone'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Radio className="w-4 h-4" /> Otwórz głosowanie
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PANEL RADNEGO ────────────────────────────────────────────────────────────

function PanelRadnego({
  stan,
  onVote,
}: {
  stan: StanGlosowania;
  onVote: (wybor: WyborGlosu) => void;
}) {
  if (stan.status === 'oczekiwanie') {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Clock className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Oczekiwanie na głosowanie</p>
        <p className="text-sm text-slate-400">Przewodniczący otworzy głosowanie gdy nadejdzie odpowiedni punkt agendy.</p>
      </div>
    );
  }

  if (stan.status === 'aktywne') {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>
              Głosowanie otwarte
              {stan.tajne && <Lock className="w-3 h-3 ml-1 text-blue-400" />}
            </p>
            <p className="font-bold text-slate-900 text-base leading-snug">{stan.title}</p>
          </div>
          <TimerRing remaining={stan.pozostalo} max={stan.maxCzas} />
        </div>

        {stan.mojGlos ? (
          <div className="flex flex-col items-center gap-3 py-6 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Twój głos został zarejestrowany</p>
            <GlosChip glos={stan.mojGlos} large />
            {stan.tajne && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Lock className="w-3 h-3" /> Wyniki widoczne po zakończeniu głosowania
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { wybor: 'ZA'        as WyborGlosu, cls: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800', icon: <CheckCircle2 className="w-5 h-5" /> },
              { wybor: 'PRZECIW'   as WyborGlosu, cls: 'bg-red-600 hover:bg-red-700 active:bg-red-800',             icon: <XCircle      className="w-5 h-5" /> },
              { wybor: 'WSTRZYMUJĘ'as WyborGlosu, cls: 'bg-slate-600 hover:bg-slate-700 active:bg-slate-800',       icon: <MinusCircle  className="w-5 h-5" /> },
            ] as const).map(({ wybor, cls, icon }) => (
              <button
                key={wybor}
                onClick={() => onVote(wybor)}
                className={`${cls} text-white font-extrabold py-4 rounded-xl text-sm flex flex-col items-center gap-2 transition active:scale-[0.97] shadow-sm`}
              >
                {icon}
                {wybor}
              </button>
            ))}
          </div>
        )}

        {/* Wyniki bieżące (tylko jawne) */}
        {!stan.tajne && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Wyniki na żywo
            </p>
            <WynikiBar {...stan.wyniki} />
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── WYNIK KOŃCOWY ────────────────────────────────────────────────────────────

function WynikKoncowy({ wynik, mojGlos }: { wynik: WynikiKoncowe; mojGlos: WyborGlosu | null }) {
  const total = wynik.za + wynik.przeciw + wynik.wstrzymalo + wynik.nieobecnych;

  return (
    <div className={`rounded-2xl border-2 p-6 space-y-5 ${wynik.uchwalona ? 'border-emerald-300 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${wynik.uchwalona ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {wynik.uchwalona
            ? <CheckCircle2 className="w-6 h-6 text-white" />
            : <XCircle      className="w-6 h-6 text-white" />}
        </div>
        <div>
          <p className={`text-lg font-extrabold leading-tight ${wynik.uchwalona ? 'text-emerald-800' : 'text-red-800'}`}>
            {wynik.uchwalona ? 'Uchwała przyjęta' : 'Uchwała odrzucona'}
          </p>
          <p className={`text-sm mt-0.5 ${wynik.uchwalona ? 'text-emerald-600' : 'text-red-500'}`}>
            {wynik.title}
          </p>
        </div>
      </div>

      <WynikiBar
        za={wynik.za}
        przeciw={wynik.przeciw}
        wstrzymalo={wynik.wstrzymalo}
        nieobecnych={wynik.nieobecnych}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/50">
        <p className="text-xs text-slate-500 font-semibold">
          Oddano głosów: {wynik.za + wynik.przeciw + wynik.wstrzymalo} / {total} · Wymagana większość: {Math.ceil(total * 0.5)} głosów
        </p>
        {mojGlos && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            Twój głos: <GlosChip glos={mojGlos} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GLOS CHIP ────────────────────────────────────────────────────────────────

function GlosChip({ glos, large }: { glos: WyborGlosu; large?: boolean }) {
  const map: Record<WyborGlosu, { cls: string; icon: React.ReactNode }> = {
    'ZA':         { cls: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    'PRZECIW':    { cls: 'bg-red-100     text-red-700     border-red-300',     icon: <XCircle      className="w-3.5 h-3.5" /> },
    'WSTRZYMUJĘ': { cls: 'bg-slate-100   text-slate-600   border-slate-300',   icon: <MinusCircle  className="w-3.5 h-3.5" /> },
  };
  const { cls, icon } = map[glos];
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border px-3 ${large ? 'py-2 text-sm' : 'py-1 text-xs'} ${cls}`}>
      {icon} {glos}
    </span>
  );
}

// ─── PASEK OBECNOŚCI ─────────────────────────────────────────────────────────

function PasekObecnosci({ online, total }: { online: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
      <Users className="w-4 h-4 text-blue-500" />
      <span>Obecnych radnych:</span>
      <span className="text-slate-900 font-extrabold">{online}</span>
      <span>/ {total}</span>
      <div className="ml-auto flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i < online ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        ))}
      </div>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function LiveGlosowanie() {
  const [stan, setStan] = useState<StanGlosowania>({
    id: null,
    title: '',
    status: 'oczekiwanie',
    mojGlos: null,
    wyniki: { za: 0, przeciw: 0, wstrzymalo: 0, nieobecnych: 17 },
    pozostalo: 0,
    maxCzas: 60,
    wynikKoncowy: null,
    tajne: false,
  });

  const [obecnosc, setObecnosc] = useState({ online: 14, total: 17 });
  const [historia, setHistoria] = useState<WynikiKoncowe[]>([]);

  // ── obsługa wiadomości WS / symulacji ──
  const handleMessage = useCallback((msg: WiadomoscWS) => {
    switch (msg.type) {
      case 'voting_started':
        setStan(prev => ({
          ...prev,
          id: msg.payload.votingId,
          title: msg.payload.title,
          status: 'aktywne',
          mojGlos: null,
          wyniki: { za: 0, przeciw: 0, wstrzymalo: 0, nieobecnych: 17 },
          pozostalo: msg.payload.durationSeconds,
          maxCzas: msg.payload.durationSeconds,
          wynikKoncowy: null,
        }));
        break;
      case 'tick':
        setStan(prev => ({ ...prev, pozostalo: msg.payload.remaining }));
        break;
      case 'vote_cast':
        setStan(prev => ({ ...prev, wyniki: msg.payload }));
        break;
      case 'voting_ended':
        setStan(prev => ({ ...prev, status: 'zakonczone', wynikKoncowy: msg.payload, pozostalo: 0 }));
        setHistoria(prev => [msg.payload, ...prev].slice(0, 5));
        break;
      case 'voting_canceled':
        setStan(prev => ({ ...prev, status: 'anulowane', pozostalo: 0 }));
        break;
      case 'presence':
        setObecnosc(msg.payload);
        break;
    }
  }, []);

  const { polaczony, reconnecting, send } = useVotingWebSocket(handleMessage);
  const symulacja = useSymulacja(handleMessage, !polaczony);

  // ── akcje ──
  const handleStart = (title: string, duration: number, tajne: boolean) => {
    setStan(prev => ({ ...prev, tajne }));
    if (polaczony) {
      send({ type: 'start_voting', title, durationSeconds: duration, secret: tajne });
    } else {
      symulacja.start(title, duration);
    }
  };

  const handleVote = (wybor: WyborGlosu) => {
    if (stan.mojGlos || stan.status !== 'aktywne') return;
    setStan(prev => ({ ...prev, mojGlos: wybor }));
    if (polaczony) {
      send({ type: 'cast_vote', votingId: stan.id, vote: wybor });
    } else {
      symulacja.addVote(wybor);
    }
  };

  const handleStop = () => {
    if (polaczony) send({ type: 'end_voting', votingId: stan.id });
    else {
      // Wymuś zakończenie w symulacji
      handleMessage({
        type: 'voting_ended',
        payload: {
          votingId: stan.id ?? 0,
          title: stan.title,
          ...stan.wyniki,
          uchwalona: stan.wyniki.za > 8,
        },
      });
    }
  };

  const canVote = UZYTKOWNIK.rola === 'radny' || UZYTKOWNIK.rola === 'przewodniczacy';
  const canManage = UZYTKOWNIK.rola === 'przewodniczacy';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
          <StatusPill status={polaczony} reconnecting={reconnecting} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {stan.status === 'aktywne' ? 'Live — głosowanie w toku' : 'Panel głosowania'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">{SESJA.nazwa}</h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                {UZYTKOWNIK.rola === 'przewodniczacy'
                  ? <><Crown className="w-3.5 h-3.5 text-blue-400" /> Przewodniczący obrad</>
                  : <><Shield className="w-3.5 h-3.5 text-slate-400" /> Radny – tylko do odczytu i głosowania</>
                }
                · {UZYTKOWNIK.imie}
              </p>
            </div>
            <PasekObecnosci online={obecnosc.online} total={obecnosc.total} />
          </div>
        </div>
      </div>

      {/* Treść */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Lewa kolumna — główny panel */}
          <div className="lg:col-span-2 space-y-5">

            {/* Panel głosowania dla radnego */}
            {canVote && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Twój głos
                </h2>
                <PanelRadnego stan={stan} onVote={handleVote} />
              </div>
            )}

            {/* Wynik końcowy */}
            {stan.status === 'zakonczone' && stan.wynikKoncowy && (
              <WynikKoncowy wynik={stan.wynikKoncowy} mojGlos={stan.mojGlos} />
            )}

            {/* Wyniki na żywo (dla przewodniczącego zawsze widoczne) */}
            {canManage && stan.status === 'aktywne' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                  <BarChart2 className="w-4 h-4 text-blue-600" /> Wyniki na żywo
                  {stan.tajne && (
                    <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" /> Widoczne tylko dla Ciebie
                    </span>
                  )}
                </h2>
                <WynikiBar {...stan.wyniki} />
              </div>
            )}
          </div>

          {/* Prawa kolumna */}
          <div className="space-y-5">

            {/* Panel zarządzania (tylko przewodniczący) */}
            {canManage && (
              <PanelPrzewodniczacego stan={stan} onStart={handleStart} onStop={handleStop} />
            )}

            {/* Historia głosowań */}
            {historia.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Historia sesji
                </h3>
                <div className="space-y-2">
                  {historia.map((h, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${h.uchwalona ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${h.uchwalona ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {h.uchwalona
                          ? <CheckCircle2 className="w-3 h-3 text-white" />
                          : <XCircle      className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${h.uchwalona ? 'text-emerald-800' : 'text-red-700'}`}>{h.title}</p>
                        <p className="text-slate-400 mt-0.5">ZA {h.za} · PRZECIW {h.przeciw} · WSTRZ. {h.wstrzymalo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info WS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-500 uppercase tracking-wide">Połączenie</p>
              <p>URL: <code className="text-slate-600">{WS_URL}</code></p>
              <p>Sesja: <code className="text-slate-600">{SESJA.id}</code></p>
              <p>Status: <span className={polaczony ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {polaczony ? 'WebSocket aktywny' : reconnecting ? 'Ponowne łączenie...' : 'Tryb symulacji (demo)'}
              </span></p>
              <p className="pt-1 border-t border-slate-200 text-slate-400">
                Brak serwera? Komponent działa w trybie symulacji — wszystkie głosy są lokalne.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
