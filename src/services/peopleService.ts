import { fetchWithAuth } from '../lib/apiClient';
import { mapPerson, mapRelation, type Person, type Relation } from '../lib/people';

// fetchWithAuth caches GETs for 30s; lists change on every tap, so every GET carries a unique `_`.
const fresh = (path: string) => `${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
const enc = encodeURIComponent;
const send = (method: 'POST' | 'DELETE', path: string) => fetchWithAuth(`/api/people${path}`, { method });
const relation = async (p: Promise<any>): Promise<Relation> => mapRelation((await p).relation);
const cards = async (p: Promise<any>): Promise<Person[]> => (await p).items.map(mapPerson);

export type ListName = 'followers' | 'following' | 'connections';

export const PeopleService = {
  follow: (id: string) => relation(send('POST', `/follow/${enc(id)}`)),
  unfollow: (id: string) => send('DELETE', `/follow/${enc(id)}`),
  connect: (id: string) => relation(send('POST', `/connect/${enc(id)}`)),
  accept: (id: string) => relation(send('POST', `/connect/${enc(id)}/accept`)),
  /** cancel, ignore and remove are the same silent delete */
  disconnect: (id: string) => send('DELETE', `/connect/${enc(id)}`),

  requests: () => cards(fetchWithAuth(fresh('/api/people/requests'))),
  suggestions: () => cards(fetchWithAuth(fresh('/api/people/suggestions'))),
  search: (q: string) => cards(fetchWithAuth(fresh(`/api/people/search?q=${enc(q)}`))),
  list: async (username: string, list: ListName, cursor?: string): Promise<{ items: Person[]; nextCursor: string | null }> => {
    const d = await fetchWithAuth(fresh(`/api/people/${enc(username)}/${list}${cursor ? `?cursor=${enc(cursor)}` : ''}`));
    return { items: d.items.map(mapPerson), nextCursor: d.nextCursor ?? null };
  },
};
