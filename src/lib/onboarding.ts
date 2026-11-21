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

const INTEREST_CATEGORY: Record<string, string> = {
  Finance: 'Finance & Economics', Coding: 'Tech & Coding', Debate: 'Debating', Dramatics: 'Dramatics', Music: 'Music', Dance: 'Dance',
  Quiz: 'Quiz', Entrepreneurship: 'Entrepreneurship', 'Social impact': 'Social service', Sports: 'Sports',
  Photography: 'Photography & Film', Writing: 'Literary', Design: 'Fine arts', Placements: 'Placement cell',
};

/** Society categories matching the picked interests (unknown interests skipped, no duplicates). */
export const categoriesForInterests = (interests: string[]): string[] =>
  [...new Set(interests.map(i => INTEREST_CATEGORY[i]).filter((c): c is string => !!c))];

/** College societies first, then interest matches; deduped by id, at most 6. */
export const mergeSuggestions = <T extends { id: string }>(atCollege: T[], byInterest: T[]): T[] => {
  const seen = new Set<string>();
  return [...atCollege, ...byInterest].filter(c => !seen.has(c.id) && !!seen.add(c.id)).slice(0, 6);
};
