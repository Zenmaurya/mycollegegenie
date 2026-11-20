import { fetchWithAuth } from '../lib/apiClient';
import { feedQuery, mapFeedPage, type FeedPage } from '../lib/feed';
import type { FeedTab } from '../types';

/** One page of the home feed. Throws on network/server error so the page can show Retry. */
export async function getFeedPage(p: { tab: FeedTab; cursor?: string; topic?: string; course?: string }): Promise<FeedPage> {
  return mapFeedPage(await fetchWithAuth(`/api/feed/foryou?${feedQuery(p)}`));
}
