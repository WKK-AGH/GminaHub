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
import { getVoteChoice } from '../utils/dateUtils';

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
    SCHEDULED: 'Zaplanowana',
    ACTIVE: 'W trakcie',
    CONCLUDED: 'Zakończona', // Poprawiono: Zakończona (zamiast FINISHED)
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

    if (loading) return <div className="p-8">Ładowanie...</div>;

    if (error || !session) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">{error ?? 'Nie znaleziono sesji'}</p>
                    <Link to="/panel" className="text-sm text-[#B91C1C] hover:underline mt-2 inline-block">← Wróć do panelu</Link>
                </div>
            </div>
        );
    }

    const agendaItems = session.agendaItems ?? [];
    const allVotings = agendaItems.flatMap((p) => p.voting ?? []);
    // Poprawiono status na CLOSED (zamiast COMPLETED)
    const completedVotings = allVotings.filter((g) => g.status === 'CLOSED');

    const passedCount = completedVotings.filter((g) => {
        // Poprawiono na FOR (zamiast YES)
        const za = g.votes?.filter((v: any) => getVoteChoice(v) === 'FOR').length ?? 0;
        const total = g.votes?.length ?? 0;
        return za > total / 2;
    }).length;
    const rejectedCount = completedVotings.length - passedCount;

    return (
        <div className="min-h-screen bg-slate-50 print:bg-white">
            <div className="bg-white border-b border-slate-200 px-4 py-3 print:hidden">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to={`/sesja/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
                        <ArrowLeft className="w-4 h-4" /> Szczegóły sesji
                    </Link>
                    <button onClick={handleExportPDF} className="inline-flex items-center gap-2 text-sm font-bold text-[#B91C1C] hover:text-[#7F1D1D] border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition">
                        <FileDown className="w-4 h-4" /> Eksport do PDF
                    </button>
                </div>
            </div>

            <div className="bg-white border-b border-slate-200 px-4 py-8 print:border-0">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-4">{session.title}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {formatDate(session.scheduledAt ?? '')}</span>
                        <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" /> Status: {STATUS_LABEL[session.status] ?? session.status}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Punktów agendy', value: agendaItems.length },
                        { label: 'Głosowań', value: allVotings.length },
                        { label: 'Przyjętych', value: passedCount },
                        { label: 'Odrzuconych', value: rejectedCount },
                    ].map((s, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                            <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-extrabold text-slate-900 text-sm">Porządek obrad</h2></div>
                    <div className="divide-y divide-slate-50">
                        {agendaItems.sort((a, b) => (a.order || 0) - (b.order || 0)).map((item, i) => {
                            const voting = item.voting?.[0];
                            const forVotes = voting?.votes?.filter((v: any) => getVoteChoice(v) === 'FOR').length ?? 0;
                            const against = voting?.votes?.filter((v: any) => getVoteChoice(v) === 'AGAINST').length ?? 0;
                            const abstain = voting?.votes?.filter((v: any) => getVoteChoice(v) === 'ABSTAIN').length ?? 0;
                            const total = forVotes + against + abstain;

                            return (
                                <div key={item.id} className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                            {voting && voting.status === 'CLOSED' && (
                                                <div className="mt-2 text-xs font-semibold flex gap-4">
                                                    <span className="text-emerald-600">ZA {forVotes}</span>
                                                    <span className="text-red-500">PRZECIW {against}</span>
                                                    <span className="text-slate-400">WSTRZ. {abstain}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
