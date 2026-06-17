import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users, FileText,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle,
  FileDown, Radio, Eye, Paperclip, BarChart2, Lock, Unlock, Loader2, AlertCircle
} from 'lucide-react';
import { sessionsApi, type Session, type VoteValue, VOTE_LABEL } from '../api/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

const SESSION_STATUS_CONFIG: Record<string, { label: string; dot: string; className: string }> = {
  PLANNED:  { label: 'Upcoming',  dot: 'bg-amber-400', className: 'bg-amber-50  text-amber-800  border-amber-200' },
  ACTIVE:   { label: 'Active',    dot: 'bg-blue-500',  className: 'bg-blue-50   text-blue-800   border-blue-200'  },
  FINISHED: { label: 'Finished',  dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600  border-slate-200' },
};

const AGENDA_ITEM_STATUS_CONFIG: Record<string, { iconCls: string; lineCls: string }> = {
  PENDING:   { iconCls: 'border-2 border-slate-300 bg-white',               lineCls: 'bg-slate-200'   },
  ACTIVE:    { iconCls: 'border-2 border-blue-500 bg-blue-50 animate-pulse', lineCls: 'bg-slate-200'   },
  COMPLETED: { iconCls: 'bg-emerald-500',                                    lineCls: 'bg-emerald-400' },
  SKIPPED:   { iconCls: 'bg-slate-300',                                      lineCls: 'bg-slate-200'   },
};

// ─── VOTE CHIP ────────────────────────────────────────────────────────────────

function VoteChip({ value }: { value: VoteValue }) {
  const config: Record<VoteValue, { className: string; icon: React.ReactNode }> = {
    YES:     { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    NO:      { className: 'bg-red-50     text-red-700     border-red-200',     icon: <XCircle      className="w-3.5 h-3.5" /> },
    ABSTAIN: { className: 'bg-slate-100  text-slate-600   border-slate-300',   icon: <MinusCircle  className="w-3.5 h-3.5" /> },
  };
  const { className, icon } = config[value];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${className}`}>
      {icon} {VOTE_LABEL[value]}
    </span>
  );
}

// ─── RESULTS BAR ──────────────────────────────────────────────────────────────

function ResultsBar({ yes, no, abstain, total }: { yes: number; no: number; abstain: number; total: number }) {
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${pct(yes)}%` }} />
        <div className="bg-red-500 transition-all"                    style={{ width: `${pct(no)}%` }} />
        <div className="bg-slate-300 rounded-r-full transition-all"   style={{ width: `${pct(abstain)}%` }} />
      </div>
      <div className="flex gap-4 text-xs font-semibold">
        <span className="text-emerald-600">YES {yes} ({pct(yes)}%)</span>
        <span className="text-red-500">NO {no} ({pct(no)}%)</span>
        <span className="text-slate-400">ABSTAIN {abstain}</span>
        <span className="text-slate-400 ml-auto">Total {total}</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session,   setSession]  = useState<Session | null>(null);
  const [isLoading, setLoading]  = useState(true);
  const [error,     setError]    = useState<string | null>(null);

  // Fetch session from API: GET /api/sessions/:id
  useEffect(() => {
    if (!id) return;
    sessionsApi.getById(id)
      .then(data => setSession(data))
      .catch(err  => setError(err.message ?? 'Failed to load session'))
      .finally(()  => setLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700">{error ?? 'Session not found'}</p>
          <Link to="/panel" className="text-sm text-blue-600 hover:underline mt-2 inline-block">← Back to panel</Link>
        </div>
      </div>
    );
  }

  const statusConfig = SESSION_STATUS_CONFIG[session.status] ?? SESSION_STATUS_CONFIG.PLANNED;
  const agendaItems  = session.agendaItems ?? [];
  const completedItems = agendaItems.filter(item => item.voting?.some(v => v.status === 'COMPLETED')).length;
  const progress = agendaItems.length > 0 ? Math.round((completedItems / agendaItems.length) * 100) : 0;
  const totalVotings = agendaItems.reduce((acc, item) => acc + (item.voting?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Council Panel
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-8">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-wrap items-start gap-3 mb-4">
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${statusConfig.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${session.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
              {statusConfig.label}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-6 leading-tight">
            {session.title}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
            <div className="flex items-start gap-2.5 text-slate-600">
              <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Date</p>
                <p className="font-semibold text-slate-900">
                  {new Date(session.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-600">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Time</p>
                <p className="font-semibold text-slate-900">
                  {new Date(session.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            {session.committee && (
              <div className="flex items-start gap-2.5 text-slate-600 col-span-2">
                <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Committee</p>
                  <p className="font-semibold text-slate-900">{session.committee.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2 text-xs font-semibold">
              <span className="text-slate-500">Session progress</span>
              <span className="text-slate-700">{completedItems} / {agendaItems.length} items</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                Votings in session: {totalVotings}
              </span>
              {session.status === 'FINISHED' && (
                <Link to={`/statistics/${session.id}`}
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition">
                  <BarChart2 className="w-3.5 h-3.5" /> View statistics →
                </Link>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
              <FileDown className="w-4 h-4" /> Export agenda (PDF)
            </button>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition shadow-sm">
              <FileDown className="w-4 h-4 text-slate-400" /> Session summary (PDF)
            </button>
            <Link to={`/statistics/${session.id}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 px-4 py-2 rounded-lg transition">
              <BarChart2 className="w-4 h-4" /> Statistics
            </Link>
          </div>
        </div>
      </div>

      {/* Agenda */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Agenda
        </h2>

        {agendaItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No agenda items yet</p>
            <p className="text-sm mt-1">Agenda items will appear here once added</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            {agendaItems
              .sort((a, b) => a.order - b.order)
              .map((item, idx) => {
                const hasVoting   = item.voting && item.voting.length > 0;
                const activeVote  = item.voting?.find(v => v.status === 'ACTIVE');
                const doneVote    = item.voting?.find(v => v.status === 'COMPLETED');
                const isLast      = idx === agendaItems.length - 1;
                const itemStatus  = activeVote ? 'ACTIVE' : doneVote ? 'COMPLETED' : 'PENDING';
                const cfg         = AGENDA_ITEM_STATUS_CONFIG[itemStatus] ?? AGENDA_ITEM_STATUS_CONFIG.PENDING;

                return (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    itemStatus={itemStatus}
                    config={cfg}
                    isLast={isLast}
                    index={idx}
                  />
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AGENDA ITEM ROW ──────────────────────────────────────────────────────────

function AgendaItemRow({ item, itemStatus, config, isLast, index }: {
  item: any;
  itemStatus: string;
  config: { iconCls: string; lineCls: string };
  isLast: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(itemStatus === 'ACTIVE' || itemStatus === 'COMPLETED');

  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.iconCls}`}>
          {itemStatus === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
          {itemStatus === 'ACTIVE'    && <Radio        className="w-3.5 h-3.5 text-blue-600" />}
          {itemStatus === 'PENDING'   && <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />}
        </div>
        {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-[2rem] ${config.lineCls}`} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <button onClick={() => setExpanded(v => !v)} className="w-full text-left group">
          <div className="flex items-start gap-2">
            <span className="text-xs font-mono font-bold text-slate-400 mt-0.5 flex-shrink-0">{index + 1}.</span>
            <p className={`text-sm font-semibold leading-snug flex-1 group-hover:text-blue-700 transition-colors ${
              itemStatus === 'ACTIVE'    ? 'text-blue-700' :
              itemStatus === 'COMPLETED' ? 'text-slate-700' : 'text-slate-900'
            }`}>
              {item.title}
            </p>
            <span className="flex-shrink-0 text-slate-400 mt-0.5">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </button>

        {expanded && (
          <div className="mt-3 ml-6 space-y-3">
            {/* Documents */}
            {item.documents?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </p>
                {item.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="hover:underline truncate">{doc.title}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Votings */}
            {item.voting?.map((voting: any) => (
              <div key={voting.id} className="mt-2">
                {voting.status === 'PENDING' && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50">
                    <Lock className="w-4 h-4" /> Voting not started yet
                  </div>
                )}
                {voting.status === 'ACTIVE' && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                      </span>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Voting open</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{voting.title}</p>
                  </div>
                )}
                {voting.status === 'COMPLETED' && voting.votes && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5" /> Voting completed
                      </p>
                    </div>
                    {(() => {
                      const yes     = voting.votes.filter((v: any) => v.value === 'YES').length;
                      const no      = voting.votes.filter((v: any) => v.value === 'NO').length;
                      const abstain = voting.votes.filter((v: any) => v.value === 'ABSTAIN').length;
                      return <ResultsBar yes={yes} no={no} abstain={abstain} total={voting.votes.length} />;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
