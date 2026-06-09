import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Users, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sesjeApi, type CreateSessionPayload } from '../api/api';

export default function TworzenieSesji() {
  const navigate = useNavigate();

  const [title,       setTitle]       = useState('');
  const [date,        setDate]        = useState('');
  const [time,        setTime]        = useState('10:00');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  // Minimalna data to jutro
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError('Wypełnij wszystkie wymagane pola');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Łączymy datę i godzinę w ISO string
      // Backend wymaga: scheduledAt jako Date w przyszłości
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

      const payload: CreateSessionPayload = {
        title: title.trim(),
        scheduledAt,
      };

      // POST /api/sessions
      await sesjeApi.create(payload);
      setSuccess(true);

      // Po 1.5s wróć do panelu
      setTimeout(() => navigate('/panel'), 1500);

    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Błąd tworzenia sesji');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Panel Radnego
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Nowa sesja</p>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Utwórz posiedzenie</h1>
          <p className="text-slate-500 text-sm mt-1">Zaplanuj nową sesję Rady Gminy lub komisji</p>
        </div>
      </div>

      {/* Formularz */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Sukces */}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold">Sesja została utworzona!</p>
              <p className="text-sm mt-0.5">Przekierowuję do panelu...</p>
            </div>
          </div>
        )}

        {/* Błąd */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

          {/* Tytuł sesji */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tytuł sesji *
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="np. XXXV Sesja Zwyczajna Rady Gminy"
                required
                minLength={5}
                maxLength={100}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Minimum 5 znaków</p>
          </div>

          {/* Data i godzina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Data *
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={minDate}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Godzina *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold mb-1">Co dzieje się po utworzeniu?</p>
              <ul className="space-y-0.5 text-blue-700 font-light">
                <li>• Sesja pojawi się w panelu ze statusem <strong>Nadchodząca</strong></li>
                <li>• Możesz dodać agendę przez przycisk "Edytuj agendę"</li>
                <li>• Radni zobaczą sesję na swojej liście</li>
              </ul>
            </div>
          </div>

          {/* Przyciski */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Tworzenie...</>
                : <><Plus className="w-4 h-4" /> Utwórz sesję</>
              }
            </button>
            <Link
              to="/panel"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 px-6 py-3 rounded-xl transition"
            >
              Anuluj
            </Link>
          </div>
        </form>

        {/* Podpowiedź */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Kolejne kroki po utworzeniu sesji
          </h3>
          <ol className="space-y-2 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              Wejdź w szczegóły sesji i dodaj punkty agendy
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              Dołącz dokumenty PDF do każdego punktu
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              W dniu sesji zmień status na <strong>Aktywna</strong> i otwieraj głosowania
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
