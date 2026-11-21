import { fetchWithAuth } from '../lib/apiClient';
import type { CommunityDetail, CommunityMember, CommunitySummary, PageRole } from '../lib/communities';

// fetchWithAuth sends no token when logged out, so it also serves the optionalAuth endpoints.
const send = (method: string, body?: unknown) => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const base = (slug: string) => `/api/communities/${encodeURIComponent(slug)}`;

export type CommunityInput = {
  name: string; category: string; description?: string; links?: Record<string, string>; founded_year?: number | null;
  logo_url?: string | null; banner_url?: string | null; achievements?: string | null; faculty_advisor?: string | null; recruitment_until?: string | null;
};
export type VerificationRequest = { id: string; community_id: string; method: string; proof: string; code: string; status: string; created_at: string; slug: string; name: string; kind: string; community_status: string };

export function listCommunities(f: { q?: string; category?: string; college?: string; recruiting?: boolean; cursor?: string } = {}): Promise<{ items: CommunitySummary[]; nextCursor: string | null }> {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.category) p.set('category', f.category);
  if (f.college) p.set('college', f.college);
  if (f.recruiting) p.set('recruiting', '1');
  if (f.cursor) p.set('cursor', f.cursor);
  return fetchWithAuth(`/api/communities?${p}`);
}
export const getCommunity = (slug: string): Promise<CommunityDetail> => fetchWithAuth(base(slug));
export const createCommunity = (input: CommunityInput): Promise<{ slug: string }> => fetchWithAuth('/api/communities', send('POST', input));
export const updateCommunity = (slug: string, patch: Partial<CommunityInput>): Promise<{ ok: true; statusReset?: true }> => fetchWithAuth(base(slug), send('PATCH', patch));
export const follow = (slug: string): Promise<{ following: true }> => fetchWithAuth(`${base(slug)}/follow`, send('POST'));
export const unfollow = (slug: string): Promise<{ following: false }> => fetchWithAuth(`${base(slug)}/follow`, send('DELETE'));
/** Joins (status 'active') or requests (status 'pending') depending on the page and the user's college. */
export const join = (slug: string): Promise<{ status: 'active' | 'pending' }> => fetchWithAuth(`${base(slug)}/join`, send('POST'));
/** Also cancels a pending request. */
export const leave = (slug: string): Promise<{ ok: true }> => fetchWithAuth(`${base(slug)}/join`, send('DELETE'));
export async function listMembers(slug: string, status: 'active' | 'pending' = 'active'): Promise<CommunityMember[]> {
  return (await fetchWithAuth(`${base(slug)}/members?status=${status}`)).items;
}
export type MemberUpdate = { action: 'approve' | 'decline' | 'remove' } | { action: 'set_role'; role?: PageRole; title?: string | null; sort_order?: number };
export const updateMember = (slug: string, userId: string, u: MemberUpdate) => fetchWithAuth(`${base(slug)}/members/${encodeURIComponent(userId)}`, send('PATCH', u));
export const requestVerification = (slug: string, method: 'instagram' | 'email' | 'letter', proof: string): Promise<{ code: string }> =>
  fetchWithAuth(`${base(slug)}/verification`, send('POST', { method, proof }));

// MCG admin
export async function listVerification(status: 'pending' | 'approved' | 'rejected' = 'pending'): Promise<VerificationRequest[]> {
  return (await fetchWithAuth(`/api/communities/admin/verification?status=${status}`)).items;
}
export const decideVerification = (id: string, decision: 'approve' | 'reject') => fetchWithAuth(`/api/communities/admin/verification/${encodeURIComponent(id)}`, send('PATCH', { decision }));
export const adminCommunity = (slug: string, action: 'hide' | 'unhide' | 'remove_official' | 'delete') => fetchWithAuth(`${base(slug)}/admin`, send('PATCH', { action }));
