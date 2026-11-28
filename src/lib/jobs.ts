/**
 * Pure helpers for /jobs (no network/env imports so they run in node:test).
 */
export const JOB_REPORT_REASONS = ['Asks for money', 'Fake company', 'Misleading pay', 'Spam', 'Other'] as const;

export type JobKind = 'job' | 'internship' | 'referral';
export type WorkMode = 'remote' | 'onsite' | 'hybrid';
export type ApplyMode = 'mcg' | 'link';
export type AppStatus = 'pending' | 'accepted' | 'declined';

export const KIND_LABEL: Record<JobKind, string> = { job: 'Job', internship: 'Internship', referral: 'Referral' };
export const MODE_LABEL: Record<WorkMode, string> = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
export const EXPIRY_DAYS = [7, 14, 30, 60] as const;

export interface Job {
  id: string; kind: JobKind; title: string; company: string; location: string; mode: WorkMode; paid: boolean; pay: string | null;
  description: string; applyMode: ApplyMode; applyUrl: string | null; slots: number | null; slotsUsed: number;
  verifiedDomain: string | null; expiresAt: string; isApproved: boolean; isHidden: boolean; isClosed: boolean; createdAt: string;
  posterId: string; posterName: string | null; posterUsername: string | null;
  applicantCount?: number; isMine?: boolean; live?: boolean; myApplication?: { id: string; status: AppStatus } | null;
}

/** Raw snake_case API row to Job. */
export function mapJob(r: any): Job {
  return {
    id: r.id, kind: r.kind, title: r.title, company: r.company, location: r.location || '', mode: r.mode, paid: !!r.paid, pay: r.pay ?? null,
    description: r.description || '', applyMode: r.apply_mode, applyUrl: r.apply_url ?? null, slots: r.slots ?? null, slotsUsed: Number(r.slots_used || 0),
    verifiedDomain: r.verified_domain ?? null, expiresAt: r.expires_at, isApproved: !!r.is_approved, isHidden: !!r.is_hidden, isClosed: !!r.is_closed,
    createdAt: r.created_at, posterId: r.poster_id, posterName: r.poster_name ?? null, posterUsername: r.poster_username ?? null,
    ...(r.applicant_count !== undefined && { applicantCount: Number(r.applicant_count) }),
    ...(r.is_mine !== undefined && { isMine: !!r.is_mine, live: !!r.live, myApplication: r.my_application ?? null }),
  };
}

/** One line under the title: "Acme · Remote · ₹15k/month" */
export function jobFacts(j: Pick<Job, 'company' | 'location' | 'mode' | 'paid' | 'pay' | 'kind'>): string {
  const pay = j.kind === 'referral' ? '' : j.paid ? j.pay || 'Paid' : 'Unpaid';
  return [j.company, j.location, MODE_LABEL[j.mode], pay].filter(Boolean).join(' · ');
}

export const slotsLeft = (j: Pick<Job, 'slots' | 'slotsUsed'>): number | null => (j.slots == null ? null : Math.max(0, j.slots - j.slotsUsed));

/** What the poster sees for an applicant's status; referrals say Referred, jobs say Shortlisted. */
export function statusLabel(kind: JobKind, s: AppStatus): string {
  if (s === 'pending') return 'Pending';
  if (s === 'declined') return 'Not taken forward';
  return kind === 'referral' ? 'Referred' : 'Shortlisted';
}

export interface JobDraft {
  kind: JobKind; title: string; company: string; location: string; mode: WorkMode; paid: boolean; pay: string;
  description: string; applyMode: ApplyMode; applyUrl: string; slots: string; expiresInDays: number;
}
export const emptyJobDraft = (kind: JobKind = 'internship'): JobDraft => ({ kind, title: '', company: '', location: '', mode: 'onsite', paid: true, pay: '', description: '', applyMode: 'mcg', applyUrl: '', slots: '5', expiresInDays: 30 });

const isUrl = (v: string) => { try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };

/** First problem with the draft, or null. Mirrors backend validateJob. */
export function jobProblem(d: JobDraft): string | null {
  if (d.title.trim().length < 3) return 'Add a title (at least 3 characters)';
  if (d.company.trim().length < 2) return 'Add the company name';
  if (d.description.trim().length < 20) return 'Describe the role (at least 20 characters)';
  if (d.kind === 'referral') {
    const n = Number(d.slots);
    if (!Number.isInteger(n) || n < 1 || n > 50) return 'Referral slots must be 1-50';
  } else if (d.applyMode === 'link' && !isUrl(d.applyUrl.trim())) return 'Add a valid application link';
  return null;
}

export function jobDraftToPayload(d: JobDraft) {
  return {
    kind: d.kind, title: d.title.trim(), company: d.company.trim(), location: d.location.trim(), mode: d.mode,
    paid: d.kind === 'referral' ? true : d.paid, pay: d.kind === 'referral' || !d.paid ? null : d.pay.trim() || null,
    description: d.description.trim(), apply_mode: d.kind === 'referral' ? 'mcg' : d.applyMode,
    apply_url: d.kind !== 'referral' && d.applyMode === 'link' ? d.applyUrl.trim() : null,
    slots: d.kind === 'referral' ? Number(d.slots) : null, expires_in_days: d.expiresInDays,
  };
}
