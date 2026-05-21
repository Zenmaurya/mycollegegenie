import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
/**
 * pgService.ts — Backend API version (MySQL/Express)
 * Replaces Firebase Firestore + Firebase Auth with Express REST API + Supabase Auth.
 */
import { supabase } from '../supabase';
import { PGListing } from '../types';



// ── Normalise backend row → PGListing shape ─────────────────
function normaliseListing(item: any): PGListing {
  let parsedImages: string[] = [];
  if (typeof item.images === 'string') {
    try { parsedImages = JSON.parse(item.images); } catch(e){}
  } else if (Array.isArray(item.images)) {
    parsedImages = item.images;
  }

  return {
    id: item.id,
    college: item.college || '',
    location: item.location || '',
    budget: item.budget || '',
    gender: (item.gender as 'Male' | 'Female' | 'Any') || 'Any',
    description: item.description || '',
    images: parsedImages,
    socialLink: item.social_link || item.socialLink || '',
    authorId: item.author_id || item.authorId || '',
    authorName: item.author_name || item.authorName || 'Anonymous',
    authorPhoto: item.author_photo || item.authorPhoto || '',
    createdAt: item.created_at || item.createdAt || new Date().toISOString(),
  };
}

// ── GET /api/pg ─────────────────────────────────────────────
/**
 * getPGListings — mimics the old Firebase onSnapshot signature.
 * Calls the REST API once, invokes callback, returns a no-op unsubscribe.
 * For real-time updates, call this inside a polling interval or manually refetch.
 */
export const getPGListings = (
  callback: (listings: PGListing[]) => void,
  college?: string,
  gender?: string,
  onError?: (err: Error) => void
): (() => void) => {
  const params = new URLSearchParams({ limit: '100' });
  if (college) params.set('college', college);
  if (gender && gender !== 'Any') params.set('gender', gender);

  fetchWithAuth(`/api/pg?${params}`)
    .then((data: any[]) => {
      callback((Array.isArray(data) ? data : []).map(normaliseListing));
    })
    .catch((err) => {
      console.error('[pgService] getPGListings error:', err);
      if (onError) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
      // Do NOT call callback([]) — that would show "No listings found" on error
    });

  // Return no-op unsubscribe (compatible with old onSnapshot return value)
  return () => {};
};

// ── POST /api/pg ────────────────────────────────────────────
export const createPGListing = async (
  listingData: Omit<PGListing, 'id' | 'authorId' | 'authorName' | 'authorPhoto' | 'createdAt'>
): Promise<string | undefined> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated to post a listing.');

  try {
    const result = await fetchWithAuth('/api/pg', {
      method: 'POST',
      body: JSON.stringify({
        college: listingData.college,
        location: listingData.location,
        budget: listingData.budget,
        gender: listingData.gender,
        description: listingData.description,
        socialLink: listingData.socialLink,
        images: listingData.images || [],
      }),
    });
    return result.id;
  } catch (error) {
    console.error('[pgService] createPGListing error:', error);
    throw error;
  }
};

// ── DELETE /api/pg/:id ──────────────────────────────────────
export const deletePGListing = async (listingId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/pg/${listingId}`, { method: 'DELETE' });
  } catch (error) {
    console.error('[pgService] deletePGListing error:', error);
    throw error;
  }
};

// ── PATCH /api/pg/:id ───────────────────────────────────────
export const updatePGListing = async (listingId: string, listingData: Partial<PGListing>): Promise<void> => {
  try {
    const { id: _id, authorId, authorName, authorPhoto, createdAt, ...data } = listingData as any;
    await fetchWithAuth(`/api/pg/${listingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('[pgService] updatePGListing error:', error);
    throw error;
  }
};

// ── Helper: get current Supabase user (replaces auth.currentUser) ──
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
