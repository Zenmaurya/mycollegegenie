import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { InboxService, type UnreadCounts } from '../services/inboxService';

export const UNREAD_KEY = ['inbox', 'unread'];

/** Unread chats + pending requests + unread notifications; polled every 30s (React Query pauses it while the tab is hidden). */
export function useInboxBadge(): UnreadCounts & { total: number } {
  const { user } = useAuth();
  const q = useQuery({ queryKey: UNREAD_KEY, queryFn: InboxService.unreadCount, enabled: !!user, refetchInterval: 30_000, refetchIntervalInBackground: false, staleTime: 15_000 });
  const c = q.data ?? { notifications: 0, chats: 0, requests: 0 };
  return { ...c, total: c.notifications + c.chats + c.requests };
}
