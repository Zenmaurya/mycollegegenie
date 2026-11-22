/**
 * Pure helpers for /inbox (no network/env imports so they run in node:test).
 */
export interface ChatMessage { id: string; mine: boolean; content: string; is_system: number | boolean; created_at: string }
export interface InboxNotification { id: string; type: string; actorId: string | null; itemType: string | null; itemId: string | null; text: string; read: boolean; createdAt: string }

export const MAX_MESSAGE = 2000;
export const WAIT_REASON = 'Wait until they accept your request';

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayDiff = (a: Date, b: Date) => Math.round((new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() - new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) / 86_400_000);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dateLabel = (d: Date, now: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`}`;

/** List timestamp: time today, "Yesterday", weekday within a week, else "12 Nov" (+ year when not this year). */
export function formatTimeShort(iso: string | null, now: Date = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (sameDay(d, now)) {
    const h = d.getHours();
    return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  const diff = dayDiff(now, d);
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return WEEKDAYS[d.getDay()];
  return dateLabel(d, now);
}

/** Messages (oldest first) grouped under a day label: Today / Yesterday / "12 Nov". */
export function groupByDay<T extends { created_at: string }>(items: T[], now: Date = new Date()): { key: string; label: string; items: T[] }[] {
  const out: { key: string; label: string; items: T[] }[] = [];
  for (const m of items) {
    const d = new Date(m.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = out[out.length - 1];
    if (last?.key === key) { last.items.push(m); continue; }
    const diff = dayDiff(now, d);
    out.push({ key, label: diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : dateLabel(d, now), items: [m] });
  }
  return out;
}

/** Where tapping a notification goes. Rejections link to where the owner can fix or retry. */
export function notificationHref(n: Pick<InboxNotification, 'type' | 'itemType' | 'itemId'>): string {
  const id = n.itemId ? encodeURIComponent(n.itemId) : '';
  if (!id) return '/inbox';
  if (n.type === 'upload_rejected') return '/notes/upload';
  if (n.type === 'stay_rejected') return `/stays/${id}/edit`;
  switch (n.itemType) {
    case 'post': return `/post/${id}`;
    case 'resource': return `/notes/${id}`;
    case 'stay': return `/stays/${id}`;
    case 'conversation': return `/inbox/${id}`;
    default: return '/inbox';
  }
}

/**
 * Why the composer is off, or null when the user can type. The messages response has no "side",
 * so a pending chat is read from who sent the messages: I did -> I am the requester.
 */
export function composerReason(requestStatus: string, messages: ChatMessage[]): { role: 'sender' | 'receiver' | null; reason: string | null } {
  if (requestStatus !== 'pending') return { role: null, reason: null };
  const real = messages.filter((m) => !m.is_system);
  const mine = real.some((m) => m.mine);
  if (!mine && real.length > 0) return { role: 'receiver', reason: 'Accept the request to reply' };
  return { role: 'sender', reason: mine ? WAIT_REASON : null };
}

/** Merge an older page in front of the latest page, newest copy wins, no duplicates. */
export function mergeMessages(older: ChatMessage[], latest: ChatMessage[]): ChatMessage[] {
  const seen = new Set(latest.map((m) => m.id));
  return [...older.filter((m) => !seen.has(m.id)), ...latest];
}
