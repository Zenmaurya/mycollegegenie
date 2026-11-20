import type { User } from '../types';

export const INTERESTS = [
  'Finance', 'Coding', 'Debate', 'Dramatics', 'Music', 'Dance', 'Quiz',
  'Entrepreneurship', 'Social impact', 'Sports', 'Photography', 'Writing', 'Design', 'Placements',
] as const;

/** Logged-in user who has neither a listed college nor a typed-in "other" college. */
export const needsCollege = (user: User | null): boolean =>
  !!user && !user.collegeId && !user.collegeOther;

export const shouldShowCollegeCard = (user: User | null, dismissedThisSession: boolean): boolean =>
  !dismissedThisSession && needsCollege(user);

export const collegeLabel = (user: User | null): string | null =>
  user?.collegeName ?? user?.collegeOther ?? null;

/** Redirect target from `?next=`: same-origin path only, else "/". */
export const safeNext = (next: string | null | undefined): string =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/';

/** "Nth year" -> expected graduation year (batchYear), assuming a 4-year course. */
export const batchYearFromStudyYear = (year: number, now = new Date().getFullYear()): number => now + (4 - year);
