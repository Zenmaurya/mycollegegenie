import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
/**
 * userService.ts — Backend API version (MySQL/Express + Supabase Auth)
 * Replaces Firebase Firestore with Express REST API.
 */
import { supabase } from '../supabase';



// ── GET /api/users/me OR /api/users/public/:id ───────────────────────────────────────
export const getUserProfile = async (uid?: string) => {
  try {
    if (uid) {
      return await fetchWithAuth(`/api/users/public/${uid}`);
    } else {
      // FIX: Use getUser() instead of getSession() — getUser() verifies the token
      // is still valid with Supabase server and auto-refreshes if needed.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return await fetchWithAuth('/api/users/me');
    }
  } catch (error) {
    console.error('[userService] getUserProfile error:', error);
    return null;
  }
};

// ── PATCH /api/users/me ─────────────────────────────────────
export const updateUserProfile = async (data: {
  displayName?: string;
  college?: string;
  course?: string;
  batchYear?: number;
  photoUrl?: string;
}) => {
  try {
    // FIX: getUser() auto-refreshes expired token; getSession() does not
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return await fetchWithAuth('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        displayName: data.displayName,
        college: data.college,
        course: data.course,
        batchYear: data.batchYear,
        // Note: photoUrl is updated via /api/users/me/avatar endpoint, not here
      }),
    });
  } catch (error) {
    console.error('[userService] updateUserProfile error:', error);
    throw error;
  }
};

/**
 * createUserProfile — called after signup.
 * The backend auto-creates the user via Supabase webhook (users.js POST /sync).
 * This function just updates the profile with extra data (college, course).
 */
export const createUserProfile = async (
  _authProviderUser: any,
  additionalData?: { college?: string; course?: string }
) => {
  try {
    // FIX: getUser() auto-refreshes expired token; getSession() does not
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    if (additionalData && Object.keys(additionalData).length > 0) {
      return await fetchWithAuth('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          college: additionalData.college,
          course: additionalData.course,
        }),
      });
    }
    return await fetchWithAuth('/api/users/me');
  } catch (error) {
    console.error('[userService] createUserProfile error:', error);
    return null;
  }
};

// ── GET /api/users ── (Admin Only)
export const getUsers = async (limit: number = 100, offset: number = 0) => {
  return await fetchWithAuth(`/api/users?limit=${limit}&offset=${offset}`);
};

// ── PATCH /api/users/:id/role ── (Admin Only)
export const updateUserRole = async (userId: string, role: 'user' | 'moderator' | 'admin') => {
  return await fetchWithAuth(`/api/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
};
