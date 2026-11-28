import { fetchWithAuth, getFreshToken } from '../lib/apiClient';
import { config } from '../lib/config';
import { mapStay, type draftToPayload, type Insight, type Stay, type StayType, type Sharing } from '../lib/stays';

export interface StayFilters {
  q?: string; college?: string; area?: string; type?: string; gender?: string; sharing?: string;
  maxRent?: string; meals?: string; ac?: string; lister?: string;
}
export interface StaysPage { items: Stay[]; nextCursor: string | null; total: number }
export interface RentReportInput { college_id?: string; area?: string; type: StayType; sharing: Sharing; rent: number; meals: boolean; year: number }

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v);
  return p.toString();
};

type StayBody = ReturnType<typeof draftToPayload>;

export const StaysService = {
  list: async (filters: StayFilters = {}, cursor?: string, limit = 20): Promise<StaysPage> => {
    const d = await fetchWithAuth(`/api/stays?${qs({ ...filters, cursor, limit: String(limit) })}`);
    return { items: (d.items ?? []).map(mapStay), nextCursor: d.nextCursor ?? null, total: d.total ?? 0 };
  },

  get: async (id: string): Promise<Stay> => mapStay(await fetchWithAuth(`/api/stays/${encodeURIComponent(id)}`)),

  insight: (p: { college?: string; area?: string; type: string; sharing: string }): Promise<Insight> =>
    fetchWithAuth(`/api/stays/insight?${qs(p)}`),

  // A 429 error (daily limit) carries status 429.
  reportRent: (input: RentReportInput): Promise<{ ok: true; insight: Insight }> =>
    fetchWithAuth('/api/stays/rent', { method: 'POST', body: JSON.stringify(input) }),

  create: (body: StayBody): Promise<{ id: string }> => fetchWithAuth('/api/stays', { method: 'POST', body: JSON.stringify(body) }),

  // Saving puts the stay back into review (backend sets is_approved = 0).
  update: (id: string, body: StayBody): Promise<{ ok: true }> =>
    fetchWithAuth(`/api/stays/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),

  remove: (id: string): Promise<{ ok: true }> => fetchWithAuth(`/api/stays/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  mine: async (): Promise<Stay[]> => (await fetchWithAuth('/api/stays/mine')).map(mapStay),

  /** Upload one photo (already resized in the browser). Returns the Cloudinary URL. */
  uploadImage: async (file: Blob): Promise<string> => {
    const token = await getFreshToken();
    const form = new FormData();
    form.append('image', file, 'photo');
    const res = await fetch(`${config.apiUrl}/api/stays/upload-image`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Photo upload failed');
    return (await res.json()).url;
  },

  // Admin only.
  pending: async (cursor?: string): Promise<StaysPage> => {
    const d = await fetchWithAuth(`/api/stays/admin/pending?${qs({ cursor })}`);
    return { items: (d.items ?? []).map(mapStay), nextCursor: d.nextCursor ?? null, total: d.items?.length ?? 0 };
  },

  // updated_at must match the version that was reviewed, else the API answers 409.
  approve: (id: string, updatedAt: string): Promise<{ ok: true }> =>
    fetchWithAuth(`/api/stays/${encodeURIComponent(id)}/approve`, { method: 'PATCH', body: JSON.stringify({ updated_at: updatedAt }) }),

};
