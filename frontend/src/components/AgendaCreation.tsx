import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, FileText,
  Paperclip, Users, ChevronDown, ChevronUp, Save,
  Send, AlertCircle, CheckCircle2, X, CalendarDays,
  Clock, Eye
} from 'lucide-react';

// ─── TYPY ─────────────────────────────────────────────────────────────────────

type TypPunktu = 'standard' | 'glosowanie' | 'informacja' | 'przerwa';

interface Zalacznik {
  id: string;
  nazwa: string;
  rozmiar: string;
}

interface DanePunktu {
  id: string;
  tytul: string;
  opis: string;
  typ: TypPunktu;
  referent: string;
  czasMinuty: number;
  zalaczniki: Zalacznik[];
  wymagaGlosowania: boolean;
}

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const KONFIGURACJA_TYPU: Record<TypPunktu, { etykieta: string; kropkaKlasa: string }> = {
  standard:   { etykieta: 'Standardowy',  kropkaKlasa: 'bg-slate-400' },
  glosowanie: { etykieta: 'Głosowanie',   kropkaKlasa: 'bg-[#B91C1C]'  },
  informacja: { etykieta: 'Informacja',   kropkaKlasa: 'bg-amber-400' },
  przerwa:    { etykieta: 'Przerwa',      kropkaKlasa: 'bg-slate-300' },
};

const SZYBKIE_SZABLONY = [
  'Wolne wnioski i informacje',
  'Interpelacje i zapytania radnych',
  'Zamknięcie sesji',
  'Przyjęcie protokołu z poprzedniej sesji',
];

// ─── POMOCNICZE ───────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatujCzas(minuty: number) {
  if (minuty < 60) return `${minuty} min`;
  const h = Math.floor(minuty / 60), m = minuty % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function Toast({ wiadomosc, typ, onClose }: { wiadomosc: string; typ: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold ${typ === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
      {typ === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {wiadomosc}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── KARTA PUNKTU AGENDY ──────────────────────────────────────────────────────

function KartaPunktu({ punkt, indeks, onAktualizuj, onUsun, onDragStart, onDragEnter, onDragEnd }: {
  punkt: DanePunktu;
  indeks: number;
  onAktualizuj: (id: string, patch: Partial<DanePunktu>) => void;
  onUsun: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [rozwiniety, setRozwiniety] = useState(false);
  const plikRef = useRef<HTMLInputElement>(null);
  const cfg     = KONFIGURACJA_TYPU[punkt.typ];

  const handleDodajPlik = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pliki = Array.from(e.target.files ?? []);
    const nowe: Zalacznik[] = pliki.map(f => ({
      id: uid(), nazwa: f.name,
      rozmiar: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
    }));
    onAktualizuj(punkt.id, { zalaczniki: [...punkt.zalaczniki, ...nowe] });
    e.target.value = '';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      draggable onDragStart={() => onDragStart(punkt.id)} onDragEnter={() => onDragEnter(punkt.id)}
      onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}>
      <div className={`h-0.5 w-full ${cfg.kropkaKlasa}`} />
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition mt-0.5 touch-none">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
          {indeks + 1}
        </span>
        <div className="flex-1 min-w-0">
          <input type="text" value={punkt.tytul} onChange={e => onAktualizuj(punkt.id, { tytul: e.target.value })}
            placeholder="Tytuł punktu agendy..."
            className="w-full text-sm font-semibold text-slate-900 bg-transparent border-0 outline-none placeholder-slate-300 focus:ring-0 p-0" />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.kropkaKlasa}`} />{cfg.etykieta}
            </span>
            {punkt.referent && <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" />{punkt.referent}</span>}
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatujCzas(punkt.czasMinuty)}</span>
            {punkt.zalaczniki.length > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Paperclip className="w-3 h-3" />{punkt.zalaczniki.length}</span>}
            {punkt.wymagaGlosowania && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#B91C1C] border border-red-200">Głosowanie</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setRozwiniety(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
            {rozwiniety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onUsun(punkt.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {rozwiniety && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Opis / uzasadnienie</label>
            <textarea value={punkt.opis} onChange={e => onAktualizuj(punkt.id, { opis: e.target.value })}
              placeholder="Opcjonalny opis punktu..." rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B91C1C] bg-white resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Typ</label>
              <select value={punkt.typ} onChange={e => onAktualizuj(punkt.id, { typ: e.target.value as TypPunktu, wymagaGlosowania: e.target.value === 'glosowanie' })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B91C1C] bg-white font-semibold">
                {(Object.keys(KONFIGURACJA_TYPU) as TypPunktu[]).map(t => (
                  <option key={t} value={t}>{KONFIGURACJA_TYPU[t].etykieta}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Referent</label>
              <input type="text" value={punkt.referent} onChange={e => onAktualizuj(punkt.id, { referent: e.target.value })}
                placeholder="Imię i nazwisko referenta..."
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B91C1C] bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Czas (min)</label>
              <input type="number" min={1} max={240} value={punkt.czasMinuty}
                onChange={e => onAktualizuj(punkt.id, { czasMinuty: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B91C1C] bg-white font-mono text-center" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => onAktualizuj(punkt.id, { wymagaGlosowania: !punkt.wymagaGlosowania })}
              className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${punkt.wymagaGlosowania ? 'bg-[#B91C1C]' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${punkt.wymagaGlosowania ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-600">Wymaga głosowania</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Załączniki ({punkt.zalaczniki.length})</label>
              <button onClick={() => plikRef.current?.click()} className="inline-flex items-center gap-1 text-xs font-bold text-[#B91C1C] hover:text-[#7F1D1D] transition">
                <Plus className="w-3 h-3" /> Dodaj plik
              </button>
              <input ref={plikRef} type="file" multiple accept=".pdf,.docx,.xlsx" className="hidden" onChange={handleDodajPlik} />
            </div>
            {punkt.zalaczniki.length === 0 ? (
              <button onClick={() => plikRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-xs text-slate-400 hover:border-red-300 hover:text-[#B91C1C] transition flex items-center justify-center gap-2">
                <Paperclip className="w-4 h-4" /> Przeciągnij pliki lub kliknij aby dodać
              </button>
            ) : (
              <div className="space-y-1.5">
                {punkt.zalaczniki.map(z => (
                  <div key={z.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-[#B91C1C] flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{z.nazwa}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{z.rozmiar}</span>
                    <button onClick={() => onAktualizuj(punkt.id, { zalaczniki: punkt.zalaczniki.filter(a => a.id !== z.id) })}
                      className="text-slate-300 hover:text-red-400 transition flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PODGLĄD AGENDY ───────────────────────────────────────────────────────────

function PodgladAgendy({ punkty, tytulSesji }: { punkty: DanePunktu[]; tytulSesji: string }) {
  const lacznyCzas   = punkty.reduce((acc, p) => acc + p.czasMinuty, 0);
  const liczbaGlos   = punkty.filter(p => p.wymagaGlosowania).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-950 px-5 py-4">
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Podgląd</p>
        <p className="text-white font-extrabold text-base">{tytulSesji || 'Sesja'}</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { etykieta: 'Punktów',   wartosc: punkty.length },
          { etykieta: 'Głosowań', wartosc: liczbaGlos    },
          { etykieta: 'Szac. czas', wartosc: formatujCzas(lacznyCzas) },
        ].map(s => (
          <div key={s.etykieta} className="px-3 py-3 text-center">
            <p className="text-base font-extrabold text-slate-900">{s.wartosc}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{s.etykieta}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {punkty.length === 0 && <div className="text-center py-8 text-slate-400 text-xs">Brak punktów agendy</div>}
        {punkty.map((p, i) => (
          <div key={p.id} className="flex items-start gap-3 px-4 py-3">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{p.tytul || <span className="text-slate-300 italic">Brak tytułu</span>}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {p.referent && <span>{p.referent} · </span>}
                {formatujCzas(p.czasMinuty)}
              </p>
            </div>
            {p.wymagaGlosowania && (
              <span className="w-4 h-4 rounded-full bg-[#B91C1C] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function AgendaCreation() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [punkty,      setPunkty]      = useState<DanePunktu[]>([]);
  const [toast,       setToast]       = useState<{ msg: string; typ: 'success' | 'error' } | null>(null);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [podglad,     setPodglad]     = useState(false);

  const dragId  = useRef<string | null>(null);
  const enterId = useRef<string | null>(null);

  const onDragStart = (id: string) => { dragId.current  = id; };
  const onDragEnter = (id: string) => { enterId.current = id; };
  const onDragEnd   = () => {
    if (!dragId.current || !enterId.current || dragId.current === enterId.current) {
      dragId.current = enterId.current = null;
      return;
    }
    const from = punkty.findIndex(p => p.id === dragId.current);
    const to   = punkty.findIndex(p => p.id === enterId.current);
    if (from === -1 || to === -1) return;
    const arr = [...punkty];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setPunkty(arr);
    dragId.current = enterId.current = null;
  };

  const dodajPunkt = () => setPunkty(prev => [...prev, {
    id: uid(), tytul: '', opis: '', typ: 'standard',
    referent: '', czasMinuty: 15, zalaczniki: [], wymagaGlosowania: false,
  }]);

  const dodajPrzerwe = () => setPunkty(prev => [...prev, {
    id: uid(), tytul: 'Przerwa', opis: '', typ: 'przerwa',
    referent: '', czasMinuty: 15, zalaczniki: [], wymagaGlosowania: false,
  }]);

  const dodajSzablon = (tytul: string) => setPunkty(prev => [...prev, {
    id: uid(), tytul, opis: '', typ: 'standard',
    referent: '', czasMinuty: 10, zalaczniki: [], wymagaGlosowania: false,
  }]);

  const aktualizujPunkt = (id: string, patch: Partial<DanePunktu>) =>
    setPunkty(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const usunPunkt = (id: string) => setPunkty(prev => prev.filter(p => p.id !== id));

  const pokazToast = (msg: string, typ: 'success' | 'error') => {
    setToast({ msg, typ });
    setTimeout(() => setToast(null), 3500);
  };

  const handleZapisz = async () => {
    const puste = punkty.filter(p => !p.tytul.trim());
    if (puste.length > 0) { pokazToast(`${puste.length} punkt(y) ma pusty tytuł`, 'error'); return; }
    setZapisywanie(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      pokazToast('Agenda zapisana pomyślnie', 'success');
    } catch { pokazToast('Błąd zapisu agendy', 'error'); }
    finally { setZapisywanie(false); }
  };

  const handlePublikuj = async () => {
    const puste = punkty.filter(p => !p.tytul.trim());
    if (puste.length > 0) { pokazToast('Uzupełnij wszystkie tytuły przed publikacją', 'error'); return; }
    if (punkty.length < 2) { pokazToast('Agenda musi mieć co najmniej 2 punkty', 'error'); return; }
    setZapisywanie(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      pokazToast('Agenda opublikowana — radni zostali powiadomieni', 'success');
    } catch { pokazToast('Błąd publikacji agendy', 'error'); }
    finally { setZapisywanie(false); }
  };

  const lacznyCzas   = punkty.reduce((acc, p) => acc + p.czasMinuty, 0);
  const liczbaGlos   = punkty.filter(p => p.wymagaGlosowania).length;
  const liczbaZal    = punkty.reduce((acc, p) => acc + p.zalaczniki.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast wiadomosc={toast.msg} typ={toast.typ} onClose={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Nagłówek */}
      <div className="bg-white border-b border-slate-200 px-4 py-7">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#B91C1C] uppercase tracking-widest mb-1.5">Tworzenie agendy</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {sessionId ? `Sesja #${sessionId}` : 'Nowa agenda'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />Zaplanuj porządek obrad</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPodglad(v => !v)}
                className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border transition ${podglad ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <Eye className="w-4 h-4" /> Podgląd
              </button>
              <button onClick={handleZapisz} disabled={zapisywanie}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition disabled:opacity-50">
                <Save className="w-4 h-4" />{zapisywanie ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button onClick={handlePublikuj} disabled={zapisywanie}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
                <Send className="w-4 h-4" /> Opublikuj agendę
              </button>
            </div>
          </div>

          {/* Statystyki */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { etykieta: 'Punktów',     wartosc: punkty.length,           cls: 'text-slate-900' },
              { etykieta: 'Głosowań',   wartosc: liczbaGlos,               cls: 'text-[#B91C1C]'  },
              { etykieta: 'Załączników', wartosc: liczbaZal,               cls: 'text-slate-900' },
              { etykieta: 'Szac. czas',  wartosc: formatujCzas(lacznyCzas), cls: 'text-slate-900' },
            ].map(s => (
              <div key={s.etykieta} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className={`text-xl font-extrabold tabular-nums leading-none ${s.cls}`}>{s.wartosc}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">{s.etykieta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treść */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${podglad ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          <div className={podglad ? 'lg:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-[#B91C1C]" /> Punkty porządku obrad ({punkty.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <GripVertical className="w-3.5 h-3.5" /> Przeciągnij aby zmienić kolejność
              </div>
            </div>

            <div className="space-y-2">
              {punkty.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-slate-500">Brak punktów agendy</p>
                  <p className="text-sm mt-1">Kliknij "Dodaj punkt" aby zacząć</p>
                </div>
              )}
              {punkty.map((p, i) => (
                <KartaPunktu key={p.id} punkt={p} indeks={i}
                  onAktualizuj={aktualizujPunkt} onUsun={usunPunkt}
                  onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} />
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={dodajPunkt}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#B91C1C] bg-red-50 border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-xl transition">
                <Plus className="w-4 h-4" /> Dodaj punkt
              </button>
              <button onClick={dodajPrzerwe}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
                <Plus className="w-4 h-4" /> Dodaj przerwę
              </button>
            </div>

            {/* Szybkie szablony */}
            <div className="mt-6 border border-slate-200 rounded-2xl p-4 bg-white">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Szybkie dodawanie — typowe punkty</p>
              <div className="flex flex-wrap gap-2">
                {SZYBKIE_SZABLONY.map(szablon => (
                  <button key={szablon} onClick={() => dodajSzablon(szablon)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-red-300 hover:text-[#991B1B] hover:bg-red-50 px-3 py-2 rounded-lg transition">
                    <Plus className="w-3 h-3" /> {szablon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {podglad && (
            <div className="lg:col-span-1">
              <PodgladAgendy punkty={punkty} tytulSesji={sessionId ? `Sesja #${sessionId}` : 'Sesja'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
