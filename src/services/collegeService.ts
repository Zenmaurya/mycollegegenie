import { fetchWithAuth } from '../lib/apiClient';
import { config } from '../lib/config';

export type College = { id: string; name: string; short_name: string; campus: string };

// Public endpoint: plain fetch, no auth needed.
export async function searchColleges(q: string): Promise<College[]> {
  const res = await fetch(`${config.apiUrl}/api/colleges?q=${encodeURIComponent(q.trim())}`);
  if (!res.ok) throw new Error('Could not load colleges');
  const data = await res.json();
  return data.items ?? [];
}

// Backend rejects collegeId + collegeOther together, so send only the one that is set.
export async function saveOnboarding(input: {
  collegeId?: string; collegeOther?: string; course?: string; batchYear?: number; interests?: string[];
}): Promise<void> {
  const body = { ...input };
  if (body.collegeId) delete body.collegeOther;
  else delete body.collegeId;
  await fetchWithAuth('/api/users/me/onboarding', { method: 'PATCH', body: JSON.stringify(body) });
}
