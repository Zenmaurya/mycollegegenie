import { fetchWithAuth } from '../lib/apiClient';
import type { ChatMessage, InboxNotification } from '../lib/inbox';

export interface Conversation {
  id: string; kind: 'listing' | 'direct'; requestStatus: 'accepted' | 'pending';
  /** id and username are null for anonymous listing chats */
  other: { id: string | null; username: string | null; displayName: string; photoUrl: string | null };
  listing: { type: string; id: string; title: string | null; photo: string | null } | null;
  lastMessage: string | null; lastMessageAt: string | null; unread: boolean;
}
export type ConversationHeader = Pick<Conversation, 'id' | 'kind' | 'requestStatus' | 'other' | 'listing'>;
export interface MessagesPage {
  status: string; kind: 'listing' | 'direct'; requestStatus: string; hasMore: boolean; messages: ChatMessage[];
  conversation: ConversationHeader; youStarted: boolean; canSend: { ok: boolean; error?: string };
}
/** conversationId is set (and id null) for an anonymously blocked listing partner */
export type BlockedPerson = Conversation['other'] & { conversationId?: string };
export interface UnreadCounts { notifications: number; chats: number; requests: number }

// fetchWithAuth caches GETs for 30s; polling needs a fresh read, so every GET carries a unique `_`.
const fresh = (path: string) => `${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
const post = (path: string, body?: unknown) => fetchWithAuth(path, { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const conv = (id: string) => `/api/chat/conversations/${encodeURIComponent(id)}`;

export const InboxService = {
  conversations: async (box: 'chats' | 'requests'): Promise<Conversation[]> => (await fetchWithAuth(fresh(`/api/chat/conversations?box=${box}`))).items ?? [],
  start: (target: { listingType: string; listingId: string } | { userId: string }): Promise<{ id: string; requestStatus: string }> => post('/api/chat/conversations', target),
  messages: (id: string, before?: string): Promise<MessagesPage> => fetchWithAuth(fresh(`${conv(id)}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`)),
  send: (id: string, content: string): Promise<{ success: true; messageId: string }> => post(`${conv(id)}/messages`, { content }),
  accept: (id: string) => post(`${conv(id)}/accept`),
  decline: (id: string) => post(`${conv(id)}/decline`),
  shareContact: (id: string) => post(`${conv(id)}/share-contact`),
  blockConversation: (id: string) => post(`${conv(id)}/block`),
  unblockConversation: (id: string) => fetchWithAuth(`${conv(id)}/block`, { method: 'DELETE' }),
  reportConversation: (id: string, reason: string, note?: string) => post(`${conv(id)}/report`, { reason, ...(note ? { note } : {}) }),
  block: (userId: string) => post('/api/chat/blocks', { userId }),
  unblock: (userId: string) => fetchWithAuth(`/api/chat/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  blocks: async (): Promise<BlockedPerson[]> => (await fetchWithAuth(fresh('/api/chat/blocks'))).items ?? [],

  notifications: (cursor?: string): Promise<{ items: InboxNotification[]; nextCursor: string | null }> =>
    fetchWithAuth(fresh(`/api/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)),
  unreadCount: (): Promise<UnreadCounts> => fetchWithAuth(fresh('/api/notifications/unread-count')),
  readAll: () => post('/api/notifications/read-all'),
  read: (id: string) => post(`/api/notifications/${encodeURIComponent(id)}/read`),
};
