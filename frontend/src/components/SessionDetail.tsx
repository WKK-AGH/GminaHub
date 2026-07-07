import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, FileText,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle,
  FileDown, Radio, Paperclip, BarChart2, Loader2, AlertCircle
} from 'lucide-react';
import { formatDate, formatTime, getSessionDate, getItemPosition, getVoteChoice, getDocumentName, getDocumentUrl } from '../utils/dateUtils';
import { sessionsApi, SESSION_STATUS_LABEL, VOTE_LABEL, type Session, type VoteValue } from '../api/api';
import { useAuth } from '../context/AuthContext';
import DocumentPanel from './DocumentPanel';
import AddToCalendar from './AddToCalendar';

const SESSION_STATUS_CONFIG: Record<string, { dot: string; className: string }> = {
  SCHEDULED: { dot: 'bg-amber-400', className: 'bg-amber-50  text-amber-800  border-amber-200' },
  ACTIVE:    { dot: 'bg-[#B91C1C]', className: 'bg-red-50   text-[#7F1D1D]   border-red-200'  },
  CONCLUDED: { dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600  border-slate-200' },
};

function VoteChip({ value }: { value: VoteValue }) {
  const config: Record<VoteValue, { cls: string; icon: React.ReactNode }> = {
    FOR:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    AGAINST: { cls: 'bg-red-50     text-red-700     border-red-200',     icon: <XCircle      className="w-3.5 h-3.5" /> },
    ABSTAIN: { cls: 'bg-slate-100  text-slate-600   border-slate-300',   icon: <MinusCircle  className="w-3.5 h-3.5" /> },
  };
  const { cls, icon } = config[value];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {icon} {VOTE_LABEL[value]}
    </span>
  );
}

function ResultBar({ forVotes, against, abstain, total }: {
  forVotes: number; against: number; abstain: number; total: number;
}) {
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="mt-3 space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full" style={{ width: `${pct(forVotes)}%` }} />
        <div className="bg-red-500"                    style={{ width: `${pct(against)}%` }} />
        <div className="bg-slate-300 rounded-r-full"   style={{ width: `${pct(abstain)}%` }} />
      </div>
      <div className="flex gap-4 text-xs font-semibold">
        <span className="text-emerald-600">ZA {forVotes} ({pct(forVotes)}%)</span>
        <span className="text-red-500">PRZECIW {against}</span>
        <span className="text-slate-400">WSTRZ. {abstain}</span>
      </div>
    </div>
  );
}

function AgendaRow({ item, index, isLast, canEdit, onDocumentsChange }: any) {
  const [expanded, setExpanded] = useState(false);
  const activeVoting = item.voting?.find((v: any) => v.status === 'OPEN');
  const closedVoting = item.voting?.find((v: any) => v.status === 'CLOSED');
  const itemStatus = activeVoting ? 'ACTIVE' : closedVoting ? 'COMPLETED' : 'PENDING';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${itemStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
           {itemStatus === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
           {itemStatus === 'PENDING' && <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />}
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-1 bg-slate-200 min-h-[2rem]" />}
      </div>

      <div className="flex-1 pb-6">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left font-semibold text-sm">
          {item.title}
        </button>
        {expanded && (
          <div className="mt-3 space-y-3">
             <DocumentPanel agendaItemId={item.id} documents={item.documents} canEdit={canEdit} onDocumentsChange={(docs) => onDocumentsChange(item.id, docs)} />
             {closedVoting && (
               <ResultBar
                 forVotes={closedVoting.votes.filter((v: any) => getVoteChoice(v) === 'FOR').length}
                 against={closedVoting.votes.filter((v: any) => getVoteChoice(v) === 'AGAINST').length}
                 abstain={closedVoting.votes.filter((v: any) => getVoteChoice(v) === 'ABSTAIN').length}
                 total={closedVoting.votes.length}
               />
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
  const canManage = hasRole('CHAIRPERSON') || hasRole('ADMIN');
  // ... reszta logiki pobierania bez zmian
}
