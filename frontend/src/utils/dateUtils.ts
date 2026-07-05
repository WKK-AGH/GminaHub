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


export function getSessionDate(session: { scheduledAt?: string; date?: string; scheduled_at?: string }): string {
  return session.scheduledAt ?? session.date ?? session.scheduled_at ?? '';
}
