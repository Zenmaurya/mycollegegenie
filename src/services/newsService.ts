import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
/**
 * newsService.ts — Backend API version (MySQL/Express)
 * Replaces Firebase Firestore with the Express REST API.
 */
import { supabase } from '../supabase';
import { News } from '../types';



// ── GET /api/news ───────────────────────────────────────────
export const getNews = async (
  category?: 'News' | 'Event',
  college?: string,
  includeUnapproved = false
): Promise<News[]> => {
  try {
    const params = new URLSearchParams({ limit: '200' });
    if (category) params.set('category', category);
    if (college) params.set('college', college);
    if (includeUnapproved) params.set('includeUnapproved', 'true');

    const data = await fetchWithAuth(`/api/news?${params}`);

    // Normalise backend shape → frontend NewsItem shape
    return (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || item.content || '',
      category: item.category || 'News',
      date: item.date || new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      college: item.college || '',
      url: item.url || '',
      imageUrl: item.image_url || item.imageUrl || '',
      venue: item.venue || '',
      eligibility: item.eligibility || 'All',
      description: item.description || item.summary || '',
      createdAt: item.created_at || new Date().toISOString(),
      isApproved: Boolean(item.is_approved),
    } as News));
  } catch (error) {
    const isConnRefused = error instanceof TypeError && error.message.includes('fetch');
    if (isConnRefused) {
      console.warn('[newsService] Backend unavailable — falling back to mock data. Start backend with `npm run dev`.');
    } else {
      console.error('[newsService] getNews error:', error);
    }

    return [];
  }
};

// ── POST /api/news ──────────────────────────────────────────
export const addNews = async (newsData: Omit<News, 'id' | 'createdAt'>) => {
  try {
    return await fetchWithAuth('/api/news', {
      method: 'POST',
      body: JSON.stringify({
        title: newsData.title,
        summary: newsData.summary,
        category: newsData.category,
        date: newsData.date,
        college: newsData.college,
        url: newsData.url,
        image_url: (newsData as any).imageUrl || '',
        venue: (newsData as any).venue || '',
        eligibility: (newsData as any).eligibility || 'All',
        description: (newsData as any).description || newsData.summary,
      }),
    });
  } catch (error) {
    console.error('[newsService] addNews error:', error);
    throw error;
  }
};

// ── PATCH /api/news/:id ─────────────────────────────────────
export const updateNews = async (id: string, newsData: Partial<News>) => {
  try {
    const { id: _id, createdAt, ...data } = newsData as any;
    return await fetchWithAuth(`/api/news/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('[newsService] updateNews error:', error);
    throw error;
  }
};

// ── DELETE /api/news/:id ────────────────────────────────────
export const deleteNews = async (id: string) => {
  try {
    return await fetchWithAuth(`/api/news/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('[newsService] deleteNews error:', error);
    throw error;
  }
};

// ── PATCH /api/news/:id/approve ─── Admin approve news/event
export const approveNews = async (id: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/news/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_approved: true }),
    });
  } catch (error) {
    console.error('[newsService] approveNews error:', error);
    throw error;
  }
};

// ── POST /api/news (Event submission with image) ────────────
export const submitEvent = async (
  formData: { title: string; college: string; date: string; venue: string; eligibility: string; description: string; image?: File | null; imageUrl?: string }
) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not authenticated');

  let imageUrl = formData.imageUrl || '';
  // Upload poster image if provided (legacy fallback)
  if (formData.image && !imageUrl) {
    const uploadForm = new FormData();
    uploadForm.append('image', formData.image);
    const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in'}/api/news/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    });
    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url || '';
    }
  }

  return await fetchWithAuth('/api/news', {
    method: 'POST',
    body: JSON.stringify({
      title: formData.title,
      college: formData.college,
      date: formData.date,
      venue: formData.venue,
      eligibility: formData.eligibility,
      summary: formData.description,
      description: formData.description,
      category: 'Event',
      image_url: imageUrl,
      is_approved: false, // Admin must approve
    }),
  });
};
