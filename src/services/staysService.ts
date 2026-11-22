import { fetchWithAuth } from '../lib/apiClient';
import { mapStay, type Insight, type Stay, type StayType, type Sharing } from '../lib/stays';

export interface StayFilters {
  college?: string; area?: string; type?: string; gender?: string; sharing?: string;
  maxRent?: string; meals?: string; ac?: string; lister?: string;
}
export interface StaysPage { items: Stay[]; nextCursor: string | null; total: number }
export interface RentReportInput { college_id?: string; area?: string; type: StayType; sharing: Sharing; rent: number; meals: boolean; year: number }

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v);
  return p.toString();
};

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

};
