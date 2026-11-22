import type { ModLogRow } from './reportService';
import { fetchWithAuth } from '../lib/apiClient';
import { mapProfile, mapProfileItem, mapStats, type Profile, type ProfileItem, type ProfileStats, type ProfileTab } from '../lib/profiles';

export type ProfileResult = { redirect: string } | { profile: Profile; stats: ProfileStats; isOwner: boolean };
export interface ProfilePage { items: ProfileItem[]; nextCursor: string | null }

const enc = encodeURIComponent;

export interface AdminUser {
  id: string; username: string | null; display_name: string; email: string; role: string; warn_count: number;
  banned_until: string | null; ban_reason: string | null; created_at: string;
}
export interface AdminUserReport { id: string; item_type: string; item_id: string; reason: string; note: string | null; status: string; created_at: string; reporter_name: string | null }

export const ProfileService = {
  // Staff only: the summary, reports against the user (or what they own) and their moderation log.
  adminUser: (id: string): Promise<{ user: AdminUser; reports: AdminUserReport[]; log: ModLogRow[] }> => fetchWithAuth(`/api/profiles/admin/users/${enc(id)}`),

  // A missing, hidden or logged-out-blocked profile rejects with .status 404.
  get: async (username: string): Promise<ProfileResult> => {
    const d = await fetchWithAuth(`/api/profiles/${enc(username)}`);
    if (d.redirect) return { redirect: d.redirect };
    return { profile: mapProfile(d.profile), stats: mapStats(d.stats), isOwner: !!d.isOwner };
  },

  tab: async (username: string, tab: ProfileTab, cursor?: string): Promise<ProfilePage> => {
    const d = await fetchWithAuth(`/api/profiles/${enc(username)}/${tab}${cursor ? `?cursor=${enc(cursor)}` : ''}`);
    return { items: (d.items ?? []).map((r: any) => mapProfileItem(tab, r)).filter((i: ProfileItem | null): i is ProfileItem => !!i), nextCursor: d.nextCursor ?? null };
  },

  // 409 'Username taken', 429 for the 30-day rule: callers read error.status.
  changeUsername: async (username: string): Promise<string> =>
    (await fetchWithAuth('/api/users/me/username', { method: 'PATCH', body: JSON.stringify({ username }) })).username,
};
