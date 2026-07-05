import {
    ArrowRight,
    Calendar,
    Clock,
    FileDown,
    FileText,
    ListFilter,
    MapPin,
    Radio,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
    const [showAgenda, setShowAgenda] = useState(false);

    const agendaPoints = [
        { id: 1, title: 'Otwarcie sesji i stwierdzenie prawomocności obrad.' },
        { id: 2, title: 'Przedstawienie agendy sesji, głosowanie nad zmianami.' },
        { id: 3, title: 'Sprawozdanie Wójta Gminy z działalności między sesjami.' },
        { id: 4, title: 'Interpelacje i zapytania radnych.' },
    ];

    const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);
    const meetingDates = [12, 28];

    const stats = [
        { label: 'Radnych w kadencji', value: '17' },
        { label: 'Sesji w 2026 r.', value: '34' },
        { label: 'Głosowań łącznie', value: '218' },
        { label: 'Uchwał podjętych', value: '187' },
    ];

    return (
        <>
            {/* ── HERO GŁÓWNY — ciemny, rządowy, wyrazisty ── */}
            <div className="bg-slate-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Lewa — treść */}
                        <div className="space-y-8">
                            {/* Badge "live" */}
                            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                                </span>
                                Transmisja na żywo — sesja w toku
                            </div>

                            <div className="space-y-5">
                                <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-[0.95] uppercase">
                                    Rada
                                    <br />
                                    <span className="text-blue-500">Gminy</span>
                                    <br />
                                    Online
                                </h1>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-md font-light">
                                    Transparentny dostęp do prac samorządu. Śledź głosowania, agendy
                                    sesji i uchwały Rady Gminy w czasie rzeczywistym.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="#glosowania"
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                                >
                                    Rejestr głosowań <ArrowRight className="w-4 h-4" />
                                </a>
                                <Link
                                    to="/panel"
                                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition text-sm"
                                >
                                    Panel Radnego
                                </Link>
                            </div>
                        </div>

                        {/* Prawa — karta najbliższego posiedzenia */}
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-6">
                            <div className="flex items-center gap-3 pb-5 border-b border-slate-700">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                    <Radio className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                        Najbliższe posiedzenie
                                    </p>
                                    <p className="text-white font-extrabold text-lg leading-snug">
                                        XXXIV Sesja Zwyczajna
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="font-semibold">28 maja 2026, godz. 10:00</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="font-semibold">
                                        Główna Sala Konferencyjna (Ratusz)
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Users className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="font-semibold">17 radnych · Kworum: 9</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="font-semibold">8 punktów agendy</span>
                                </div>
                            </div>

                            {/* Agenda toggle */}
                            <div className="border-t border-slate-700 pt-4 space-y-3">
                                <button
                                    onClick={() => setShowAgenda(!showAgenda)}
                                    className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition border border-slate-700"
                                >
                                    <div className="flex items-center gap-2">
                                        <ListFilter className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-bold text-slate-200">
                                            Szczegółowa agenda
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">
                                        {showAgenda ? 'Zwiń ▲' : 'Rozwiń ▼'}
                                    </span>
                                </button>

                                {showAgenda && (
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-1">
                                        {agendaPoints.map((point) => (
                                            <div
                                                key={point.id}
                                                className="flex items-start gap-2.5 py-2 border-b border-slate-700/50 last:border-0"
                                            >
                                                <span className="font-mono text-xs font-bold text-slate-500 mt-0.5 shrink-0">
                                                    {point.id}.
                                                </span>
                                                <p className="text-sm text-slate-300 leading-snug">
                                                    {point.title}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <button className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl transition text-xs">
                                    <FileDown className="w-4 h-4 text-blue-400" /> Agenda (PDF)
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition text-xs shadow">
                                    <FileDown className="w-4 h-4" /> Podsumowanie
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pasek statystyk */}
                <div className="border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-800">
                            {stats.map((s, i) => (
                                <div key={i} className="px-6 py-5 text-center">
                                    <p className="text-2xl font-black text-white tabular-nums">
                                        {s.value}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── KALENDARZ — jasny, oddzielna sekcja ── */}
            <div id="kalendarz" className="bg-white border-b border-slate-200 py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-sm mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                                Kalendarz posiedzeń — Maj 2026
                            </h2>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                            {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
                                <span key={d}>{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {/* Maj 2026 zaczyna się od piątku — 4 puste komórki */}
                            {[...Array(4)].map((_, i) => (
                                <div key={`e${i}`} />
                            ))}
                            {calendarDays.map((day) => {
                                const isMeeting = meetingDates.includes(day);
                                return (
                                    <div
                                        key={day}
                                        className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full text-sm font-semibold transition ${
                                            isMeeting
                                                ? 'bg-blue-600 text-white font-black shadow ring-4 ring-blue-100'
                                                : 'text-slate-600 hover:bg-slate-100 cursor-default'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                            Zaplanowane posiedzenie Rady Gminy
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
