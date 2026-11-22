/**
 * Pure helpers for /u/:username and /settings (no network/env imports so they run in node:test).
 */
import type { ForumPost, Resource } from '../types';
import { mapPost } from './feed';
import { mapNote } from './notes';
import { mapStay, type Stay } from './stays';

// Mirrors backend/src/utils/usernames.js
const RESERVED = ['admin', 'mcg', 'support', 'settings', 'help', 'api', 'u', 'you', 'notes', 'stays', 'login', 'explore', 'inbox', 'profile', 'about', 'root', 'moderator', 'official'];
const RE = /^[a-z][a-z0-9._]{2,19}$/;
const DAY = 24 * 60 * 60 * 1000;
export const BIO_MAX = 160;

export function validateUsername(s: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof s !== 'string') return { ok: false, error: 'Username is required' };
  const value = s.trim().toLowerCase();
  if (!RE.test(value)) return { ok: false, error: 'Use 3-20 letters, numbers, dots or underscores, starting with a letter' };
  if (value.includes('..') || value.endsWith('.')) return { ok: false, error: "Username can't contain '..' or end with a dot" };
  if (RESERVED.includes(value)) return { ok: false, error: 'That username is reserved' };
  return { ok: true, value };
}

/** When the username may next change, or null if it can change now. */
export function usernameChangeOn(changedAt: string | null | undefined, now: Date): Date | null {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + 30 * DAY);
  return next.getTime() > now.getTime() ? next : null;
}

export type Visibility = 'logged_in' | 'everyone' | 'only_me';
export const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: 'logged_in', label: 'Logged-in users', hint: 'Only people signed in to MyCollegeGenie can see your profile.' },
  { value: 'everyone', label: 'Everyone', hint: 'Anyone can see your profile, and search engines can list it.' },
  { value: 'only_me', label: 'Only me', hint: 'Nobody else can see your profile.' },
];

export type ProfileTab = 'posts' | 'comments' | 'notes' | 'listings' | 'saved';
export const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: 'Posts' }, { id: 'comments', label: 'Comments' }, { id: 'notes', label: 'Notes' },
  { id: 'listings', label: 'Listings' }, { id: 'saved', label: 'Saved' },
];
export const tabFromParam = (p: string | null, isOwner: boolean): ProfileTab =>
  PROFILE_TABS.some((t) => t.id === p && (t.id !== 'saved' || isOwner)) ? (p as ProfileTab) : 'posts';

export interface Profile {
  id: string; username: string; displayName: string; photoUrl: string | null; role: 'admin' | 'moderator' | null;
  isVerified: boolean; collegeName: string; course: string; batchYear: number | null; bio: string; interests: string[]; createdAt: string;
  /** Owner only. */
  visibility: Visibility | null; usernameChangedAt: string | null;
}
export interface ProfileStats { posts: number; answers: number; notes: number; joined: string }

export function mapProfile(raw: any): Profile {
  return {
    id: raw.id,
    username: raw.username || '',
    displayName: raw.display_name || 'Student',
    photoUrl: raw.photo_url || null,
    role: raw.role === 'admin' || raw.role === 'moderator' ? raw.role : null,
    isVerified: Boolean(raw.is_verified),
    collegeName: raw.college_name || '',
    course: raw.course || '',
    batchYear: raw.batch_year ?? null,
    bio: raw.bio || '',
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    createdAt: raw.created_at || '',
    visibility: raw.profile_visibility === 'everyone' || raw.profile_visibility === 'only_me' || raw.profile_visibility === 'logged_in' ? raw.profile_visibility : null,
    usernameChangedAt: raw.username_changed_at ?? null,
  };
}

export const mapStats = (raw: any): ProfileStats => ({ posts: Number(raw?.posts) || 0, answers: Number(raw?.answers) || 0, notes: Number(raw?.notes) || 0, joined: raw?.joined || '' });

export interface ExchangeCard { id: string; title: string; price: number; imageUrl: string | null; type: string }
export type ProfileItem =
  | { kind: 'post'; post: ForumPost }
  | { kind: 'comment'; id: string; postId: string; postTitle: string; content: string; createdAt: string }
  | { kind: 'note'; note: Resource }
  | { kind: 'stay'; stay: Stay }
  | { kind: 'exchange'; item: ExchangeCard };

/** One tab row to a typed item. Listings and saved rows carry their own `kind`; null for an unknown one. */
export function mapProfileItem(tab: ProfileTab, raw: any): ProfileItem | null {
  const kind = tab === 'posts' ? 'post' : tab === 'comments' ? 'comment' : tab === 'notes' ? 'note' : raw?.kind;
  switch (kind) {
    case 'post': return { kind, post: mapPost(raw) };
    case 'comment': return { kind, id: raw.id, postId: raw.post_id, postTitle: raw.post_title || '', content: raw.content || '', createdAt: raw.created_at || '' };
    case 'note': return { kind, note: mapNote(raw) };
    case 'stay': return { kind, stay: mapStay(raw) };
    case 'exchange': return { kind, item: { id: raw.id, title: raw.title || '', price: Number(raw.price) || 0, imageUrl: raw.image_url || null, type: raw.type || '' } };
    default: return null;
  }
}
