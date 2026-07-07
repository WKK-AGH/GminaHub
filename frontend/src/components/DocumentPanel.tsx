import {
    AlertCircle,
    CheckCircle2,
    ExternalLink,
    FileText,
    Loader2,
    Paperclip,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { documentsApi, type SessionDocument } from '../api/api';
import { getDocumentName, getDocumentUrl } from '../utils/dateUtils';

// ─── TYPY ────────────────────────────────────────────────────────────────────

interface Props {
    agendaItemId: string;
    documents: SessionDocument[];
    canEdit: boolean;
    onDocumentsChange: (docs: SessionDocument[]) => void;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
        pdf: 'text-red-500',
        docx: 'text-blue-500',
        doc: 'text-blue-500',
        xlsx: 'text-emerald-500',
        xls: 'text-emerald-500',
    };
    return colors[ext ?? ''] ?? 'text-slate-400';
}

// ─── GŁÓWNY KOMPONENT ─────────────────────────────────────────────────────────

export default function DocumentPanel({
    agendaItemId,
    documents,
    canEdit,
    onDocumentsChange,
}: Props) {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setError(null);

        for (const file of Array.from(files)) {
            // Walidacja
            if (file.size > 20 * 1024 * 1024) {
                setError(`Plik "${file.name}" jest za duży. Maksymalny rozmiar to 20 MB.`);
                return;
            }
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|xlsx|xls)$/i)) {
                setError(
                    `Plik "${file.name}" ma nieobsługiwany format. Dozwolone: PDF, DOC, DOCX, XLS, XLSX.`,
                );
                return;
            }

            setUploading(true);
            try {
                const uploaded = await documentsApi.upload(agendaItemId, file);
                onDocumentsChange([...documents, uploaded]);
                showSuccess(`Plik "${file.name}" został wgrany.`);
            } catch (err: unknown) {
                setError((err as { message?: string })?.message ?? 'Błąd wgrywania pliku');
            } finally {
                setUploading(false);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (doc: SessionDocument) => {
        if (!confirm(`Czy na pewno chcesz usunąć plik "${getDocumentName(doc)}"?`)) return;
        setDeleting(doc.id);
        setError(null);
        try {
            await documentsApi.delete(doc.id);
            onDocumentsChange(documents.filter((d) => d.id !== doc.id));
            showSuccess(`Plik "${getDocumentName(doc)}" został usunięty.`);
        } catch (err: unknown) {
            setError((err as { message?: string })?.message ?? 'Błąd usuwania pliku');
        } finally {
            setDeleting(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    return (
        <div className="space-y-3">
            {/* Komunikaty */}
            {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-600"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Lista dokumentów */}
            {documents.length === 0 && !canEdit && (
                <p className="text-xs text-slate-400 italic">Brak załączników do tego punktu.</p>
            )}

            {documents.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5" /> Załączniki ({documents.length})
                    </p>
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center gap-3 bg-white border border-slate-200 rounded px-3 py-2.5 hover:border-slate-300 transition group"
                        >
                            <FileText
                                className={`w-4 h-4 flex-shrink-0 ${getFileIcon(getDocumentName(doc))}`}
                            />
                            <span className="text-sm font-medium text-slate-800 flex-1 truncate">
                                {getDocumentName(doc)}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Podgląd / Pobierz */}
                                <a
                                    href={getDocumentUrl(doc)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:underline px-2 py-1 rounded hover:bg-red-50 transition"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Otwórz
                                </a>

                                {/* Usuń — tylko dla uprawnionych */}
                                {canEdit && (
                                    <button
                                        onClick={() => handleDelete(doc)}
                                        disabled={deleting === doc.id}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition disabled:opacity-50"
                                    >
                                        {deleting === doc.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Strefa uploadu — tylko dla uprawnionych */}
            {canEdit && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xlsx,.xls,application/pdf"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />

                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded px-4 py-5 text-center cursor-pointer transition ${
                            dragOver
                                ? 'border-[#B91C1C] bg-red-50'
                                : 'border-slate-200 hover:border-[#B91C1C] hover:bg-slate-50'
                        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin text-[#B91C1C]" />
                                Wgrywanie pliku...
                            </div>
                        ) : (
                            <>
                                <Upload
                                    className={`w-5 h-5 mx-auto mb-2 ${dragOver ? 'text-[#B91C1C]' : 'text-slate-300'}`}
                                />
                                <p className="text-xs font-semibold text-slate-600">
                                    Przeciągnij plik lub{' '}
                                    <span className="text-[#B91C1C]">kliknij aby wybrać</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    PDF, DOC, DOCX, XLS, XLSX · max. 20 MB
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
