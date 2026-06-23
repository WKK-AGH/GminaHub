import { CheckCircle2, XCircle, MinusCircle, Lock, ArrowRight, BarChart2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionCalendar from './Sessioncalendar';

function ResultBar({ forVotes, against, abstain, total }: {
  forVotes: number; against: number; abstain: number; total: number;
}) {
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px">
        <div className="bg-emerald-500 rounded-l-full" style={{ width: `${pct(forVotes)}%` }} />
        <div className="bg-red-400"                    style={{ width: `${pct(against)}%` }} />
        <div className="bg-slate-300 rounded-r-full"   style={{ width: `${pct(abstain)}%` }} />
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> ZA {forVotes} ({pct(forVotes)}%)</span>
        <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3" /> PRZECIW {against}</span>
        <span className="flex items-center gap-1 text-slate-400"><MinusCircle className="w-3 h-3" /> WSTRZ. {abstain}</span>
        <span className="ml-auto text-slate-400">z {total} radnych</span>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <div className="bg-slate-50">

      {/* REJESTR GŁOSOWAŃ */}
      <section id="glosowania" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#B91C1C]">Rejestr głosowań</h2>
            <p className="text-slate-500 text-sm mt-1">Publiczny podgląd wyników głosowań — bez logowania.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded px-3 py-2">
            <Lock className="w-3.5 h-3.5" />
            Udział w głosowaniach wymaga logowania
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-10 text-center text-slate-400">
          <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500 text-sm">Brak głosowań do wyświetlenia</p>
          <p className="text-xs mt-1">Wyniki głosowań pojawią się tutaj po przeprowadzeniu pierwszych sesji.</p>
        </div>

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

      {/* KALENDARZ SESJI */}
      <section id="kalendarz" className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-xl font-bold text-[#B91C1C] mb-2">Kalendarz posiedzeń</h2>
              <p className="text-slate-500 text-sm mb-6">
                Terminy sesji i posiedzeń komisji Rady Gminy Nasza Gmina.
                Kliknij datę aby zobaczyć szczegóły i dodać do swojego kalendarza.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded p-4">
                <p className="text-xs">
                  <strong className="text-slate-700">Wskazówka:</strong> Kliknij na dzień z kółeczkiem
                  aby zobaczyć szczegóły sesji i dodać ją do Google Calendar lub pobrać plik .ics.
                </p>
              </div>
            </div>
            <SessionCalendar />
          </div>
        </div>
      </section>

      {/* STATYSTYKI */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-[#B91C1C] mb-8">Aktywność Rady Gminy Nasza Gmina</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BarChart2    className="w-4 h-4 text-[#B91C1C]" />, val: '—', label: 'Sesji odbytych'      },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, val: '—', label: 'Uchwał uchwalonych' },
              { icon: <XCircle      className="w-4 h-4 text-red-400" />,    val: '—', label: 'Uchwał odrzuconych'  },
              { icon: <TrendingUp   className="w-4 h-4 text-slate-500" />,  val: '—', label: 'Śr. frekwencja'      },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded p-5 text-center">
                <div className="flex items-center justify-center mb-2">{item.icon}</div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{item.val}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Dane będą aktualizowane po przeprowadzeniu sesji.</p>
        </div>
      </section>

      {/* ARCHIWUM NAGRAŃ */}
      <section id="nagrania" className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-[#B91C1C] mb-2">Archiwum nagrań sesji</h2>
          <p className="text-slate-500 text-sm mb-6">Wszystkie sesje są nagrywane i udostępniane publicznie.</p>

          <div className="bg-white border border-slate-200 rounded p-10 text-center text-slate-400">
            <p className="font-semibold text-slate-500 text-sm">Brak nagrań do wyświetlenia</p>
            <p className="text-xs mt-1">Nagrania pojawią się tutaj po przeprowadzeniu pierwszych sesji.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
