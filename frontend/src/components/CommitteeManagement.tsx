
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, Plus, Search, Shield, ChevronDown, ChevronUp,
  Trash2, UserPlus, Crown, Edit2, Check, X, AlertCircle, Lock,
  MoreHorizontal, CheckCircle2, Loader2
} from 'lucide-react';
import { usersApi, type UserListItem, type UserRole, ROLE_LABEL } from '../api/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type CommitteeType = 'permanent' | 'temporary';
type MemberRole    = 'chairman' | 'secretary' | 'member';

interface CommitteeMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  memberRole: MemberRole;
  initials: string;
  isOnline: boolean;
}

interface Committee {
  id: string;
  name: string;
  description: string;
  color: 'blue' | 'teal' | 'amber' | 'rose' | 'violet';
  type: CommitteeType;
  members: CommitteeMember[];
  createdAt: string;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const COLOR_CONFIG: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  blue:   { dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  teal:   { dot: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  amber:  { dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  rose:   { dot: 'bg-rose-500',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200'   },
  violet: { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const MEMBER_ROLE_CONFIG: Record<MemberRole, { label: string; className: string; icon: React.ReactNode; description: string }> = {
  chairman:  { label: 'Przewodniczący', className: 'bg-blue-50   text-blue-700   border-blue-200',  icon: <Crown  className="w-3 h-3" />, description: 'Zarządza porządkiem obrad i otwiera głosowania.'  },
  secretary: { label: 'Sekretarz', className: 'bg-amber-50  text-amber-700  border-amber-200', icon: <Edit2  className="w-3 h-3" />, description: 'Edytuje dokumenty i załączniki.'    },
  member:    { label: 'Członek',    className: 'bg-slate-100 text-slate-600  border-slate-200', icon: <Users  className="w-3 h-3" />, description: 'Uczestniczy w głosowaniach.'           },
};

const ASSIGNABLE_ROLES: MemberRole[] = ['chairman', 'secretary', 'member'];

const PERMISSIONS_MATRIX = [
  { action: 'Zarządzanie kontami użytkowników',         admin: true,  chair: false, sec: false, mem: false },
  { action: 'Tworzenie/usuwanie komisji',     admin: true,  chair: false, sec: false, mem: false },
  { action: 'Zarządzanie członkami komisji',     admin: true,  chair: true,  sec: false, mem: false },
  { action: 'Tworzenie i edycja agendy',       admin: true,  chair: true,  sec: true,  mem: false },
  { action: 'Otwieranie i zamykanie głosowań',       admin: true,  chair: true,  sec: false, mem: false },
  { action: 'Uczestnictwo w głosowaniach',       admin: true,  chair: true,  sec: false, mem: true  },
  { action: 'Przesyłanie załączników PDF',       admin: true,  chair: true,  sec: true,  mem: false },
  { action: 'Podgląd agendy i dokumentów',      admin: true,  chair: true,  sec: true,  mem: true  },
  { action: 'Eksport podsumowań sesji',     admin: true,  chair: true,  sec: true,  mem: false },
  { action: 'Dostęp do logów systemowych',           admin: true,  chair: false, sec: false, mem: false },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function MemberRoleBadge({ role }: { role: MemberRole }) {
  const cfg = MEMBER_ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Avatar({ initials, isOnline, size = 'md' }: { initials: string; isOnline?: boolean; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className="relative flex-shrink-0">
      <div className={`${dim} rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center`}>
        {initials}
      </div>
      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── ADD MEMBER MODAL ─────────────────────────────────────────────────────────

function AddMemberModal({ committee, availableUsers, onAdd, onClose }: {
  committee: Committee;
  availableUsers: UserListItem[];
  onAdd: (committeeId: string, user: UserListItem, role: MemberRole) => void;
  onClose: () => void;
}) {
  const [search,       setSearch]       = useState('');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');

  const existingIds = useMemo(() => new Set(committee.members.map(m => m.userId)), [committee]);

  const filteredUsers = useMemo(() =>
    availableUsers.filter(u =>
      !existingIds.has(u.id) &&
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    ), [availableUsers, existingIds, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" /> Dodaj członka
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{committee.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input autoFocus type="text" placeholder="Szukaj po nazwisku..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dostępni użytkownicy ({filteredUsers.length})</p>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400"><Users className="w-7 h-7 mx-auto mb-2 opacity-30" /><p className="text-sm">Brak dostępnych użytkowników</p></div>
            )}
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition border ${
                  selectedUser?.id === u.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 border-transparent'
                }`}>
                <Avatar initials={`${u.firstName[0]}${u.lastName[0]}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{u.login}</p>
                </div>
                {selectedUser?.id === u.id
                  ? <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></div>
                  : <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                }
              </button>
            ))}
          </div>

          {selectedUser && (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rola dla: <span className="text-slate-700">{selectedUser.firstName} {selectedUser.lastName}</span>
              </p>
              {ASSIGNABLE_ROLES.map(role => (
                <button key={role} onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    selectedRole === role ? 'border-blue-300 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedRole === role ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                    {selectedRole === role && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <MemberRoleBadge role={role} />
                    <p className="text-xs text-slate-400 mt-0.5">{MEMBER_ROLE_CONFIG[role].description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition">Anuluj</button>
          <button onClick={() => selectedUser && (onAdd(committee.id, selectedUser, selectedRole), onClose())}
            disabled={!selectedUser}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition">
            Dodaj do komisji
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE COMMITTEE MODAL ───────────────────────────────────────────────────

function CreateCommitteeModal({ onCreate, onClose }: {
  onCreate: (data: Omit<Committee, 'id' | 'members' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [name,  setName]  = useState('');
  const [desc,  setDesc]  = useState('');
  const [color, setColor] = useState<Committee['color']>('blue');
  const [type,  setType]  = useState<CommitteeType>('permanent');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> Nowa komisja</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nazwa komisji *</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="np. Komisja Finansów i Budżetu"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Opis</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              placeholder="Zakres i obowiązki komisji..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Typ</label>
            <div className="grid grid-cols-2 gap-2">
              {[['permanent', 'Stała'], ['temporary', 'Doraźna']] .map(([v, l]) => (
                <button key={v} onClick={() => setType(v as CommitteeType)}
                  className={`py-2.5 text-sm font-bold rounded-xl border transition ${type === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kolor</label>
            <div className="flex gap-3">
              {(Object.keys(COLOR_CONFIG) as Committee['color'][]).map(k => (
                <button key={k} onClick={() => setColor(k)}
                  className={`w-9 h-9 rounded-full transition-all ${COLOR_CONFIG[k].dot} ${color === k ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : 'opacity-50 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition">Anuluj</button>
          <button onClick={() => { if (name.trim()) { onCreate({ name, description: desc, color, type }); onClose(); }}}
            disabled={!name.trim()}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition">
            Utwórz komisję
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RBAC MATRIX ──────────────────────────────────────────────────────────────

function RBACMatrix() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
        <span className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-blue-600" /> Macierz Uprawnień (RBAC)
        </span>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Lock className="w-3.5 h-3.5" /> Tylko do odczytu
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-bold text-slate-500 w-1/2">Akcja</th>
                {(['Administrator', 'Przewodniczący', 'Sekretarz', 'Członek'] as const).map(r => (
                  <th key={r} className="px-4 py-3 text-center font-bold text-slate-500">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS_MATRIX.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="px-6 py-2.5 text-slate-600 font-medium">{row.action}</td>
                  {[row.admin, row.chair, row.sec, row.mem].map((allowed, j) => (
                    <td key={j} className="px-4 py-2.5 text-center">
                      {allowed ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3.5 h-3.5 text-slate-200 mx-auto" />}
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

// ─── COMMITTEE CARD ───────────────────────────────────────────────────────────

function CommitteeCard({ committee, canManage, onAddMember, onRemoveMember, onChangeRole, onDelete }: {
  committee: Committee;
  canManage: boolean;
  onAddMember: (id: string) => void;
  onRemoveMember: (committeeId: string, memberId: string) => void;
  onChangeRole: (committeeId: string, memberId: string, role: MemberRole) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded,  setExpanded]  = useState(true);
  const [editingId,   setEditingId] = useState<string | null>(null);
  const [menuOpen,    setMenuOpen]  = useState(false);

  const color     = COLOR_CONFIG[committee.color];
  const chairman  = committee.members.find(m => m.memberRole === 'chairman');
  const onlineCount = committee.members.filter(m => m.isOnline).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${color.dot}`} />
      <div className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color.bg} border ${color.border}`}>
            <Users className={`w-5 h-5 ${color.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{committee.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${committee.type === 'permanent' ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-violet-50 text-violet-600 border-violet-200'}`}>
                    {committee.type === 'permanent' ? 'Stała' : 'Doraźna'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{committee.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setExpanded(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {canManage && (
                  <div className="relative">
                    <button onClick={() => setMenuOpen(v => !v)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[160px]">
                          <button onClick={() => { setMenuOpen(false); onAddMember(committee.id); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                            <UserPlus className="w-3.5 h-3.5 text-blue-500" /> Dodaj członka
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => { setMenuOpen(false); onDelete(committee.id); }}
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
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{committee.members.length} członków</span>
              <span className="flex items-center gap-1 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{onlineCount} online</span>
              {chairman && <span className="flex items-center gap-1 truncate"><Crown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span className="truncate">{chairman.firstName} {chairman.lastName}</span></span>}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100">
          {committee.members.length === 0 && (
            <div className="text-center py-8 text-slate-400"><Users className="w-7 h-7 mx-auto mb-2 opacity-30" /><p className="text-sm">Brak członków — dodaj pierwszego</p></div>
          )}
          <div className="divide-y divide-slate-50">
            {committee.members.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50/60 transition group">
                <Avatar initials={member.initials} isOnline={member.isOnline} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
                {canManage && editingId === member.id ? (
                  <div className="flex items-center gap-1.5">
                    <select defaultValue={member.memberRole} autoFocus
                      onChange={e => { onChangeRole(committee.id, member.id, e.target.value as MemberRole); setEditingId(null); }}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400">
                      {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{MEMBER_ROLE_CONFIG[r].label}</option>)}
                    </select>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <MemberRoleBadge role={member.memberRole} />
                    {canManage && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition gap-0.5">
                        <button onClick={() => setEditingId(member.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onRemoveMember(committee.id, member.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {canManage && (
            <div className="px-6 py-3 border-t border-slate-100">
              <button onClick={() => onAddMember(committee.id)}
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CommitteeManagement() {
  const [committees,    setCommittees]    = useState<Committee[]>([]);
  const [availableUsers,setAvailableUsers]= useState<UserListItem[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterType,    setFilterType]    = useState<'all' | CommitteeType>('all');
  const [addMemberFor,  setAddMemberFor]  = useState<string | null>(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [showRBAC,      setShowRBAC]      = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);
  const [isLoadingUsers,setLoadingUsers]  = useState(true);

  useEffect(() => {
    usersApi.list()
      .then(users => setAvailableUsers(users))
      .catch(err  => console.error('Błąd ładowania użytkowników:', err))
      .finally(()  => setLoadingUsers(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() =>
    committees.filter(c =>
      (filterType === 'all' || c.type === filterType) &&
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [committees, searchQuery, filterType]);

  const handleAddMember = (committeeId: string, user: UserListItem, role: MemberRole) => {
    const newMember: CommitteeMember = {
      id: uid(), userId: user.id,
      firstName: user.firstName, lastName: user.lastName,
      email: user.login,
      memberRole: role,
      initials: `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
      isOnline: false,
    };
    setCommittees(prev => prev.map(c =>
      c.id !== committeeId ? c : { ...c, members: [...c.members, newMember] }
    ));
    showToast(`Użytkownik ${user.firstName} ${user.lastName} dodany do komisji`);
  };

  const handleRemoveMember = (committeeId: string, memberId: string) => {
    setCommittees(prev => prev.map(c =>
      c.id !== committeeId ? c : { ...c, members: c.members.filter(m => m.id !== memberId) }
    ));
    showToast('Usunięto członka z komisji');
  };

  const handleChangeRole = (committeeId: string, memberId: string, role: MemberRole) => {
    setCommittees(prev => prev.map(c =>
      c.id !== committeeId ? c : { ...c, members: c.members.map(m => m.id === memberId ? { ...m, memberRole: role } : m) }
    ));
    showToast(`Rola zaktualizowana: ${MEMBER_ROLE_CONFIG[role].label}`);
  };

  const handleCreateCommittee = (data: Omit<Committee, 'id' | 'members' | 'createdAt'>) => {
    setCommittees(prev => [...prev, { ...data, id: uid(), members: [], createdAt: new Date().toISOString() }]);
    showToast(`Komisja "${data.name}" została utworzona`);
  };

  const handleDeleteCommittee = (id: string) => {
    const c = committees.find(c => c.id === id);
    setCommittees(prev => prev.filter(c => c.id !== id));
    if (c) showToast(`Komisja "${c.name}" została usunięta`);
  };

  const committeeForModal = committees.find(c => c.id === addMemberFor);
  const totalMembers = committees.reduce((acc, c) => acc + c.members.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {addMemberFor && committeeForModal && (
        <AddMemberModal
          committee={committeeForModal}
          availableUsers={availableUsers}
          onAdd={handleAddMember}
          onClose={() => setAddMemberFor(null)}
        />
      )}
      {showCreate && <CreateCommitteeModal onCreate={handleCreateCommittee} onClose={() => setShowCreate(false)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Rady
          </Link>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Zarządzanie komisjami</h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-3">
                <span>{committees.length} komisji</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                <span>{totalMembers} członków</span>
                {isLoadingUsers && <span className="flex items-center gap-1 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> Ładowanie użytkowników...</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowRBAC(v => !v)}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition ${showRBAC ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <Shield className="w-4 h-4" /><span className="hidden sm:inline">Uprawnienia</span>
              </button>
              <button onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-sm">
                <Plus className="w-4 h-4" /> Nowa komisja
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Szukaj komisji..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[['all', 'Wszystkie'], ['permanent', 'Stałe'], ['temporary', 'Doraźne']].map(([v, l]) => (
                <button key={v} onClick={() => setFilterType(v as typeof filterType)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${filterType === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {showRBAC && <RBACMatrix />}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-slate-500">Nie znaleziono komisji</p>
            <p className="text-sm mt-1">Zmień kryteria wyszukiwania lub utwórz nową komisję.</p>
          </div>
        )}

        {filtered.map(c => (
          <CommitteeCard
            key={c.id}
            committee={c}
            canManage={true}
            onAddMember={id => setAddMemberFor(id)}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            onDelete={handleDeleteCommittee}
          />
        ))}
      </div>
    </div>
  );
}
