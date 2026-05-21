import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';

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

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}/api/exchange?${queryParams.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exchange items');
  }

  return response.json();
};

export const fetchUserListings = async (): Promise<ExchangeItem[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const response = await fetch(`${API_URL}/api/exchange/me`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user listings');
  }

  return response.json();
};

export const createExchangeItem = async (itemData: Partial<ExchangeItem>): Promise<any> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create exchange item');
  }

  return response.json();
};

export const deleteExchangeItem = async (id: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/exchange/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete exchange item');
  }
};
