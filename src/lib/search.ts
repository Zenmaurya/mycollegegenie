export const SEARCH_TABS = [
  { id: 'all', label: 'All' }, { id: 'notes', label: 'Notes' }, { id: 'societies', label: 'Societies' }, { id: 'people', label: 'People' },
  { id: 'stays', label: 'Stays' }, { id: 'exchange', label: 'Exchange' }, { id: 'events', label: 'Events' }, { id: 'jobs', label: 'Jobs' },
];
export const parseTab = (v: string | null) => SEARCH_TABS.find((t) => t.id === v)?.id ?? 'all';

// 60 is the jobs API cap, the lowest of the list APIs apart from people (which trims to 40 itself)
export function cleanQuery(v: string | null) {
  const q = (v ?? '').trim().slice(0, 60);
  return q.length < 2 ? '' : q;
}
export const searchPath = (q: string) => (q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search');

export const addRecent = (list: string[], q: string) => [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6);

const KEY = 'mcg-recent-searches';
export function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 6) : [];
  } catch { return []; }
}
export function writeRecent(list: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private window: recent searches are only a convenience */ }
}
