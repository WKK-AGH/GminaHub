import {
    AlertCircle,
    ArrowLeft,
    BarChart2,
    CheckCircle2,
    Clock,
    Loader2,
    MinusCircle,
    Radio,
    Shield,
    Users,
    Wifi,
    WifiOff,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ROLE_LABEL,
    sessionsApi,
    VOTE_LABEL,
    votingsApi,
    type Session,
    type VoteValue,
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getSessionDate } from '../utils/dateUtils';

// ─── TYPY ────────────────────────────────────────────────────────────────────

interface VotingResults {
    forVotes: number;
    against: number;
    abstain: number;
    total: number;
}

// ─── PRZYCISK GŁOSU ──────────────────────────────────────────────────────────

function VoteButton({
    value,
    selected,
    disabled,
    onClick,
}: {
    value: VoteValue;
    selected: boolean;
    disabled: boolean;
    onClick: () => void;
}) {
    const config: Record<VoteValue, { cls: string; selectedCls: string; icon: React.ReactNode }> = {
        FOR: {
            cls: 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400',
            selectedCls: 'bg-emerald-600 border-emerald-600 text-white',
            icon: <CheckCircle2 className="w-6 h-6" />,
        },
        AGAINST: {
            cls: 'border-red-200     hover:bg-red-50     hover:border-red-400',
            selectedCls: 'bg-red-600     border-red-600     text-white',
            icon: <XCircle className="w-6 h-6" />,
        },
        ABSTAIN: {
            cls: 'border-slate-200   hover:bg-slate-50   hover:border-slate-400',
            selectedCls: 'bg-slate-600   border-slate-600   text-white',
            icon: <MinusCircle className="w-6 h-6" />,
        },
    };
    const cfg = config[value];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 font-bold text-sm transition-all ${
                selected ? cfg.selectedCls : `bg-white ${cfg.cls} text-slate-700`
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {cfg.icon}
            <span>{VOTE_LABEL[value]}</span>
            {selected && <span className="text-xs font-semibold opacity-80">Wybrano</span>}
        </button>
    );
}

// ─── PASEK WYNIKÓW ────────────────────────────────────────────────────────────

function ResultBar({ results }: { results: VotingResults }) {
    const { forVotes, against, abstain, total } = results;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return (
        <div className="space-y-3">
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                <div
                    className="bg-emerald-500 rounded-l-full transition-all duration-700"
                    style={{ width: `${pct(forVotes)}%` }}
                />
                <div
                    className="bg-red-500   transition-all duration-700"
                    style={{ width: `${pct(against)}%` }}
                />
                <div
                    className="bg-slate-300 rounded-r-full transition-all duration-700"
                    style={{ width: `${pct(abstain)}%` }}
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[
                    {
                        label: 'ZA',
                        val: forVotes,
                        cls: 'text-emerald-600',
                        bg: 'bg-emerald-50 border-emerald-200',
                    },
                    {
                        label: 'PRZECIW',
                        val: against,
                        cls: 'text-red-500',
                        bg: 'bg-red-50     border-red-200',
                    },
                    {
                        label: 'WSTRZYMUJĘ',
                        val: abstain,
                        cls: 'text-slate-500',
                        bg: 'bg-slate-100  border-slate-200',
                    },
                ].map((r) => (
                    <div
                        key={r.label}
                        className={`flex flex-col items-center px-3 py-3 rounded-xl border text-xs ${r.bg}`}
                    >
                        <span className={`text-3xl font-extrabold leading-none ${r.cls}`}>
                            {r.val}
                        </span>
                        <span className={`font-bold mt-1 text-[10px] ${r.cls}`}>{r.label}</span>
                        <span className="text-slate-400 mt-0.5">{pct(r.val)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function LiveVoting() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { currentUser } = useAuth();

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
    const [voted, setVoted] = useState(false);
    const [sending, setSending] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [results, setResults] = useState<VotingResults | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        sessionsApi
            .getById(sessionId)
            .then((data) => {
                setSession(data);
                setConnected(true);
            })
            .catch((err) => setError(err.message ?? 'Błąd połączenia z sesją'))
            .finally(() => setLoading(false));
    }, [sessionId]);

    useEffect(() => {
        timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatCzas = (sek: number) => {
        const m = Math.floor(sek / 60);
        const s = sek % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleGlosowanie = async () => {
        if (!selectedVote || voted || sending) return;
        const activeVoting = session?.agendaItems
            ?.flatMap((p) => p.voting ?? [])
            .find((v) => v.status === 'OPEN'); // Update status

        if (!activeVoting) return;

        setSending(true);
        try {
            await votingsApi.vote(activeVoting.id, { value: selectedVote });
            setVoted(true);
            setResults({
                forVotes: selectedVote === 'FOR' ? 9 : 8,
                against: selectedVote === 'AGAINST' ? 4 : 3,
                abstain: selectedVote === 'ABSTAIN' ? 5 : 4,
                total: 15,
            });
        } catch (err: unknown) {
            setError((err as { message?: string })?.message ?? 'Błąd oddawania głosu');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Łączenie z sesją...</span>
                </div>
            </div>
        );
    }

    if (error && !session) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Błąd połączenia</h2>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                    <Link
                        to="/panel"
                        className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Wróć do panelu
                    </Link>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const agendaItems = session.agendaItems ?? [];
    const activeItem = agendaItems.find((p) => p.voting?.some((v) => v.status === 'OPEN'));
    const activeVoting = activeItem?.voting?.find((v) => v.status === 'OPEN');

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Górny pasek */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Link
                        to="/panel"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> Panel
                    </Link>
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${connected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                        >
                            {connected ? (
                                <Wifi className="w-3 h-3" />
                            ) : (
                                <WifiOff className="w-3 h-3" />
                            )}
                            {connected ? 'Połączono' : 'Rozłączono'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {formatCzas(elapsed)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Informacje o sesji */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#B91C1C]/20 border border-[#B91C1C]/30 flex items-center justify-center flex-shrink-0">
                            <Radio className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">
                                Aktywna sesja
                            </p>
                            <p className="font-extrabold text-white text-base mt-0.5">
                                {session.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {new Date(getSessionDate(session)).toLocaleDateString('pl-PL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Dane zalogowanego */}
                    {currentUser && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-[#B91C1C] flex items-center justify-center font-extrabold text-xs text-white">
                                {currentUser.initials}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    {currentUser.fullName}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {ROLE_LABEL[currentUser.role]}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <Shield className="w-3 h-3" /> Autoryzowany
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Aktywne głosowanie */}
                {activeVoting ? (
                    <div className="bg-slate-900 border-2 border-[#B91C1C]/40 rounded-2xl p-6 space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B91C1C]" />
                                </span>
                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                                    Głosowanie otwarte
                                </span>
                            </div>
                            <h2 className="text-lg font-extrabold text-white">
                                {activeVoting.title}
                            </h2>
                            {activeItem && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Punkt: {activeItem.title}
                                </p>
                            )}
                        </div>

                        {!voted ? (
                            <>
                                <div className="flex gap-3">
                                    {(['FOR', 'AGAINST', 'ABSTAIN'] as VoteValue[]).map((v) => (
                                        <VoteButton
                                            key={v}
                                            value={v}
                                            selected={selectedVote === v}
                                            disabled={sending}
                                            onClick={() =>
                                                setSelectedVote(v === selectedVote ? null : v)
                                            }
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleGlosowanie}
                                    disabled={!selectedVote || sending}
                                    className="w-full py-4 text-base font-extrabold text-white bg-[#B91C1C] hover:bg-[#B91C1C] rounded-2xl transition disabled:opacity-40 shadow-lg flex items-center justify-center gap-2"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />{' '}
                                            Wysyłanie...
                                        </>
                                    ) : selectedVote ? (
                                        `Potwierdź: ${VOTE_LABEL[selectedVote]}`
                                    ) : (
                                        'Wybierz głos'
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-emerald-400">
                                            Głos oddany
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Twój głos:{' '}
                                            <span className="font-bold text-white">
                                                {selectedVote ? VOTE_LABEL[selectedVote] : ''}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {results && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                            <BarChart2 className="w-3.5 h-3.5" /> Bieżące wyniki
                                        </p>
                                        <ResultBar results={results} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                            <Radio className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="font-bold text-slate-300 text-lg">
                            Oczekiwanie na głosowanie
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            Przewodniczący wkrótce otworzy głosowanie
                        </p>
                    </div>
                )}

                {/* Lista punktów agendy */}
                {agendaItems.length > 0 && (
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Porządek obrad
                        </h3>
                        <div className="space-y-2">
                            {agendaItems
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((item, i) => {
                                    const isActive = item.voting?.some((v) => v.status === 'OPEN');
                                    const isCompleted = item.voting?.every(
                                        (v) => v.status === 'CLOSED',
                                    );
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive ? 'bg-[#B91C1C]/10 border border-[#B91C1C]/30' : 'border border-transparent'}`}
                                        >
                                            <span
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                                                    isActive
                                                        ? 'bg-[#B91C1C]   text-white'
                                                        : isCompleted
                                                          ? 'bg-emerald-600 text-white'
                                                          : 'bg-slate-800  text-slate-400'
                                                }`}
                                            >
                                                {i + 1}
                                            </span>
                                            <span
                                                className={`text-sm font-semibold flex-1 truncate ${isActive ? 'text-red-300' : isCompleted ? 'text-slate-400' : 'text-slate-300'}`}
                                            >
                                                {item.title}
                                            </span>
                                            {isActive && (
                                                <Radio className="w-3.5 h-3.5 text-red-400 flex-shrink-0 animate-pulse" />
                                            )}
                                            {isCompleted && (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                        Głosowania w czasie rzeczywistym wymagają połączenia WebSocket. Pełna
                        funkcjonalność będzie dostępna po wdrożeniu przez backend.
                    </p>
                </div>
            </div>
        </div>
    );
}
