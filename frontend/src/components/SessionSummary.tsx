import {
    AlertCircle,
    ArrowLeft,
    Award,
    BarChart2,
    CalendarDays,
    CheckCircle2,
    Clock,
    FileDown,
    FileText,
    MinusCircle,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sessionsApi, type Session } from '../api/api';

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}
function pct(n: number, total: number) {
    return total > 0 ? Math.round((n / total) * 100) : 0;
}

const STATUS_LABEL: Record<string, string> = {
    PLANNED: 'Nadchodząca',
    ACTIVE: 'W trakcie',
    FINISHED: 'Zakończona',
};

export default function SessionSummary() {
    const { id } = useParams<{ id: string }>();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        sessionsApi
            .getById(id)
            .then((data) => setSession(data))
            .catch((err) => setError(err.message ?? 'Błąd pobierania podsumowania'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleExportPDF = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="bg-white border-b border-slate-200 px-4 py-3">
                    <div className="max-w-5xl mx-auto h-4 bg-slate-200 rounded w-32 animate-pulse" />
                </div>
                <div className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
                    <div className="h-7 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded p-4">
                                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
                                <div className="h-6 bg-slate-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-6 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="h-4 bg-slate-100 rounded"
                                style={{ width: `${80 - i * 8}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">{error ?? 'Nie znaleziono sesji'}</p>
                    <Link
                        to="/panel"
                        className="text-sm text-[#B91C1C] hover:underline mt-2 inline-block"
                    >
                        ← Wróć do panelu
                    </Link>
                </div>
            </div>
        );
    }

    const agendaItems = session.agendaItems ?? [];
    const allVotings = agendaItems.flatMap((p) => p.voting ?? []);
    const completedVotings = allVotings.filter((g) => g.status === 'COMPLETED');
    const passedCount = completedVotings.filter((g) => {
        const za = g.votes?.filter((v: any) => v.value === 'YES').length ?? 0;
        const total = g.votes?.length ?? 0;
        return za > total / 2;
    }).length;
    const rejectedCount = completedVotings.length - passedCount;

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            {/* Breadcrumb — ukryty przy druku */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        to={`/sesja/${id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Szczegóły sesji
                    </Link>
                    <button
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#B91C1C] hover:text-[#7F1D1D] border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
                    >
                        <FileDown className="w-4 h-4" /> Eksport do PDF
                    </button>
                </div>
            </div>

            {/* Nagłówek */}
            <div className="bg-white border-b border-slate-200 px-4 py-8 print:border-0">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-[#B91C1C]" />
                        <span className="text-xs font-bold text-[#B91C1C] uppercase tracking-widest">
                            Podsumowanie obrad
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-4">
                        {session.title}
                    </h1>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" />
                            {formatDate(session.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(session.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4" />
                            Status: {STATUS_LABEL[session.status] ?? session.status}
                        </span>
                        {session.committee && (
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {session.committee.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print:py-4">
                {/* Karty podsumowania */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        {
                            icon: <FileText className="w-5 h-5" />,
                            label: 'Punktów agendy',
                            value: agendaItems.length,
                            bg: 'bg-slate-100',
                            tc: 'text-slate-600',
                        },
                        {
                            icon: <BarChart2 className="w-5 h-5" />,
                            label: 'Głosowań łącznie',
                            value: allVotings.length,
                            bg: 'bg-red-50',
                            tc: 'text-[#B91C1C]',
                        },
                        {
                            icon: <CheckCircle2 className="w-5 h-5" />,
                            label: 'Uchwał uchwalonych',
                            value: passedCount,
                            bg: 'bg-emerald-50',
                            tc: 'text-emerald-600',
                        },
                        {
                            icon: <XCircle className="w-5 h-5" />,
                            label: 'Odrzuconych',
                            value: rejectedCount,
                            bg: 'bg-red-50',
                            tc: 'text-red-500',
                        },
                    ].map((s, i) => (
                        <div
                            key={i}
                            className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm"
                        >
                            <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.bg} ${s.tc}`}
                            >
                                {s.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {s.label}
                                </p>
                                <p className="text-xl font-extrabold text-slate-900 leading-tight">
                                    {s.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Agenda */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#B91C1C]" />
                        <h2 className="font-extrabold text-slate-900 text-sm">Porządek obrad</h2>
                    </div>
                    {agendaItems.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            Brak punktów agendy
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {agendaItems
                                .sort((a, b) => a.order - b.order)
                                .map((item, i) => {
                                    const voting = item.voting?.[0];
                                    const yes =
                                        voting?.votes?.filter((v: any) => v.value === 'YES')
                                            .length ?? 0;
                                    const no =
                                        voting?.votes?.filter((v: any) => v.value === 'NO')
                                            .length ?? 0;
                                    const abstain =
                                        voting?.votes?.filter((v: any) => v.value === 'ABSTAIN')
                                            .length ?? 0;
                                    const total = yes + no + abstain;
                                    const uchwalona = total > 0 && yes > total / 2;

                                    return (
                                        <div key={item.id} className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {item.title}
                                                    </p>
                                                    {voting && voting.status === 'COMPLETED' && (
                                                        <div className="mt-2">
                                                            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px mb-1.5">
                                                                <div
                                                                    className="bg-emerald-500 rounded-l-full"
                                                                    style={{
                                                                        width: `${pct(yes, total)}%`,
                                                                    }}
                                                                />
                                                                <div
                                                                    className="bg-red-500"
                                                                    style={{
                                                                        width: `${pct(no, total)}%`,
                                                                    }}
                                                                />
                                                                <div
                                                                    className="bg-slate-300 rounded-r-full"
                                                                    style={{
                                                                        width: `${pct(abstain, total)}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex gap-4 text-xs font-semibold">
                                                                <span className="text-emerald-600 flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" />{' '}
                                                                    ZA {yes} ({pct(yes, total)}%)
                                                                </span>
                                                                <span className="text-red-500 flex items-center gap-1">
                                                                    <XCircle className="w-3 h-3" />{' '}
                                                                    PRZECIW {no}
                                                                </span>
                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                    <MinusCircle className="w-3 h-3" />{' '}
                                                                    WSTRZ. {abstain}
                                                                </span>
                                                                <span className="ml-auto">
                                                                    {uchwalona ? (
                                                                        <span className="text-emerald-600 font-bold">
                                                                            ✓ Uchwalona
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-red-500 font-bold">
                                                                            ✗ Odrzucona
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(!voting || voting.status !== 'COMPLETED') && (
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Bez głosowania
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>

                {/* Treść podsumowania z bazy */}
                {session.summary && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-[#B91C1C]" /> Protokół z obrad
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {session.summary.content}
                        </p>
                    </div>
                )}

                {/* Stopka wydruku */}
                <div className="hidden print:block text-center text-xs text-slate-400 border-t border-slate-200 pt-4">
                    <p>Urząd Gminy Nasza Gmina · ul. Samorządowa 1 · rada@nasza-gmina.pl</p>
                    <p className="mt-1">
                        Wygenerowano:{' '}
                        {new Date().toLocaleDateString('pl-PL', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}
