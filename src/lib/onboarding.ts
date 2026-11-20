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

/** Redirect target from `?next=`: same-origin path only, else "/". Pure: origin is passed in. */
export const safeNext = (next: string | null | undefined, origin = 'http://localhost'): string => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\') || /[\u0000-\u001F\u007F]/.test(next)) return '/';
  try {
    return new URL(next, origin).origin === origin ? next : '/';
  } catch {
    return '/';
  }
};

/**
 * "Nth year" -> expected graduation year for a 4-year course. Academic year starts in July;
 * never earlier than the current calendar year.
 */
export const batchYearFromStudyYear = (studyYear: number, now: Date = new Date()): number => {
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return Math.max(now.getFullYear(), start + 4 - (studyYear - 1));
};

/** Backend requires the college on every onboarding save, so every payload carries exactly one of collegeId/collegeOther. */
export const buildOnboardingPayload = (
  college: { id: string } | { other: string } | null,
  extra: { course?: string; batchYear?: number; interests?: string[] } = {},
): { collegeId?: string; collegeOther?: string; course?: string; batchYear?: number; interests?: string[] } => {
  if (!college) throw new Error('Pick your college first.');
  return 'id' in college ? { collegeId: college.id, ...extra } : { collegeOther: college.other.trim(), ...extra };
};
