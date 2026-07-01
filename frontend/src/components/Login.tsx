import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [loginValue, setLoginValue] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (currentUser) {
        navigate('/panel', { replace: true });
        return null;
    }

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/panel';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginValue.trim() || !password.trim()) {
            setError('Wypełnij wszystkie pola');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(loginValue, password);
            navigate(from === '/login' ? '/panel' : from, { replace: true });
        } catch (err: unknown) {
            setError((err as { message?: string })?.message ?? 'Błąd logowania');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#B91C1C] rounded flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-lg">RG</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#B91C1C]">Panel radnego</h1>
                    <p className="text-slate-500 text-sm mt-1">Rada Gminy Nasza Gmina</p>
                </div>

                <div className="bg-white border border-slate-200 rounded p-6">
                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Login
                            </label>
                            <input
                                type="text"
                                placeholder="Wprowadź login"
                                value={loginValue}
                                onChange={(e) => setLoginValue(e.target.value)}
                                required
                                autoComplete="username"
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Hasło
                            </label>
                            <input
                                type="password"
                                placeholder="Wprowadź hasło"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-50 text-white font-semibold py-2.5 rounded transition text-sm flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Logowanie...' : 'Zaloguj się'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    <Link to="/" className="hover:text-slate-600 transition">
                        ← Wróć na stronę główną
                    </Link>
                </p>
            </div>
        </div>
    );
}
