/**
 * Pure helpers for follow / connect (no network/env imports so they run in node:test).
 */
export type ConnectionState = 'none' | 'requested' | 'incoming' | 'connected';
export interface Relation { following: boolean; followsYou: boolean; connection: ConnectionState }
export interface Person {
  id: string; username: string; displayName: string; photoUrl: string | null;
  collegeName: string | null; course: string | null; batchYear: number | null; mutualCount?: number; relation: Relation;
}
export type PeopleTab = 'suggestions' | 'requests' | 'connections' | 'following' | 'followers';
export const PEOPLE_TABS: PeopleTab[] = ['suggestions', 'requests', 'connections', 'following', 'followers'];
export const peopleTabFromParam = (p: string | null): PeopleTab => (PEOPLE_TABS as (string | null)[]).includes(p) ? (p as PeopleTab) : 'suggestions';

export const NO_RELATION: Relation = { following: false, followsYou: false, connection: 'none' };
export type ConnectAction = 'connect' | 'cancel' | 'accept' | 'remove';
export type FollowAction = 'follow' | 'unfollow';

/** One-line status under a name, or '' when there is nothing to say. */
export function relationLabel(r: Relation): string {
  if (r.connection === 'connected') return 'Connected';
  if (r.connection === 'requested') return 'Requested';
  if (r.connection === 'incoming') return 'Wants to connect';
  if (r.following) return r.followsYou ? 'Following · Follows you' : 'Following';
  return r.followsYou ? 'Follows you' : '';
}

/** What each button does next. Requested cancels, Connected removes (both are the same silent delete). */
export function nextActions(r: Relation): { connect: { action: ConnectAction; label: string }; follow: { action: FollowAction; label: string } } {
  const connect = {
    none: { action: 'connect', label: 'Connect' }, requested: { action: 'cancel', label: 'Requested' },
    incoming: { action: 'accept', label: 'Accept' }, connected: { action: 'remove', label: 'Connected' },
  } as const;
  return { connect: connect[r.connection], follow: r.following ? { action: 'unfollow', label: 'Following' } : { action: 'follow', label: 'Follow' } };
}

/** The relation as it will be once the server agrees, for optimistic updates. Accept follows both ways; ignoring or removing keeps follows. */
export function applyAction(r: Relation, a: ConnectAction | FollowAction | 'ignore'): Relation {
  switch (a) {
    case 'connect': return { ...r, connection: 'requested' };
    case 'accept': return { following: true, followsYou: true, connection: 'connected' };
    case 'cancel': case 'remove': case 'ignore': return { ...r, connection: 'none' };
    case 'follow': return { ...r, following: true };
    case 'unfollow': return { ...r, following: false };
  }
}

export const mapRelation = (raw: any): Relation => ({
  following: !!raw?.following, followsYou: !!raw?.followsYou,
  connection: ['requested', 'incoming', 'connected'].includes(raw?.connection) ? raw.connection : 'none',
});

export const mapPerson = (raw: any): Person => ({
  id: raw.id, username: raw.username, displayName: raw.displayName || 'Student', photoUrl: raw.photoUrl ?? null,
  collegeName: raw.collegeName ?? null, course: raw.course ?? null, batchYear: raw.batchYear ?? null,
  ...(raw.mutualCount === undefined ? {} : { mutualCount: Number(raw.mutualCount) || 0 }), relation: mapRelation(raw.relation),
});
