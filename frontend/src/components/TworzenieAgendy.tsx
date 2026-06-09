import { useState, useRef, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, FileText,
  Paperclip, Users, ChevronDown, ChevronUp, Save,
  Send, AlertCircle, CheckCircle2, X, CalendarDays,
  Clock, MapPin, Copy, Eye
} from 'lucide-react';

// ─── TYPY ────────────────────────────────────────────────────────────────────

type TypPunktu = 'standardowy' | 'glosowanie' | 'informacja' | 'przerwa';

interface Zalacznik {
  id: string;
  nazwa: string;
  rozmiar: string;
}

interface PunktAgendy {
  id: string;
  tytul: string;
  opis: string;
  typ: TypPunktu;
  referent: string;
  czasMinuty: number;
  zalaczniki: Zalacznik[];
  wymagaGlosowania: boolean;
}

interface MetadaneSesji {
  numer: string;
  typ: string;
  data: string;
  godzina: string;
  miejsce: string;
  przewodniczacy: string;
}

// ─── DANE STARTOWE ────────────────────────────────────────────────────────────

const SESJA_META: MetadaneSesji = {
  numer: 'XXXV',
  typ: 'Sesja Zwyczajna',
  data: '25 czerwca 2026',
  godzina: '10:00',
  miejsce: 'Główna Sala Konferencyjna (Ratusz)',
  przewodniczacy: 'Anna Wiśniewska',
};

const RADNI = [
  'Anna Wiśniewska', 'Jan Kowalski', 'Maria Nowak',
  'Tomasz Malinowski', 'Elżbieta Nowak', 'Grzegorz Wróbel',
  'Katarzyna Bąk', 'Andrzej Sikora', 'Piotr Wiśniewski',
  'Skarbnik Gminy – Elżbieta Nowak', 'Wójt Gminy – Tomasz Malinowski',
  'Komisja Finansów i Budżetu',
];

const PUNKTY_DOMYSLNE: PunktAgendy[] = [
  {
    id: 'p1', tytul: 'Otwarcie sesji i stwierdzenie prawomocności obrad',
    opis: '', typ: 'standardowy', referent: 'Anna Wiśniewska',
    czasMinuty: 5, zalaczniki: [], wymagaGlosowania: false,
  },
  {
    id: 'p2', tytul: 'Przyjęcie porządku obrad',
    opis: '', typ: 'glosowanie', referent: 'Anna Wiśniewska',
    czasMinuty: 10, zalaczniki: [], wymagaGlosowania: true,
  },
  {
    id: 'p3', tytul: 'Sprawozdanie Wójta Gminy z działalności między sesjami',
    opis: 'Informacja o działalności w okresie od ostatniej sesji, podjętych decyzjach i realizowanych inwestycjach.',
    typ: 'informacja', referent: 'Wójt Gminy – Tomasz Malinowski',
    czasMinuty: 20, zalaczniki: [
      { id: 'z1', nazwa: 'Sprawozdanie_Wojta_Q2_2026.pdf', rozmiar: '2,1 MB' },
    ], wymagaGlosowania: false,
  },
];

// ─── KONFIGURACJA TYPÓW ───────────────────────────────────────────────────────

const TYP_CFG: Record<TypPunktu, { label: string; cls: string; dot: string }> = {
  standardowy: { label: 'Standardowy', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  glosowanie:  { label: 'Głosowanie',  cls: 'bg-blue-50  text-blue-700  border-blue-200',  dot: 'bg-blue-500'  },
  informacja:  { label: 'Informacja',  cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  przerwa:     { label: 'Przerwa',     cls: 'bg-slate-50  text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatCzas(minuty: number) {
  if (minuty < 60) return `${minuty} min`;
  const h = Math.floor(minuty / 60);
  const m = minuty % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        : <AlertCircle  className="w-4 h-4 text-white flex-shrink-0" />
      }
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── KARTA PUNKTU AGENDY ─────────────────────────────────────────────────────

function KartaPunktu({
  punkt,
  numer,
  isDragging,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  punkt: PunktAgendy;
  numer: number;
  isDragging: boolean;
  onUpdate: (id: string, patch: Partial<PunktAgendy>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cfg = TYP_CFG[punkt.typ];

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const nowe: Zalacznik[] = files.map(f => ({
      id: uid(),
      nazwa: f.name,
      rozmiar: f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`,
    }));
    onUpdate(punkt.id, { zalaczniki: [...punkt.zalaczniki, ...nowe] });
    e.target.value = '';
  };

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden transition-all ${
        isDragging ? 'border-blue-400 shadow-lg opacity-50' : 'border-slate-200 shadow-sm hover:shadow-md'
      }`}
      draggable
      onDragStart={() => onDragStart(punkt.id)}
      onDragEnter={() => onDragEnter(punkt.id)}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
    >
      {/* Pasek koloru na górze według typu */}
      <div className={`h-0.5 w-full ${cfg.dot}`} />

      {/* Główny wiersz */}
      <div className="flex items-start gap-3 px-4 py-4">
        {/* Grip */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition mt-0.5 touch-none">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Numer */}
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
          {numer}
        </span>

        {/* Treść */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={punkt.tytul}
            onChange={e => onUpdate(punkt.id, { tytul: e.target.value })}
            placeholder="Tytuł punktu agendy..."
            className="w-full text-sm font-semibold text-slate-900 bg-transparent border-0 outline-none placeholder-slate-300 focus:ring-0 p-0"
          />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {punkt.referent && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" /> {punkt.referent}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatCzas(punkt.czasMinuty)}
            </span>
            {punkt.zalaczniki.length > 0 && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {punkt.zalaczniki.length}
              </span>
            )}
            {punkt.wymagaGlosowania && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Głosowanie
              </span>
            )}
          </div>
        </div>

        {/* Akcje */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(punkt.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel szczegółów */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40 space-y-4">

          {/* Opis */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Opis / uzasadnienie</label>
            <textarea
              value={punkt.opis}
              onChange={e => onUpdate(punkt.id, { opis: e.target.value })}
              placeholder="Opcjonalny opis punktu, uzasadnienie lub dodatkowe informacje..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Typ */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Typ punktu</label>
              <select
                value={punkt.typ}
                onChange={e => onUpdate(punkt.id, { typ: e.target.value as TypPunktu, wymagaGlosowania: e.target.value === 'glosowanie' })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-semibold"
              >
                {(Object.keys(TYP_CFG) as TypPunktu[]).map(t => (
                  <option key={t} value={t}>{TYP_CFG[t].label}</option>
                ))}
              </select>
            </div>

            {/* Referent */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Referent</label>
              <input
                list={`referenci-${punkt.id}`}
                value={punkt.referent}
                onChange={e => onUpdate(punkt.id, { referent: e.target.value })}
                placeholder="Wybierz lub wpisz..."
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <datalist id={`referenci-${punkt.id}`}>
                {RADNI.map(r => <option key={r} value={r} />)}
              </datalist>
            </div>

            {/* Czas */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Czas (min)</label>
              <input
                type="number"
                min={1}
                max={240}
                value={punkt.czasMinuty}
                onChange={e => onUpdate(punkt.id, { czasMinuty: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-mono text-center"
              />
            </div>
          </div>

          {/* Głosowanie toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => onUpdate(punkt.id, { wymagaGlosowania: !punkt.wymagaGlosowania })}
              className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${punkt.wymagaGlosowania ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${punkt.wymagaGlosowania ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-600">Wymaga głosowania</span>
          </label>

          {/* Załączniki */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Załączniki ({punkt.zalaczniki.length})
              </label>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
              >
                <Plus className="w-3 h-3" /> Dodaj plik
              </button>
              <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx" className="hidden" onChange={handleFileAdd} />
            </div>
            {punkt.zalaczniki.length === 0 ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2"
              >
                <Paperclip className="w-4 h-4" /> Przeciągnij pliki lub kliknij aby dodać
              </button>
            ) : (
              <div className="space-y-1.5">
                {punkt.zalaczniki.map(z => (
                  <div key={z.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{z.nazwa}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{z.rozmiar}</span>
                    <button
                      onClick={() => onUpdate(punkt.id, { zalaczniki: punkt.zalaczniki.filter(a => a.id !== z.id) })}
                      className="text-slate-300 hover:text-red-400 transition flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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

// ─── PODGLĄD AGENDY ──────────────────────────────────────────────────────────

function PodgladAgendy({ punkty, sesja }: { punkty: PunktAgendy[]; sesja: MetadaneSesji }) {
  const sumaMinut = punkty.reduce((a, p) => a + p.czasMinuty, 0);
  const glosowania = punkty.filter(p => p.wymagaGlosowania).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Nagłówek */}
      <div className="bg-slate-950 px-5 py-4">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Podgląd</p>
        <p className="text-white font-extrabold text-base">{sesja.numer} {sesja.typ}</p>
        <p className="text-slate-400 text-xs mt-0.5">{sesja.data} · {sesja.godzina}</p>
      </div>

      {/* Statsy */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Punktów',   val: punkty.length },
          { label: 'Głosowań', val: glosowania     },
          { label: 'Szac. czas', val: formatCzas(sumaMinut) },
        ].map(s => (
          <div key={s.label} className="px-3 py-3 text-center">
            <p className="text-base font-extrabold text-slate-900">{s.val}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {punkty.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">Brak punktów agendy</div>
        )}
        {punkty.map((p, i) => {
          const cfg = TYP_CFG[p.typ];
          return (
            <div key={p.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5 ${cfg.cls}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{p.tytul || <span className="text-slate-300 italic">Bez tytułu</span>}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.referent && <span>{p.referent} · </span>}
                  {formatCzas(p.czasMinuty)}
                  {p.zalaczniki.length > 0 && <span> · {p.zalaczniki.length} zał.</span>}
                </p>
              </div>
              {p.wymagaGlosowania && (
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5" title="Głosowanie">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function TworzenieAgendy() {
  const [sesja] = useState<MetadaneSesji>(SESJA_META);
  const [punkty, setPunkty] = useState<PunktAgendy[]>(PUNKTY_DOMYSLNE);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [zapisywanie, setZapisywanie] = useState(false);
  const [showPodglad, setShowPodglad] = useState(false);

  // Drag & drop
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

  const addPunkt = () => {
    const nowy: PunktAgendy = {
      id: uid(), tytul: '', opis: '', typ: 'standardowy',
      referent: '', czasMinuty: 15, zalaczniki: [], wymagaGlosowania: false,
    };
    setPunkty(prev => [...prev, nowy]);
  };

  const addPrzerwa = () => {
    const przerwa: PunktAgendy = {
      id: uid(), tytul: 'Przerwa', opis: '', typ: 'przerwa',
      referent: '', czasMinuty: 15, zalaczniki: [], wymagaGlosowania: false,
    };
    setPunkty(prev => [...prev, przerwa]);
  };

  const updatePunkt = (id: string, patch: Partial<PunktAgendy>) => {
    setPunkty(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  const deletePunkt = (id: string) => {
    setPunkty(prev => prev.filter(p => p.id !== id));
  };

  const duplikuj = (id: string) => {
    const src = punkty.find(p => p.id === id);
    if (!src) return;
    const kopia: PunktAgendy = { ...src, id: uid(), tytul: `${src.tytul} (kopia)` };
    const idx = punkty.findIndex(p => p.id === id);
    const arr = [...punkty];
    arr.splice(idx + 1, 0, kopia);
    setPunkty(arr);
  };

  const handleZapisz = async () => {
    const puste = punkty.filter(p => !p.tytul.trim());
    if (puste.length > 0) {
      setToast({ msg: `${puste.length} punkt${puste.length > 1 ? 'y mają' : ' ma'} pusty tytuł`, type: 'error' });
      return;
    }
    setZapisywanie(true);
    // W produkcji: await fetch('/api/sessions/35/agenda', { method: 'PUT', body: JSON.stringify(punkty) })
    await new Promise(r => setTimeout(r, 800));
    setZapisywanie(false);
    setToast({ msg: 'Agenda zapisana pomyślnie', type: 'success' });
  };

  const handlePublikuj = async () => {
    const puste = punkty.filter(p => !p.tytul.trim());
    if (puste.length > 0) {
      setToast({ msg: 'Uzupełnij wszystkie tytuły przed publikacją', type: 'error' });
      return;
    }
    if (punkty.length < 2) {
      setToast({ msg: 'Agenda musi mieć co najmniej 2 punkty', type: 'error' });
      return;
    }
    setZapisywanie(true);
    await new Promise(r => setTimeout(r, 1000));
    setZapisywanie(false);
    setToast({ msg: 'Agenda opublikowana — radni zostali powiadomieni', type: 'success' });
  };

  const sumaMinut   = punkty.reduce((a, p) => a + p.czasMinuty, 0);
  const glosowania  = punkty.filter(p => p.wymagaGlosowania).length;
  const zalaczniki  = punkty.reduce((a, p) => a + p.zalaczniki.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-4 py-7">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">Tworzenie agendy</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {sesja.numer} {sesja.typ}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />{sesja.data}</span>
                <span className="flex items-center gap-1.5"><Clock        className="w-3.5 h-3.5 text-slate-400" />{sesja.godzina}</span>
                <span className="flex items-center gap-1.5"><MapPin       className="w-3.5 h-3.5 text-slate-400" />{sesja.miejsce}</span>
                <span className="flex items-center gap-1.5"><Users        className="w-3.5 h-3.5 text-slate-400" />{sesja.przewodniczacy}</span>
              </div>
            </div>

            {/* Przyciski zapisu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPodglad(v => !v)}
                className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border transition ${showPodglad ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                <Eye className="w-4 h-4" /> Podgląd
              </button>
              <button
                onClick={handleZapisz}
                disabled={zapisywanie}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {zapisywanie ? 'Zapisywanie...' : 'Zapisz'}
              </button>
              <button
                onClick={handlePublikuj}
                disabled={zapisywanie}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Opublikuj agendę
              </button>
            </div>
          </div>

          {/* Pasek statystyk */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Punktów',     val: punkty.length,        cls: 'text-slate-900'    },
              { label: 'Głosowań',   val: glosowania,            cls: 'text-blue-600'     },
              { label: 'Załączników',val: zalaczniki,            cls: 'text-slate-900'    },
              { label: 'Szac. czas', val: formatCzas(sumaMinut), cls: 'text-slate-900'    },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className={`text-xl font-extrabold tabular-nums leading-none ${s.cls}`}>{s.val}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treść */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showPodglad ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          {/* Lista punktów */}
          <div className={showPodglad ? 'lg:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Punkty porządku obrad ({punkty.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <GripVertical className="w-3.5 h-3.5" /> Przeciągnij aby zmienić kolejność
              </div>
            </div>

            {/* Drag-and-drop lista */}
            <div className="space-y-2">
              {punkty.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-slate-500">Brak punktów agendy</p>
                  <p className="text-sm mt-1">Kliknij "Dodaj punkt" aby zacząć</p>
                </div>
              )}
              {punkty.map((p, i) => (
                <KartaPunktu
                  key={p.id}
                  punkt={p}
                  numer={i + 1}
                  isDragging={false}
                  onUpdate={updatePunkt}
                  onDelete={deletePunkt}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                  onDragEnd={onDragEnd}
                />
              ))}
            </div>

            {/* Przyciski dodawania */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={addPunkt}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Dodaj punkt
              </button>
              <button
                onClick={addPrzerwa}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Dodaj przerwę
              </button>
            </div>

            {/* Punkty szablonowe */}
            <div className="mt-6 border border-slate-200 rounded-2xl p-4 bg-white">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Szybkie dodawanie — typowe punkty</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Wolne wnioski i informacje',
                  'Interpelacje i zapytania radnych',
                  'Zamknięcie sesji',
                  'Przyjęcie protokołu z poprzedniej sesji',
                ].map(tpl => (
                  <button
                    key={tpl}
                    onClick={() => setPunkty(prev => [...prev, {
                      id: uid(), tytul: tpl, opis: '', typ: 'standardowy',
                      referent: 'Anna Wiśniewska', czasMinuty: 10,
                      zalaczniki: [], wymagaGlosowania: false,
                    }])}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" /> {tpl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Podgląd (prawa kolumna) */}
          {showPodglad && (
            <div className="lg:col-span-1">
              <PodgladAgendy punkty={punkty} sesja={sesja} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
