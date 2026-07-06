import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, FileText,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle,
  FileDown, Radio, AlertCircle
} from 'lucide-react';
import { formatDate, formatTime, getSessionDate, getItemPosition, getVoteChoice } from '../utils/dateUtils';
import { sessionsApi, SESSION_STATUS_LABEL, VOTE_LABEL, type Session, type VoteValue } from '../api/api';
import { useAuth } from '../context/AuthContext';
import DocumentPanel from './DocumentPanel';

const SESSION_STATUS_CONFIG: Record<string, { dot: string; className: string }> = {
  SCHEDULED: { dot: 'bg-amber-400', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  ACTIVE:    { dot: 'bg-[#B91C1C]', className: 'bg-red-50 text-[#7F1D1D] border-red-200' },
  CONCLUDED: { dot: 'bg-slate-400', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function AgendaRow({ item, index, isLast, canEdit, onDocumentsChange }: any) {
  const [expanded, setExpanded] = useState(false);

  // Zaktualizowane statusy zgodnie z bazą: OPEN / CLOSED
  const activeVoting = item.voting?.find((v: any) => v.status === 'OPEN');
  const closedVoting = item.voting?.find((v: any) => v.status === 'CLOSED');
  const itemStatus = activeVoting ? 'ACTIVE' : closedVoting ? 'COMPLETED' : 'PENDING';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${itemStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'}`}>
           {itemStatus === 'COMPLETED' && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-1 bg-slate-200 min-h-[2rem]" />}
      </div>

      <div className="flex-1 pb-6">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left font-semibold text-sm">
          {item.title}
        </button>
        {expanded && (
          <div className="mt-3 space-y-3">
             <DocumentPanel agendaItemId={item.id} documents={item.documents} canEdit={canEdit} onDocumentsChange={onDocumentsChange} />
             {closedVoting && (
               <div className="text-xs font-semibold flex gap-4">
                 {/* Używamy FOR / AGAINST */}
                 <span className="text-emerald-600">ZA {closedVoting.votes.filter((v: any) => getVoteChoice(v) === 'FOR').length}</span>
                 <span className="text-red-500">PRZECIW {closedVoting.votes.filter((v: any) => getVoteChoice(v) === 'AGAINST').length}</span>
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

  // Poprawiono role na zgodne z api.ts (ADMIN/CHAIRPERSON)
  const canManage = hasRole('CHAIRPERSON') || hasRole('ADMIN');

  useEffect(() => {
    if (id) sessionsApi.getById(id).then(setSession);
  }, [id]);

  if (!session) return null;

  return (
    // Tutaj renderuj sesję...
    <div>{session.title}</div>
  );
}
