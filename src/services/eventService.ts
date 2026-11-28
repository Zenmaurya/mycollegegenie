import { fetchWithAuth } from '../lib/apiClient';
import type { EventCard, InterestStatus } from '../lib/communities';
import { config } from '../lib/config';

export type EventInput = {
  title: string; type: string; mode: string; eligibility: string; starts_at: string; ends_at?: string | null; register_by?: string | null;
  team_size_min?: number | null; team_size_max?: number | null; entry_fee?: number; prize?: string | null; register_url?: string | null;
  venue?: string | null; eligibility_note?: string | null; contact?: string | null; rounds?: string | null; rules?: string | null; poster_url?: string | null;
  description?: string | null; schedule?: ScheduleRow[] | null; faqs?: FaqRow[] | null;
};
export type ScheduleRow = { time: string; label: string };
export type FaqRow = { q: string; a: string };
export type EventStatus = 'live' | 'pending' | 'rejected';
export type MyEvent = EventCard & { status: EventStatus; reject_reason: string | null };
export type PendingEvent = MyEvent & { orphan: boolean; submitter: string | null };
export type EventDetail = MyEvent & {
  description: string | null; schedule: ScheduleRow[] | null; faqs: FaqRow[] | null;
  connections: { username: string; displayName: string | null; photoUrl: string | null }[];
  can_manage: boolean; google_calendar_url: string;
};
export type EventSections = Record<'hero' | 'college' | 'fests' | 'competitions' | 'free', EventCard[]>;
export type InterestState = Pick<EventCard, 'interested' | 'my_status' | 'interested_count' | 'going_count'>;
export type EventFilters = { q?: string; type?: string; free?: boolean; closing?: boolean; week?: boolean; today?: boolean; weekend?: boolean; open?: boolean; college?: string; cursor?: string };
type Page = { items: EventCard[]; nextCursor: string | null };

export function listEvents(f: EventFilters = {}): Promise<Page> {
  const p = new URLSearchParams();
  if (f.type) p.set('type', f.type);
  if (f.free) p.set('free', '1');
  if (f.closing) p.set('closing', '1');
  if (f.week) p.set('week', '1');
  if (f.today) p.set('today', '1');
  if (f.weekend) p.set('weekend', '1');
  if (f.open) p.set('open', '1');
  if (f.q) p.set('q', f.q);
  if (f.college) p.set('college', f.college);
  if (f.cursor) p.set('cursor', f.cursor);
  return fetchWithAuth(`/api/events?${p}`);
}
export const listSavedEvents = (cursor?: string): Promise<Page> => fetchWithAuth(`/api/events/saved${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
export async function listCommunityEvents(slug: string): Promise<EventCard[]> {
  return (await fetchWithAuth(`/api/communities/${encodeURIComponent(slug)}/events`)).items;
}
export const createEvent = (slug: string, e: EventInput): Promise<{ id: string }> =>
  fetchWithAuth(`/api/communities/${encodeURIComponent(slug)}/events`, { method: 'POST', body: JSON.stringify(e) });
export const updateEvent = (id: string, patch: Partial<EventInput>) => fetchWithAuth(`/api/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteEvent = (id: string) => fetchWithAuth(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const setInterest = (id: string, on: boolean): Promise<{ interested: boolean; interested_count: number }> =>
  fetchWithAuth(`/api/events/${encodeURIComponent(id)}/interest`, { method: on ? 'POST' : 'DELETE' });

const one = (id: string) => `/api/events/${encodeURIComponent(id)}`;
export const getEventSections = (college?: string): Promise<EventSections> => fetchWithAuth(`/api/events/sections${college ? `?college=${encodeURIComponent(college)}` : ''}`);
export const getEvent = (id: string): Promise<EventDetail> => fetchWithAuth(one(id));
/** null removes the viewer's Interested / Going. */
export const setInterestStatus = (id: string, status: InterestStatus | null): Promise<InterestState> =>
  fetchWithAuth(`${one(id)}/interest`, status ? { method: 'PUT', body: JSON.stringify({ status }) } : { method: 'DELETE' });
export const submitEvent = (community: string, e: EventInput): Promise<{ id: string; status: EventStatus }> =>
  fetchWithAuth('/api/events', { method: 'POST', body: JSON.stringify({ ...e, community }) });
export const reviewEvent = (id: string, action: 'approve' | 'reject', reason?: string): Promise<{ ok: true; status: EventStatus }> =>
  fetchWithAuth(`${one(id)}/review`, { method: 'POST', body: JSON.stringify({ action, reason }) });
export const listMyEvents = async (): Promise<MyEvent[]> => (await fetchWithAuth('/api/events/mine')).items;
/** With a slug: that page's pending events (its mods). Without: every pending event (staff). */
export const listPendingEvents = async (slug?: string): Promise<PendingEvent[]> =>
  (await fetchWithAuth(`/api/events/pending${slug ? `?community=${encodeURIComponent(slug)}` : ''}`)).items;
/** Plain link download, so it only works for live events (no auth header). */
export const icsUrl = (id: string) => `${config.apiUrl}${one(id)}/ics`;
