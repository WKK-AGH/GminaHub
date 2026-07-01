import {
    ArrowRight,
    BarChart2,
    CheckCircle2,
    Lock,
    MinusCircle,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Dane publiczne — tylko do odczytu dla gości
const glosowania = [
    {
        id: 1,
        tytul: 'Uchwała nr XV/102/26 w sprawie uchwalenia budżetu gminy na rok 2026',
        sesja: 'XXXIV Sesja Zwyczajna',
        data: '28.05.2026',
        status: 'w_trakcie' as const,
        wyniki: null,
    },
    {
        id: 2,
        tytul: 'Wniosek o zmianę stawek podatku od nieruchomości',
        sesja: 'XXXIII Sesja',
        data: '14.04.2026',
        status: 'uchwalona' as const,
        wyniki: { za: 12, przeciw: 3, wstrzymalo: 2, lacznie: 17 },
    },
    {
        id: 3,
        tytul: 'Plan zagospodarowania przestrzennego — działka nr 412/B',
        sesja: 'XXXIII Sesja',
        data: '14.04.2026',
        status: 'odrzucona' as const,
        wyniki: { za: 6, przeciw: 8, wstrzymalo: 3, lacznie: 17 },
    },
    {
        id: 4,
        tytul: 'Sprawozdanie z realizacji budżetu gminy za rok 2025',
        sesja: 'XXXII Sesja',
        data: '17.03.2026',
        status: 'uchwalona' as const,
        wyniki: { za: 14, przeciw: 1, wstrzymalo: 2, lacznie: 17 },
    },
    {
        id: 5,
        tytul: 'Przyjęcie planu pracy Komisji Rewizyjnej na rok 2026',
        sesja: 'XXXI Sesja',
        data: '18.02.2026',
        status: 'uchwalona' as const,
        wyniki: { za: 15, przeciw: 0, wstrzymalo: 2, lacznie: 17 },
    },
];

function StatusBadge({ status }: { status: 'uchwalona' | 'odrzucona' | 'w_trakcie' }) {
    if (status === 'uchwalona')
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Uchwalona
            </span>
        );
    if (status === 'odrzucona')
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                <XCircle className="w-3.5 h-3.5" /> Odrzucona
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            W trakcie
        </span>
    );
}

function WynikiBar({
    za,
    przeciw,
    wstrzymalo,
    lacznie,
}: {
    za: number;
    przeciw: number;
    wstrzymalo: number;
    lacznie: number;
}) {
    const pct = (n: number) => Math.round((n / lacznie) * 100);
    return (
        <div className="mt-3 space-y-2">
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px">
                <div
                    className="bg-emerald-500 rounded-l-full transition-all"
                    style={{ width: `${pct(za)}%` }}
                />
                <div className="bg-red-500 transition-all" style={{ width: `${pct(przeciw)}%` }} />
                <div
                    className="bg-slate-300 rounded-r-full transition-all"
                    style={{ width: `${pct(wstrzymalo)}%` }}
                />
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
    return (
        <div className="bg-slate-50">
            {/* ── REJESTR GŁOSOWAŃ ── */}
            <section id="glosowania" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Nagłówek sekcji */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                            Jawność i transparentność
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                            Rejestr głosowań
                        </h2>
                        <p className="text-slate-500 text-sm mt-2">
                            Publiczny podgląd wyników głosowań — bez logowania.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Udział w głosowaniach wymaga logowania
                    </div>
                </div>

                {/* Lista głosowań */}
                <div className="space-y-3">
                    {glosowania.map((g) => (
                        <div
                            key={g.id}
                            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <StatusBadge status={g.status} />
                                        <span className="text-xs text-slate-400">
                                            {g.sesja} · {g.data}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-900 text-sm leading-snug">
                                        {g.tytul}
                                    </p>
                                    {g.wyniki && <WynikiBar {...g.wyniki} />}
                                </div>

                                {/* Blokada dla gości */}
                                {g.status === 'w_trakcie' && (
                                    <Link
                                        to="/login"
                                        className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition whitespace-nowrap"
                                    >
                                        <Lock className="w-3 h-3" /> Zaloguj aby głosować
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA zaloguj */}
                <div className="mt-8 bg-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
                    <div>
                        <p className="font-extrabold text-white text-lg">Jesteś radnym?</p>
                        <p className="text-slate-400 text-sm mt-1">
                            Zaloguj się, aby brać udział w głosowaniach, przeglądać agendę i
                            pobierać dokumenty.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm whitespace-nowrap"
                    >
                        Panel Radnego <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* ── STATYSTYKI TRANSPARENTNOŚCI ── */}
            <section className="border-t border-slate-200 bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                            Dane publiczne
                        </p>
                        <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                            Aktywność Rady Gminy w 2026 r.
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                icon: <BarChart2 className="w-5 h-5 text-blue-600" />,
                                val: '34',
                                label: 'Sesji odbytych',
                                bg: 'bg-blue-50',
                                border: 'border-blue-100',
                            },
                            {
                                icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                                val: '187',
                                label: 'Uchwał uchwalonych',
                                bg: 'bg-emerald-50',
                                border: 'border-emerald-100',
                            },
                            {
                                icon: <XCircle className="w-5 h-5 text-red-500" />,
                                val: '31',
                                label: 'Uchwał odrzuconych',
                                bg: 'bg-red-50',
                                border: 'border-red-100',
                            },
                            {
                                icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
                                val: '94%',
                                label: 'Avg. frekwencja',
                                bg: 'bg-amber-50',
                                border: 'border-amber-100',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`${item.bg} border ${item.border} rounded-2xl p-5 text-center`}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    {item.icon}
                                </div>
                                <p className="text-3xl font-black text-slate-900 tabular-nums">
                                    {item.val}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                                    {item.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ARCHIWUM NAGRAŃ ── */}
            <section id="nagrania" className="border-t border-slate-200 bg-slate-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
                                Publiczne archiwum
                            </p>
                            <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                                Archiwum nagrań sesji
                            </h2>
                            <p className="text-slate-500 text-sm mt-2">
                                Wszystkie sesje są nagrywane i udostępniane publicznie.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            {
                                numer: 'XXXIV',
                                data: '28.05.2026',
                                czas: '3h 12min',
                                status: 'live' as const,
                            },
                            {
                                numer: 'XXXIII',
                                data: '14.04.2026',
                                czas: '2h 47min',
                                status: 'dostepne' as const,
                            },
                            {
                                numer: 'XXXII',
                                data: '17.03.2026',
                                czas: '4h 03min',
                                status: 'dostepne' as const,
                            },
                        ].map((n, i) => (
                            <div
                                key={i}
                                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition shadow-sm group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-extrabold text-slate-900">
                                            {n.numer} Sesja Zwyczajna
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {n.data} · {n.czas}
                                        </p>
                                    </div>
                                    {n.status === 'live' ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                            </span>
                                            LIVE
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                            Dostępne
                                        </span>
                                    )}
                                </div>
                                <button className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition">
                                    ▶ {n.status === 'live' ? 'Oglądaj na żywo' : 'Odtwórz nagranie'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
