import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, FileText,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle,
  FileDown, Radio, Eye, Paperclip, BarChart2, Lock, Unlock
} from 'lucide-react';

type StatusSesji = 'nadchodzaca' | 'w_trakcie' | 'zakonczona';
type StatusPunktu = 'oczekujacy' | 'w_trakcie' | 'zakonczone' | 'pominiety';
type StatusGlosowania = 'nierozpoczete' | 'aktywne' | 'zakonczone';
type WyborGlosu = 'ZA' | 'PRZECIW' | 'WSTRZYMUJĘ';

interface Zalacznik { id: number; nazwa: string; typ: 'pdf' | 'docx'; rozmiar: string; }
interface WynikiGlosowania { za: number; przeciw: number; wstrzymalo: number; nieobecnych: number; lacznie: number; }
interface Glosowanie { id: number; tytul: string; status: StatusGlosowania; mojGlos?: WyborGlosu; wyniki?: WynikiGlosowania; trybTajny: boolean; }
interface PunktAgendy { id: number; numer: string; tytul: string; opis?: string; status: StatusPunktu; referent?: string; zalaczniki: Zalacznik[]; glosowanie?: Glosowanie; }
interface Sesja { id: number; numer: string; typ: string; data: string; godzina: string; miejsce: string; przewodniczacy: string; obecnych: number; lacznie: number; status: StatusSesji; punkty: PunktAgendy[]; }

const mockSesja: Sesja = {
  id: 34, numer: 'XXXIV', typ: 'Sesja Zwyczajna', data: '28 maja 2026', godzina: '10:00',
  miejsce: 'Główna Sala Konferencyjna, Ratusz ul. Samorządowa 1',
  przewodniczacy: 'mgr Anna Wiśniewska', obecnych: 14, lacznie: 17, status: 'w_trakcie',
  punkty: [
    { id: 1, numer: '1.', status: 'zakonczone', tytul: 'Otwarcie sesji i stwierdzenie prawomocności obrad', referent: 'Przewodnicząca Rady', zalaczniki: [] },
    { id: 2, numer: '2.', status: 'zakonczone', tytul: 'Przyjęcie porządku obrad', opis: 'Głosowanie nad przyjęciem zaproponowanego porządku obrad z ewentualnymi poprawkami zgłoszonymi przez radnych.', referent: 'Przewodnicząca Rady', zalaczniki: [{ id: 1, nazwa: 'Proponowany porządek obrad.pdf', typ: 'pdf', rozmiar: '124 KB' }], glosowanie: { id: 1, tytul: 'Przyjęcie porządku obrad', status: 'zakonczone', trybTajny: false, mojGlos: 'ZA', wyniki: { za: 13, przeciw: 1, wstrzymalo: 0, nieobecnych: 3, lacznie: 17 } } },
    { id: 3, numer: '3.', status: 'zakonczone', tytul: 'Sprawozdanie Wójta z działalności między sesjami', opis: 'Informacja Wójta Gminy o działalności w okresie od ostatniej sesji, podjętych decyzjach i realizowanych inwestycjach.', referent: 'Wójt Gminy – Tomasz Malinowski', zalaczniki: [{ id: 2, nazwa: 'Sprawozdanie Wójta Q1 2026.pdf', typ: 'pdf', rozmiar: '2,1 MB' }, { id: 3, nazwa: 'Zestawienie inwestycji.pdf', typ: 'pdf', rozmiar: '548 KB' }] },
    { id: 4, numer: '4.', status: 'w_trakcie', tytul: 'Podjęcie uchwały w sprawie uchwalenia budżetu gminy na rok 2026', opis: 'Rozpatrzenie projektu uchwały budżetowej na rok 2026, w tym analizy dochodów i wydatków gminy, planowanych inwestycji oraz źródeł finansowania deficytu.', referent: 'Skarbnik Gminy – Elżbieta Nowak', zalaczniki: [{ id: 4, nazwa: 'Projekt uchwały XV-102-26.pdf', typ: 'pdf', rozmiar: '874 KB' }, { id: 5, nazwa: 'Uzasadnienie do projektu budżetu.pdf', typ: 'pdf', rozmiar: '1,3 MB' }, { id: 6, nazwa: 'Opinia RIO.pdf', typ: 'pdf', rozmiar: '312 KB' }], glosowanie: { id: 2, tytul: 'Uchwała nr XV/102/26 – budżet gminy 2026', status: 'aktywne', trybTajny: false } },
    { id: 5, numer: '5.', status: 'oczekujacy', tytul: 'Zmiana stawek podatku od nieruchomości – dyskusja i głosowanie', opis: 'Rozpatrzenie wniosku Komisji Finansów w sprawie korekty stawek podatkowych obowiązujących od 1 stycznia 2027.', referent: 'Komisja Finansów i Budżetu', zalaczniki: [{ id: 7, nazwa: 'Projekt uchwały podatkowej.pdf', typ: 'pdf', rozmiar: '210 KB' }], glosowanie: { id: 3, tytul: 'Zmiana stawek podatku od nieruchomości', status: 'nierozpoczete', trybTajny: false } },
    { id: 6, numer: '6.', status: 'oczekujacy', tytul: 'Interpelacje i zapytania radnych', referent: 'Radni', zalaczniki: [] },
    { id: 7, numer: '7.', status: 'oczekujacy', tytul: 'Wolne wnioski i informacje', referent: 'Przewodnicząca Rady', zalaczniki: [] },
    { id: 8, numer: '8.', status: 'oczekujacy', tytul: 'Zamknięcie sesji', referent: 'Przewodnicząca Rady', zalaczniki: [] },
  ],
};

const statusSesjiConfig: Record<StatusSesji, { label: string; dot: string; cls: string }> = {
  nadchodzaca: { label: 'Nadchodząca', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  w_trakcie:   { label: 'W trakcie',   dot: 'bg-blue-500',  cls: 'bg-blue-50  text-blue-800  border-blue-200'  },
  zakonczona:  { label: 'Zakończona',  dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const statusPunktuConfig: Record<StatusPunktu, { label: string; iconCls: string; lineCls: string }> = {
  oczekujacy: { label: 'Oczekuje',    iconCls: 'border-2 border-slate-300 bg-white',               lineCls: 'bg-slate-200'   },
  w_trakcie:  { label: 'W trakcie',  iconCls: 'border-2 border-blue-500 bg-blue-50 animate-pulse', lineCls: 'bg-slate-200'   },
  zakonczone: { label: 'Zakończone', iconCls: 'bg-emerald-500',                                     lineCls: 'bg-emerald-400' },
  pominiety:  { label: 'Pominięty',  iconCls: 'bg-slate-300',                                       lineCls: 'bg-slate-200'   },
};

function GlosChip({ glos }: { glos: WyborGlosu }) {
  const map: Record<WyborGlosu, { cls: string; icon: React.ReactNode }> = {
    'ZA':         { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    'PRZECIW':    { cls: 'bg-red-50 text-red-700 border-red-200',             icon: <XCircle      className="w-3.5 h-3.5" /> },
    'WSTRZYMUJĘ': { cls: 'bg-slate-100 text-slate-600 border-slate-300',      icon: <MinusCircle  className="w-3.5 h-3.5" /> },
  };
  const { cls, icon } = map[glos];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {icon} {glos}
    </span>
  );
}

function WynikiBar({ wyniki }: { wyniki: WynikiGlosowania }) {
  const total = wyniki.za + wyniki.przeciw + wyniki.wstrzymalo;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${pct(wyniki.za)}%` }} />
        <div className="bg-red-500 transition-all"                    style={{ width: `${pct(wyniki.przeciw)}%` }} />
        <div className="bg-slate-300 rounded-r-full transition-all"   style={{ width: `${pct(wyniki.wstrzymalo)}%` }} />
      </div>
      <div className="flex gap-4 text-xs font-semibold">
        <span className="text-emerald-600">ZA {wyniki.za} ({pct(wyniki.za)}%)</span>
        <span className="text-red-500">PRZECIW {wyniki.przeciw} ({pct(wyniki.przeciw)}%)</span>
        <span className="text-slate-400">WSTRZ. {wyniki.wstrzymalo}</span>
        <span className="text-slate-400 ml-auto">Nieobecnych {wyniki.nieobecnych}</span>
      </div>
    </div>
  );
}

function GlosowaniePanel({ glosowanie, onVote }: { glosowanie: Glosowanie; onVote: (id: number, choice: WyborGlosu) => void; }) {
  if (glosowanie.status === 'nierozpoczete') {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-400 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
        <Lock className="w-4 h-4" /> Głosowanie jeszcze nierozpoczęte
      </div>
    );
  }
  if (glosowanie.status === 'aktywne') {
    return (
      <div className="mt-4 border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
          </span>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Głosowanie otwarte</p>
          {glosowanie.trybTajny && <span className="ml-auto flex items-center gap-1 text-xs text-blue-500"><Lock className="w-3.5 h-3.5" /> Tajne</span>}
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-3">{glosowanie.tytul}</p>
        {glosowanie.mojGlos ? (
          <div className="flex items-center gap-2"><span className="text-sm text-slate-500">Twój głos:</span><GlosChip glos={glosowanie.mojGlos} /></div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(['ZA', 'PRZECIW', 'WSTRZYMUJĘ'] as WyborGlosu[]).map(choice => (
              <button key={choice} onClick={() => onVote(glosowanie.id, choice)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all active:scale-95 ${choice === 'ZA' ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700' : choice === 'PRZECIW' ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                {choice}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5" /> Głosowanie zakończone</p>
        {glosowanie.mojGlos && <GlosChip glos={glosowanie.mojGlos} />}
      </div>
      {glosowanie.wyniki && <WynikiBar wyniki={glosowanie.wyniki} />}
    </div>
  );
}

function PunktAgendyRow({ punkt, isLast, onVote }: { punkt: PunktAgendy; isLast: boolean; onVote: (glosowanieId: number, choice: WyborGlosu) => void; }) {
  const [expanded, setExpanded] = useState(punkt.status === 'w_trakcie' || punkt.status === 'zakonczone');
  const cfg = statusPunktuConfig[punkt.status];
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconCls}`}>
          {punkt.status === 'zakonczone' && <CheckCircle2 className="w-4 h-4 text-white" />}
          {punkt.status === 'w_trakcie'  && <Radio        className="w-3.5 h-3.5 text-blue-600" />}
          {(punkt.status === 'oczekujacy' || punkt.status === 'pominiety') && <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-[2rem] ${cfg.lineCls}`} />}
      </div>
      <div className="flex-1 pb-6 min-w-0">
        <button onClick={() => setExpanded(v => !v)} className="w-full text-left group">
          <div className="flex items-start gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 mt-0.5 flex-shrink-0">{punkt.numer}</span>
            <p className={`text-sm font-semibold leading-snug flex-1 group-hover:text-blue-700 transition-colors ${punkt.status === 'w_trakcie' ? 'text-blue-700' : punkt.status === 'zakonczone' ? 'text-slate-700' : 'text-slate-900'}`}>
              {punkt.tytul}
            </p>
            <span className="flex-shrink-0 text-slate-400 mt-0.5">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </div>
          {punkt.referent && !expanded && <p className="text-xs text-slate-400 mt-1 ml-6">{punkt.referent}</p>}
        </button>
        {expanded && (
          <div className="mt-3 ml-6 space-y-3">
            {punkt.referent && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {punkt.referent}</p>}
            {punkt.opis && <p className="text-sm text-slate-600 leading-relaxed">{punkt.opis}</p>}
            {punkt.zalaczniki.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> Załączniki</p>
                {punkt.zalaczniki.map(z => (
                  <button key={z.id} className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 font-medium group/att transition">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="group-hover/att:underline truncate">{z.nazwa}</span>
                    <span className="text-slate-400 text-xs font-normal ml-auto flex-shrink-0">{z.rozmiar}</span>
                  </button>
                ))}
              </div>
            )}
            {punkt.glosowanie && <GlosowaniePanel glosowanie={punkt.glosowanie} onVote={onVote} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SesjaDetail() {
  const { id } = useParams<{ id: string }>();
  const [sesja, setSesja] = useState<Sesja>(mockSesja);

  const handleVote = (glosowanieId: number, choice: WyborGlosu) => {
    setSesja(prev => ({
      ...prev,
      punkty: prev.punkty.map(p =>
        p.glosowanie?.id !== glosowanieId ? p : { ...p, glosowanie: { ...p.glosowanie!, mojGlos: choice } }
      ),
    }));
  };

  const statusCfg        = statusSesjiConfig[sesja.status];
  const zakonczone       = sesja.punkty.filter(p => p.status === 'zakonczone').length;
  const postep           = Math.round((zakonczone / sesja.punkty.length) * 100);
  const laczneGlosowania = sesja.punkty.filter(p => p.glosowanie).length;
  const zaglosowane      = sesja.punkty.filter(p => p.glosowanie?.mojGlos).length;
  const sesjaId          = id ?? String(sesja.id);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${sesja.status === 'w_trakcie' ? 'animate-pulse' : ''}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 px-3 py-1.5 bg-slate-100 rounded-full">
              Sesja {sesja.numer}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-6 leading-tight">
            {sesja.numer} {sesja.typ} Rady Gminy
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <div className="flex items-start gap-2.5 text-slate-600">
              <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Data</p>
                <p className="font-semibold text-slate-900">{sesja.data}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Godzina</p>
                <p className="font-semibold text-slate-900">{sesja.godzina}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600 col-span-2">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Miejsce</p>
                <p className="font-semibold text-slate-900">{sesja.miejsce}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600">
              <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Obecni</p>
                <p className="font-semibold text-slate-900">{sesja.obecnych} / {sesja.lacznie} radnych</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600">
              <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Przewodniczy</p>
                <p className="font-semibold text-slate-900">{sesja.przewodniczacy}</p>
              </div>
            </div>
          </div>

          {/* Pasek postępu */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold">
              <span className="text-slate-500">Postęp obrad</span>
              <span className="text-slate-700">{zakonczone} / {sesja.punkty.length} punktów</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${postep}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                Głosowań w sesji: {laczneGlosowania} · Twoje głosy: {zaglosowane}/{laczneGlosowania}
              </span>
              {/* Link do statystyk — tylko gdy sesja zakończona */}
              {sesja.status === 'zakonczona' && (
                <Link
                  to={`/statystyki/${sesjaId}`}
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Zobacz statystyki →
                </Link>
              )}
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
              <FileDown className="w-4 h-4" /> Eksportuj agendę (PDF)
            </button>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition shadow-sm">
              <FileDown className="w-4 h-4 text-slate-400" /> Podsumowanie sesji (PDF)
            </button>
            {/* Statystyki — zawsze widoczny trzeci przycisk */}
            <Link
              to={`/statystyki/${sesjaId}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-4 py-2 rounded-lg transition"
            >
              <BarChart2 className="w-4 h-4" /> Statystyki sesji
            </Link>
          </div>
        </div>
      </div>

      {/* Agenda */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Porządek obrad
        </h2>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {sesja.punkty.map((punkt, idx) => (
            <PunktAgendyRow
              key={punkt.id}
              punkt={punkt}
              isLast={idx === sesja.punkty.length - 1}
              onVote={handleVote}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
