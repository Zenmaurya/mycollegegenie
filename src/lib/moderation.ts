import type { User } from '../types';

export type BanStatus = { banned: boolean; permanent: boolean; until: Date | null };

/** Derives the ban state from `bannedUntil`; a past or unparseable date means not banned. */
export function banStatus(user: Pick<User, 'bannedUntil'> | null | undefined, now: Date): BanStatus {
  const until = user?.bannedUntil ? new Date(user.bannedUntil) : null;
  if (!until || Number.isNaN(until.getTime()) || until <= now) return { banned: false, permanent: false, until: null };
  return { banned: true, permanent: until.getUTCFullYear() >= 9999, until };
}
