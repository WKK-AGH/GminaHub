import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sessionsApi, type Session } from '../api/api';
import AddToCalendar from './AddToCalendar';

const MONTHS = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
];
const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

const STATUS_DOT: Record<string, string> = {
    PLANNED: 'bg-amber-400',
    ACTIVE: 'bg-[#B91C1C] animate-pulse',
    FINISHED: 'bg-slate-400',
};
const STATUS_LABEL: Record<string, string> = {
    PLANNED: 'Zaplanowana',
    ACTIVE: 'W trakcie',
    FINISHED: 'Zakończona',
};

function isSameDay(a: Date, b: Date) {
    return (
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    );
}

export default function SessionCalendar() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Date | null>(null);

    useEffect(() => {
        sessionsApi
            .list()
            .then((data) => setSessions(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Dni w miesiącu
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Przesunięcie: poniedziałek = 0
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: (Date | null)[] = [
        ...Array(startOffset).fill(null),
        ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
    ];
    // Dopełnij do pełnych tygodni
    while (days.length % 7 !== 0) days.push(null);

    const prevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear((y) => y - 1);
        } else setMonth((m) => m - 1);
        setSelected(null);
    };
    const nextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear((y) => y + 1);
        } else setMonth((m) => m + 1);
        setSelected(null);
    };

    // Sesje na dany dzień
    const sessionsOnDay = (day: Date) =>
        sessions.filter((s) => isSameDay(new Date(s.scheduledAt), day));

    // Sesje na wybrany dzień
    const selectedSessions = selected ? sessionsOnDay(selected) : [];

    return (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
            {/* Nagłówek */}
            <div className="bg-[#B91C1C] px-5 py-4 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-white font-bold text-sm">
                    {MONTHS[month]} {year}
                </h3>
                <button
                    onClick={nextMonth}
                    className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Dni tygodnia */}
            <div className="grid grid-cols-7 border-b border-slate-100">
                {DAYS.map((d) => (
                    <div
                        key={d}
                        className="text-center text-[10px] font-bold text-slate-400 uppercase py-2"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Siatka dni */}
            <div className="grid grid-cols-7">
                {days.map((day, i) => {
                    if (!day)
                        return <div key={i} className="h-10 border-b border-r border-slate-50" />;

                    const daySessions = sessionsOnDay(day);
                    const isToday = isSameDay(day, today);
                    const isSelected = selected ? isSameDay(day, selected) : false;
                    const hasSessions = daySessions.length > 0;
                    const isPast = day < today && !isToday;

                    return (
                        <button
                            key={i}
                            onClick={() => setSelected(isSelected ? null : day)}
                            className={`h-10 flex flex-col items-center justify-center border-b border-r border-slate-50 relative transition group
                ${isSelected ? 'bg-[#B91C1C]' : isToday ? 'bg-red-50' : 'hover:bg-slate-50'}
                ${isPast ? 'opacity-50' : ''}
              `}
                        >
                            <span
                                className={`text-xs font-semibold leading-none
                ${isSelected ? 'text-white' : isToday ? 'text-[#B91C1C]' : 'text-slate-700'}
              `}
                            >
                                {day.getDate()}
                            </span>

                            {/* Kółeczka sesji */}
                            {hasSessions && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {daySessions.slice(0, 3).map((s) => (
                                        <span
                                            key={s.id}
                                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : (STATUS_DOT[s.status] ?? 'bg-slate-400')}`}
                                        />
                                    ))}
                                    {daySessions.length > 3 && (
                                        <span
                                            className={`text-[8px] font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}
                                        >
                                            +{daySessions.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                {Object.entries(STATUS_DOT).map(([status, dot]) => (
                    <span
                        key={status}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500"
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${dot.replace('animate-pulse', '')}`}
                        />
                        {STATUS_LABEL[status]}
                    </span>
                ))}
                {loading && (
                    <span className="text-[10px] text-slate-400 ml-auto">Ładowanie...</span>
                )}
            </div>

            {/* Panel wybranego dnia */}
            {selected && (
                <div className="border-t border-slate-200 px-4 py-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                        {selected.toLocaleDateString('pl-PL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>

                    {selectedSessions.length === 0 ? (
                        <p className="text-sm text-slate-400">Brak sesji w tym dniu</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedSessions.map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 rounded p-3"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span
                                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[s.status]?.replace('animate-pulse', '') ?? 'bg-slate-400'}`}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                                                {s.title}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {new Date(s.scheduledAt).toLocaleTimeString(
                                                    'pl-PL',
                                                    { hour: '2-digit', minute: '2-digit' },
                                                )}
                                                {' · '}
                                                {STATUS_LABEL[s.status]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        {s.status === 'PLANNED' && (
                                            <AddToCalendar session={s} variant="link" />
                                        )}
                                        {s.status === 'ACTIVE' && (
                                            <Link
                                                to={`/live/${s.id}`}
                                                className="text-xs font-semibold text-[#B91C1C] flex items-center gap-1 hover:underline"
                                            >
                                                <Radio className="w-3 h-3" /> Na żywo
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
