// Types and pure rules for society pages and events. Mirrors backend/src/utils/communities.js.
export const CATEGORIES = ['Finance & Economics', 'Entrepreneurship', 'Debating', 'Dramatics', 'Music', 'Dance', 'Quiz', 'Literary', 'Fine arts', 'Photography & Film', 'Tech & Coding', 'Social service', 'Sports', 'Placement cell', 'Other'] as const;
export const EVENT_TYPES = ['Competition', 'Quiz', 'Workshop', 'Fest', 'Recruitment', 'Talk', 'Other'] as const;
export const EVENT_MODES = ['Online', 'Offline', 'Hybrid'] as const;
export const ELIGIBILITY = ['Open to all DU', 'Own college only', 'Specific'] as const;
export const REPORT_REASONS = ['Spam', 'Scam / fake', 'Fake society page', 'Harassment', 'Inappropriate', 'Other'] as const;

export type PageRole = 'admin' | 'core' | 'member';
export type CommunityStatus = 'unverified' | 'official' | 'hidden';
export type JoinMode = 'login' | 'pick_college' | 'join' | 'request';

export interface CommunitySummary {
  id: string; slug: string; kind: 'society' | 'mcg'; name: string; category: string; logo_url: string | null; status: CommunityStatus;
  college: { id: string; short_name: string } | null;
  followers: number; members: number; recruitment_until: string | null;
  /** Viewer follows this page (false when logged out). */
  following?: boolean;
}
/** Latest verification request; only page admins receive it. */
export interface VerificationState { status: 'pending' | 'approved' | 'rejected'; method: 'instagram' | 'email' | 'letter'; code: string; created_at: string }
export interface CommunityDetail extends CommunitySummary {
  description: string | null; links: Record<string, string>; founded_year: number | null; achievements: string | null;
  faculty_advisor: string | null; banner_url: string | null;
  isListed: boolean;
  viewer: { following: boolean; role: PageRole | null; status: 'active' | 'pending' | null; joinMode: JoinMode; verification?: VerificationState | null };
}
export interface CommunityMember { userId: string; displayName: string; avatar: string | null; role: PageRole; title: string | null; sort_order: number }
export interface EventCard {
  id: string; title: string; type: (typeof EVENT_TYPES)[number]; starts_at: string; ends_at: string | null; register_by: string | null;
  mode: (typeof EVENT_MODES)[number]; venue: string | null; eligibility: (typeof ELIGIBILITY)[number]; eligibility_note: string | null;
  team_size_min: number | null; team_size_max: number | null; entry_fee: number; prize: string | null; rounds: string | null; rules: string | null;
  contact: string | null; poster_url: string | null; register_url: string | null;
  community: { slug: string; name: string; logo_url: string | null; status: CommunityStatus; college_short: string | null };
  interested: boolean; interested_count: number;
}

export type JoinButton = {
  label: 'Join' | 'Request to join' | 'Requested' | 'Member' | 'Pick your college to join' | 'Log in to join';
  action: 'join' | 'request' | 'leave' | 'pick_college' | 'login' | null;
};

export function joinButton(d: Pick<CommunityDetail, 'isListed' | 'viewer'>): JoinButton {
  const { status, joinMode } = d.viewer;
  if (joinMode === 'login') return { label: 'Log in to join', action: 'login' };
  if (status === 'active') return { label: 'Member', action: 'leave' };
  if (status === 'pending') return { label: 'Requested', action: 'leave' }; // DELETE /join cancels a pending request
  if (joinMode === 'pick_college') return { label: 'Pick your college to join', action: 'pick_college' };
  // unlisted page: the backend refuses outsiders, so show the label but no action
  const action = d.isListed ? joinMode : null;
  return joinMode === 'join' ? { label: 'Join', action } : { label: 'Request to join', action };
}

const SOON_MS = 48 * 3600_000;
const closingSoon = (e: Pick<EventCard, 'register_by'>, now: Date) => {
  if (!e.register_by) return false;
  const left = new Date(e.register_by).getTime() - now.getTime();
  return left >= 0 && left <= SOON_MS;
};

export function eventBadges(e: EventCard, now: Date): string[] {
  const out: string[] = [];
  if (e.entry_fee === 0) out.push('Free');
  if (closingSoon(e, now)) out.push('Closing soon');
  if (e.eligibility === 'Open to all DU') out.push('Open to all DU');
  if (e.mode === 'Online') out.push('Online');
  return out;
}

/** Saved events whose registration closes within 48 h, soonest first. */
export function deadlineSoon(saved: EventCard[], now: Date): EventCard[] {
  return saved.filter((e) => closingSoon(e, now)).sort((a, b) => new Date(a.register_by!).getTime() - new Date(b.register_by!).getTime());
}

export type CommunityForm = { name: string; category: string; description: string; instagram: string; linkedin: string; website: string; email: string };

/** Mirrors backend safeHttpsUrl: https only, no whitespace/control chars, no credentials, at most 500 chars. */
export const isHttpsUrl = (v: string) => {
  if (!v.startsWith('https://') || v.length > 500 || /[\s\x00-\x1f\x7f]/.test(v)) return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !!u.hostname && !u.username && !u.password; } catch { return false; }
};

/** Client-side first pass; the server's validation is final. Returns field -> message. */
export function validateCommunityForm(f: CommunityForm): Partial<Record<keyof CommunityForm, string>> {
  const e: Partial<Record<keyof CommunityForm, string>> = {};
  const name = f.name.trim();
  if (name.length < 3 || name.length > 80) e.name = 'Name must be 3 to 80 characters';
  if (!(CATEGORIES as readonly string[]).includes(f.category)) e.category = 'Choose a category';
  if (f.description.length > 1000) e.description = 'Keep the description under 1000 characters';
  for (const k of ['instagram', 'linkedin', 'website'] as const) {
    const v = f[k].trim();
    if (v && !isHttpsUrl(v)) e[k] = 'Links must be a full https:// address';
  }
  const mail = f.email.trim();
  if (mail && (mail.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))) e.email = 'Enter a valid email';
  return e;
}

/** Register is shown for official/mcg pages; unverified pages only for listed pages and viewers from the page's own college. */
export function canRegister(d: Pick<CommunityDetail, 'status' | 'kind' | 'isListed' | 'college'>, viewerCollegeId?: string | null): boolean {
  if (d.status === 'hidden') return false;
  if (d.status === 'official' || d.kind === 'mcg') return true;
  return d.isListed !== false && !!viewerCollegeId && viewerCollegeId === d.college?.id;
}

/** Domain label for an https link, or null when the link must not be rendered. */
export function linkLabel(url: string): string | null {
  if (!isHttpsUrl(url)) return null;
  return new URL(url).hostname.replace(/^www\./, '');
}

export type PostKind = 'official' | 'discussion';
/** Post kinds the viewer may publish on a page. Server rules are final. */
export function composerKinds(role: PageRole | null, kind: 'society' | 'mcg'): PostKind[] {
  if (kind === 'mcg') return ['discussion'];
  if (role === 'admin' || role === 'core') return ['official', 'discussion'];
  return role === 'member' ? ['discussion'] : [];
}
