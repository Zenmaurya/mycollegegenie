import { fetchWithAuth } from '../lib/apiClient';
import type { EventCard } from '../lib/communities';

export type EventInput = {
  title: string; type: string; mode: string; eligibility: string; starts_at: string; ends_at?: string | null; register_by?: string | null;
  team_size_min?: number | null; team_size_max?: number | null; entry_fee?: number; prize?: string | null; register_url?: string | null;
  venue?: string | null; eligibility_note?: string | null; contact?: string | null; rounds?: string | null; rules?: string | null; poster_url?: string | null;
};
export type EventFilters = { type?: string; free?: boolean; closing?: boolean; week?: boolean; college?: string; cursor?: string };
type Page = { items: EventCard[]; nextCursor: string | null };

export function listEvents(f: EventFilters = {}): Promise<Page> {
  const p = new URLSearchParams();
  if (f.type) p.set('type', f.type);
  if (f.free) p.set('free', '1');
  if (f.closing) p.set('closing', '1');
  if (f.week) p.set('week', '1');
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
