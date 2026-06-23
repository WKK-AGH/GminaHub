import { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, ExternalLink, Download } from 'lucide-react';
import type { Session } from '../api/api';

// ─── UTILS (wbudowane) ────────────────────────────────────────────────────────

function googleCalendarUrl(session: Session): string {
  const start = new Date(session.scheduledAt);
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     session.title,
    dates:    `${fmt(start)}/${fmt(end)}`,
    details:  'Sesja Rady Gminy Nasza Gmina\nSystem e-Sesja',
    location: 'Urząd Gminy Nasza Gmina, ul. Samorządowa 1',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadIcs(session: Session): void {
  const start = new Date(session.scheduledAt);
  const end   = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//e-Sesja//Rada Gminy Nasza Gmina//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:session-${session.id}@nasza-gmina.pl`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${session.title}`,
    'DESCRIPTION:Sesja Rady Gminy Nasza Gmina\\nSystem e-Sesja',
    'LOCATION:Urząd Gminy Nasza Gmina\\, ul. Samorządowa 1',
    `DTSTAMP:${fmt(new Date())}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sesja-${session.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────

function DropdownMenu({ onGoogle, onIcs }: { onGoogle: () => void; onIcs: () => void }) {
  return (
    <div className="absolute left-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded shadow-lg z-20 overflow-hidden">
      <button onClick={onGoogle}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition text-left">
        <ExternalLink className="w-4 h-4 text-[#B91C1C] flex-shrink-0" />
        <div>
          <p className="font-semibold">Google Calendar</p>
          <p className="text-xs text-slate-400">Otwiera w przeglądarce</p>
        </div>
      </button>
      <div className="border-t border-slate-100" />
      <button onClick={onIcs}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition text-left">
        <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div>
          <p className="font-semibold">Pobierz plik .ics</p>
          <p className="text-xs text-slate-400">Apple Calendar, Outlook i inne</p>
        </div>
      </button>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

interface Props {
  session: Session;
  variant?: 'button' | 'link';
}

export default function AddToCalendar({ session, variant = 'button' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGoogle = () => { window.open(googleCalendarUrl(session), '_blank', 'noopener,noreferrer'); setOpen(false); };
  const handleIcs    = () => { downloadIcs(session); setOpen(false); };

  if (variant === 'link') {
    return (
      <div ref={ref} className="relative inline-block">
        <button onClick={() => setOpen(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#B91C1C] transition">
          <CalendarPlus className="w-3.5 h-3.5" />
          Dodaj do kalendarza
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <DropdownMenu onGoogle={handleGoogle} onIcs={handleIcs} />}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-[#B91C1C] hover:text-[#B91C1C] px-4 py-2 rounded transition">
        <CalendarPlus className="w-4 h-4" />
        Dodaj do kalendarza
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <DropdownMenu onGoogle={handleGoogle} onIcs={handleIcs} />}
    </div>
  );
}
