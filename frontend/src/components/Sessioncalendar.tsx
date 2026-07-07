import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sessionsApi, type Session } from '../api/api';
import { formatTime, getSessionDate } from '../utils/dateUtils';
import AddToCalendar from './AddToCalendar';

const MONTHS = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'
];
const DAYS = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-amber-400',
  ACTIVE:    'bg-[#B91C1C] animate-pulse',
  CONCLUDED: 'bg-slate-400',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Zaplanowana',
  ACTIVE:    'W trakcie',
  CONCLUDED: 'Zakończona',
};

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear();
}

export default function SessionCalendar() {
  const today = new Date();
  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    sessionsApi.list()
      .then(data => setSessions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const days: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (days.length % 7 !== 0) days.push(null);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelected(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelected(null); };

  const sessionsOnDay = (day: Date) =>
    sessions.filter(s => { const d = getSessionDate(s); return d ? isSameDay(new Date(d), day) : false; });

  const selectedSessions = selected ? sessionsOnDay(selected) : [];

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden">
      <div className="bg-[#B91C1C] px-5 py-4 flex items-center justify-between">
        <button onClick={prevMonth} className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"><ChevronLeft className="w-4 h-4" /></button>
        <h3 className="text-white font-bold text-sm">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="w-7 h-7 rounded flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{d}</div>)}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) return <div key={i} className="h-10 border-b border-r border-slate-50" />;
          const daySessions  = sessionsOnDay(day);
          const isToday      = isSameDay(day, today);
          const isSelected   = selected ? isSameDay(day, selected) : false;

          return (
            <button key={i} onClick={() => setSelected(isSelected ? null : day)}
              className={`h-10 flex flex-col items-center justify-center border-b border-r border-slate-50 relative transition ${isSelected ? 'bg-[#B91C1C]' : isToday ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
              <span className={`text-xs font-semibold ${isSelected ? 'text-white' : isToday ? 'text-[#B91C1C]' : 'text-slate-700'}`}>{day.getDate()}</span>
              {daySessions.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {daySessions.slice(0, 3).map(s => <span key={s.id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : STATUS_DOT[s.status]}`} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="border-t border-slate-200 px-4 py-4 bg-slate-50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{selected.toLocaleDateString('pl-PL')}</p>
          {selectedSessions.length === 0 ? <p className="text-sm text-slate-400">Brak sesji</p> : (
            <div className="space-y-2">
              {selectedSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-white border border-slate-200 rounded p-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500">{STATUS_LABEL[s.status]}</p>
                  </div>
                  {s.status === 'SCHEDULED' && <AddToCalendar session={s} variant="link" />}
                  {s.status === 'ACTIVE' && <Link to={`/live/${s.id}`} className="text-[#B91C1C] font-bold text-xs"><Radio className="w-3 h-3 inline"/> Na żywo</Link>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
