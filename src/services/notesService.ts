import { fetchWithAuth } from '../lib/apiClient';
import { mapNote } from '../lib/notes';
import type { Resource } from '../types';

export interface NoteFilters {
  q?: string; type?: string; course?: string; semester?: number | string; subjectCode?: string;
  year?: number | string; minRating?: number | string; college?: 'mine'; sort?: 'helpful' | 'new' | 'downloads';
}
export interface NotesPage { items: Resource[]; nextCursor: string | null; total: number }
export interface NoteSections {
  topRated: Resource[]; byYear: { year: number; items: Resource[] }[];
  subjects: { code: string; title: string; count: number }[]; newThisWeek: Resource[];
}
export interface RatingResult { ratingAvg: number | null; ratingCount: number; helpfulYes: number; helpfulNo: number }
export type NoteInput = Pick<Resource, 'title' | 'description' | 'type' | 'course' | 'semester' | 'subCategory' | 'subjectCode' | 'tags' | 'link' | 'directDownloadLink' | 'thumbnailUrl' | 'pageCount' | 'year'>;

export const NotesService = {
  // sort is always sent: without sort or cursor the API returns the legacy array shape.
  list: async (filters: NoteFilters = {}, cursor?: string, limit = 24): Promise<NotesPage> => {
    const params = new URLSearchParams({ limit: String(limit) });
    for (const [k, v] of Object.entries(filters)) if (v !== undefined && v !== '') params.set(k, String(v));
    if (!params.has('sort')) params.set('sort', 'helpful');
    if (cursor) params.set('cursor', cursor);
    const d = await fetchWithAuth(`/api/resources?${params}`);
    return { items: (d.items ?? []).map(mapNote), nextCursor: d.nextCursor ?? null, total: d.total ?? 0 };
  },

  sections: async (course?: string, semester?: number): Promise<NoteSections> => {
    const params = new URLSearchParams();
    if (course) params.set('course', course);
    if (semester) params.set('semester', String(semester));
    const d = await fetchWithAuth(`/api/resources/sections?${params}`);
    return {
      topRated: (d.topRated ?? []).map(mapNote),
      byYear: (d.byYear ?? []).map((g: any) => ({ year: g.year, items: g.items.map(mapNote) })),
      subjects: d.subjects ?? [],
      newThisWeek: (d.newThisWeek ?? []).map(mapNote),
    };
  },

  get: async (id: string): Promise<Resource> => mapNote(await fetchWithAuth(`/api/resources/${encodeURIComponent(id)}`)),

  rate: (id: string, stars: number, helpful?: boolean | null): Promise<RatingResult> =>
    fetchWithAuth(`/api/resources/${encodeURIComponent(id)}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ stars, ...(helpful === undefined ? {} : { helpful }) }),
    }),

  download: async (id: string): Promise<string> =>
    (await fetchWithAuth(`/api/resources/download/${encodeURIComponent(id)}?json=1`)).url,

  create: async (input: NoteInput): Promise<string> => {
    const r = await fetchWithAuth('/api/resources', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title, description: input.description, type: input.type, course: input.course,
        semester: input.semester, subCategory: input.subCategory, subjectCode: input.subjectCode || '',
        tags: input.tags ?? [], link: input.link, directDownloadLink: input.directDownloadLink || '',
        thumbnail_url: input.thumbnailUrl ?? null, page_count: input.pageCount ?? null, year: input.year ?? null,
      }),
      timeoutMs: 30_000,
    });
    return r.id;
  },
};
