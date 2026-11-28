/**
 * Pure helpers for /inbox (no network/env imports so they run in node:test).
 */
export interface ChatMessage { id: string; mine: boolean; content: string; is_system: number | boolean; created_at: string }
export interface InboxNotification { id: string; type: string; itemType: string | null; itemId: string | null; text: string; read: boolean; createdAt: string; actorUsername?: string | null }

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
export function notificationHref(n: Pick<InboxNotification, 'type' | 'itemType' | 'itemId' | 'actorUsername'>): string {
  const profile = n.actorUsername ? `/u/${encodeURIComponent(n.actorUsername)}` : null; // null when the actor is private or gone
  if (n.type === 'connect_request') return '/people?tab=requests';
  if (n.type === 'connect_accepted') return profile ?? '/people?tab=connections';
  if (n.type === 'new_follower') return profile ?? '/people?tab=followers';
  const id = n.itemId ? encodeURIComponent(n.itemId) : '';
  if (!id) return '/inbox';
  if (n.type === 'upload_rejected') return '/notes/upload';
  if (n.type === 'stay_rejected') return '/stays/new'; // the rejected row is deleted, so the owner starts a new listing
  if (n.type === 'job_rejected') return '/jobs/new'; // the rejected row is deleted
  switch (n.itemType) {
    case 'job': return `/jobs/${id}`;
    case 'post': return `/post/${id}`;
    case 'resource': return `/notes/${id}`;
    case 'stay': return `/stays/${id}`;
    case 'conversation': return `/inbox/${id}`;
    default: return '/inbox';
  }
}

/** Composer state from the server's verdict: the receiver of a pending request sees Accept/Decline, otherwise canSend decides. */
export function composerState(requestStatus: string, youStarted: boolean, canSend: { ok: boolean; error?: string }): { role: 'receiver' | null; reason: string | null } {
  if (requestStatus === 'pending' && !youStarted) return { role: 'receiver', reason: null };
  return { role: null, reason: canSend.ok ? null : canSend.error ?? WAIT_REASON };
}

/** Merge an older page in front of the latest page, newest copy wins, no duplicates. */
export function mergeMessages(older: ChatMessage[], latest: ChatMessage[]): ChatMessage[] {
  const seen = new Set(latest.map((m) => m.id));
  return [...older.filter((m) => !seen.has(m.id)), ...latest];
}
