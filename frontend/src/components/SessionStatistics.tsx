import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, BarChart2, CheckCircle2, XCircle, MinusCircle,
  FileDown, Calendar, Clock,
  ChevronDown, ChevronUp, Loader2, AlertCircle, TrendingUp, Award
} from 'lucide-react';
import { sessionsApi, type Session } from '../api/api';

function formatujDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function PasekNakladany({ za, przeciw, wstrzymalo }: { za: number; przeciw: number; wstrzymalo: number }) {
  const total = za + przeciw + wstrzymalo;
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px bg-slate-100">
      <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${pct(za, total)}%` }} />
      <div className="bg-red-500   transition-all duration-700" style={{ width: `${pct(przeciw, total)}%` }} />
      <div className="bg-slate-300 transition-all duration-700" style={{ width: `${pct(wstrzymalo, total)}%` }} />
    </div>
  );
}

function WierszGlosowania({ glosowanie, indeks }: { glosowanie: any; indeks: number }) {
  const [rozwiniety, setRozwiniety] = useState(false);

  const za         = glosowanie.votes?.filter((v: any) => v.value === 'YES').length    ?? 0;
  const przeciw    = glosowanie.votes?.filter((v: any) => v.value === 'NO').length     ?? 0;
  const wstrzymalo = glosowanie.votes?.filter((v: any) => v.value === 'ABSTAIN').length ?? 0;
  const total      = za + przeciw + wstrzymalo;
  const uchwalona  = za > total / 2;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${uchwalona ? 'border-slate-200' : 'border-red-100'}`}>
      <button onClick={() => setRozwiniety(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition">
        <span className="text-xs font-mono font-bold text-slate-400 flex-shrink-0 w-5">{indeks + 1}.</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate mb-2">{glosowanie.title}</p>
          <PasekNakladany za={za} przeciw={przeciw} wstrzymalo={wstrzymalo} />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-sm font-extrabold tabular-nums ${uchwalona ? 'text-emerald-600' : 'text-red-500'}`}>
            {pct(za, total)}%
          </span>
          {uchwalona ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
          {rozwiniety ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {rozwiniety && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/40">
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { etykieta: 'ZA',          wartosc: za,         cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { etykieta: 'PRZECIW',     wartosc: przeciw,    cls: 'text-red-500',     bg: 'bg-red-50     border-red-200'     },
              { etykieta: 'WSTRZYMUJĘ',  wartosc: wstrzymalo, cls: 'text-slate-500',   bg: 'bg-slate-100  border-slate-200'   },
            ].map(r => (
              <div key={r.etykieta} className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs ${r.bg}`}>
                <span className={`text-2xl font-extrabold leading-none ${r.cls}`}>{r.wartosc}</span>
                <span className={`font-bold mt-1 ${r.cls}`}>{r.etykieta}</span>
                <span className="text-slate-400 mt-0.5">{pct(r.wartosc, total)}%</span>
              </div>
            ))}
          </div>
          <p className={`text-xs mt-3 font-semibold ${uchwalona ? 'text-emerald-600' : 'text-red-500'}`}>
            {uchwalona ? '✓ Uchwała przyjęta' : '✗ Uchwała odrzucona'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SessionStatistics() {
  const { id } = useParams<{ id: string }>();
  const [sesja,     setSesja]     = useState<Session | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad,      setBlad]      = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sessionsApi.getById(id)
      .then(data => setSesja(data))
      .catch(err  => setBlad(err.message ?? 'Błąd pobierania statystyk'))
      .finally(()  => setLadowanie(false));
  }, [id]);

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Ładowanie statystyk...</span>
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

  const punktyAgendy     = sesja.agendaItems ?? [];
  const wszystkieGlos    = punktyAgendy.flatMap(p => p.voting ?? []);
  const zakonczone       = wszystkieGlos.filter(g => g.status === 'COMPLETED');
  const uchwalone        = zakonczone.filter(g => {
    const za    = g.votes?.filter((v: any) => v.value === 'YES').length ?? 0;
    const total = g.votes?.length ?? 0;
    return za > total / 2;
  }).length;
  const odrzucone = zakonczone.length - uchwalone;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to={`/sesja/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Szczegóły sesji
          </Link>
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition">
            <FileDown className="w-4 h-4" /> Eksport (PDF)
          </button>
        </div>
      </div>

      {/* Nagłówek */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Statystyki sesji</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">{sesja.title}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" />{formatujDate(sesja.scheduledAt)}</span>
            <span className="flex items-center gap-1.5"><Clock    className="w-4 h-4 text-slate-400" />{new Date(sesja.scheduledAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Karty KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { ikona: <BarChart2    className="w-5 h-5" />, etykieta: 'Głosowań łącznie',   wartosc: wszystkieGlos.length,  bg: 'bg-slate-100',  tc: 'text-slate-600'    },
            { ikona: <CheckCircle2 className="w-5 h-5" />, etykieta: 'Uchwał przyjętych',  wartosc: uchwalone,             bg: 'bg-emerald-50', tc: 'text-emerald-600'  },
            { ikona: <XCircle      className="w-5 h-5" />, etykieta: 'Odrzuconych',        wartosc: odrzucone,             bg: 'bg-red-50',     tc: 'text-red-500'      },
            { ikona: <TrendingUp   className="w-5 h-5" />, etykieta: 'Punktów agendy',     wartosc: punktyAgendy.length,   bg: 'bg-blue-50',    tc: 'text-blue-600'     },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.tc}`}>{s.ikona}</div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.etykieta}</p>
                <p className="text-2xl font-extrabold text-slate-900 leading-tight tabular-nums">{s.wartosc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Lista głosowań */}
        {zakonczone.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Wyniki głosowań ({zakonczone.length})
              </h2>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Przyjęte</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400    inline-block" />Odrzucone</span>
              </div>
            </div>
            <div className="space-y-2">
              {zakonczone.map((g, i) => <WierszGlosowania key={g.id} glosowanie={g} indeks={i} />)}
            </div>
          </div>
        )}

        {zakonczone.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Brak zakończonych głosowań</p>
            <p className="text-sm mt-1">Statystyki pojawią się po przeprowadzeniu głosowań</p>
          </div>
        )}

        {/* Podsumowanie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-blue-600" /> Podsumowanie sesji
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { etykieta: 'Data',            wartosc: formatujDate(sesja.scheduledAt) },
              { etykieta: 'Godzina',         wartosc: new Date(sesja.scheduledAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) },
              { etykieta: 'Status',          wartosc: sesja.status === 'FINISHED' ? 'Zakończona' : sesja.status === 'ACTIVE' ? 'W trakcie' : 'Nadchodząca' },
              { etykieta: 'Punktów agendy', wartosc: `${punktyAgendy.length} łącznie` },
              { etykieta: 'Głosowań',       wartosc: `${wszystkieGlos.length} łącznie` },
              { etykieta: 'Komisja',        wartosc: sesja.committee?.name ?? 'Pełny skład rady' },
            ].map(({ etykieta, wartosc }) => (
              <div key={etykieta} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">{etykieta}</p>
                <p className="font-extrabold text-slate-900 text-sm">{wartosc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
