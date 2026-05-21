import { fetchWithAuth, safeJsonParse } from '../lib/apiClient';
import { supabase } from '../supabase';



export interface Contributor {
  id: string;
  category: 'core_team' | 'feature_contributor' | 'resource_contributor' | 'wall_of_fame';
  name: string;
  role: string;
  image: string;
  bio: string;
  contributions: number;
  badges: string[];
  social_linkedin: string;
  social_instagram: string;
  social_github: string;
  is_approved: number;
  created_at: string;
}

export async function getContributors(): Promise<Contributor[]> {
  try {
    const data = await fetchWithAuth('/api/contributors');
    return data.map((c: any) => ({
      ...c,
      badges: typeof c.badges === 'string' ? JSON.parse(c.badges || '[]') : (c.badges || [])
    }));
  } catch (err) {
    console.error('Failed to get contributors', err);
    return [];
  }
}

export async function getAllContributorsAdmin(): Promise<Contributor[]> {
  try {
    const data = await fetchWithAuth('/api/contributors/all');
    return data.map((c: any) => ({
      ...c,
      badges: typeof c.badges === 'string' ? JSON.parse(c.badges || '[]') : (c.badges || [])
    }));
  } catch (err) {
    console.error('Failed to get all contributors', err);
    throw err;
  }
}

export async function addContributor(data: Partial<Contributor>): Promise<string> {
  try {
    const result = await fetchWithAuth('/api/contributors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.id;
  } catch (err) {
    console.error('Failed to add contributor', err);
    throw err;
  }
}

export async function updateContributor(id: string, updates: Partial<Contributor>): Promise<void> {
  try {
    await fetchWithAuth(`/api/contributors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.error('Failed to update contributor', err);
    throw err;
  }
}

export async function deleteContributor(id: string): Promise<void> {
  try {
    await fetchWithAuth(`/api/contributors/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete contributor', err);
    throw err;
  }
}
