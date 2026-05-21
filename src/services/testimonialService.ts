import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
/**
 * testimonialService.ts — Backend API version (MySQL/Express)
 * Replaces Firebase Firestore. Falls back to static defaults if API unavailable.
 */
import { supabase } from '../supabase';
import { Testimonial } from '../types';
import { toast } from 'sonner';



// ── GET /api/testimonials ───────────────────────────────────
export const getTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const data = await fetchWithAuth('/api/testimonials');
    const results = (Array.isArray(data) ? data : []).map((item: any) => ({
      id: item.id,
      name: item.name,
      handle: item.handle || '',
      image: item.image || '',
      text: item.text,
      createdAt: item.created_at || new Date().toISOString(),
    })) as Testimonial[];

    // Fall back to defaults if backend returns empty (e.g. table not seeded yet)
    if (results.length === 0) {
      return DEFAULT_DATA.map((d, i) => ({ ...d, id: `default-${i}`, createdAt: new Date().toISOString() }));
    }
    return results;
  } catch (error) {
    console.warn('[testimonialService] API unavailable, using defaults:', error);
    return DEFAULT_DATA.map((d, i) => ({ ...d, id: `default-${i}`, createdAt: new Date().toISOString() }));
  }
};

// ── POST /api/testimonials ──────────────────────────────────
export const addTestimonial = async (testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<void> => {
  try {
    await fetchWithAuth('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(testimonial),
    });
  } catch (error) {
    console.error('[testimonialService] addTestimonial error:', error);
    throw error;
  }
};

// ── PATCH /api/testimonials/:id ─────────────────────────────
export const updateTestimonial = async (id: string, updates: Partial<Testimonial>): Promise<void> => {
  try {
    await fetchWithAuth(`/api/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    toast.success('Testimonial updated successfully');
  } catch (error) {
    console.error('[testimonialService] updateTestimonial error:', error);
    toast.error('Failed to update testimonial');
    throw error;
  }
};

// ── DELETE /api/testimonials/:id ────────────────────────────
export const deleteTestimonial = async (id: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/testimonials/${id}`, { method: 'DELETE' });
    toast.success('Testimonial deleted successfully');
  } catch (error) {
    console.error('[testimonialService] deleteTestimonial error:', error);
    toast.error('Failed to delete testimonial');
    throw error;
  }
};
