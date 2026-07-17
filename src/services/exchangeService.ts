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

  try {
    return await fetchWithAuth(`/api/campus-exchange?${queryParams.toString()}`);
  } catch (error) {
    console.error('[exchangeService] fetchExchangeItems error:', error);
    throw error;
  }
};

export const fetchUserListings = async (): Promise<ExchangeItem[]> => {
  try {
    return await fetchWithAuth('/api/campus-exchange/me');
  } catch (error) {
    console.error('[exchangeService] fetchUserListings error:', error);
    throw error;
  }
};

export const createExchangeItem = async (itemData: Partial<ExchangeItem>): Promise<any> => {
  try {
    return await fetchWithAuth('/api/campus-exchange', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  } catch (error) {
    console.error('[exchangeService] createExchangeItem error:', error);
    throw error;
  }
};

export const deleteExchangeItem = async (id: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/campus-exchange/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('[exchangeService] deleteExchangeItem error:', error);
    throw error;
  }
};
