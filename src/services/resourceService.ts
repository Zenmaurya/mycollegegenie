/**
 * resourceService.ts — Backend API version (MySQL/Express + Cloudinary/R2)
 * Replaces Firebase Firestore and Firebase Storage.
 */
import { fetchWithAuth, safeJsonParse, getFreshToken } from '../lib/apiClient';
import { supabase } from '../supabase';
import { config } from '../lib/config';
import { Resource, ResourceType } from '../types';

// FIX Bug #5: OperationType was referenced throughout this file but never declared.
// This is a leftover from the Firebase → Express refactor. Without it, every catch
// block that calls handleFirestoreError() throws ReferenceError, masking the real error.
enum OperationType {
  CREATE = 'create',
  READ   = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

// Legacy error handler shim (for callers that still use this from newsService import)
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('[resourceService] API Error:', { operationType, path, error: msg });
  throw error instanceof Error ? error : new Error(msg);
}

/**
 * Upload a file to the backend (PDF → Cloudflare R2, images → Cloudinary).
 *
 * CRIT-05 FIX: Removed 'new Promise(async executor)' anti-pattern.
 * The old code wrapped an async function in a Promise constructor, which means:
 *  - Any unhandled throw inside async code left the Promise permanently pending
 *  - This caused memory leaks and upload spinners that never stopped
 *
 * FIX: Async work (token fetch) happens BEFORE creating the XHR Promise.
 * The Promise constructor only wraps the XHR (which is inherently callback-based).
 */
export const uploadFile = async (
  file: File,
  folder: 'pyqs' | 'notes' | 'books' | 'resources' | 'exchange' | 'events' | 'avatars' | 'pg' = 'resources',
  meta: { subject?: string; course?: string; subjectCode?: string } = {},
  onProgress?: (percent: number) => void,
  _isRetry = false
): Promise<string> => {
  // Step 1: Get a fresh token BEFORE creating the XHR Promise.
  // If this fails, it throws normally — no leaked Promise.
  const token = await getFreshToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in to upload files.');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Build query string — backend uses these to name the R2 file
  const params = new URLSearchParams({ folder });
  if (meta.course)      params.set('course',      meta.course);
  if (meta.subject)     params.set('subject',     meta.subject);
  if (meta.subjectCode) params.set('subjectCode', meta.subjectCode);

  // BUG FIX: was using import.meta.env.VITE_API_URL directly — now uses config.apiUrl
  // so it respects the same centralised config as the rest of the app.
  const url = `${config.apiUrl}/api/resources/upload?${params.toString()}`;

  // Step 2: Wrap ONLY the XHR in a Promise (it's callback-based, not async).
  // No async work happens inside the Promise constructor — safe pattern.
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data.url) {
            // Upload "succeeded" but server returned no URL — log for debugging
            console.error('[uploadFile] Server responded 200 but no URL in response:', xhr.responseText);
            reject(new Error('Upload completed but server did not return a file URL. Contact admin.'));
          } else {
            resolve(data.url);
          }
        } catch {
          reject(new Error('Failed to parse upload response from server.'));
        }
      } else {
        try {
          // If 401 and not already a retry, force refresh session and retry once!
          if (xhr.status === 401 && !_isRetry) {
            console.warn('[uploadFile] Got 401 on file upload, force-refreshing session and retrying...');
            supabase.auth.refreshSession()
              .then(({ data: { session: refreshed } }) => {
                if (refreshed?.access_token) {
                  uploadFile(file, folder, meta, onProgress, true)
                    .then(resolve)
                    .catch(reject);
                } else {
                  reject(new Error('Session expired. Please sign in again.'));
                }
              })
              .catch(err => {
                console.error('[uploadFile] Session refresh failed on retry:', err);
                reject(new Error('Authentication failed. Please sign in again.'));
              });
            return;
          }

          const err = JSON.parse(xhr.responseText);
          const msg = err.error || `Upload failed with status ${xhr.status}`;
          console.error('[uploadFile] HTTP', xhr.status, ':', msg);
          reject(new Error(msg));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}. Please try again.`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Check your connection.'));
    xhr.timeout = 120_000; // 2 minute timeout for large files

    xhr.send(formData);
  });
};


function safeArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ── Normalise backend row → Resource shape ──────────────────
function normaliseResource(item: any): Resource {
  const uploadDateStr = item.upload_date || item.uploadDate || new Date(item.created_at || Date.now()).toISOString().split('T')[0];
  const ratings = safeArray(item.ratings);
  const averageRating = ratings.length > 0 
    ? parseFloat((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)) 
    : 0;

  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    type: item.type as ResourceType,
    course: item.course || '',
    semester: Number(item.semester) || 0,
    subCategory: item.sub_category || item.subCategory || '',
    subjectCode: item.subject_code || item.subjectCode || '',
    tags: safeArray(item.tags),
    link: item.link || item.file_url || item.fileUrl || '',
    directDownloadLink: item.direct_download_link || item.directDownloadLink || '',
    uploadDate: uploadDateStr,
    uploadTimestamp: new Date(uploadDateStr).getTime(),
    uploader: item.uploader || item.uploader_name || item.uploaderName || '',
    uploaderId: item.uploader_id || item.uploaderId || '',
    uploaderRole: item.uploader_role || item.uploaderRole || 'user',
    isApproved: Boolean(item.is_approved),
    ratings,
    averageRating,
    reports: safeArray(item.reports),
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
      timeoutMs: 30_000, // BUG FIX: was default 15s — increased to 30s because
                          // server may be slow after a large file upload completes.
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
