import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Lock, ArrowRight, BarChart2, TrendingUp, Loader2, CalendarDays, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sessionsApi, type Session } from '../api/api';
import { formatDate, formatTime, getSessionDate } from '../utils/dateUtils';
import SessionCalendar from './Sessioncalendar';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Zaplanowana', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  ACTIVE:    { label: 'W trakcie',   className: 'text-[#B91C1C] bg-red-50 border-red-200'    },
  CONCLUDED: { label: 'Zakończona',  className: 'text-slate-500 bg-slate-100 border-slate-200'},
};

export default function Features() {
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    sessionsApi.list()
      .then(data => setSessions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finishedSessions  = sessions.filter(s => s.status === 'CONCLUDED');
  const activeSessions    = sessions.filter(s => s.status === 'ACTIVE');
  const plannedSessions   = sessions.filter(s => s.status === 'SCHEDULED');

  // Statystyki z zakończonych sesji
  const totalVotings  = finishedSessions.flatMap(s => s.agendaItems ?? []).flatMap(a => a.voting ?? []).length;
  const passedVotings = finishedSessions.flatMap(s => s.agendaItems ?? []).flatMap(a => a.voting ?? []).filter(v => {
    const yes   = v.votes?.filter((vote: any) => vote.value === 'FOR').length  ?? 0;
    const total = v.votes?.length ?? 0;
    return total > 0 && yes > total / 2;
  }).length;

  return (
    <div className="bg-slate-50">

      {/* AKTYWNA SESJA — tylko gdy trwa */}
      {activeSessions.length > 0 && (
        <section className="bg-[#B91C1C] py-4 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <p className="text-white font-semibold text-sm">
                Trwa sesja: <span className="font-bold">{activeSessions[0].title}</span>
              </p>
            </div>
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-[#B91C1C] font-bold text-sm px-4 py-1.5 rounded transition hover:bg-red-50">
              Dołącz <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* REJESTR GŁOSOWAŃ */}
      <section id="glosowania" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#B91C1C]">Rejestr głosowań</h2>
            <p className="text-slate-500 text-sm mt-1">Publiczny podgląd wyników głosowań — bez logowania.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded px-3 py-2">
            <Lock className="w-3.5 h-3.5" />
            Udział w głosowaniach wymaga logowania
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Ładowanie danych...
          </div>
        ) : finishedSessions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded p-10 text-center text-slate-400">
            <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-slate-500 text-sm">Brak zakończonych sesji</p>
            <p className="text-xs mt-1">Wyniki głosowań pojawią się po przeprowadzeniu pierwszych sesji.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {finishedSessions.slice(0, 5).map(session => {
              const votings   = (session.agendaItems ?? []).flatMap(a => a.voting ?? []);
              const passed    = votings.filter(v => {
                const yes   = v.votes?.filter((vote: any) => vote.value === 'FOR').length ?? 0;
                const total = v.votes?.length ?? 0;
                return total > 0 && yes > total / 2;
              }).length;
              const rejected  = votings.length - passed;
              const date      = getSessionDate(session);

              return (
                <div key={session.id} className="bg-white border border-slate-200 rounded p-4 flex items-center justify-between gap-4 flex-wrap hover:border-slate-300 transition">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{session.title}</p>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatTime(date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold flex-shrink-0">
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />{passed} przyjętych</span>
                    <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" />{rejected} odrzuconych</span>
                    <Link to="/login" className="text-[#B91C1C] hover:underline flex items-center gap-1">
                      Szczegóły <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 bg-[#B91C1C] rounded p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="font-bold text-white text-base">Jesteś radnym?</p>
            <p className="text-red-200 text-sm mt-1">Zaloguj się, aby brać udział w głosowaniach, przeglądać agendę i pobierać dokumenty.</p>
          </div>
          <Link to="/login"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white hover:bg-red-50 text-[#B91C1C] font-bold px-5 py-2.5 rounded text-sm transition whitespace-nowrap">
            Panel radnego <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* KALENDARZ */}
      <section id="kalendarz" className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-xl font-bold text-[#B91C1C] mb-2">Kalendarz posiedzeń</h2>
              <p className="text-slate-500 text-sm mb-4">Terminy sesji i posiedzeń komisji. Kliknij datę aby zobaczyć szczegóły.</p>

              {/* Nadchodzące sesje */}
              {!loading && plannedSessions.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nadchodzące posiedzenia</p>
                  {plannedSessions.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                        <p className="text-xs text-slate-400">{formatDate(getSessionDate(s))} · {formatTime(getSessionDate(s))}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded border text-amber-700 bg-amber-50 border-amber-200">Zaplanowana</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SessionCalendar />
          </div>
        </div>
      </section>

      {/* STATYSTYKI */}
      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-[#B91C1C] mb-8">Aktywność Rady Gminy Nasza Gmina</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BarChart2    className="w-4 h-4 text-[#B91C1C]" />, val: loading ? '...' : String(finishedSessions.length),  label: 'Sesji odbytych'      },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, val: loading ? '...' : String(passedVotings),           label: 'Uchwał przyjętych'   },
              { icon: <XCircle      className="w-4 h-4 text-red-400" />,    val: loading ? '...' : String(totalVotings - passedVotings), label: 'Uchwał odrzuconych' },
              { icon: <TrendingUp   className="w-4 h-4 text-slate-500" />,  val: loading ? '...' : String(sessions.length),          label: 'Sesji łącznie'       },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded p-5 text-center">
                <div className="flex items-center justify-center mb-2">{item.icon}</div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.val}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          {!loading && <p className="text-xs text-slate-400 mt-3">Dane aktualizowane na podstawie przeprowadzonych sesji.</p>}
        </div>
      </section>

      {/* ARCHIWUM NAGRAŃ */}
      <section id="nagrania" className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-[#B91C1C] mb-2">Archiwum nagrań sesji</h2>
          <p className="text-slate-500 text-sm mb-6">Wszystkie sesje są nagrywane i udostępniane publicznie.</p>
          <div className="bg-slate-50 border border-slate-200 rounded p-10 text-center text-slate-400">
            <p className="font-semibold text-slate-500 text-sm">Brak nagrań do wyświetlenia</p>
            <p className="text-xs mt-1">Nagrania pojawią się tutaj po przeprowadzeniu pierwszych sesji.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
