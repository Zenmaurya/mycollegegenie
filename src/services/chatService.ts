import { fetchWithAuth } from '../lib/apiClient';

export interface ChatSession {
  id: string;
  listing_type: 'pg' | 'exchange';
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'anonymous' | 'unlocked';
  created_at: string;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string | null;
  content: string;
  is_system: number;
  created_at: string;
}

export const ChatService = {
  getSessions: async (): Promise<ChatSession[]> => {
    return fetchWithAuth('/api/chat/sessions');
  },

  createSession: async (listingType: 'pg' | 'exchange', listingId: string, sellerId: string): Promise<{ sessionId: string }> => {
    return fetchWithAuth('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ listing_type: listingType, listing_id: listingId, seller_id: sellerId }),
    });
  },

  getMessages: async (sessionId: string): Promise<{ status: 'anonymous' | 'unlocked'; messages: ChatMessage[] }> => {
    return fetchWithAuth(`/api/chat/${sessionId}/messages`);
  },

  sendMessage: async (sessionId: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string; injected?: boolean }> => {
    try {
      const res = await fetchWithAuth(`/api/chat/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return res;
    } catch (err: any) {
      if (err.message.includes('Contact sharing is disabled')) {
        return { success: false, injected: true, error: err.message };
      }
      throw err;
    }
  },

  unlockChat: async (sessionId: string): Promise<{ success: boolean }> => {
    return fetchWithAuth(`/api/chat/${sessionId}/unlock`, { method: 'POST' });
  }
};
