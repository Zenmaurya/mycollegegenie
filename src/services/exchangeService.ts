import { fetchWithAuth } from '../lib/apiClient';
import { supabase } from '../supabase';
import { mapItem, type Listing } from '../lib/exchange';

export interface ExchangeItem {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  type: string;
  category: string;
  college: string;
  image_url?: string;
  created_at: string;
  is_active: boolean;
  exchange_for?: string;
  contact_phone?: string;
  contact_instagram?: string;
  seller_name?: string;
  is_mine?: boolean | number;
  seller_avatar?: string;
}

export const fetchExchangeItems = async (filters?: {
  type?: string;
  college?: string;
  q?: string;
}): Promise<ExchangeItem[]> => {
  const queryParams = new URLSearchParams();
  if (filters?.type && filters.type !== 'All' && filters.type !== 'all') {
    queryParams.append('type', filters.type);
  }
  if (filters?.college && filters.college !== 'All Campuses' && filters.college !== 'all') {
    queryParams.append('college', filters.college);
  }
  if (filters?.q) {
    queryParams.append('q', filters.q);
  }

  return await fetchWithAuth(`/api/exchange?${queryParams.toString()}`);
};

export const fetchUserListings = async (): Promise<ExchangeItem[]> => {
  return await fetchWithAuth('/api/exchange/me');
};

export const createExchangeItem = async (itemData: Partial<ExchangeItem>): Promise<any> => {
  return await fetchWithAuth('/api/exchange', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

export const deleteExchangeItem = async (id: string): Promise<void> => {
  await fetchWithAuth(`/api/exchange/${id}`, {
    method: 'DELETE',
  });
};

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

  setStatus: (id: string, status: 'active' | 'reserved' | 'sold'): Promise<{ ok: true; status: string }> =>
    fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status }) }),

  remove: (id: string): Promise<{ ok: true }> => fetchWithAuth(`/api/exchange/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
