import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileDown, CheckCircle2, XCircle, MinusCircle,
  CalendarDays, Clock, Users, FileText, BarChart2,
  Loader2, AlertCircle, Award
} from 'lucide-react';
import { sessionsApi, type Session } from '../api/api';

function formatujDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatujCzas(iso: string) {
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}
function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

const STATUS_ETYKIETA: Record<string, string> = {
  PLANNED:  'Nadchodząca',
  ACTIVE:   'W trakcie',
  FINISHED: 'Zakończona',
};

export default function SessionSummary() {
  const { id } = useParams<{ id: string }>();
  const [sesja,     setSesja]     = useState<Session | null>(null);
  const [ladowanie, setLadowanie] = useState(true);
  const [blad,      setBlad]      = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sessionsApi.getById(id)
      .then(data => setSesja(data))
      .catch(err  => setBlad(err.message ?? 'Błąd pobierania podsumowania'))
      .finally(()  => setLadowanie(false));
  }, [id]);

  const handleEksportPDF = () => {
    window.print();
  };

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Ładowanie podsumowania...</span>
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

  const punktyAgendy  = sesja.agendaItems ?? [];
  const wszystkieGlosowania = punktyAgendy.flatMap(p => p.voting ?? []);
  const zakonczone    = wszystkieGlosowania.filter(g => g.status === 'COMPLETED');
  const uchwalone     = zakonczone.filter(g => {
    const za    = g.votes?.filter((v: any) => v.value === 'YES').length   ?? 0;
    const total = g.votes?.length ?? 0;
    return za > total / 2;
  }).length;
  const odrzucone = zakonczone.length - uchwalone;

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">

      {/* Breadcrumb — ukryty przy druku */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to={`/sesja/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Szczegóły sesji
          </Link>
          <button onClick={handleEksportPDF}
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
            <FileDown className="w-4 h-4" /> Eksport do PDF
          </button>
        </div>
      </div>

      {/* Nagłówek */}
      <div className="bg-white border-b border-slate-200 px-4 py-8 print:border-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Podsumowanie obrad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-4">{sesja.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatujDate(sesja.scheduledAt)}</span>
            <span className="flex items-center gap-1.5"><Clock    className="w-4 h-4" />{formatujCzas(sesja.scheduledAt)}</span>
            <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" />Status: {STATUS_ETYKIETA[sesja.status] ?? sesja.status}</span>
            {sesja.committee && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{sesja.committee.name}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:py-4">

        {/* Karty podsumowania */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { ikona: <FileText    className="w-5 h-5" />, etykieta: 'Punktów agendy',    wartosc: punktyAgendy.length,         bg: 'bg-slate-100',  tc: 'text-slate-600'    },
            { ikona: <BarChart2   className="w-5 h-5" />, etykieta: 'Głosowań łącznie',  wartosc: wszystkieGlosowania.length,  bg: 'bg-blue-50',    tc: 'text-blue-600'     },
            { ikona: <CheckCircle2 className="w-5 h-5" />, etykieta: 'Uchwał uchwalonych',wartosc: uchwalone,                   bg: 'bg-emerald-50', tc: 'text-emerald-600'  },
            { ikona: <XCircle     className="w-5 h-5" />, etykieta: 'Odrzuconych',       wartosc: odrzucone,                   bg: 'bg-red-50',     tc: 'text-red-500'      },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.tc}`}>{s.ikona}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.etykieta}</p>
                <p className="text-xl font-extrabold text-slate-900 leading-tight">{s.wartosc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Agenda */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">Porządek obrad</h2>
          </div>
          {punktyAgendy.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">Brak punktów agendy</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {punktyAgendy.sort((a, b) => a.order - b.order).map((punkt, i) => {
                const glosowanie = punkt.voting?.[0];
                const yes     = glosowanie?.votes?.filter((v: any) => v.value === 'YES').length    ?? 0;
                const no      = glosowanie?.votes?.filter((v: any) => v.value === 'NO').length     ?? 0;
                const abstain = glosowanie?.votes?.filter((v: any) => v.value === 'ABSTAIN').length ?? 0;
                const total   = yes + no + abstain;
                const uchwalona = total > 0 && yes > total / 2;

                return (
                  <div key={punkt.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{punkt.title}</p>
                        {glosowanie && glosowanie.status === 'COMPLETED' && (
                          <div className="mt-2">
                            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px mb-1.5">
                              <div className="bg-emerald-500 rounded-l-full" style={{ width: `${pct(yes, total)}%` }} />
                              <div className="bg-red-500" style={{ width: `${pct(no, total)}%` }} />
                              <div className="bg-slate-300 rounded-r-full" style={{ width: `${pct(abstain, total)}%` }} />
                            </div>
                            <div className="flex gap-4 text-xs font-semibold">
                              <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ZA {yes} ({pct(yes, total)}%)</span>
                              <span className="text-red-500 flex items-center gap-1"><XCircle      className="w-3 h-3" /> PRZECIW {no}</span>
                              <span className="text-slate-400 flex items-center gap-1"><MinusCircle className="w-3 h-3" /> WSTRZ. {abstain}</span>
                              <span className="ml-auto">
                                {uchwalona
                                  ? <span className="text-emerald-600 font-bold">✓ Uchwalona</span>
                                  : <span className="text-red-500 font-bold">✗ Odrzucona</span>
                                }
                              </span>
                            </div>
                          </div>
                        )}
                        {(!glosowanie || glosowanie.status !== 'COMPLETED') && (
                          <p className="text-xs text-slate-400 mt-1">Bez głosowania</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Treść podsumowania z bazy */}
        {sesja.summary && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-blue-600" /> Protokół z obrad
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{sesja.summary.content}</p>
          </div>
        )}

        {/* Stopka wydruku */}
        <div className="hidden print:block text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
          <p>Urząd Gminy Nasza Gmina · ul. Samorządowa 1 · rada@nasza-gmina.pl</p>
          <p className="mt-1">Wygenerowano: {new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}
