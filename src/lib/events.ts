// Pure helpers for the events hub. All dates are shown in IST.
const IST = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_MS = 72 * 60 * 60 * 1000;

const part = (iso: string, o: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString('en-GB', { timeZone: IST, ...o });

export const dateBlock = (iso: string) => ({
  day: part(iso, { day: '2-digit' }),
  month: part(iso, { month: 'short' }).slice(0, 3).toUpperCase(),
});

export const feeLabel = (fee: number) => (fee > 0 ? `₹${fee}` : 'Free');

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// IST calendar day number, so "today" and "tomorrow" follow the Indian date
const istDay = (d: Date) => Math.floor((d.getTime() + 5.5 * 60 * 60 * 1000) / DAY_MS);

export function dateRange(starts: string, ends: string | null): string {
  if (!ends || ends === starts) return `${formatDateTime(starts)} IST`;
  const sameDay = istDay(new Date(starts)) === istDay(new Date(ends));
  const end = sameDay ? new Date(ends).toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit' }) : formatDateTime(ends);
  return `${formatDateTime(starts)} – ${end} IST`;
}

export const registrationClosed = (registerBy: string | null, now: Date) => !!registerBy && new Date(registerBy).getTime() < now.getTime();

/** Ribbon text: only for closed registrations or ones closing within 72 hours. */
export function deadlineLabel(registerBy: string | null, now: Date): string | null {
  if (!registerBy) return null;
  const end = new Date(registerBy);
  const left = end.getTime() - now.getTime();
  if (left < 0) return 'Registration closed';
  if (left > SOON_MS) return null;
  const days = istDay(end) - istDay(now);
  return days <= 0 ? 'Closes today' : `Closes in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export const eventHref = (id: string) => `/events/${encodeURIComponent(id)}`;

export const mapsUrl = (venue: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;

type Interest = { my_status: 'interested' | 'going' | null; interested: boolean; interested_count: number; going_count: number };

/** Optimistic Going/Interested change: moves the viewer between the two counts. */
export function applyInterest<T extends Interest>(e: T, next: T['my_status']): T {
  const delta = (s: 'interested' | 'going') => (next === s ? 1 : 0) - (e.my_status === s ? 1 : 0);
  return { ...e, my_status: next, interested: !!next, interested_count: e.interested_count + delta('interested'), going_count: e.going_count + delta('going') };
}
