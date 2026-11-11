import { fetchWithAuth, clearApiCache } from '../lib/apiClient';
import { config } from '../lib/config';
import { supabase } from '../supabase';
import { BLOG_POSTS, BlogPost } from '../data/blogData';

export interface AdminBlogPost extends BlogPost {
  isPublished?: boolean;
  isBuiltIn?: boolean;
}

const SETTINGS_POST_PREFIX = 'mcg_blog_post_';
const SETTINGS_DELETED_KEY = 'mcg_blog_deleted_ids';
const LOCAL_STORAGE_POSTS_KEY = 'mcg_local_blog_posts';
const LOCAL_STORAGE_DELETED_KEY = 'mcg_local_blog_deleted';

// Category color mapping helper
export const CATEGORY_COLORS: Record<string, string> = {
  'Placements & Career': 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Study & Exams': 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300',
  'Campus & PG Life': 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300',
  'Tech & Coding': 'bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300',
  'Hackathons': 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300',
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
};

// Slugify helper
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Local storage helpers (safety fallback)
const getLocalPosts = (): AdminBlogPost[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalPosts = (posts: AdminBlogPost[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(posts));
  } catch { /* ignore */ }
};

const getLocalDeletedIds = (): string[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalDeletedIds = (ids: string[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
};

// Read dynamic blogs stored in /api/settings (fallback when /api/blogs is not deployed yet)
async function fetchFromSettingsFallback(): Promise<{ posts: AdminBlogPost[]; deletedIds: string[] }> {
  try {
    const res = await fetch(`${config.apiUrl}/api/settings`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Settings fetch failed');
    const settings: Record<string, string> = await res.json();

    const posts: AdminBlogPost[] = [];
    let deletedIds: string[] = [];

    if (settings[SETTINGS_DELETED_KEY]) {
      try {
        deletedIds = JSON.parse(settings[SETTINGS_DELETED_KEY]);
      } catch { /* ignore */ }
    }

    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith(SETTINGS_POST_PREFIX) && value && value !== 'DELETED') {
        try {
          const parsed = JSON.parse(value);
          if (parsed && parsed.id && !parsed._deleted) {
            posts.push(parsed);
          }
        } catch { /* ignore */ }
      }
    }

    return { posts, deletedIds };
  } catch {
    return { posts: getLocalPosts(), deletedIds: getLocalDeletedIds() };
  }
}

async function saveToSettingsFallback(payload: Record<string, string>): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${config.apiUrl}/api/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/**
 * Fetch all blog posts (merged with built-in guides).
 * @param includeUnpublished Set true in Admin Panel to see drafts too.
 */
export async function getAllBlogs(includeUnpublished = false): Promise<AdminBlogPost[]> {
  let remotePosts: AdminBlogPost[] = [];
  let deletedIds: string[] = [];
  let usedSettingsFallback = false;

  try {
    const query = includeUnpublished ? '?includeUnpublished=true' : '';
    const data = await fetchWithAuth(`/api/blogs${query}`, { cache: 'no-store' });
    if (Array.isArray(data)) {
      remotePosts = data;
    }
  } catch (err: any) {
    // If /api/blogs route returns 404 or isn't deployed yet, use /api/settings fallback
    usedSettingsFallback = true;
    const fallback = await fetchFromSettingsFallback();
    remotePosts = fallback.posts;
    deletedIds = fallback.deletedIds;
  }

  // Also grab settings-stored deleted IDs if /api/blogs returned empty (in case static posts were hidden)
  if (!usedSettingsFallback && remotePosts.length === 0) {
    const fallback = await fetchFromSettingsFallback();
    if (fallback.posts.length > 0 || fallback.deletedIds.length > 0) {
      remotePosts = fallback.posts;
      deletedIds = fallback.deletedIds;
    }
  }

  // Merge remote posts with built-in posts (remote overrides built-in with same id or slug)
  const mergedMap = new Map<string, AdminBlogPost>();

  for (const builtIn of BLOG_POSTS) {
    if (!deletedIds.includes(builtIn.id)) {
      mergedMap.set(builtIn.id, { ...builtIn, isPublished: true, isBuiltIn: true });
    }
  }

  for (const post of remotePosts) {
    // Check if an existing built-in post has the same slug or id and replace it
    for (const [k, v] of mergedMap.entries()) {
      if (v.slug === post.slug || v.id === post.id) {
        mergedMap.delete(k);
      }
    }
    if (includeUnpublished || post.isPublished !== false) {
      mergedMap.set(post.id, { ...post, isPublished: post.isPublished !== false });
    }
  }

  const finalPosts = Array.from(mergedMap.values()).filter(
    (p) => includeUnpublished || p.isPublished !== false
  );

  // Sort newest / featured first
  return finalPosts.sort((a, b) => {
    const dateA = new Date(a.publishedDate).getTime() || 0;
    const dateB = new Date(b.publishedDate).getTime() || 0;
    return dateB - dateA;
  });
}

/**
 * Fetch a single blog post by slug
 */
export async function getBlogBySlug(slug: string, includeUnpublished = false): Promise<AdminBlogPost | null> {
  const all = await getAllBlogs(includeUnpublished);
  return all.find((p) => p.slug === slug || p.id === slug) || null;
}

/**
 * Create or update a blog post (Admin only)
 */
export async function saveBlogPost(post: AdminBlogPost, isUpdate = false): Promise<AdminBlogPost> {
  const now = new Date();
  const normalized: AdminBlogPost = {
    ...post,
    id: post.id || `post-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`,
    slug: post.slug ? generateSlug(post.slug) : generateSlug(post.title),
    categoryColor: post.categoryColor || getCategoryColor(post.category),
    publishedDate: post.publishedDate || now.toISOString(),
    formattedDate: post.formattedDate || now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    isPublished: post.isPublished !== undefined ? post.isPublished : true,
  };

  let savedToPrimary = false;
  try {
    if (isUpdate && !post.isBuiltIn) {
      await fetchWithAuth(`/api/blogs/${normalized.id}`, {
        method: 'PATCH',
        body: JSON.stringify(normalized),
      });
    } else {
      await fetchWithAuth('/api/blogs', {
        method: 'POST',
        body: JSON.stringify(normalized),
      });
    }
    savedToPrimary = true;
  } catch (err: any) {
    console.warn('[blogService] Primary /api/blogs unavailable, falling back to /api/settings:', err?.message);
  }

  if (!savedToPrimary) {
    const cleanCopy = { ...normalized };
    delete cleanCopy.isBuiltIn;
    const ok = await saveToSettingsFallback({
      [`${SETTINGS_POST_PREFIX}${normalized.id}`]: JSON.stringify(cleanCopy),
    });

    if (!ok) {
      // Final local fallback if API completely unreachable
      const locals = getLocalPosts().filter((p) => p.id !== normalized.id && p.slug !== normalized.slug);
      locals.unshift(cleanCopy);
      saveLocalPosts(locals);
    }
  }

  clearApiCache();
  return normalized;
}

/**
 * Delete a blog post (Admin only)
 */
export async function deleteBlogPost(post: AdminBlogPost): Promise<void> {
  let deletedFromPrimary = false;

  try {
    await fetchWithAuth(`/api/blogs/${post.id}`, { method: 'DELETE' });
    deletedFromPrimary = true;
  } catch {
    // Fallback
  }

  const { deletedIds } = await fetchFromSettingsFallback();
  const updatedDeletedIds = Array.from(new Set([...deletedIds, post.id]));

  const payload: Record<string, string> = {
    [`${SETTINGS_POST_PREFIX}${post.id}`]: JSON.stringify({ _deleted: true, id: post.id }),
  };

  if (post.isBuiltIn) {
    payload[SETTINGS_DELETED_KEY] = JSON.stringify(updatedDeletedIds);
  }

  const ok = await saveToSettingsFallback(payload);
  if (!ok && !deletedFromPrimary) {
    saveLocalPosts(getLocalPosts().filter((p) => p.id !== post.id));
    if (post.isBuiltIn) {
      saveLocalDeletedIds(Array.from(new Set([...getLocalDeletedIds(), post.id])));
    }
  }

  clearApiCache();
}

/**
 * Upload cover or author image using existing Cloudinary image upload endpoint
 */
export async function uploadBlogImage(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const formData = new FormData();
  formData.append('image', file);

  // Reusing /api/news/upload-image (already live on production Cloudinary uploader)
  const res = await fetch(`${config.apiUrl}/api/news/upload-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || 'Image upload failed');
  }

  const data = await res.json();
  return data.url;
}

