import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sessionsApi, type CreateSessionPayload } from '../api/api';

export default function SessionCreation() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !date || !time) {
            setError('Proszę wypełnić wszystkie wymagane pola');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
            await sessionsApi.create({ title: title.trim(), scheduledAt } as CreateSessionPayload);
            setSuccess(true);
            setTimeout(() => navigate('/panel'), 1500);
        } catch (err: unknown) {
            setError((err as { message?: string })?.message ?? 'Nie udało się utworzyć sesji');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="max-w-2xl mx-auto">
                    <Link
                        to="/panel"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Panel Rady
                    </Link>
                </div>
            </div>

            {/* Nagłówek */}
            <div className="bg-white border-b border-slate-200 px-4 py-7">
                <div className="max-w-2xl mx-auto">
                    <p className="text-xs font-semibold text-[#B91C1C] uppercase tracking-widest mb-1">
                        Nowa sesja
                    </p>
                    <h1 className="text-2xl font-bold text-slate-900">Utwórz sesję</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Zaplanuj nową sesję Rady Miejskiej lub komisji
                    </p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-7">
                {success && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded p-4 mb-5 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">Sesja została utworzona!</p>
                            <p className="text-xs mt-0.5">Trwa przekierowanie do panelu...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-4 mb-5 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white border border-slate-200 rounded p-6 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Tytuł sesji *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="np. XXXV Zwyczajna Sesja Rady"
                            required
                            minLength={5}
                            maxLength={100}
                            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                        />
                        <p className="text-xs text-slate-400 mt-1">Minimum 5 znaków</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Data *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={minDate}
                                required
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Godzina *
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded p-4 text-sm text-slate-600">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <div>
                            <p className="font-semibold mb-1 text-slate-700">
                                Co dzieje się po utworzeniu?
                            </p>
                            <ul className="space-y-0.5 text-slate-500 text-xs">
                                <li>
                                    • Sesja pojawi się w panelu ze statusem{' '}
                                    <strong>Nadchodząca</strong>
                                </li>
                                <li>• Będziesz mógł dodać porządek obrad przez "Edytuj agendę"</li>
                                <li>• Radni zobaczą sesję na swojej liście</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="inline-flex items-center gap-2 bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded text-sm transition"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Tworzenie...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" /> Utwórz sesję
                                </>
                            )}
                        </button>
                        <Link
                            to="/panel"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded transition"
                        >
                            Anuluj
                        </Link>
                    </div>
                </form>

                <div className="mt-5 bg-white border border-slate-200 rounded p-5">
                    <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#B91C1C]" /> Kolejne kroki
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-500">
                        {[
                            'Przejdź do szczegółów sesji i dodaj punkty porządku obrad',
                            'Dołącz dokumenty PDF do każdego punktu obrad',
                            'W dniu sesji zmień status na Aktywny i otwórz głosowania',
                        ].map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <span className="w-5 h-5 rounded-full bg-[#B91C1C] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
}
