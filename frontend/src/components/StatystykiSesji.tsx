import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, BarChart2, TrendingUp, Users, CheckCircle2,
  XCircle, MinusCircle, FileDown, Calendar, Clock,
  Award, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── TYPY ────────────────────────────────────────────────────────────────────

interface WynikiGlosowania {
  id: number;
  tytul: string;
  za: number;
  przeciw: number;
  wstrzymalo: number;
  nieobecnych: number;
  uchwalona: boolean;
}

interface FrekwencjaSesja {
  numer: string;
  data: string;
  obecnych: number;
  lacznie: number;
}

interface PodsumowanieSesji {
  numer: string;
  typ: string;
  data: string;
  godzina: string;
  czasTrwania: string;
  przewodniczacy: string;
  lacznie: number;
  obecnych: number;
  glosowaniaLacznie: number;
  uchwal: number;
  odrzuconych: number;
  punktowAgendy: number;
  punktowZrealizowanych: number;
}

// ─── DANE MOCK ────────────────────────────────────────────────────────────────

const PODSUMOWANIE: PodsumowanieSesji = {
  numer: 'XXXIV',
  typ: 'Sesja Zwyczajna',
  data: '28 maja 2026',
  godzina: '10:00 – 13:48',
  czasTrwania: '3h 48min',
  przewodniczacy: 'Anna Wiśniewska',
  lacznie: 17,
  obecnych: 15,
  glosowaniaLacznie: 7,
  uchwal: 5,
  odrzuconych: 2,
  punktowAgendy: 8,
  punktowZrealizowanych: 8,
};

const GLOSOWANIA: WynikiGlosowania[] = [
  { id: 1, tytul: 'Przyjęcie porządku obrad',           za: 14, przeciw: 1,  wstrzymalo: 0, nieobecnych: 2,  uchwalona: true  },
  { id: 2, tytul: 'Uchwała XV/102/26 – budżet 2026',    za: 11, przeciw: 3,  wstrzymalo: 1, nieobecnych: 2,  uchwalona: true  },
  { id: 3, tytul: 'Zmiana stawek podatku od nieruch.',  za: 9,  przeciw: 5,  wstrzymalo: 1, nieobecnych: 2,  uchwalona: true  },
  { id: 4, tytul: 'Plan zagosp. działka 412/B',         za: 6,  przeciw: 7,  wstrzymalo: 2, nieobecnych: 2,  uchwalona: false },
  { id: 5, tytul: 'Zakup działki pod parking',          za: 4,  przeciw: 9,  wstrzymalo: 2, nieobecnych: 2,  uchwalona: false },
  { id: 6, tytul: 'Dotacja dla GOK na remont',          za: 13, przeciw: 0,  wstrzymalo: 2, nieobecnych: 2,  uchwalona: true  },
  { id: 7, tytul: 'Regulamin korzystania z basenu',     za: 15, przeciw: 0,  wstrzymalo: 0, nieobecnych: 2,  uchwalona: true  },
];

const HISTORIA_FREKWENCJI: FrekwencjaSesja[] = [
  { numer: 'XXIX',   data: 'sty 2026', obecnych: 14, lacznie: 17 },
  { numer: 'XXX',    data: 'lut 2026', obecnych: 17, lacznie: 17 },
  { numer: 'XXXI',   data: 'mar 2026', obecnych: 13, lacznie: 17 },
  { numer: 'XXXII',  data: 'kwi 2026', obecnych: 16, lacznie: 17 },
  { numer: 'XXXIII', data: 'maj 2026', obecnych: 12, lacznie: 17 },
  { numer: 'XXXIV',  data: 'maj 2026', obecnych: 15, lacznie: 17 },
];

// ─── KOLORY ───────────────────────────────────────────────────────────────────

const C = {
  za:        '#10b981',
  przeciw:   '#ef4444',
  wstrzymalo:'#94a3b8',
  nieobecni: '#e2e8f0',
  frekwencja:'#2563eb',
};

// ─── WYKRES: PIERŚCIEŃ (donut) ────────────────────────────────────────────────

function DonutChart({ za, przeciw, wstrzymalo, nieobecnych, size = 120 }: {
  za: number; przeciw: number; wstrzymalo: number; nieobecnych: number; size?: number;
}) {
  const total = za + przeciw + wstrzymalo + nieobecnych;
  const r = 42;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const segments = [
    { val: za,          color: C.za,         label: 'ZA'    },
    { val: przeciw,     color: C.przeciw,    label: 'PR'    },
    { val: wstrzymalo,  color: C.wstrzymalo, label: 'WS'    },
    { val: nieobecnych, color: C.nieobecni,  label: 'NB'    },
  ];

  let offset = 0;
  const arcs = segments.map(s => {
    const pct   = total > 0 ? s.val / total : 0;
    const dash  = pct * circ;
    const gap   = circ - dash;
    const start = offset;
    offset += dash;
    return { ...s, pct, dash, gap, start };
  });

  const pctZa = total > 0 ? Math.round((za / total) * 100) : 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={12}
            strokeDasharray={`${a.dash} ${a.gap}`}
            strokeDashoffset={-a.start}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-900 leading-none tabular-nums">{pctZa}%</span>
        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">ZA</span>
      </div>
    </div>
  );
}

// ─── WYKRES: SŁUPKI FREKWENCJI ────────────────────────────────────────────────

function FrekwencjaChart({ dane }: { dane: FrekwencjaSesja[] }) {
  const max = Math.max(...dane.map(d => d.lacznie));
  const H = 100;

  return (
    <div className="flex items-end gap-2 h-28 pt-4">
      {dane.map((d, i) => {
        const pct = d.obecnych / max;
        const h   = Math.round(pct * H);
        const isLast = i === dane.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition tabular-nums">
              {d.obecnych}/{d.lacznie}
            </span>
            <div className="w-full relative flex items-end" style={{ height: H }}>
              <div
                className={`w-full rounded-t-md transition-all duration-700 ${isLast ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-blue-300'}`}
                style={{ height: h }}
              />
            </div>
            <span className={`text-[10px] font-bold truncate w-full text-center ${isLast ? 'text-blue-600' : 'text-slate-400'}`}>
              {d.numer}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── WYKRES: POZIOMY STACKED BAR ──────────────────────────────────────────────

function StackedBar({ za, przeciw, wstrzymalo, nieobecnych }: {
  za: number; przeciw: number; wstrzymalo: number; nieobecnych: number;
}) {
  const total = za + przeciw + wstrzymalo + nieobecnych;
  const p = (n: number) => total > 0 ? (n / total) * 100 : 0;

  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px">
      <div className="transition-all duration-700 rounded-l-full" style={{ width: `${p(za)}%`,          backgroundColor: C.za         }} />
      <div className="transition-all duration-700"               style={{ width: `${p(przeciw)}%`,     backgroundColor: C.przeciw    }} />
      <div className="transition-all duration-700"               style={{ width: `${p(wstrzymalo)}%`,  backgroundColor: C.wstrzymalo }} />
      <div className="transition-all duration-700 rounded-r-full"style={{ width: `${p(nieobecnych)}%`, backgroundColor: C.nieobecni  }} />
    </div>
  );
}

// ─── KARTA STATYSTYCZNA ───────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color ?? 'bg-blue-50'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── WIERSZ GŁOSOWANIA ────────────────────────────────────────────────────────

function WierszGlosowania({ g, idx }: { g: WynikiGlosowania; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const total = g.za + g.przeciw + g.wstrzymalo + g.nieobecnych;
  const pctZa = Math.round((g.za / total) * 100);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${
      g.uchwalona ? 'border-slate-200' : 'border-red-100'
    }`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition"
      >
        {/* Numer */}
        <span className="text-xs font-mono font-bold text-slate-400 flex-shrink-0 w-5">{idx + 1}.</span>

        {/* Tytuł + pasek */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate mb-2">{g.tytul}</p>
          <StackedBar za={g.za} przeciw={g.przeciw} wstrzymalo={g.wstrzymalo} nieobecnych={g.nieobecnych} />
        </div>

        {/* Wynik */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-extrabold tabular-nums" style={{ color: g.uchwalona ? C.za : C.przeciw }}>
            {pctZa}%
          </span>
          {g.uchwalona
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <XCircle      className="w-5 h-5 text-red-400" />
          }
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Rozwinięte szczegóły */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40">
          <div className="flex items-center gap-4">
            <DonutChart za={g.za} przeciw={g.przeciw} wstrzymalo={g.wstrzymalo} nieobecnych={g.nieobecnych} size={100} />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { label: 'ZA',         val: g.za,          color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { label: 'PRZECIW',    val: g.przeciw,     color: 'text-red-500',     bg: 'bg-red-50 border-red-200',         icon: <XCircle      className="w-3.5 h-3.5" /> },
                { label: 'WSTRZYM.',   val: g.wstrzymalo,  color: 'text-slate-500',   bg: 'bg-slate-100 border-slate-200',    icon: <MinusCircle  className="w-3.5 h-3.5" /> },
                { label: 'NIEOBECNI',  val: g.nieobecnych, color: 'text-slate-400',   bg: 'bg-white border-slate-200',        icon: <Users        className="w-3.5 h-3.5" /> },
              ].map(r => (
                <div key={r.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${r.bg}`}>
                  <span className={r.color}>{r.icon}</span>
                  <span className={`font-bold ${r.color}`}>{r.label}</span>
                  <span className={`ml-auto font-extrabold tabular-nums ${r.color}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-semibold">
            {g.uchwalona
              ? `✓ Uchwała przyjęta — wymagana większość (${Math.ceil(total * 0.5 - g.nieobecnych * 0.5)} głosów) osiągnięta`
              : `✗ Uchwała odrzucona — za: ${g.za}, wymagane: ${Math.ceil((total - g.nieobecnych) / 2) + 1}`
            }
          </p>
        </div>
      )}
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function StatystykiSesji() {
  const { id } = useParams<{ id: string }>();
  const s = PODSUMOWANIE;

  const frekwencjaPct = Math.round((s.obecnych / s.lacznie) * 100);
  const skutecznoscPct = Math.round((s.uchwal / s.glosowaniaLacznie) * 100);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={`/sesja/${id ?? 34}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Szczegóły sesji
          </Link>
          <button className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition">
            <FileDown className="w-4 h-4" /> Eksportuj raport (PDF)
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Statystyki sesji</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {s.numer} {s.typ}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{s.data}</span>
                <span className="flex items-center gap-1.5"><Clock    className="w-4 h-4 text-slate-400" />{s.godzina} · {s.czasTrwania}</span>
                <span className="flex items-center gap-1.5"><Users    className="w-4 h-4 text-slate-400" />Przewodniczy: {s.przewodniczacy}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── KARTY KPI ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Frekwencja"
            value={`${frekwencjaPct}%`}
            sub={`${s.obecnych} z ${s.lacznie} radnych`}
            color="bg-blue-50"
          />
          <StatCard
            icon={<BarChart2 className="w-5 h-5 text-slate-600" />}
            label="Głosowań"
            value={s.glosowaniaLacznie}
            sub={`${s.uchwal} uchwalone · ${s.odrzuconych} odrzucone`}
            color="bg-slate-100"
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-emerald-600" />}
            label="Skuteczność"
            value={`${skutecznoscPct}%`}
            sub="uchwał przyjętych"
            color="bg-emerald-50"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-violet-600" />}
            label="Agenda"
            value={`${s.punktowZrealizowanych}/${s.punktowAgendy}`}
            sub="punktów zrealizowanych"
            color="bg-violet-50"
          />
        </div>

        {/* ── DWIE KOLUMNY: frekwencja + rozkład głosów ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Frekwencja historyczna */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Frekwencja — ostatnie 6 sesji
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Liczba obecnych radnych na posiedzeniu (z {s.lacznie})</p>
            <FrekwencjaChart dane={HISTORIA_FREKWENCJI} />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <span>Śr. frekwencja: <span className="text-slate-800">{Math.round(HISTORIA_FREKWENCJI.reduce((a, d) => a + d.obecnych, 0) / HISTORIA_FREKWENCJI.length * 10) / 10} / {s.lacznie}</span></span>
              <span className="text-blue-600 font-bold">Bieżąca: {s.obecnych}/{s.lacznie}</span>
            </div>
          </div>

          {/* Łączny rozkład głosów sesji */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-blue-600" /> Łączny rozkład głosów
            </h2>
            <p className="text-xs text-slate-400 mb-5">Wszystkie {s.glosowaniaLacznie} głosowania łącznie</p>

            {/* Wielki pierścień */}
            {(() => {
              const sumZa        = GLOSOWANIA.reduce((a, g) => a + g.za,          0);
              const sumPrzeciw   = GLOSOWANIA.reduce((a, g) => a + g.przeciw,     0);
              const sumWstrzym   = GLOSOWANIA.reduce((a, g) => a + g.wstrzymalo,  0);
              const sumNieobecni = GLOSOWANIA.reduce((a, g) => a + g.nieobecnych, 0);
              const sumTotal     = sumZa + sumPrzeciw + sumWstrzym + sumNieobecni;
              const p = (n: number) => sumTotal > 0 ? Math.round((n / sumTotal) * 100) : 0;
              return (
                <div className="flex items-center gap-6">
                  <DonutChart za={sumZa} przeciw={sumPrzeciw} wstrzymalo={sumWstrzym} nieobecnych={sumNieobecni} size={120} />
                  <div className="flex-1 space-y-2">
                    {[
                      { label: 'ZA',        val: sumZa,        pct: p(sumZa),        color: C.za,         textCls: 'text-emerald-600' },
                      { label: 'PRZECIW',   val: sumPrzeciw,   pct: p(sumPrzeciw),   color: C.przeciw,    textCls: 'text-red-500'     },
                      { label: 'WSTRZYM.',  val: sumWstrzym,   pct: p(sumWstrzym),   color: C.wstrzymalo, textCls: 'text-slate-500'   },
                      { label: 'NIEOBECNI', val: sumNieobecni, pct: p(sumNieobecni), color: C.nieobecni,  textCls: 'text-slate-400'   },
                    ].map(r => (
                      <div key={r.label} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                        <span className="text-slate-500 font-medium flex-1">{r.label}</span>
                        <span className={`font-extrabold tabular-nums ${r.textCls}`}>{r.val}</span>
                        <span className="text-slate-300 w-8 text-right tabular-nums">{r.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Mini wskaźniki */}
            <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-400">Uchwalone</p>
                <p className="text-xl font-extrabold text-emerald-600 tabular-nums">{s.uchwal}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Odrzucone</p>
                <p className="text-xl font-extrabold text-red-400 tabular-nums">{s.odrzuconych}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── LISTA GŁOSOWAŃ ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Wyniki głosowań ({GLOSOWANIA.length})
            </h2>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Uchwalona</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400    inline-block" />Odrzucona</span>
            </div>
          </div>
          <div className="space-y-2">
            {GLOSOWANIA.map((g, i) => (
              <WierszGlosowania key={g.id} g={g} idx={i} />
            ))}
          </div>
        </div>

        {/* ── ALERT nieobecni ── */}
        {s.obecnych < s.lacznie && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold mb-1">
                {s.lacznie - s.obecnych} {s.lacznie - s.obecnych === 1 ? 'radny był nieobecny' : 'radnych było nieobecnych'} na sesji
              </p>
              <p className="font-normal text-amber-700">
                Frekwencja: {frekwencjaPct}% ({s.obecnych}/{s.lacznie}). Kworum ({Math.ceil(s.lacznie / 2)} radnych) zostało zachowane.
              </p>
            </div>
          </div>
        )}

        {/* ── PODSUMOWANIE TEKSTOWE ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-blue-600" /> Podsumowanie obrad
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Czas trwania',        val: s.czasTrwania                    },
              { label: 'Godzina otwarcia',    val: s.godzina.split('–')[0].trim()   },
              { label: 'Godzina zamknięcia',  val: s.godzina.split('–')[1]?.trim()  },
              { label: 'Przewodniczący/a',    val: s.przewodniczacy                 },
              { label: 'Punkty agendy',       val: `${s.punktowZrealizowanych} / ${s.punktowAgendy}` },
              { label: 'Głosowania',          val: `${s.glosowaniaLacznie} łącznie` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-extrabold text-slate-900 text-sm">{val}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
