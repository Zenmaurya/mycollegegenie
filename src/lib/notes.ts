/**
 * Pure helpers for /notes (no network/env imports so they run in node:test).
 */
import type { Resource, ResourceType } from '../types';
import { COURSE_METADATA, College_COURSES } from '../constants';

export const RESOURCE_REPORT_REASONS = ['Wrong file', 'Copyright', 'Low quality', 'Spam', 'Other'] as const;

const BBA = 'Bachelor of Business Administration (Financial Investment Analysis) [BBA(FIA)]';
const BMS = 'Bachelor of Management Studies (BMS)';
const BCOM = 'B.Com. (Hons.)';
const SEC = 'Skill Enhancement Course (SEC)';

/** Course picker: the four most-used names first, then every DU UG/PG course (Ph.D. left out). */
export const NOTES_COURSES = [...new Set([BBA, BMS, SEC, BCOM, ...College_COURSES.filter((c) => !c.startsWith('Ph.D.'))])];
const COURSE_BY_KEY = new Map<string, string>(
  [...NOTES_COURSES, ...Object.keys(COURSE_METADATA)].map((c) => [c.toLowerCase(), c]),
);

const ALIASES: Record<string, string> = {
  'bba': BBA, 'bba-fia': BBA, 'bba fia': BBA, 'bba(fia)': BBA,
  'bms': BMS,
  'bcom': BCOM, 'b.com': BCOM, 'b.com (hons)': BCOM,
};

export function canonicalCourse(text: string | null): string | null {
  const k = (text ?? '').trim().toLowerCase();
  return COURSE_BY_KEY.get(k) ?? (Object.hasOwn(ALIASES, k) ? ALIASES[k] : null);
}

/** Short course label for cards, e.g. 'BBA(FIA)'. */
export function courseShort(course: string): string {
  const m = /\[(.+)\]$|\((BMS|SEC)\)$/.exec(course);
  return m ? (m[1] ?? m[2]) : course.replace('B.Com. (Hons.)', 'B.Com (H)');
}

/** batchYear = admission year; the academic year starts in July. null when outside 1..maxSem. */
export function currentSemester(batchYear: number | null, now: Date, maxSem: number): number | null {
  if (batchYear == null) return null;
  const autumn = now.getMonth() >= 6;
  const sem = ((autumn ? now.getFullYear() : now.getFullYear() - 1) - batchYear) * 2 + (autumn ? 1 : 2);
  return sem >= 1 && sem <= maxSem ? sem : null;
}

const KEPT = ['q', 'type', 'course', 'semester', 'subjectCode'];

/** My Uploads status chip: hidden wins over approval. */
export function uploadStatus(r: { isApproved?: boolean; isHidden?: boolean }): 'Hidden' | 'In review' | 'Live' {
  return r.isHidden ? 'Hidden' : r.isApproved ? 'Live' : 'In review';
}

export function legacyBrowseToNotes(search: string): string {
  const src = new URLSearchParams(search);
  const id = src.get('resourceId');
  if (id) return `/notes/${encodeURIComponent(id)}`;
  if (src.get('openUpload') === '1') return '/notes/upload';
  const out = new URLSearchParams();
  for (const k of KEPT) { const v = src.get(k); if (v) out.set(k, v); }
  const sem = src.get('sem'); if (sem && !out.has('semester')) out.set('semester', sem);
  const qs = out.toString();
  return qs ? `/notes?${qs}` : '/notes';
}

// Same rule as backend utils/resources.js
export function yearFromTitle(title: string | null | undefined): number | null {
  const m = /(?<!\d)(20(?:1\d|2\d|30))(?!\d)/.exec(String(title || ''));
  return m ? Number(m[1]) : null;
}

/** Suggested title from an uploaded file name. */
export function titleFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** File/link rules for the upload page; null when fine. Re-run when the type changes. */
export function uploadProblem(o: { type: ResourceType; hasFile: boolean; link: string }): string | null {
  const link = o.link.trim();
  if (o.type === 'Playlist' && (o.hasFile || !link)) return 'A Playlist needs a YouTube link, not a file.';
  if (!o.hasFile && !link) return 'Add a file or paste a link to continue.';
  if (link && !/^https?:\/\//i.test(link)) return 'Links must start with http:// or https://.';
  return null;
}

export function formatHelpedPct(yes: number, no: number): string | null {
  const n = yes + no;
  return n < 5 ? null : `${Math.round((yes / n) * 100)}% found it helpful`;
}

/** Raw snake_case API row to Resource. link/directDownloadLink are '' when the API omits them (logged out). */
export function mapNote(raw: any): Resource {
  const date = raw.upload_date ? String(raw.upload_date).slice(0, 10) : '';
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    type: raw.type as ResourceType,
    course: raw.course || '',
    semester: Number(raw.semester) || 0,
    subCategory: raw.sub_category || '',
    subjectCode: raw.subject_code || '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    link: raw.link || '',
    directDownloadLink: raw.direct_download_link || '',
    uploadDate: date,
    uploadTimestamp: date ? new Date(date).getTime() : undefined,
    uploader: raw.uploader || '',
    uploaderId: raw.uploader_id || '',
    uploaderRole: raw.uploader_role || 'user',
    uploaderUsername: raw.uploader_username ?? null,
    isApproved: Boolean(raw.is_approved),
    ratings: [],
    reports: [],
    thumbnailUrl: raw.thumbnail_url ?? null,
    pageCount: raw.page_count ?? null,
    ratingAvg: raw.rating_avg == null ? null : Number(raw.rating_avg),
    ratingCount: Number(raw.rating_count) || 0,
    downloads: Number(raw.downloads) || 0,
    views: Number(raw.views) || 0,
    year: raw.year ?? null,
    uploaderCollege: raw.uploader_college ?? null,
    uploaderVerified: Boolean(raw.uploader_verified),
    helpfulYes: Number(raw.helpful_yes) || 0,
    helpfulNo: Number(raw.helpful_no) || 0,
    isHidden: Boolean(raw.is_hidden),
  };
}

/** Leaving sections mode: carry the viewer's default course/semester into the URL unless it already has them. */
export function withPickDefaults(params: URLSearchParams, pick: { course: string; semester: string }): URLSearchParams {
  const out = new URLSearchParams(params);
  if (pick.course && !out.get('course')) out.set('course', pick.course);
  if (pick.semester && !out.get('semester')) out.set('semester', pick.semester);
  return out;
}

export type PreviewKind = { kind: 'pdf' | 'drive' | 'youtube' | 'image' | 'other'; id?: string };

/** What the resource page should embed for a link. id is the Drive file id or YouTube video id. */
export function previewKind(link: string): PreviewKind {
  let u: URL;
  try { u = new URL(link); } catch { return { kind: 'other' }; }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'drive.google.com' || host === 'docs.google.com') {
    const id = /\/file\/d\/([\w-]+)/.exec(u.pathname)?.[1] ?? u.searchParams.get('id');
    return id ? { kind: 'drive', id } : { kind: 'other' };
  }
  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    const id = host === 'youtu.be' ? u.pathname.split('/')[1] : (u.searchParams.get('v') ?? /\/embed\/([\w-]+)/.exec(u.pathname)?.[1]);
    return id ? { kind: 'youtube', id } : { kind: 'other' };
  }
  if (/\.pdf$/i.test(u.pathname)) return { kind: 'pdf' };
  if (/\.(png|jpe?g|webp|gif)$/i.test(u.pathname)) return { kind: 'image' };
  return { kind: 'other' };
}
