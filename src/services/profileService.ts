import { fetchWithAuth } from '../lib/apiClient';
import { mapProfile, mapProfileItem, mapStats, type Profile, type ProfileItem, type ProfileStats, type ProfileTab } from '../lib/profiles';

export type ProfileResult = { redirect: string } | { profile: Profile; stats: ProfileStats; isOwner: boolean };
export interface ProfilePage { items: ProfileItem[]; nextCursor: string | null }

const enc = encodeURIComponent;

export const ProfileService = {
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
