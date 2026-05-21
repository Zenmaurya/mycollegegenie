import { fetchWithAuth } from '../lib/apiClient';
import { supabase } from '../supabase';

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
