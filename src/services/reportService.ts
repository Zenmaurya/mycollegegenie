import { fetchWithAuth } from '../lib/apiClient';
import type { REPORT_REASONS } from '../lib/communities';
import type { RESOURCE_REPORT_REASONS } from '../lib/notes';
import type { STAY_REPORT_REASONS } from '../lib/stays';

export type ReportItemType = 'community' | 'event' | 'post' | 'comment' | 'user' | 'resource' | 'stay';
export type ReportRow = {
  itemType: ReportItemType; itemId: string; title: string; slug: string; status: string; is_hidden: boolean;
  reporters: number; reasons: Record<string, number>; latest: string;
  postId?: string; displayName?: string; warn_count?: number; banned_until?: string | null; target_banned_until?: string | null;
};
export type ModAction = 'dismiss' | 'hide' | 'unhide' | 'delete' | 'warn' | 'ban' | 'unban' | 'remove_official';
export type BanDuration = '1d' | '7d' | '30d' | 'permanent';
export type ModLogRow = { id: string; actor_id: string | null; actor_name: string | null; action: string; item_type: string; item_id: string; reason: string | null; created_at: string };

export const report = (itemType: ReportItemType, itemId: string, reason: (typeof REPORT_REASONS)[number] | (typeof RESOURCE_REPORT_REASONS)[number] | (typeof STAY_REPORT_REASONS)[number], note?: string): Promise<{ ok: true; duplicate?: true }> =>
  fetchWithAuth('/api/reports', { method: 'POST', body: JSON.stringify({ itemType, itemId, reason, ...(note ? { note } : {}) }) });
export const listReports = (cursor?: string, type?: ReportItemType, status: 'open' | 'resolved' = 'open'): Promise<{ items: ReportRow[]; nextCursor: string | null }> => {
  const q = new URLSearchParams({ status });
  if (type) q.set('type', type);
  if (cursor) q.set('cursor', cursor);
  return fetchWithAuth(`/api/reports/admin?${q}`);
};
export const actOnReport = (itemType: ReportItemType, itemId: string, action: ModAction, extra: { reason?: string; duration?: BanDuration } = {}) =>
  fetchWithAuth(`/api/reports/admin/${itemType}/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: JSON.stringify({ action, ...extra }) });
export const listModerationLog = (cursor?: string): Promise<{ items: ModLogRow[]; nextCursor: string | null }> =>
  fetchWithAuth(`/api/reports/admin/log${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
// Post moderation lives on the forum route.
export const moderatePost = (postId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'remove') =>
  fetchWithAuth(`/api/forum/posts/${encodeURIComponent(postId)}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) });
