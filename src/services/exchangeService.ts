import { fetchWithAuth, getFreshToken } from '../lib/apiClient';
import { config } from '../lib/config';
import { mapItem, type draftToPayload, type Listing } from '../lib/exchange';

export type ExchangeBody = ReturnType<typeof draftToPayload>;
export interface ExchangeFilters { q?: string; type?: string; category?: string; college?: string; sort?: string }
export interface ExchangePage { items: Listing[]; nextCursor: string | null; total: number }
export interface ExchangeSections { picks: Listing[]; free: Listing[]; categories: { category: string; count: number }[] }

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v);
  return p.toString();
};

export const ExchangeService = {
  list: async (filters: ExchangeFilters = {}, cursor?: string): Promise<ExchangePage> => {
    const d = await fetchWithAuth(`/api/exchange?${qs({ ...filters, cursor })}`);
    return { items: (d.items ?? []).map(mapItem), nextCursor: d.nextCursor ?? null, total: d.total ?? 0 };
  },

  sections: async (college?: string): Promise<ExchangeSections> => {
    const d = await fetchWithAuth(`/api/exchange/sections?${qs({ college })}`);
    return { picks: (d.picks ?? []).map(mapItem), free: (d.free ?? []).map(mapItem), categories: d.categories ?? [] };
  },

  get: async (id: string): Promise<Listing> => mapItem(await fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}`)),

  /** Own items, hidden ones included (an owner-deleted one has hidden_reason 'owner'). */
  mine: async (): Promise<Listing[]> => ((await fetchWithAuth('/api/exchange/me')) as unknown[]).map(mapItem),

  create: (body: ExchangeBody): Promise<{ id: number }> => fetchWithAuth('/api/exchange', { method: 'POST', body: JSON.stringify(body) }),

  // PATCH replaces the whole item: always pass the full payload.
  update: (id: string, body: ExchangeBody): Promise<{ ok: true }> =>
    fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),

  uploadImage: async (file: Blob): Promise<string> => {
    const token = await getFreshToken();
    const form = new FormData();
    form.append('image', file, 'photo');
    const res = await fetch(`${config.apiUrl}/api/exchange/upload-image`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Photo upload failed');
    return (await res.json()).url;
  },

  setStatus: (id: string, status: 'active' | 'reserved' | 'sold'): Promise<{ ok: true; status: string }> =>
    fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  remove: (id: string): Promise<{ ok: true }> => fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
