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
    Loader2,
    MinusCircle,
    Paperclip,
    Radio,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    SESSION_STATUS_LABEL,
    sessionsApi,
    VOTE_LABEL,
    type Session,
    type VoteValue,
} from '../api/api';
import { useAuth } from '../context/AuthContext';
import {
    formatDate,
    formatTime,
    getDocumentName,
    getDocumentUrl,
    getItemPosition,
    getSessionDate,
    getVoteChoice,
} from '../utils/dateUtils';
import AddToCalendar from './AddToCalendar';
import DocumentPanel from './DocumentPanel';

const SESSION_STATUS_CONFIG: Record<string, { dot: string; className: string }> = {
    SCHEDULED: { dot: 'bg-amber-400', className: 'bg-amber-50 text-amber-800 border-amber-200' },
    ACTIVE: { dot: 'bg-[#B91C1C]', className: 'bg-red-50 text-[#7F1D1D] border-red-200' },
    CONCLUDED: { dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function VoteChip({ value }: { value: VoteValue }) {
    const config: Record<VoteValue, { cls: string; icon: React.ReactNode }> = {
        FOR: {
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        },
        AGAINST: {
            cls: 'bg-red-50 text-red-700 border-red-200',
            icon: <XCircle className="w-3.5 h-3.5" />,
        },
        ABSTAIN: {
            cls: 'bg-slate-100 text-slate-600 border-slate-300',
            icon: <MinusCircle className="w-3.5 h-3.5" />,
        },
    };

    const { cls, icon } = config[value];

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}
        >
            {icon} {VOTE_LABEL[value]}
        </span>
    );
}

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
            </div>
        </div>
    );
}

function AgendaRow({ item, isLast, canEdit, onDocumentsChange }: any) {
    const [expanded, setExpanded] = useState(false);
    const activeVoting = item.voting?.find((v: any) => v.status === 'OPEN');
    const closedVoting = item.voting?.find((v: any) => v.status === 'CLOSED');
    const itemStatus = activeVoting ? 'ACTIVE' : closedVoting ? 'COMPLETED' : 'PENDING';
    const firstDocument = item.documents?.[0];

    let winningVote: VoteValue | null = null;
    if (closedVoting) {
        const forVotes =
            closedVoting.votes?.filter((v: any) => getVoteChoice(v) === 'FOR').length ?? 0;
        const against =
            closedVoting.votes?.filter((v: any) => getVoteChoice(v) === 'AGAINST').length ?? 0;
        const abstain =
            closedVoting.votes?.filter((v: any) => getVoteChoice(v) === 'ABSTAIN').length ?? 0;

        if (forVotes > against && forVotes >= abstain) winningVote = 'FOR';
        else if (against > forVotes && against >= abstain) winningVote = 'AGAINST';
        else if (abstain >= forVotes && abstain >= against) winningVote = 'ABSTAIN';
    }

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center shrink-0">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${itemStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                    {itemStatus === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
                    {itemStatus === 'PENDING' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    )}
                </div>
                {!isLast && <div className="w-0.5 flex-1 mt-1 bg-slate-200 min-h-8" />}
            </div>

            <div className="flex-1 pb-6">
                <button
                    onClick={() => setExpanded((value) => !value)}
                    className="w-full text-left font-semibold text-sm text-slate-900 flex items-center justify-between gap-3"
                >
                    <span>{item.title}</span>
                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </button>

                {firstDocument && (
                    <a
                        href={getDocumentUrl(firstDocument)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline"
                    >
                        <FileDown className="w-3.5 h-3.5" /> {getDocumentName(firstDocument)}
                    </a>
                )}

                {expanded && (
                    <div className="mt-3 space-y-3">
                        <DocumentPanel
                            agendaItemId={item.id}
                            documents={item.documents ?? []}
                            canEdit={canEdit}
                            onDocumentsChange={(docs) => onDocumentsChange(item.id, docs)}
                        />
                        {closedVoting && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Wynik głosowania
                                    </p>
                                    {winningVote && <VoteChip value={winningVote} />}
                                </div>
                                <ResultBar
                                    forVotes={
                                        closedVoting.votes?.filter(
                                            (v: any) => getVoteChoice(v) === 'FOR',
                                        ).length ?? 0
                                    }
                                    against={
                                        closedVoting.votes?.filter(
                                            (v: any) => getVoteChoice(v) === 'AGAINST',
                                        ).length ?? 0
                                    }
                                    abstain={
                                        closedVoting.votes?.filter(
                                            (v: any) => getVoteChoice(v) === 'ABSTAIN',
                                        ).length ?? 0
                                    }
                                    total={closedVoting.votes?.length ?? 0}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SessionDetail() {
    const { id } = useParams<{ id: string }>();
    const { hasRole } = useAuth();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canManage = hasRole('CHAIRPERSON') || hasRole('ADMIN');

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        sessionsApi
            .getById(id)
            .then((data) => setSession(data))
            .catch((err) => setError(err.message ?? 'Błąd pobierania sesji'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDocumentsChange = (agendaItemId: string, documents: any[]) => {
        setSession((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                agendaItems: prev.agendaItems?.map((item) =>
                    item.id === agendaItemId ? { ...item, documents } : item,
                ),
            };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Ładowanie szczegółów sesji...</span>
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

    const agendaItems = [...(session.agendaItems ?? [])].sort(
        (a, b) => (getItemPosition(a) ?? 0) - (getItemPosition(b) ?? 0),
    );
    const sessionDate = getSessionDate(session);
    const statusConfig = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.SCHEDULED;
    const totalVotes = agendaItems.reduce(
        (sum, item) =>
            sum +
            (item.voting?.reduce(
                (count: number, voting: any) => count + (voting.votes?.length ?? 0),
                0,
            ) ?? 0),
        0,
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link
                        to="/panel"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition"
                    >
                        <ArrowLeft className="w-4 h-4" /> Panel
                    </Link>
                    <AddToCalendar session={session} />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-8 border-b border-slate-100">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Szczegóły sesji
                                </p>
                                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950">
                                    {session.title}
                                </h1>
                                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />{' '}
                                        {formatDate(sessionDate)}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> {formatTime(sessionDate)}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4" />{' '}
                                        {SESSION_STATUS_LABEL[session.status] ?? session.status}
                                    </span>
                                </div>
                            </div>
                            <div
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${statusConfig.className}`}
                            >
                                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                                {SESSION_STATUS_LABEL[session.status] ?? session.status}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#B91C1C]" />
                                    <h2 className="font-semibold text-slate-900">Porządek obrad</h2>
                                </div>

                                <div className="mt-4 space-y-0">
                                    {agendaItems.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            Brak punktów agendy.
                                        </p>
                                    ) : (
                                        agendaItems.map((item, index) => (
                                            <AgendaRow
                                                key={item.id}
                                                item={item}
                                                isLast={index === agendaItems.length - 1}
                                                canEdit={canManage}
                                                onDocumentsChange={(
                                                    agendaItemId: string,
                                                    docs: any[],
                                                ) => handleDocumentsChange(agendaItemId, docs)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-[#B91C1C]" />
                                    <h3 className="font-semibold text-slate-900">Szybki podgląd</h3>
                                </div>
                                <div className="mt-4 space-y-3 text-sm">
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">Liczba punktów</span>
                                        <span className="font-semibold text-slate-900">
                                            {agendaItems.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">Liczba głosów</span>
                                        <span className="font-semibold text-slate-900">
                                            {totalVotes}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                        <span className="text-slate-500">
                                            Możliwość zarządzania
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {canManage ? 'Tak' : 'Nie'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {session.committee && (
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="w-4 h-4 text-slate-500" />
                                        <h3 className="font-semibold text-slate-900">Komisja</h3>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-600">
                                        {session.committee.name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
