import { fetchWithAuth } from '../lib/apiClient';
import type { REPORT_REASONS } from '../lib/communities';

export type ReportItemType = 'community' | 'event' | 'post' | 'comment' | 'user';
export type ReportRow = {
  itemType: ReportItemType; itemId: string; title: string; slug: string; status: string; is_hidden: boolean;
  reporters: number; reasons: Record<string, number>; latest: string;
};

export const report = (itemType: ReportItemType, itemId: string, reason: (typeof REPORT_REASONS)[number], note?: string): Promise<{ ok: true; duplicate?: true }> =>
  fetchWithAuth('/api/reports', { method: 'POST', body: JSON.stringify({ itemType, itemId, reason, ...(note ? { note } : {}) }) });
export const listReports = (cursor?: string): Promise<{ items: ReportRow[]; nextCursor: string | null }> =>
  fetchWithAuth(`/api/reports/admin${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
export const actOnReport = (itemType: ReportItemType, itemId: string, action: 'dismiss' | 'hide' | 'unhide' | 'delete') =>
  fetchWithAuth(`/api/reports/admin/${itemType}/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: JSON.stringify({ action }) });
// Post moderation lives on the forum route.
export const moderatePost = (postId: string, action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'remove') =>
  fetchWithAuth(`/api/forum/posts/${encodeURIComponent(postId)}/moderate`, { method: 'PATCH', body: JSON.stringify({ action }) });
