// ─── HELPERS DAT ──────────────────────────────────────────────────────────────

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Brak daty';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Nieprawidłowa data';
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Brak daty';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Nieprawidłowa data';
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Normalizuje pole daty — backend może zwracać scheduledAt, date, scheduled_at itp.
export function getSessionDate(session: {
  scheduledAt?: string;
  scheduledDate?: string;
  scheduled_date?: string;
  date?: string;
}): string {
  return session.scheduledAt
    ?? session.scheduledDate
    ?? session.scheduled_date
    ?? session.date
    ?? '';
}

// Pobiera nazwę pliku z dokumentu (file_name lub title)
export function getDocumentName(doc: {
  fileName?: string;
  file_name?: string;
  title?: string;
}): string {
  return doc.fileName ?? doc.file_name ?? doc.title ?? 'Dokument';
}

// Pobiera URL pliku (file_url lub fileUrl)
export function getDocumentUrl(doc: {
  fileUrl?: string;
  file_url?: string;
}): string {
  return doc.fileUrl ?? doc.file_url ?? '';
}

// Pobiera pozycję punktu agendy (position lub order)
export function getItemPosition(item: {
  position?: number;
  order?: number;
}): number {
  return item.position ?? item.order ?? 0;
}

// Pobiera wybór głosu (choice lub value)
export function getVoteChoice(vote: {
  choice?: string;
  value?: string;
}): string {
  return vote.choice ?? vote.value ?? '';
}
