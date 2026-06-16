import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, FileText,
  Paperclip, Users, ChevronDown, ChevronUp, Save,
  Send, AlertCircle, CheckCircle2, X, CalendarDays,
  Clock, Eye
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type AgendaItemType = 'standard' | 'voting' | 'information' | 'break';

interface Attachment {
  id: string;
  name: string;
  size: string;
}

interface AgendaItemData {
  id: string;
  title: string;
  description: string;
  type: AgendaItemType;
  presenter: string;
  durationMinutes: number;
  attachments: Attachment[];
  requiresVoting: boolean;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG: Record<AgendaItemType, { label: string; dotClass: string }> = {
  standard:    { label: 'Standard',    dotClass: 'bg-slate-400' },
  voting:      { label: 'Voting',      dotClass: 'bg-blue-500'  },
  information: { label: 'Information', dotClass: 'bg-amber-400' },
  break:       { label: 'Break',       dotClass: 'bg-slate-300' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold ${type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ─── AGENDA ITEM CARD ─────────────────────────────────────────────────────────

function AgendaItemCard({ item, index, onUpdate, onDelete, onDragStart, onDragEnter, onDragEnd }: {
  item: AgendaItemData;
  index: number;
  onUpdate: (id: string, patch: Partial<AgendaItemData>) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [isExpanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const config  = ITEM_TYPE_CONFIG[item.type];

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: Attachment[] = files.map(f => ({
      id: uid(), name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
    }));
    onUpdate(item.id, { attachments: [...item.attachments, ...newAttachments] });
    e.target.value = '';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      draggable onDragStart={() => onDragStart(item.id)} onDragEnter={() => onDragEnter(item.id)}
      onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}>
      <div className={`h-0.5 w-full ${config.dotClass}`} />
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition mt-0.5 touch-none">
          <GripVertical className="w-4 h-4" />
        </div>
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <input type="text" value={item.title} onChange={e => onUpdate(item.id, { title: e.target.value })}
            placeholder="Agenda item title..."
            className="w-full text-sm font-semibold text-slate-900 bg-transparent border-0 outline-none placeholder-slate-300 focus:ring-0 p-0" />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />{config.label}
            </span>
            {item.presenter && <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" />{item.presenter}</span>}
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(item.durationMinutes)}</span>
            {item.attachments.length > 0 && <span className="text-xs text-slate-400 flex items-center gap-1"><Paperclip className="w-3 h-3" />{item.attachments.length}</span>}
            {item.requiresVoting && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Voting</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/40 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={item.description} onChange={e => onUpdate(item.id, { description: e.target.value })}
              placeholder="Optional description or additional information..." rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
              <select value={item.type} onChange={e => onUpdate(item.id, { type: e.target.value as AgendaItemType, requiresVoting: e.target.value === 'voting' })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-semibold">
                {(Object.keys(ITEM_TYPE_CONFIG) as AgendaItemType[]).map(t => (
                  <option key={t} value={t}>{ITEM_TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Presenter</label>
              <input type="text" value={item.presenter} onChange={e => onUpdate(item.id, { presenter: e.target.value })}
                placeholder="Enter presenter name..."
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
              <input type="number" min={1} max={240} value={item.durationMinutes}
                onChange={e => onUpdate(item.id, { durationMinutes: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-mono text-center" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div onClick={() => onUpdate(item.id, { requiresVoting: !item.requiresVoting })}
              className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${item.requiresVoting ? 'bg-blue-600' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${item.requiresVoting ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-600">Requires voting</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attachments ({item.attachments.length})</label>
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition">
                <Plus className="w-3 h-3" /> Add file
              </button>
              <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx" className="hidden" onChange={handleFileAdd} />
            </div>
            {item.attachments.length === 0 ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
                <Paperclip className="w-4 h-4" /> Drag files or click to add
              </button>
            ) : (
              <div className="space-y-1.5">
                {item.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-700 flex-1 truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{att.size}</span>
                    <button onClick={() => onUpdate(item.id, { attachments: item.attachments.filter(a => a.id !== att.id) })}
                      className="text-slate-300 hover:text-red-400 transition flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AGENDA PREVIEW ───────────────────────────────────────────────────────────

function AgendaPreview({ items, sessionTitle }: { items: AgendaItemData[]; sessionTitle: string }) {
  const totalMinutes = items.reduce((acc, item) => acc + item.durationMinutes, 0);
  const votingCount  = items.filter(item => item.requiresVoting).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-950 px-5 py-4">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Preview</p>
        <p className="text-white font-extrabold text-base">{sessionTitle || 'Session'}</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Items',   val: items.length },
          { label: 'Votings', val: votingCount  },
          { label: 'Est. time', val: formatDuration(totalMinutes) },
        ].map(s => (
          <div key={s.label} className="px-3 py-3 text-center">
            <p className="text-base font-extrabold text-slate-900">{s.val}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {items.length === 0 && <div className="text-center py-8 text-slate-400 text-xs">No agenda items</div>}
        {items.map((item, i) => {
          const cfg = ITEM_TYPE_CONFIG[item.type];
          return (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.title || <span className="text-slate-300 italic">No title</span>}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {item.presenter && <span>{item.presenter} · </span>}
                  {formatDuration(item.durationMinutes)}
                </p>
              </div>
              {item.requiresVoting && (
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const QUICK_TEMPLATES = [
  'Public comments and questions',
  'Interpellations from council members',
  'Closing of the session',
  'Approval of previous session minutes',
];

export default function AgendaCreation() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [items,       setItems]      = useState<AgendaItemData[]>([]);
  const [toast,       setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isSaving,    setSaving]     = useState(false);
  const [showPreview, setShowPreview]= useState(false);

  const dragId  = useRef<string | null>(null);
  const enterId = useRef<string | null>(null);

  const onDragStart = (id: string) => { dragId.current  = id; };
  const onDragEnter = (id: string) => { enterId.current = id; };
  const onDragEnd   = () => {
    if (!dragId.current || !enterId.current || dragId.current === enterId.current) {
      dragId.current = enterId.current = null;
      return;
    }
    const from = items.findIndex(p => p.id === dragId.current);
    const to   = items.findIndex(p => p.id === enterId.current);
    if (from === -1 || to === -1) return;
    const arr = [...items];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setItems(arr);
    dragId.current = enterId.current = null;
  };

  const addItem = () => setItems(prev => [...prev, {
    id: uid(), title: '', description: '', type: 'standard',
    presenter: '', durationMinutes: 15, attachments: [], requiresVoting: false,
  }]);

  const addBreak = () => setItems(prev => [...prev, {
    id: uid(), title: 'Break', description: '', type: 'break',
    presenter: '', durationMinutes: 15, attachments: [], requiresVoting: false,
  }]);

  const addTemplate = (title: string) => setItems(prev => [...prev, {
    id: uid(), title, description: '', type: 'standard',
    presenter: '', durationMinutes: 10, attachments: [], requiresVoting: false,
  }]);

  const updateItem = (id: string, patch: Partial<AgendaItemData>) =>
    setItems(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const deleteItem = (id: string) => setItems(prev => prev.filter(p => p.id !== id));

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    const emptyItems = items.filter(p => !p.title.trim());
    if (emptyItems.length > 0) { showToast(`${emptyItems.length} item(s) have empty title`, 'error'); return; }
    setSaving(true);
    try {
      // TODO: await agendaApi.save(sessionId, { items: items.map(mapToPayload) });
      await new Promise(r => setTimeout(r, 600));
      showToast('Agenda saved successfully', 'success');
    } catch { showToast('Failed to save agenda', 'error'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    const emptyItems = items.filter(p => !p.title.trim());
    if (emptyItems.length > 0) { showToast('Fill in all titles before publishing', 'error'); return; }
    if (items.length < 2)      { showToast('Agenda must have at least 2 items', 'error'); return; }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      showToast('Agenda published — council members notified', 'success');
    } catch { showToast('Failed to publish agenda', 'error'); }
    finally { setSaving(false); }
  };

  const totalMinutes = items.reduce((acc, p) => acc + p.durationMinutes, 0);
  const votingCount  = items.filter(p => p.requiresVoting).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <Link to="/panel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-4 h-4" /> Council Panel
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-7">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">Agenda creation</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {sessionId ? `Session #${sessionId}` : 'New agenda'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />Schedule new agenda</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowPreview(v => !v)}
                className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border transition ${showPreview ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <Eye className="w-4 h-4" /> Preview
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition disabled:opacity-50">
                <Save className="w-4 h-4" />{isSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={handlePublish} disabled={isSaving}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50">
                <Send className="w-4 h-4" /> Publish agenda
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Items',      val: items.length,              cls: 'text-slate-900' },
              { label: 'Votings',    val: votingCount,               cls: 'text-blue-600'  },
              { label: 'Attachments',val: items.reduce((a,p) => a + p.attachments.length, 0), cls: 'text-slate-900' },
              { label: 'Est. time',  val: formatDuration(totalMinutes), cls: 'text-slate-900' },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className={`text-xl font-extrabold tabular-nums leading-none ${s.cls}`}>{s.val}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          <div className={showPreview ? 'lg:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-blue-600" /> Agenda items ({items.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <GripVertical className="w-3.5 h-3.5" /> Drag to reorder
              </div>
            </div>

            <div className="space-y-2">
              {items.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-slate-500">No agenda items</p>
                  <p className="text-sm mt-1">Click "Add item" to start</p>
                </div>
              )}
              {items.map((item, i) => (
                <AgendaItemCard key={item.id} item={item} index={i}
                  onUpdate={updateItem} onDelete={deleteItem}
                  onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} />
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={addItem}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition">
                <Plus className="w-4 h-4" /> Add item
              </button>
              <button onClick={addBreak}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
                <Plus className="w-4 h-4" /> Add break
              </button>
            </div>

            {/* Quick templates */}
            <div className="mt-6 border border-slate-200 rounded-2xl p-4 bg-white">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick add — common items</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map(template => (
                  <button key={template} onClick={() => addTemplate(template)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition">
                    <Plus className="w-3 h-3" /> {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="lg:col-span-1">
              <AgendaPreview items={items} sessionTitle={sessionId ? `Session #${sessionId}` : 'Session'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
