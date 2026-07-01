import {
    AlertCircle,
    ArrowLeft,
    BarChart2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    FileDown,
    FileText,
    Radio,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SESSION_STATUS_LABEL, sessionsApi, type Session } from '../api/api';
import { useAuth } from '../context/AuthContext';
import DocumentPanel from './DocumentPanel';

// ─── KONFIGURACJA ─────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<string, { dot: string; className: string }> = {
    PLANNED: { dot: 'bg-amber-400', className: 'bg-amber-50  text-amber-800  border-amber-200' },
    ACTIVE: { dot: 'bg-[#B91C1C]', className: 'bg-red-50   text-[#7F1D1D]   border-red-200' },
    FINISHED: { dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600  border-slate-200' },
};

// ─── PASEK WYNIKÓW ────────────────────────────────────────────────────────────

function ResultBar({
    forVotes,
    against,
    abstain,
    total,
}: {
    forVotes: number;
    against: number;
    abstain: number;
    total: number;
}) {
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return (
        <div className="mt-3 space-y-2">
            <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                <div
                    className="bg-emerald-500 rounded-l-full"
                    style={{ width: `${pct(forVotes)}%` }}
                />
                <div className="bg-red-500" style={{ width: `${pct(against)}%` }} />
                <div
                    className="bg-slate-300 rounded-r-full"
                    style={{ width: `${pct(abstain)}%` }}
                />
            </div>
            <div className="flex gap-4 text-xs font-semibold">
                <span className="text-emerald-600">
                    ZA {forVotes} ({pct(forVotes)}%)
                </span>
                <span className="text-red-500">PRZECIW {against}</span>
                <span className="text-slate-400">WSTRZ. {abstain}</span>
                <span className="text-slate-400 ml-auto">z {total} radnych</span>
            </div>
        </div>
    );
}

// ─── WIERSZ PUNKTU AGENDY ─────────────────────────────────────────────────────

function AgendaRow({
    item,
    index,
    isLast,
    canEdit,
    onDocumentsChange,
}: {
    item: any;
    index: number;
    isLast: boolean;
    canEdit: boolean;
    onDocumentsChange: (itemId: string, docs: any[]) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const activeVoting = item.voting?.find((v: any) => v.status === 'ACTIVE');
    const completedVoting = item.voting?.find((v: any) => v.status === 'COMPLETED');
    const itemStatus = activeVoting ? 'ACTIVE' : completedVoting ? 'COMPLETED' : 'PENDING';

    const iconCls =
        itemStatus === 'ACTIVE'
            ? 'border-2 border-[#B91C1C] bg-red-50 animate-pulse'
            : itemStatus === 'COMPLETED'
              ? 'bg-emerald-500'
              : 'border-2 border-slate-300 bg-white';

    const lineCls = itemStatus === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-200';

    return (
        <div className="flex gap-4">
            {/* Oś czasu */}
            <div className="flex flex-col items-center shrink-0">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconCls}`}
                >
                    {itemStatus === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {itemStatus === 'ACTIVE' && <Radio className="w-3.5 h-3.5 text-[#B91C1C]" />}
                    {itemStatus === 'PENDING' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    )}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-8 ${lineCls}`} />}
            </div>

            {/* Treść */}
            <div className="flex-1 pb-6 min-w-0">
                <button onClick={() => setExpanded((v) => !v)} className="w-full text-left group">
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 mt-0.5 shrink-0">
                            {index + 1}.
                        </span>
                        <p
                            className={`text-sm font-semibold leading-snug flex-1 group-hover:text-[#991B1B] transition-colors ${
                                itemStatus === 'ACTIVE' ? 'text-[#991B1B]' : 'text-slate-900'
                            }`}
                        >
                            {item.title}
                        </p>
                        <span className="shrink-0 text-slate-400 mt-0.5">
                            {expanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </span>
                    </div>
                </button>

                {expanded && (
                    <div className="mt-3 ml-6 space-y-3">
                        {/* Dokumenty */}
                        <DocumentPanel
                            agendaItemId={item.id}
                            documents={item.documents ?? []}
                            canEdit={canEdit}
                            onDocumentsChange={(docs) => onDocumentsChange(item.id, docs)}
                        />

                        {/* Głosowania */}
                        {item.voting?.map((voting: any) => (
                            <div key={voting.id}>
                                {voting.status === 'PENDING' && (
                                    <div className="text-sm text-slate-400 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
                                        Głosowanie jeszcze nie rozpoczęte
                                    </div>
                                )}
                                {voting.status === 'ACTIVE' && (
                                    <div className="border-2 border-red-200 bg-red-50 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B91C1C]" />
                                            </span>
                                            <p className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
                                                Głosowanie otwarte
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {voting.title}
                                        </p>
                                    </div>
                                )}
                                {voting.status === 'COMPLETED' &&
                                    voting.votes &&
                                    (() => {
                                        const forVotes = voting.votes.filter(
                                            (v: any) => v.value === 'YES',
                                        ).length;
                                        const against = voting.votes.filter(
                                            (v: any) => v.value === 'NO',
                                        ).length;
                                        const abstain = voting.votes.filter(
                                            (v: any) => v.value === 'ABSTAIN',
                                        ).length;
                                        return (
                                            <div className="border border-slate-200 rounded-xl p-4 bg-white">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    Wyniki głosowania
                                                </p>
                                                <ResultBar
                                                    forVotes={forVotes}
                                                    against={against}
                                                    abstain={abstain}
                                                    total={voting.votes.length}
                                                />
                                            </div>
                                        );
                                    })()}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function SessionDetail() {
    const { id } = useParams<{ id: string }>();
    const { hasRole } = useAuth();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const canManage = hasRole('PRZEWODNICZACY', 'ADMINISTRATOR');

    useEffect(() => {
        if (!id) return;
        sessionsApi
            .getById(id)
            .then((data) => setSession(data))
            .catch((err) => setError(err.message ?? 'Błąd pobierania sesji'))
            .finally(() => setLoading(false));
    }, [id]);

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

    const statusConfig = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.PLANNED;
    const agendaItems = session.agendaItems ?? [];
    const doneCount = agendaItems.filter((p) =>
        p.voting?.some((v: any) => v.status === 'COMPLETED'),
    ).length;
    const progress =
        agendaItems.length > 0 ? Math.round((doneCount / agendaItems.length) * 100) : 0;
    const votingCount = agendaItems.reduce((acc, p) => acc + (p.voting?.length ?? 0), 0);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="max-w-5xl mx-auto">
                    <Link
                        to="/panel"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Panel Radnego
                    </Link>
                </div>
            </div>

            {/* Nagłówek */}
            <div className="bg-white border-b border-slate-200 px-4 py-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-wrap items-start gap-3 mb-4">
                        <span
                            className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${statusConfig.className}`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${session.status === 'ACTIVE' ? 'animate-pulse' : ''}`}
                            />
                            {SESSION_STATUS_LABEL[session.status] ?? session.status}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-5 leading-tight">
                        {session.title}
                    </h1>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
                        <div className="flex items-start gap-2.5 text-slate-600">
                            <CalendarDays className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                                    Data
                                </p>
                                <p className="font-semibold text-slate-900">
                                    {new Date(session.scheduledAt).toLocaleDateString('pl-PL', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-slate-600">
                            <Clock className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                                    Godzina
                                </p>
                                <p className="font-semibold text-slate-900">
                                    {new Date(session.scheduledAt).toLocaleTimeString('pl-PL', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                        {session.committee && (
                            <div className="flex items-start gap-2.5 text-slate-600">
                                <FileText className="w-4 h-4 text-[#B91C1C] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                                        Komisja
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                        {session.committee.name}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pasek postępu */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                            <span className="text-slate-500">Postęp obrad</span>
                            <span className="text-slate-700">
                                {doneCount} / {agendaItems.length} punktów
                            </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-2 bg-[#B91C1C] rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <BarChart2 className="w-3.5 h-3.5 text-[#B91C1C]" />
                                Głosowań: {votingCount}
                            </span>
                            {session.status === 'FINISHED' && (
                                <Link
                                    to={`/statystyki/${session.id}`}
                                    className="inline-flex items-center gap-1 font-bold text-[#B91C1C] hover:text-[#7F1D1D] transition"
                                >
                                    <BarChart2 className="w-3.5 h-3.5" /> Statystyki →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Przyciski */}
                    <div className="flex flex-wrap gap-2">
                        <button className="inline-flex items-center gap-2 text-sm font-bold text-[#991B1B] bg-red-50 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg transition">
                            <FileDown className="w-4 h-4" /> Agenda (PDF)
                        </button>
                        <Link
                            to={`/podsumowanie/${session.id}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg transition"
                        >
                            <FileDown className="w-4 h-4" /> Podsumowanie
                        </Link>
                        <Link
                            to={`/statystyki/${session.id}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-4 py-2 rounded-lg transition"
                        >
                            <BarChart2 className="w-4 h-4" /> Statystyki
                        </Link>
                        {session.status === 'ACTIVE' && (
                            <Link
                                to={`/live/${session.id}`}
                                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] px-4 py-2 rounded-lg transition shadow-sm"
                            >
                                <Radio className="w-4 h-4" /> Dołącz do głosowania
                            </Link>
                        )}
                        {canManage && (
                            <Link
                                to={`/agenda/${session.id}/edytuj`}
                                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-lg transition"
                            >
                                <FileText className="w-4 h-4" /> Edytuj agendę
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Agenda */}
            <div className="max-w-5xl mx-auto px-4 py-10">
                <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B91C1C]" /> Porządek obrad
                </h2>

                {agendaItems.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">Brak punktów agendy</p>
                        <p className="text-sm mt-1">
                            Punkty agendy pojawią się tutaj po dodaniu przez przewodniczącego
                        </p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
                        {agendaItems
                            .sort((a, b) => a.order - b.order)
                            .map((item, i) => (
                                <AgendaRow
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    isLast={i === agendaItems.length - 1}
                                    canEdit={canManage}
                                    onDocumentsChange={(itemId, docs) => {
                                        setSession((prev) => {
                                            if (!prev) return prev;
                                            return {
                                                ...prev,
                                                agendaItems: prev.agendaItems?.map((a) =>
                                                    a.id === itemId ? { ...a, documents: docs } : a,
                                                ),
                                            };
                                        });
                                    }}
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
