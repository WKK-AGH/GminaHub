import { CheckCircle2, XCircle, MinusCircle, Lock, ArrowRight, BarChart2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── PASEK WYNIKÓW GŁOSOWANIA ─────────────────────────────────────────────────

function PasekWynikow({ za, przeciw, wstrzymalo, lacznie }: {
  za: number; przeciw: number; wstrzymalo: number; lacznie: number;
}) {
  const pct = (n: number) => Math.round((n / lacznie) * 100);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px">
        <div className="bg-emerald-500 rounded-l-full" style={{ width: `${pct(za)}%` }} />
        <div className="bg-red-500" style={{ width: `${pct(przeciw)}%` }} />
        <div className="bg-slate-300 rounded-r-full" style={{ width: `${pct(wstrzymalo)}%` }} />
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1 text-emerald-600">
          <CheckCircle2 className="w-3 h-3" /> ZA {za} ({pct(za)}%)
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <XCircle className="w-3 h-3" /> PRZECIW {przeciw}
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <MinusCircle className="w-3 h-3" /> WSTRZ. {wstrzymalo}
        </span>
        <span className="ml-auto text-slate-400">z {lacznie} radnych</span>
      </div>
    </div>
  );
}

export default function Features() {
  const { currentUser } = useAuth();

  return (
    <div className="bg-slate-50">

      {/* ── REJESTR GŁOSOWAŃ ── */}
      <section id="glosowania" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Rejestr głosowań</h2>
            <p className="text-slate-500 text-sm mt-2">Publiczny podgląd wyników głosowań — bez logowania.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
            <Lock className="w-3.5 h-3.5" />
            Udział w głosowaniach wymaga logowania
          </div>
        </div>

        {/* Pusta lista — dane będą z API */}
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-500">Brak głosowań do wyświetlenia</p>
          <p className="text-sm mt-1">Wyniki głosowań pojawią się tutaj po przeprowadzeniu pierwszych sesji.</p>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <p className="font-extrabold text-white text-lg">Jesteś radnym?</p>
            <p className="text-slate-400 text-sm mt-1">Zaloguj się, aby brać udział w głosowaniach, przeglądać agendę i pobierać dokumenty.</p>
          </div>
          <Link to="/login"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm whitespace-nowrap">
            Panel Radnego <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── STATYSTYKI ── */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Aktywność Rady Gminy Nasza Gmina</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <BarChart2    className="w-5 h-5 text-blue-600" />,   val: '—',  label: 'Sesji odbytych',      bg: 'bg-blue-50',    border: 'border-blue-100'    },
              { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,val: '—',  label: 'Uchwał uchwalonych',  bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { icon: <XCircle      className="w-5 h-5 text-red-500" />,    val: '—',  label: 'Uchwał odrzuconych',  bg: 'bg-red-50',     border: 'border-red-100'     },
              { icon: <TrendingUp   className="w-5 h-5 text-amber-600" />,  val: '—',  label: 'Śr. frekwencja',      bg: 'bg-amber-50',   border: 'border-amber-100'   },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} border ${item.border} rounded-2xl p-5 text-center`}>
                <div className="flex items-center justify-center mb-3">{item.icon}</div>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{item.val}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">Dane będą aktualizowane po przeprowadzeniu sesji.</p>
        </div>
      </section>

      {/* ── ARCHIWUM NAGRAŃ ── */}
      <section id="nagrania" className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Archiwum nagrań sesji</h2>
            <p className="text-slate-500 text-sm mt-2">Wszystkie sesje są nagrywane i udostępniane publicznie.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
            <p className="font-semibold text-slate-500">Brak nagrań do wyświetlenia</p>
            <p className="text-sm mt-1">Nagrania pojawią się tutaj po przeprowadzeniu pierwszych sesji.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
