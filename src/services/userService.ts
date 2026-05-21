/**
 * userService.ts — Backend API version (MySQL/Express + Supabase Auth)
 * Replaces Firebase Firestore with Express REST API.
 */
import { supabase } from '../supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';

// ── Shared auth-aware fetch helper ─────────────────────────
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// ── GET /api/users/me OR /api/users/public/:id ───────────────────────────────────────
export const getUserProfile = async (uid?: string) => {
  try {
    if (uid) {
      return await fetchWithAuth(`/api/users/public/${uid}`);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

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
