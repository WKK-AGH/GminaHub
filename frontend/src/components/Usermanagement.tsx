import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Users, Shield, Loader2,
  AlertCircle, CheckCircle2, X, Eye, EyeOff, Search
} from 'lucide-react';
import { usersApi, authApi, ROLE_LABEL, type UserRole, type UserListItem } from '../api/api';

// ─── TYPY ────────────────────────────────────────────────────────────────────

interface NewUserForm {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const EMPTY_FORM: NewUserForm = {
  login: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'RADNY',
};

// ─── KONFIG RÓL ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { className: string; desc: string }> = {
  ADMINISTRATOR:  { className: 'bg-red-50 text-[#B91C1C] border-red-200',      desc: 'Pełny dostęp do systemu'              },
  PRZEWODNICZACY: { className: 'bg-amber-50 text-amber-700 border-amber-200',   desc: 'Zarządza sesjami i komisjami'         },
  RADNY:          { className: 'bg-slate-100 text-slate-600 border-slate-300',  desc: 'Uczestniczy w głosowaniach'           },
};

// ─── SKELETON ────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-slate-200 rounded w-32" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded w-20" /></td>
    </tr>
  );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users,       setUsers]       = useState<UserListItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState<NewUserForm>(EMPTY_FORM);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [sending,     setSending]     = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    usersApi.list()
      .then(data => setUsers(data))
      .catch(err  => setError(err.message ?? 'Błąd pobierania użytkowników'))
      .finally(()  => setLoading(false));
  };

  const handleField = (field: keyof NewUserForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const validate = (): string | null => {
    if (!form.login.trim())     return 'Login jest wymagany';
    if (form.login.length < 3)  return 'Login musi mieć co najmniej 3 znaki';
    if (!form.firstName.trim()) return 'Imię jest wymagane';
    if (!form.lastName.trim())  return 'Nazwisko jest wymagane';
    if (!form.password.trim())  return 'Hasło jest wymagane';
    if (form.password.length < 6) return 'Hasło musi mieć co najmniej 6 znaków';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setFormError(validationError); return; }

    setSending(true);
    setFormError(null);
    try {
      await authApi.register({
        login:     form.login.trim(),
        password:  form.password,
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        role:      form.role,
      });
      setFormSuccess(`Konto dla ${form.firstName} ${form.lastName} zostało utworzone.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchUsers();
      setTimeout(() => setFormSuccess(null), 4000);
    } catch (err: unknown) {
      setFormError((err as { message?: string })?.message ?? 'Błąd tworzenia konta');
    } finally {
      setSending(false);
    }
  };

  const filtered = users.filter(u => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || u.login.includes(q);
  });

  const countByRole = (role: UserRole) => users.filter(u => u.role.name === role).length;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel
          </Link>
        </div>
      </div>

      {/* Nagłówek */}
      <div className="bg-white border-b border-slate-200 px-4 py-7">
        <div className="max-w-4xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#B91C1C] uppercase tracking-widest mb-1">Administrator</p>
            <h1 className="text-2xl font-bold text-slate-900">Zarządzanie użytkownikami</h1>
            <p className="text-slate-500 text-sm mt-1">Tworzenie kont i przypisywanie ról systemowych</p>
          </div>
          <button onClick={() => { setShowForm(v => !v); setFormError(null); }}
            className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold px-4 py-2.5 rounded text-sm transition">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Anuluj' : 'Nowy użytkownik'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-7 space-y-5">

        {/* Komunikat sukcesu */}
        {formSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded p-4 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            {formSuccess}
          </div>
        )}

        {/* Statystyki */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {(['RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR'] as UserRole[]).map(role => (
              <div key={role} className="bg-white border border-slate-200 rounded p-4 text-center">
                <p className="text-2xl font-bold text-[#B91C1C]">{countByRole(role)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ROLE_LABEL[role]}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formularz nowego użytkownika */}
        {showForm && (
          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="bg-[#B91C1C] px-5 py-3">
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Nowe konto użytkownika
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Imię *</label>
                  <input type="text" value={form.firstName} onChange={e => handleField('firstName', e.target.value)}
                    placeholder="np. Jan" required
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nazwisko *</label>
                  <input type="text" value={form.lastName} onChange={e => handleField('lastName', e.target.value)}
                    placeholder="np. Kowalski" required
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Login *</label>
                <input type="text" value={form.login} onChange={e => handleField('login', e.target.value)}
                  placeholder="np. jkowalski" required minLength={3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]" />
                <p className="text-xs text-slate-400 mt-1">Minimum 3 znaki, użytkownik użyje go do logowania</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hasło *</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => handleField('password', e.target.value)}
                    placeholder="Minimum 6 znaków" required minLength={6}
                    className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rola *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['RADNY', 'PRZEWODNICZACY', 'ADMINISTRATOR'] as UserRole[]).map(role => (
                    <button key={role} type="button" onClick={() => handleField('role', role)}
                      className={`flex flex-col items-start px-4 py-3 rounded border text-left transition ${
                        form.role === role
                          ? 'border-[#B91C1C] bg-red-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border mb-1 ${ROLE_CONFIG[role].className}`}>
                        {ROLE_LABEL[role]}
                      </span>
                      <span className="text-xs text-slate-400">{ROLE_CONFIG[role].desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={sending}
                  className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded text-sm transition">
                  {sending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Tworzenie...</>
                    : <><Plus className="w-4 h-4" /> Utwórz konto</>
                  }
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                  className="text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded transition">
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista użytkowników */}
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#B91C1C]" />
              Użytkownicy systemu
              {!loading && <span className="text-slate-400 font-normal">({users.length})</span>}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Szukaj..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#B91C1C] w-44" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-5 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="text-left px-4 py-3">Użytkownik</th>
                <th className="text-left px-4 py-3">Login</th>
                <th className="text-left px-4 py-3">Rola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400 text-sm">
                    {search ? `Brak wyników dla „${search}"` : 'Brak użytkowników w systemie'}
                  </td>
                </tr>
              )}
              {!loading && filtered.map(user => {
                const role = user.role.name as UserRole;
                const cfg  = ROLE_CONFIG[role] ?? ROLE_CONFIG.RADNY;
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#B91C1C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{user.login}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg.className}`}>
                        {ROLE_LABEL[role]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Info o bezpieczeństwie */}
        <div className="flex items-start gap-3 bg-slate-100 border border-slate-200 rounded p-4 text-xs text-slate-500">
          <Shield className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>Tylko Administrator może tworzyć konta i przypisywać role systemowe. Przewodniczący może zarządzać składem komisji, ale nie tworzyć nowych kont.</p>
        </div>
      </div>
    </div>
  );
}
