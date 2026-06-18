import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, FileText,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle,
  FileDown, Radio, Paperclip, BarChart2, Loader2, AlertCircle
} from 'lucide-react';
import { sessionsApi, SESSION_STATUS_LABEL, VOTE_LABEL, type Session, type VoteValue } from '../api/api';
import { useAuth } from '../context/AuthContext';

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<string, { dot: string; className: string }> = {
  PLANNED:  { dot: 'bg-amber-400', className: 'bg-amber-50  text-amber-800  border-amber-200' },
  ACTIVE:   { dot: 'bg-blue-500',  className: 'bg-blue-50   text-blue-800   border-blue-200'  },
  FINISHED: { dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600  border-slate-200' },
};

// ─── CHIP GŁOSU ───────────────────────────────────────────────────────────────

function ChipGlosu({ value }: { value: VoteValue }) {
  const config: Record<VoteValue, { cls: string; icon: React.ReactNode }> = {
    YES:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    NO:      { cls: 'bg-red-50     text-red-700     border-red-200',     icon: <XCircle      className="w-3.5 h-3.5" /> },
    ABSTAIN: { cls: 'bg-slate-100  text-slate-600   border-slate-300',   icon: <MinusCircle  className="w-3.5 h-3.5" /> },
  };
  const { cls, icon } = config[value];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {icon} {VOTE_LABEL[value]}
    </span>
  );
}

// ─── PASEK WYNIKÓW ────────────────────────────────────────────────────────────

function PasekWynikow({ za, przeciw, wstrzymalo, lacznie }: {
  za: number; przeciw: number; wstrzymalo: number; lacznie: number;
}) {
  const pct = (n: number) => lacznie > 0 ? Math.round((n / lacznie) * 100) : 0;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full" style={{ width: `${pct(za)}%` }} />
        <div className="bg-red-500"                    style={{ width: `${pct(przeciw)}%` }} />
        <div className="bg-slate-300 rounded-r-full"   style={{ width: `${pct(wstrzymalo)}%` }} />
      </div>
      <div className="flex gap-4 text-xs font-semibold">
        <span className="text-emerald-600">ZA {za} ({pct(za)}%)</span>
        <span className="text-red-500">PRZECIW {przeciw}</span>
        <span className="text-slate-400">WSTRZ. {wstrzymalo}</span>
        <span className="text-slate-400 ml-auto">z {lacznie} radnych</span>
      </div>
    </div>
  );
}

// ─── WIERSZ PUNKTU AGENDY ─────────────────────────────────────────────────────

function WierszPunktu({ item, index, isLast }: { item: any; index: number; isLast: boolean }) {
  const [rozwiniety, setRozwiniety] = useState(false);

  const aktywneGlosowanie  = item.voting?.find((v: any) => v.status === 'ACTIVE');
  const ukonczone          = item.voting?.find((v: any) => v.status === 'COMPLETED');
  const statusPunktu       = aktywneGlosowanie ? 'ACTIVE' : ukonczone ? 'COMPLETED' : 'PENDING';

  const ikonaCls = statusPunktu === 'ACTIVE'
    ? 'border-2 border-blue-500 bg-blue-50 animate-pulse'
    : statusPunktu === 'COMPLETED'
    ? 'bg-emerald-500'
    : 'border-2 border-slate-300 bg-white';

  const liniaCls = statusPunktu === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-200';

  return (
    <div className="flex gap-4">
      {/* Oś czasu */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${ikonaCls}`}>
          {statusPunktu === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
          {statusPunktu === 'ACTIVE'    && <Radio        className="w-3.5 h-3.5 text-blue-600" />}
          {statusPunktu === 'PENDING'   && <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-[2rem] ${liniaCls}`} />}
      </div>

      {/* Treść */}
      <div className="flex-1 pb-6 min-w-0">
        <button onClick={() => setRozwiniety(v => !v)} className="w-full text-left group">
          <div className="flex items-start gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 mt-0.5 flex-shrink-0">{index + 1}.</span>
            <p className={`text-sm font-semibold leading-snug flex-1 group-hover:text-blue-700 transition-colors ${
              statusPunktu === 'ACTIVE' ? 'text-blue-700' : 'text-slate-900'
            }`}>
              {item.title}
            </p>
            <span className="flex-shrink-0 text-slate-400 mt-0.5">
              {rozwiniety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </button>

        {rozwiniety && (
          <div className="mt-3 ml-6 space-y-3">
            {/* Dokumenty */}
            {item.documents?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Załączniki
                </p>
                {item.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    {doc.title}
                  </a>
                ))}
              </div>
            )}

            {/* Głosowania */}
            {item.voting?.map((glosowanie: any) => (
              <div key={glosowanie.id}>
                {glosowanie.status === 'PENDING' && (
                  <div className="text-sm text-slate-400 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
                    Głosowanie jeszcze nie rozpoczęte
                  </div>
                )}
                {glosowanie.status === 'ACTIVE' && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                      </span>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Głosowanie otwarte</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{glosowanie.title}</p>
                  </div>
                )}
                {glosowanie.status === 'COMPLETED' && glosowanie.votes && (() => {
                  const za         = glosowanie.votes.filter((v: any) => v.value === 'YES').length;
                  const przeciw    = glosowanie.votes.filter((v: any) => v.value === 'NO').length;
                  const wstrzymalo = glosowanie.votes.filter((v: any) => v.value === 'ABSTAIN').length;
                  return (
                    <div className="border border-slate-200 rounded-xl p-4 bg-white">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Wyniki głosowania</p>
                      <PasekWynikow za={za} przeciw={przeciw} wstrzymalo={wstrzymalo} lacznie={glosowanie.votes.length} />
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [sesja,     setSesja]     = useState<Session | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad,      setBlad]      = useState<string | null>(null);

  const mozeZarzadzac = hasRole('PRZEWODNICZACY', 'ADMINISTRATOR');

  useEffect(() => {
    if (!id) return;
    sessionsApi.getById(id)
      .then(data => setSesja(data))
      .catch(err  => setBlad(err.message ?? 'Błąd pobierania sesji'))
      .finally(()  => setLadowanie(false));
  }, [id]);

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Ładowanie sesji...</span>
        </div>
      </div>
    );
  }

  if (blad || !sesja) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700">{blad ?? 'Nie znaleziono sesji'}</p>
          <Link to="/panel" className="text-sm text-blue-600 hover:underline mt-2 inline-block">← Wróć do panelu</Link>
        </div>
      </div>
    );
  }

  const statusCfg   = SESSION_STATUS_CONFIG[sesja.status] ?? SESSION_STATUS_CONFIG.PLANNED;
  const punktyAgendy = sesja.agendaItems ?? [];
  const ukonczone    = punktyAgendy.filter(p => p.voting?.some((v: any) => v.status === 'COMPLETED')).length;
  const postep       = punktyAgendy.length > 0 ? Math.round((ukonczone / punktyAgendy.length) * 100) : 0;
  const liczbaGlosowan = punktyAgendy.reduce((acc, p) => acc + (p.voting?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Nagłówek */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${sesja.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
              {SESSION_STATUS_LABEL[sesja.status] ?? sesja.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-5 leading-tight">
            {sesja.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
            <div className="flex items-start gap-2.5 text-slate-600">
              <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Data</p>
                <p className="font-semibold text-slate-900">
                  {new Date(sesja.scheduledAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Godzina</p>
                <p className="font-semibold text-slate-900">
                  {new Date(sesja.scheduledAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {sesja.committee && (
              <div className="flex items-start gap-2.5 text-slate-600">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Komisja</p>
                  <p className="font-semibold text-slate-900">{sesja.committee.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Pasek postępu */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold">
              <span className="text-slate-500">Postęp obrad</span>
              <span className="text-slate-700">{ukonczone} / {punktyAgendy.length} punktów</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${postep}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                Głosowań: {liczbaGlosowan}
              </span>
              {sesja.status === 'FINISHED' && (
                <Link to={`/statystyki/${sesja.id}`}
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition">
                  <BarChart2 className="w-3.5 h-3.5" /> Statystyki →
                </Link>
              )}
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
              <FileDown className="w-4 h-4" /> Agenda (PDF)
            </button>
            <Link to={`/podsumowanie/${sesja.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition">
              <FileDown className="w-4 h-4" /> Podsumowanie
            </Link>
            <Link to={`/statystyki/${sesja.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-4 py-2 rounded-lg transition">
              <BarChart2 className="w-4 h-4" /> Statystyki
            </Link>
            {sesja.status === 'ACTIVE' && (
              <Link to={`/live/${sesja.id}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm">
                <Radio className="w-4 h-4" /> Dołącz do głosowania
              </Link>
            )}
            {mozeZarzadzac && (
              <Link to={`/agenda/${sesja.id}/edytuj`}
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg transition">
                <FileText className="w-4 h-4" /> Edytuj agendę
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Agenda */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Porządek obrad
        </h2>

        {punktyAgendy.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Brak punktów agendy</p>
            <p className="text-sm mt-1">Punkty agendy pojawią się tutaj po dodaniu przez przewodniczącego</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            {punktyAgendy
              .sort((a, b) => a.order - b.order)
              .map((punkt, i) => (
                <WierszPunktu
                  key={punkt.id}
                  item={punkt}
                  index={i}
                  isLast={i === punktyAgendy.length - 1}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
