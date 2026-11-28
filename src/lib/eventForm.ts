// Pure helpers for the event form. Mirrors backend validateEvent.
import { EVENT_TYPES, EVENT_MODES, ELIGIBILITY, isHttpsUrl, type EventCard } from './communities';

export type EventFormValues = {
  title: string; type: string; mode: string; eligibility: string; eligibility_note: string;
  starts_at: string; ends_at: string; register_by: string; // datetime-local values
  team_size_min: string; team_size_max: string; entry_fee: string; prize: string; register_url: string;
  venue: string; contact: string; rounds: string; rules: string;
};

export type ScheduleRow = { time: string; label: string };
export type FaqRow = { q: string; a: string };

/** Drops untouched rows and checks the rest. Mirrors backend validateDetails. */
export function cleanRows(schedule: ScheduleRow[], faqs: FaqRow[]) {
  const s = schedule.map((r) => ({ time: r.time.trim(), label: r.label.trim() })).filter((r) => r.time || r.label);
  const f = faqs.map((r) => ({ q: r.q.trim(), a: r.a.trim() })).filter((r) => r.q || r.a);
  const error = s.some((r) => !r.label) ? 'Every schedule row needs a description'
    : f.some((r) => !r.q || !r.a) ? 'Every FAQ needs a question and an answer' : '';
  return { schedule: s, faqs: f, error };
}

export const emptyEventForm = (): EventFormValues => ({
  title: '', type: '', mode: '', eligibility: '', eligibility_note: '', starts_at: '', ends_at: '', register_by: '',
  team_size_min: '', team_size_max: '', entry_fee: '', prize: '', register_url: '', venue: '', contact: '', rounds: '', rules: '',
});

const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');
const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** '2026-03-05T18:30' -> '2026-03-05T18:30:00+05:30'. `date` supplies the offset (defaults to the entered moment, so DST is right). */
export function toIsoWithOffset(localValue: string, date: Date = new Date(localValue)): string {
  if (!LOCAL.test(localValue) || Number.isNaN(date.getTime?.() ?? 0)) return '';
  const off = -date.getTimezoneOffset();
  return `${localValue}:00${off < 0 ? '-' : '+'}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`;
}

/** ISO instant -> value for <input type="datetime-local"> in the viewer's zone. */
export function fromIsoToLocalInput(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function eventToForm(e: EventCard): EventFormValues {
  const n = (v: number | null) => (v == null ? '' : String(v));
  return {
    title: e.title, type: e.type, mode: e.mode, eligibility: e.eligibility, eligibility_note: e.eligibility_note ?? '',
    starts_at: fromIsoToLocalInput(e.starts_at), ends_at: fromIsoToLocalInput(e.ends_at), register_by: fromIsoToLocalInput(e.register_by),
    team_size_min: n(e.team_size_min), team_size_max: n(e.team_size_max), entry_fee: e.entry_fee ? String(e.entry_fee) : '', prize: e.prize ?? '',
    register_url: e.register_url ?? '', venue: e.venue ?? '', contact: e.contact ?? '', rounds: e.rounds ?? '', rules: e.rules ?? '',
  };
}

const int = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);

export function validateEventForm(f: EventFormValues, { isOfficial }: { isOfficial: boolean }): Partial<Record<keyof EventFormValues, string>> {
  const e: Partial<Record<keyof EventFormValues, string>> = {};
  const title = f.title.trim();
  if (title.length < 3 || title.length > 150) e.title = 'Title must be 3 to 150 characters';
  if (!(EVENT_TYPES as readonly string[]).includes(f.type)) e.type = 'Choose a type';
  if (!(EVENT_MODES as readonly string[]).includes(f.mode)) e.mode = 'Choose a mode';
  if (!(ELIGIBILITY as readonly string[]).includes(f.eligibility)) e.eligibility = 'Choose who can take part';
  if (f.eligibility === 'Specific' && !f.eligibility_note.trim()) e.eligibility_note = 'Say who can take part';

  if (!f.starts_at) e.starts_at = 'Choose a start date and time';
  // datetime-local values sort as strings
  if (f.ends_at && f.starts_at && f.ends_at < f.starts_at) e.ends_at = 'End must not be before start';
  if (f.register_by && f.starts_at && f.register_by > f.starts_at) e.register_by = 'Registration must close before the event starts';

  const min = f.team_size_min.trim() ? int(f.team_size_min) : null, max = f.team_size_max.trim() ? int(f.team_size_max) : null;
  const bad = (t: number | null) => t !== null && (!Number.isInteger(t) || t < 1 || t > 20);
  if (bad(min)) e.team_size_min = 'Team size must be 1 to 20';
  if (bad(max)) e.team_size_max = 'Team size must be 1 to 20';
  if (!e.team_size_min && !e.team_size_max && min !== null && max !== null && min > max) e.team_size_min = 'Min team size exceeds max';

  const fee = f.entry_fee.trim() ? int(f.entry_fee) : 0;
  if (!Number.isInteger(fee) || fee > 100000) e.entry_fee = 'Fee must be a whole number from 0 to 100000';
  if (f.prize.length > 200) e.prize = 'Keep the prize under 200 characters';
  if (!isOfficial && (fee > 0 || f.prize.trim())) {
    if (fee > 0) e.entry_fee = 'Fees and prizes need an Official page';
    if (f.prize.trim()) e.prize = 'Fees and prizes need an Official page';
  }
  if (f.register_url.trim() && !isHttpsUrl(f.register_url.trim())) e.register_url = 'Use a full https:// link';
  return e;
}

/** Fee and prize fields: locked on unverified pages, unless the event already carries a fee or prize that must be cleared. */
export function feePrizeState(isOfficial: boolean, initial?: Pick<EventCard, 'entry_fee' | 'prize'>): { disabled: boolean; hint?: string } {
  if (isOfficial) return { disabled: false };
  if (initial && (initial.entry_fee > 0 || initial.prize)) return { disabled: false, hint: 'Fees and prizes need an Official page — clear them to save' };
  return { disabled: true, hint: 'Fees and prizes need an Official page' };
}
