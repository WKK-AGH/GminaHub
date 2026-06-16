import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  Users, Clock, Radio, AlertCircle, Loader2,
  BarChart2, Shield, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sessionsApi, type Session, type VoteValue, VOTE_LABEL, ROLE_LABEL } from '../api/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface VoteResults {
  yes: number;
  no: number;
  abstain: number;
  total: number;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// ─── VOTE BUTTON ──────────────────────────────────────────────────────────────

function VoteButton({ value, selected, disabled, onClick }: {
  value: VoteValue;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const config: Record<VoteValue, { className: string; selectedClass: string; icon: React.ReactNode; label: string }> = {
    YES:     { className: 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400', selectedClass: 'bg-emerald-600 border-emerald-600 text-white', icon: <CheckCircle2 className="w-6 h-6" />, label: 'YES' },
    NO:      { className: 'border-red-200     hover:bg-red-50     hover:border-red-400',     selectedClass: 'bg-red-600     border-red-600     text-white', icon: <XCircle      className="w-6 h-6" />, label: 'NO'  },
    ABSTAIN: { className: 'border-slate-200   hover:bg-slate-50   hover:border-slate-400',   selectedClass: 'bg-slate-600   border-slate-600   text-white', icon: <MinusCircle  className="w-6 h-6" />, label: 'ABSTAIN' },
  };
  const cfg = config[value];

  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-2xl border-2 font-bold text-sm transition-all ${
        selected ? cfg.selectedClass : `bg-white ${cfg.className} text-slate-700`
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      {cfg.icon}
      <span>{cfg.label}</span>
      {selected && <span className="text-xs font-semibold opacity-80">Selected</span>}
    </button>
  );
}

// ─── RESULTS BAR ──────────────────────────────────────────────────────────────

function ResultsBar({ results }: { results: VoteResults }) {
  const { yes, no, abstain, total } = results;
  return (
    <div className="space-y-3">
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${pct(yes, total)}%` }} />
        <div className="bg-red-500   transition-all duration-700" style={{ width: `${pct(no, total)}%` }} />
        <div className="bg-slate-300 rounded-r-full transition-all duration-700" style={{ width: `${pct(abstain, total)}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'YES',     val: yes,     cls: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'NO',      val: no,       cls: 'text-red-500',     bg: 'bg-red-50     border-red-200'     },
          { label: 'ABSTAIN', val: abstain,  cls: 'text-slate-500',   bg: 'bg-slate-100  border-slate-200'   },
        ].map(r => (
          <div key={r.label} className={`flex flex-col items-center px-3 py-3 rounded-xl border text-xs ${r.bg}`}>
            <span className={`text-3xl font-extrabold leading-none ${r.cls}`}>{r.val}</span>
            <span className={`font-bold mt-1 ${r.cls}`}>{r.label}</span>
            <span className="text-slate-400 mt-0.5">{pct(r.val, total)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LiveVoting() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentUser } = useAuth();

  const [session,       setSession]      = useState<Session | null>(null);
  const [isLoading,     setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [isConnected,   setConnected]    = useState(false);
  const [castVote,      setCastVote]     = useState<VoteValue | null>(null);
  const [hasVoted,      setHasVoted]     = useState(false);
  const [isVoting,      setVoting]       = useState(false);
  const [elapsedTime,   setElapsedTime]  = useState(0);
  const [results,       setResults]      = useState<VoteResults | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch session data
  useEffect(() => {
    if (!sessionId) return;
    sessionsApi.getById(sessionId)
      .then(data => { setSession(data); setConnected(true); })
      .catch(err  => setError(err.message ?? 'Failed to connect to session'))
      .finally(()  => setLoading(false));
  }, [sessionId]);

  // Elapsed time counter
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleVote = async () => {
    if (!castVote || hasVoted || isVoting) return;
    setVoting(true);
    try {
      // TODO: await votingApi.vote(activeVotingId, { value: castVote });
      await new Promise(r => setTimeout(r, 600));
      setHasVoted(true);
      setResults({
        yes:     castVote === 'YES'     ? 9 : 8,
        no:      castVote === 'NO'      ? 4 : 3,
        abstain: castVote === 'ABSTAIN' ? 5 : 4,
        total:   15,
      });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Connecting to session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection failed</h2>
          <p className="text-slate-400 text-sm mb-6">{error ?? 'Session not found'}</p>
          <Link to="/panel" className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition">
            <ArrowLeft className="w-4 h-4" /> Back to panel
          </Link>
        </div>
      </div>
    );
  }

  const agendaItems  = session.agendaItems ?? [];
  const activeItem   = agendaItems.find(item => item.voting?.some(v => v.status === 'ACTIVE'));
  const activeVoting = activeItem?.voting?.find(v => v.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition font-medium">
            <ArrowLeft className="w-4 h-4" /> Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" />{formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Session info */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Active session</p>
              <p className="font-extrabold text-white text-base mt-0.5">{session.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(session.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* User info */}
          {currentUser && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-extrabold text-xs text-white">
                {currentUser.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{currentUser.fullName}</p>
                <p className="text-xs text-slate-400">{ROLE_LABEL[currentUser.role]}</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-3 h-3" /> Authorized
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active voting */}
        {activeVoting ? (
          <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Voting open</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">{activeVoting.title}</h2>
              {activeItem && <p className="text-xs text-slate-400 mt-1">Agenda item: {activeItem.title}</p>}
            </div>

            {!hasVoted ? (
              <>
                <div className="flex gap-3">
                  {(['YES', 'NO', 'ABSTAIN'] as VoteValue[]).map(v => (
                    <VoteButton key={v} value={v}
                      selected={castVote === v}
                      disabled={isVoting}
                      onClick={() => setCastVote(v === castVote ? null : v)}
                    />
                  ))}
                </div>
                <button onClick={handleVote} disabled={!castVote || isVoting}
                  className="w-full py-4 text-base font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition disabled:opacity-40 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isVoting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                    : castVote ? `Confirm: ${VOTE_LABEL[castVote]}` : 'Select your vote'
                  }
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Vote submitted</p>
                    <p className="text-xs text-slate-400 mt-0.5">Your vote: <span className="font-bold text-white">{castVote ? VOTE_LABEL[castVote] : ''}</span></p>
                  </div>
                </div>
                {results && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" /> Current results
                    </p>
                    <ResultsBar results={results} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No active voting */
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-slate-600" />
            </div>
            <p className="font-bold text-slate-300 text-lg">Waiting for voting</p>
            <p className="text-slate-500 text-sm mt-2">The chairman will open voting soon</p>
          </div>
        )}

        {/* Agenda overview */}
        {agendaItems.length > 0 && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Agenda items
            </h3>
            <div className="space-y-2">
              {agendaItems.sort((a, b) => a.order - b.order).map((item, i) => {
                const isActive = item.voting?.some(v => v.status === 'ACTIVE');
                const isDone   = item.voting?.every(v => v.status === 'COMPLETED');
                return (
                  <div key={item.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${isActive ? 'bg-blue-600/10 border border-blue-500/30' : 'border border-transparent'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                      isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>{i + 1}</span>
                    <span className={`text-sm font-semibold flex-1 truncate ${isActive ? 'text-blue-300' : isDone ? 'text-slate-400' : 'text-slate-300'}`}>
                      {item.title}
                    </span>
                    {isActive && <Radio className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />}
                    {isDone   && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Note about WebSocket */}
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Real-time voting requires WebSocket connection. Full functionality will be available after backend WebSocket implementation.</p>
        </div>
      </div>
    </div>
  );
}
