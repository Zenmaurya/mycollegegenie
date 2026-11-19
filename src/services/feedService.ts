import { fetchWithAuth } from '../lib/apiClient';
import { mapFeedItem } from '../lib/feed';
import type { FeedItem, FeedTab } from '../types';

/** Home feed (forum posts + news + events). Throws on network/server error so the page can show Retry. */
export async function getFeed(tab: FeedTab): Promise<FeedItem[]> {
  const data = await fetchWithAuth(`/api/feed/foryou?tab=${tab}`);
  if (!Array.isArray(data)) return [];
  return data.map(mapFeedItem).filter((item): item is FeedItem => item !== null);
}
