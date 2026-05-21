import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
/**
 * resourceService.ts — Backend API version (MySQL/Express + Cloudinary)
 * Replaces Firebase Firestore and Firebase Storage.
 */
import { supabase } from '../supabase';
import { Resource, ResourceType } from '../types';



// Legacy error handler shim (for callers that still use this from newsService import)
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[resourceService] API Error:', { operationType, path, error: msg });
  throw error instanceof Error ? error : new Error(msg);
}

// ── Upload file via backend (Cloudinary or R2 depending on file type) ────────────
export const uploadFile = async (
  file: File,
  folder: 'pyqs' | 'notes' | 'books' | 'resources' | 'exchange' | 'events' | 'avatars' | 'pg' = 'resources',
  meta: { subject?: string; course?: string; subjectCode?: string } = {}
): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('file', file);

    // Build query string — backend uses these to name the R2 file
    const params = new URLSearchParams({ folder });
    if (meta.course)      params.set('course',      meta.course);
    if (meta.subject)     params.set('subject',     meta.subject);
    if (meta.subjectCode) params.set('subjectCode', meta.subjectCode);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in'}/api/resources/upload?${params.toString()}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'File upload failed');
    }
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('[resourceService] uploadFile error:', error);
    throw error;
  }
};

// ── Normalise backend row → Resource shape ──────────────────
function normaliseResource(item: any): Resource {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    type: item.type as ResourceType,
    course: item.course || '',
    semester: Number(item.semester) || 0,
    subCategory: item.sub_category || item.subCategory || '',
    subjectCode: item.subject_code || item.subjectCode || '',
    tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : []),
    link: item.link || item.file_url || item.fileUrl || '',
    directDownloadLink: item.direct_download_link || item.directDownloadLink || '',
    uploadDate: item.upload_date || item.uploadDate || new Date(item.created_at || Date.now()).toISOString().split('T')[0],
    uploader: item.uploader || item.uploader_name || item.uploaderName || '',
    uploaderId: item.uploader_id || item.uploaderId || '',
    uploaderRole: item.uploader_role || item.uploaderRole || 'user',
    isApproved: Boolean(item.is_approved),
    ratings: Array.isArray(item.ratings) ? item.ratings : (typeof item.ratings === 'string' ? JSON.parse(item.ratings || '[]') : []),
    reports: Array.isArray(item.reports) ? item.reports : (typeof item.reports === 'string' ? JSON.parse(item.reports || '[]') : []),
  };
}

// ── GET /api/resources ──────────────────────────────────────
export const getResources = async (
  includeUnapproved = false,
  course?: string,
  semester?: number,
  type?: ResourceType
): Promise<Resource[]> => {
  try {
    const params = new URLSearchParams({ limit: '200' });
    if (course && course !== 'All Courses') params.set('course', course);
    if (semester) params.set('semester', String(semester));
    if (type && type !== ('All' as any)) params.set('type', type);

    const endpoint = includeUnapproved
      ? `/api/resources?${params}&includeUnapproved=true`
      : `/api/resources?${params}`;

    const data = await fetchWithAuth(endpoint);
    return (Array.isArray(data) ? data : []).map(normaliseResource);
  } catch (error) {
    const isConnRefused = error instanceof TypeError && error.message.includes('fetch');
    if (isConnRefused) {
      console.warn('[resourceService] Backend unavailable — using local data. Start the backend with `npm run dev` in the backend folder.');
    } else {
      console.error('[resourceService] getResources error:', error);
    }
    return [];
  }
};

// ── GET /api/resources/me ────────────────────────────────────
export const fetchUserResources = async (): Promise<Resource[]> => {
  try {
    const data = await fetchWithAuth('/api/resources/me');
    return (Array.isArray(data) ? data : []).map(normaliseResource);
  } catch (error) {
    console.error('[resourceService] fetchUserResources error:', error);
    return [];
  }
};

// ── POST /api/resources ───────────────────────────────────────────
export const uploadResource = async (
  resourceData: Omit<Resource, 'id' | 'ratings' | 'reports' | 'uploadDate'>
): Promise<string | undefined> => {
  try {
    const payload = {
      title: resourceData.title,
      description: resourceData.description,
      type: resourceData.type,
      course: resourceData.course,
      semester: resourceData.semester,
      subCategory: resourceData.subCategory,
      subjectCode: (resourceData as any).subjectCode || '',
      tags: Array.isArray(resourceData.tags) ? resourceData.tags : [],
      link: resourceData.link,
      directDownloadLink: resourceData.directDownloadLink || '',
      uploader: resourceData.uploader,
      uploaderId: resourceData.uploaderId || '',
    };
    const result = await fetchWithAuth('/api/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'resources');
  }
};

// ── PATCH /api/resources/:id/approve ───────────────────────
export const approveResource = async (resourceId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/resources/${resourceId}/approve`, { method: 'PATCH' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${resourceId}`);
  }
};

// ── DELETE /api/resources/:id ───────────────────────────────
export const deleteResource = async (resourceId: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/resources/${resourceId}`, { method: 'DELETE' });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `resources/${resourceId}`);
  }
};

// ── PATCH /api/resources/:id ────────────────────────────────
export const updateResource = async (resourceId: string, resourceData: Partial<Resource>): Promise<void> => {
  try {
    const { id: _id, ratings, reports, ...rest } = resourceData as any;
    const payload: any = { ...rest };
    // Convert camelCase to snake_case for backend
    if (payload.fileUrl !== undefined) { payload.file_url = payload.fileUrl; delete payload.fileUrl; }
    if (payload.thumbnailUrl !== undefined) { payload.thumbnail_url = payload.thumbnailUrl; delete payload.thumbnailUrl; }
    if (payload.subCategory !== undefined) { payload.sub_category = payload.subCategory; delete payload.subCategory; }
    if (payload.uploadDate !== undefined) { delete payload.uploadDate; }

    await fetchWithAuth(`/api/resources/${resourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${resourceId}`);
  }
};

// ── PATCH /api/resources/:id/rate ──────────────────────────
export const rateResource = async (resourceId: string, rating: number): Promise<void> => {
  try {
    await fetchWithAuth(`/api/resources/${resourceId}/rate`, {
      method: 'PATCH',
      body: JSON.stringify({ rating }),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${resourceId}`);
  }
};

// ── PATCH /api/resources/:id/report ────────────────────────
export const reportResource = async (resourceId: string, reason: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/resources/${resourceId}/report`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${resourceId}`);
  }
};
