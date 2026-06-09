import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Plus, Search, Shield, ChevronDown, ChevronUp,
  Trash2, UserPlus, Crown, Edit2, Check, X, AlertCircle, Lock,
  MoreHorizontal, CheckCircle2,
} from 'lucide-react';

// ─── TYPY ────────────────────────────────────────────────────────────────────

type Rola = 'administrator' | 'przewodniczacy' | 'sekretarz' | 'radny';
type TypKomisji = 'stala' | 'dorazna';

interface Czlonek {
  id: number;
  imieNazwisko: string;
  email: string;
  rola: Rola;
  inicjaly: string;
  aktywny: boolean;
}

interface Komisja {
  id: number;
  nazwa: string;
  opis: string;
  kolor: 'blue' | 'teal' | 'amber' | 'rose' | 'violet';
  typ: TypKomisji;
  czlonkowie: Czlonek[];
  createdAt: string;
}

// ─── DANE MOCK ────────────────────────────────────────────────────────────────

const PULA_RADNYCH: Czlonek[] = [
  { id: 101, imieNazwisko: 'Paweł Zając',        email: 'p.zajac@gmina.pl',     rola: 'radny',     inicjaly: 'PZ', aktywny: true  },
  { id: 102, imieNazwisko: 'Monika Dąbrowska',   email: 'm.dabrowska@gmina.pl', rola: 'radny',     inicjaly: 'MD', aktywny: false },
  { id: 103, imieNazwisko: 'Krzysztof Lewicki',  email: 'k.lewicki@gmina.pl',   rola: 'radny',     inicjaly: 'KL', aktywny: true  },
  { id: 104, imieNazwisko: 'Zofia Pietrzak',     email: 'z.pietrzak@gmina.pl',  rola: 'sekretarz', inicjaly: 'ZP', aktywny: false },
  { id: 105, imieNazwisko: 'Rafał Kowalczyk',    email: 'r.kowalczyk@gmina.pl', rola: 'radny',     inicjaly: 'RK', aktywny: true  },
  { id: 106, imieNazwisko: 'Beata Mazurek',      email: 'b.mazurek@gmina.pl',   rola: 'radny',     inicjaly: 'BM', aktywny: false },
  { id: 107, imieNazwisko: 'Sławomir Jabłoński', email: 's.jablonski@gmina.pl', rola: 'radny',     inicjaly: 'SJ', aktywny: true  },
];

const MOCK_KOMISJE: Komisja[] = [
  {
    id: 1,
    nazwa: 'Komisja Finansów i Budżetu',
    opis: 'Opiniowanie projektów budżetu, kontrola wykonania planu finansowego oraz nadzór nad mieniem gminy.',
    kolor: 'blue', typ: 'stala', createdAt: '2024-01-15',
    czlonkowie: [
      { id: 1, imieNazwisko: 'Anna Wiśniewska',  email: 'a.wisniewska@gmina.pl',  rola: 'przewodniczacy', inicjaly: 'AW', aktywny: true  },
      { id: 2, imieNazwisko: 'Jan Kowalski',     email: 'j.kowalski@gmina.pl',    rola: 'radny',          inicjaly: 'JK', aktywny: true  },
      { id: 3, imieNazwisko: 'Maria Nowak',      email: 'm.nowak@gmina.pl',       rola: 'sekretarz',      inicjaly: 'MN', aktywny: false },
      { id: 4, imieNazwisko: 'Piotr Wiśniewski', email: 'p.wisniewski@gmina.pl',  rola: 'radny',          inicjaly: 'PW', aktywny: true  },
    ],
  },
  {
    id: 2,
    nazwa: 'Komisja Infrastruktury i Środowiska',
    opis: 'Nadzór nad planowaniem przestrzennym, inwestycjami drogowymi oraz polityką ekologiczną gminy.',
    kolor: 'teal', typ: 'stala', createdAt: '2024-01-15',
    czlonkowie: [
      { id: 5, imieNazwisko: 'Tomasz Malinowski', email: 't.malinowski@gmina.pl', rola: 'przewodniczacy', inicjaly: 'TM', aktywny: true  },
      { id: 6, imieNazwisko: 'Elżbieta Nowak',   email: 'e.nowak@gmina.pl',      rola: 'sekretarz',      inicjaly: 'EN', aktywny: false },
      { id: 7, imieNazwisko: 'Grzegorz Wróbel',  email: 'g.wrobel@gmina.pl',     rola: 'radny',          inicjaly: 'GW', aktywny: true  },
    ],
  },
  {
    id: 3,
    nazwa: 'Komisja Rewizyjna',
    opis: 'Kontrola działalności Wójta oraz gminnych jednostek organizacyjnych. Opiniowanie wniosków o udzielenie absolutorium.',
    kolor: 'amber', typ: 'stala', createdAt: '2024-01-15',
    czlonkowie: [
      { id: 8, imieNazwisko: 'Katarzyna Bąk',  email: 'k.bak@gmina.pl',    rola: 'przewodniczacy', inicjaly: 'KB', aktywny: true  },
      { id: 9, imieNazwisko: 'Andrzej Sikora', email: 'a.sikora@gmina.pl', rola: 'radny',          inicjaly: 'AS', aktywny: false },
    ],
  },
  {
    id: 4,
    nazwa: 'Doraźna Komisja ds. Strategii 2030',
    opis: 'Przygotowanie projektu strategii rozwoju gminy na lata 2025–2030.',
    kolor: 'violet', typ: 'dorazna', createdAt: '2025-03-01',
    czlonkowie: [
      { id: 10, imieNazwisko: 'Anna Wiśniewska',   email: 'a.wisniewska@gmina.pl', rola: 'przewodniczacy', inicjaly: 'AW', aktywny: true },
      { id: 11, imieNazwisko: 'Jan Kowalski',      email: 'j.kowalski@gmina.pl',   rola: 'radny',          inicjaly: 'JK', aktywny: true },
      { id: 12, imieNazwisko: 'Tomasz Malinowski', email: 't.malinowski@gmina.pl', rola: 'radny',          inicjaly: 'TM', aktywny: true },
    ],
  },
];

// Zalogowany użytkownik — w produkcji z AuthContext
const ZALOGOWANY: { id: number; rola: Rola; imie: string } = {
  id: 1, rola: 'administrator', imie: 'Jan Kowalski',
};

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const KOLOR_CFG: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  blue:   { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  teal:   { dot: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  amber:  { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  rose:   { dot: 'bg-rose-500',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200'   },
  violet: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const ROLA_CFG: Record<Rola, { label: string; cls: string; icon: React.ReactNode; opis: string }> = {
  administrator:  { label: 'Administrator',  cls: 'bg-red-50    text-red-700    border-red-200',   icon: <Shield className="w-3 h-3"/>,  opis: 'Pełny dostęp systemowy.'              },
  przewodniczacy: { label: 'Przewodniczący', cls: 'bg-blue-50   text-blue-700   border-blue-200',  icon: <Crown  className="w-3 h-3"/>,  opis: 'Zarządza agendą i otwiera głosowania.' },
  sekretarz:      { label: 'Sekretarz',      cls: 'bg-amber-50  text-amber-700  border-amber-200', icon: <Edit2  className="w-3 h-3"/>,  opis: 'Edytuje dokumenty i załączniki.'      },
  radny:          { label: 'Radny',          cls: 'bg-slate-100 text-slate-600  border-slate-200', icon: <Users  className="w-3 h-3"/>,  opis: 'Uczestniczy w głosowaniach.'          },
};

const ROLE_DO_PRZYPISANIA: Rola[] = ['przewodniczacy', 'sekretarz', 'radny'];

const UPRAWNIENIA = [
  { akcja: 'Zarządzanie kontami',         admin: true,  przew: false, sekr: false, radny: false },
  { akcja: 'Tworzenie/usuwanie komisji',  admin: true,  przew: false, sekr: false, radny: false },
  { akcja: 'Zarządzanie składem komisji', admin: true,  przew: true,  sekr: false, radny: false },
  { akcja: 'Tworzenie i edycja agendy',   admin: true,  przew: true,  sekr: true,  radny: false },
  { akcja: 'Otwieranie głosowań',         admin: true,  przew: true,  sekr: false, radny: false },
  { akcja: 'Udział w głosowaniach',       admin: true,  przew: true,  sekr: false, radny: true  },
  { akcja: 'Wgrywanie załączników PDF',   admin: true,  przew: true,  sekr: true,  radny: false },
  { akcja: 'Przeglądanie dokumentów',     admin: true,  przew: true,  sekr: true,  radny: true  },
  { akcja: 'Eksport podsumowań',          admin: true,  przew: true,  sekr: true,  radny: false },
  { akcja: 'Dostęp do logów systemu',     admin: true,  przew: false, sekr: false, radny: false },
];

// ─── POMOCNICZE ───────────────────────────────────────────────────────────────

function RolaBadge({ rola, size = 'sm' }: { rola: Rola; size?: 'xs' | 'sm' }) {
  const cfg = ROLA_CFG[rola];
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${
      size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
    } ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function Avatar({ inicjaly, aktywny, size = 'md' }: { inicjaly: string; aktywny?: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className="relative flex-shrink-0">
      <div className={`${dim} rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center`}>
        {inicjaly}
      </div>
      {aktywny && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />}
    </div>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {msg}
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── MODAL: DODAJ CZŁONKA ─────────────────────────────────────────────────────

function ModalDodajCzlonka({ komisja, onDodaj, onClose }: {
  komisja: Komisja;
  onDodaj: (komisjaId: number, czlonek: Czlonek, rola: Rola) => void;
  onClose: () => void;
}) {
  const [szukaj, setSzukaj] = useState('');
  const [wybrany, setWybrany] = useState<Czlonek | null>(null);
  const [wybranaRola, setWybranaRola] = useState<Rola>('radny');

  const obecneId = useMemo(() => new Set(komisja.czlonkowie.map(c => c.id)), [komisja]);
  const dostepni = useMemo(() =>
    PULA_RADNYCH.filter(r =>
      !obecneId.has(r.id) &&
      r.imieNazwisko.toLowerCase().includes(szukaj.toLowerCase())
    ), [obecneId, szukaj]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" /> Dodaj członka
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{komisja.nazwa}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus type="text" placeholder="Szukaj radnego..."
              value={szukaj} onChange={e => setSzukaj(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dostępni radni ({dostepni.length})</p>
            {dostepni.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Brak pasujących radnych</p>
              </div>
            )}
            {dostepni.map(r => (
              <button key={r.id} onClick={() => setWybrany(wybrany?.id === r.id ? null : r)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition border ${
                  wybrany?.id === r.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 border-transparent'
                }`}>
                <Avatar inicjaly={r.inicjaly} aktywny={r.aktywny} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{r.imieNazwisko}</p>
                  <p className="text-xs text-slate-400 truncate">{r.email}</p>
                </div>
                {wybrany?.id === r.id
                  ? <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>
                  : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                }
              </button>
            ))}
          </div>

          {wybrany && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rola dla: <span className="text-slate-700">{wybrany.imieNazwisko}</span>
              </p>
              {ROLE_DO_PRZYPISANIA.map(rola => (
                <button key={rola} onClick={() => setWybranaRola(rola)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    wybranaRola === rola ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    wybranaRola === rola ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {wybranaRola === rola && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <RolaBadge rola={rola} />
                    <p className="text-xs text-slate-400 mt-0.5">{ROLA_CFG[rola].opis}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition">Anuluj</button>
          <button
            onClick={() => wybrany && (onDodaj(komisja.id, wybrany, wybranaRola), onClose())}
            disabled={!wybrany}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Dodaj do komisji
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL: NOWA KOMISJA ──────────────────────────────────────────────────────

function ModalNowaKomisja({ onUtwórz, onClose }: {
  onUtwórz: (k: Omit<Komisja, 'id' | 'czlonkowie' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [nazwa, setNazwa] = useState('');
  const [opis, setOpis] = useState('');
  const [kolor, setKolor] = useState<Komisja['kolor']>('blue');
  const [typ, setTyp] = useState<TypKomisji>('stala');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Nowa komisja
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nazwa komisji *</label>
            <input autoFocus type="text" value={nazwa} onChange={e => setNazwa(e.target.value)}
              placeholder="np. Komisja Oświaty i Kultury"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Opis działalności</label>
            <textarea value={opis} onChange={e => setOpis(e.target.value)}
              placeholder="Zakres działania i kompetencji komisji..." rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Typ komisji</label>
            <div className="grid grid-cols-2 gap-2">
              {([['stala', 'Komisja stała'], ['dorazna', 'Komisja doraźna']] as [TypKomisji, string][]).map(([t, l]) => (
                <button key={t} onClick={() => setTyp(t)}
                  className={`py-2.5 text-sm font-bold rounded-xl border transition ${
                    typ === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kolor</label>
            <div className="flex gap-3">
              {(Object.keys(KOLOR_CFG) as Komisja['kolor'][]).map(k => (
                <button key={k} onClick={() => setKolor(k)}
                  className={`w-9 h-9 rounded-full transition-all ${KOLOR_CFG[k].dot} ${
                    kolor === k ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : 'opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition">Anuluj</button>
          <button
            onClick={() => { if (nazwa.trim()) { onUtwórz({ nazwa, opis, kolor, typ }); onClose(); }}}
            disabled={!nazwa.trim()}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Utwórz komisję
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MACIERZ RBAC ────────────────────────────────────────────────────────────

function MacierzRBAC() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
        <span className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-blue-600" /> Macierz uprawnień (RBAC)
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Tylko podgląd
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-bold text-slate-500 w-1/2">Akcja w systemie</th>
                {(['administrator','przewodniczacy','sekretarz','radny'] as Rola[]).map(r => (
                  <th key={r} className="px-4 py-3 text-center"><RolaBadge rola={r} size="xs" /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UPRAWNIENIA.map((u, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="px-6 py-2.5 text-slate-600 font-medium">{u.akcja}</td>
                  {[u.admin, u.przew, u.sekr, u.radny].map((ma, j) => (
                    <td key={j} className="px-4 py-2.5 text-center">
                      {ma ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                           : <X    className="w-3.5 h-3.5 text-slate-200 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── KARTA KOMISJI ────────────────────────────────────────────────────────────

function KartaKomisji({ komisja, mozeZarzadzac, onDodaj, onUsun, onZmienRole, onUsunKomisje }: {
  komisja: Komisja;
  mozeZarzadzac: boolean;
  onDodaj: (id: number) => void;
  onUsun: (komisjaId: number, czlonekId: number) => void;
  onZmienRole: (komisjaId: number, czlonekId: number, rola: Rola) => void;
  onUsunKomisje: (id: number) => void;
}) {
  const [rozwiniety, setRozwiniety] = useState(true);
  const [edytowanyId, setEdytowanyId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const kol = KOLOR_CFG[komisja.kolor];
  const przewodniczacy = komisja.czlonkowie.find(c => c.rola === 'przewodniczacy');
  const aktywnych = komisja.czlonkowie.filter(c => c.aktywny).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${kol.dot}`} />
      <div className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kol.bg} border ${kol.border}`}>
            <Users className={`w-5 h-5 ${kol.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{komisja.nazwa}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    komisja.typ === 'stala' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-violet-50 text-violet-600 border-violet-200'
                  }`}>
                    {komisja.typ === 'stala' ? 'Komisja stała' : 'Doraźna'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{komisja.opis}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setRozwiniety(v => !v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
                  {rozwiniety ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {mozeZarzadzac && (
                  <div className="relative">
                    <button onClick={() => setMenuOpen(v => !v)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                          <button onClick={() => { setMenuOpen(false); onDodaj(komisja.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                            <UserPlus className="w-3.5 h-3.5 text-blue-500" /> Dodaj członka
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => { setMenuOpen(false); onUsunKomisje(komisja.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                            <Trash2 className="w-3.5 h-3.5" /> Usuń komisję
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{komisja.czlonkowie.length} członków</span>
              <span className="flex items-center gap-1 text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{aktywnych} online
              </span>
              {przewodniczacy && (
                <span className="flex items-center gap-1 truncate">
                  <Crown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="truncate">{przewodniczacy.imieNazwisko}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {rozwiniety && (
        <div className="border-t border-slate-100">
          {komisja.czlonkowie.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Brak członków — dodaj pierwszego</p>
            </div>
          )}
          <div className="divide-y divide-slate-50">
            {komisja.czlonkowie.map(czlonek => (
              <div key={czlonek.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/60 transition group">
                <Avatar inicjaly={czlonek.inicjaly} aktywny={czlonek.aktywny} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{czlonek.imieNazwisko}</p>
                  <p className="text-xs text-slate-400 truncate">{czlonek.email}</p>
                </div>
                {mozeZarzadzac && edytowanyId === czlonek.id ? (
                  <div className="flex items-center gap-1.5">
                    <select defaultValue={czlonek.rola} autoFocus
                      onChange={e => { onZmienRole(komisja.id, czlonek.id, e.target.value as Rola); setEdytowanyId(null); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {ROLE_DO_PRZYPISANIA.map(r => <option key={r} value={r}>{ROLA_CFG[r].label}</option>)}
                    </select>
                    <button onClick={() => setEdytowanyId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <RolaBadge rola={czlonek.rola} />
                    {mozeZarzadzac && czlonek.rola !== 'administrator' && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition gap-0.5">
                        <button onClick={() => setEdytowanyId(czlonek.id)} title="Zmień rolę"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onUsun(komisja.id, czlonek.id)} title="Usuń z komisji"
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {mozeZarzadzac && (
            <div className="px-6 py-3 border-t border-slate-100">
              <button onClick={() => onDodaj(komisja.id)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                <UserPlus className="w-4 h-4" /> Dodaj członka
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function ZarzadzanieKomisjami() {
  const [komisje, setKomisje] = useState<Komisja[]>(MOCK_KOMISJE);
  const [szukaj, setSzukaj] = useState('');
  const [filtrTyp, setFiltrTyp] = useState<'wszystkie' | TypKomisji>('wszystkie');
  const [modalDodaj, setModalDodaj] = useState<number | null>(null);
  const [modalNowa, setModalNowa] = useState(false);
  const [showRbac, setShowRbac] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mozeZarzadzac = ZALOGOWANY.rola === 'administrator' || ZALOGOWANY.rola === 'przewodniczacy';
  const jestAdmin = ZALOGOWANY.rola === 'administrator';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const filtrowane = useMemo(() =>
    komisje.filter(k =>
      (filtrTyp === 'wszystkie' || k.typ === filtrTyp) &&
      k.nazwa.toLowerCase().includes(szukaj.toLowerCase())
    ), [komisje, szukaj, filtrTyp]);

  const handleDodajCzlonka = (komisjaId: number, czlonek: Czlonek, rola: Rola) => {
    setKomisje(prev => prev.map(k =>
      k.id !== komisjaId ? k : { ...k, czlonkowie: [...k.czlonkowie, { ...czlonek, rola }] }
    ));
    showToast(`${czlonek.imieNazwisko} dodany/a do komisji`);
  };

  const handleUsunCzlonka = (komisjaId: number, czlonekId: number) => {
    setKomisje(prev => prev.map(k =>
      k.id !== komisjaId ? k : { ...k, czlonkowie: k.czlonkowie.filter(c => c.id !== czlonekId) }
    ));
    showToast('Członek usunięty z komisji');
  };

  const handleZmienRole = (komisjaId: number, czlonekId: number, rola: Rola) => {
    setKomisje(prev => prev.map(k =>
      k.id !== komisjaId ? k : { ...k, czlonkowie: k.czlonkowie.map(c => c.id === czlonekId ? { ...c, rola } : c) }
    ));
    showToast(`Rola zaktualizowana: ${ROLA_CFG[rola].label}`);
  };

  const handleNowaKomisja = (data: Omit<Komisja, 'id' | 'czlonkowie' | 'createdAt'>) => {
    setKomisje(prev => [...prev, { ...data, id: Date.now(), czlonkowie: [], createdAt: new Date().toISOString().split('T')[0] }]);
    showToast(`Komisja "${data.nazwa}" utworzona`);
  };

  const handleUsunKomisje = (id: number) => {
    const k = komisje.find(k => k.id === id);
    setKomisje(prev => prev.filter(k => k.id !== id));
    if (k) showToast(`Komisja "${k.nazwa}" usunięta`);
  };

  const komisjaDodaj = komisje.find(k => k.id === modalDodaj);
  const totalCzlonkow = komisje.reduce((a, k) => a + k.czlonkowie.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {modalDodaj !== null && komisjaDodaj && (
        <ModalDodajCzlonka komisja={komisjaDodaj} onDodaj={handleDodajCzlonka} onClose={() => setModalDodaj(null)} />
      )}
      {modalNowa && <ModalNowaKomisja onUtwórz={handleNowaKomisja} onClose={() => setModalNowa(false)} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Zarządzanie komisjami</h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-3">
                <span>{komisje.length} komisji</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                <span>{totalCzlonkow} członków</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                <span className="text-emerald-600 font-medium">
                  {komisje.reduce((a, k) => a + k.czlonkowie.filter(c => c.aktywny).length, 0)} online
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowRbac(v => !v)}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition ${
                  showRbac ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Uprawnienia</span>
              </button>
              {jestAdmin && (
                <button onClick={() => setModalNowa(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm">
                  <Plus className="w-4 h-4" /> Nowa komisja
                </button>
              )}
            </div>
          </div>

          {!mozeZarzadzac && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p>Tryb tylko do odczytu. Zarządzanie składem wymaga roli <strong>Przewodniczącego</strong> lub <strong>Administratora</strong>.</p>
            </div>
          )}

          {/* Filtry */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Szukaj komisji..." value={szukaj} onChange={e => setSzukaj(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {([['wszystkie', 'Wszystkie'], ['stala', 'Stałe'], ['dorazna', 'Doraźne']] as [string, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setFiltrTyp(v as typeof filtrTyp)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    filtrTyp === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {showRbac && <MacierzRBAC />}

        {filtrowane.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-slate-500">Brak wyników</p>
            <p className="text-sm mt-1">Zmień kryteria wyszukiwania lub utwórz nową komisję.</p>
          </div>
        )}

        {filtrowane.map(k => (
          <KartaKomisji
            key={k.id} komisja={k}
            mozeZarzadzac={mozeZarzadzac}
            onDodaj={id => setModalDodaj(id)}
            onUsun={handleUsunCzlonka}
            onZmienRole={handleZmienRole}
            onUsunKomisje={handleUsunKomisje}
          />
        ))}
      </div>
    </div>
  );
}
