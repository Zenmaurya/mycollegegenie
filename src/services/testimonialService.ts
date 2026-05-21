/**
 * testimonialService.ts — Backend API version (MySQL/Express)
 * Replaces Firebase Firestore. Falls back to static defaults if API unavailable.
 */
import { supabase } from '../supabase';
import { Testimonial } from '../types';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';

// ── Static fallback data (shown if API not yet set up) ─────
const DEFAULT_DATA: Omit<Testimonial, 'id' | 'createdAt'>[] = [
  {
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    name: "Aarav Yadav",
    handle: "@aarav_du",
    text: "MyCollegeGenie made preparing for my final semester exams an absolute breeze. The notes and PYQs are totally game-changing!"
  },
  {
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    name: "Riya Patel",
    handle: "@riya_sgtb",
    text: "Found my PG partner in just 2 days! The community here is so helpful and genuine. Highly recommend for all freshers."
  },
  {
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60",
    name: "Kabir Singh",
    handle: "@kabir_hindu",
    text: "The event section is incredible — I never miss a fest now. MyCollegeGenie is the only app every college student needs!"
  },
  {
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    name: "Ananya Desai",
    handle: "@ananya_srcc",
    text: "The forum is super active and the study resources are top quality. Best platform for college students!"
  }
];

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
