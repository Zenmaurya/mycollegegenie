import { fetchWithAuth } from '../lib/apiClient';
import { mapJob, type AppStatus, type Job, type JobKind, type jobDraftToPayload } from '../lib/jobs';

export interface JobFilters { kind?: string; mode?: string; paid?: string; verified?: string; q?: string }
export interface JobsPage { items: Job[]; nextCursor: string | null }
export interface Applicant { id: string; note: string; resume_url: string; target: string | null; status: AppStatus; created_at: string; user_id: string; display_name: string; photo_url: string | null; username: string | null }
export interface MyApplication { id: string; status: AppStatus; target: string | null; created_at: string; job_id: string; kind: JobKind; title: string; company: string }
export interface JobsMe { workEmail: { email: string; domain: string } | null; pendingEmail: string | null; resumeUrl: string | null }

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v);
  return p.toString();
};
const enc = encodeURIComponent;
const post = (url: string, body: unknown, method = 'POST') => fetchWithAuth(url, { method, body: JSON.stringify(body) });

export const JobsService = {
  list: async (filters: JobFilters = {}, cursor?: string): Promise<JobsPage> => {
    const d = await fetchWithAuth(`/api/jobs?${qs({ ...filters, cursor })}`);
    return { items: (d.items ?? []).map(mapJob), nextCursor: d.nextCursor ?? null };
  },
  get: async (id: string): Promise<Job> => mapJob(await fetchWithAuth(`/api/jobs/${enc(id)}`)),
  create: (body: ReturnType<typeof jobDraftToPayload>): Promise<{ id: string; live: boolean }> => post('/api/jobs', body),
  setClosed: (id: string, isClosed: boolean): Promise<{ ok: true }> => post(`/api/jobs/${enc(id)}`, { is_closed: isClosed }, 'PATCH'),
  remove: (id: string): Promise<{ ok: true }> => fetchWithAuth(`/api/jobs/${enc(id)}`, { method: 'DELETE' }),
  mine: async (): Promise<Job[]> => (await fetchWithAuth('/api/jobs/mine')).map(mapJob),
  applied: (): Promise<MyApplication[]> => fetchWithAuth('/api/jobs/applied'),
  apply: (id: string, body: { note: string; resume_url: string; target?: string }): Promise<{ ok: true }> => post(`/api/jobs/${enc(id)}/apply`, body),
  applications: (id: string): Promise<Applicant[]> => fetchWithAuth(`/api/jobs/${enc(id)}/applications`),
  decide: (appId: string, status: 'accepted' | 'declined'): Promise<{ ok: true; sessionId: string | null }> => post(`/api/jobs/applications/${enc(appId)}`, { status }, 'PATCH'),
  me: (): Promise<JobsMe> => fetchWithAuth('/api/jobs/me'),
  sendCode: (email: string): Promise<{ ok: true }> => post('/api/jobs/work-email', { email }),
  verifyCode: (code: string): Promise<{ ok: true; domain: string }> => post('/api/jobs/work-email/verify', { code }),
  // Staff only.
  pending: async (cursor?: string): Promise<JobsPage> => {
    const d = await fetchWithAuth(`/api/jobs/admin/pending?${qs({ cursor })}`);
    return { items: (d.items ?? []).map(mapJob), nextCursor: d.nextCursor ?? null };
  },
  approve: (id: string): Promise<{ ok: true }> => post(`/api/jobs/${enc(id)}/approve`, {}, 'PATCH'),
};
