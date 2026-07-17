import { fetchWithAuth } from '../lib/apiClient';

export interface FeedItem {
  id: string;
  feedType: 'forum_post' | 'news' | 'event';
  feedScore: number;
  created_at: string;
  // Dynamic fields based on type
  title: string;
  content?: string;
  summary?: string;
  course?: string;
  topic?: string;
  college?: string;
  venue?: string;
  eligibility?: string;
  image_url?: string;
  author_name?: string;
  upvotes?: string[];
  downvotes?: string[];
  comment_count?: number;
  date?: string; // used in news/events
}

export const FeedService = {
  getForYouFeed: async (tab: 'foryou' | 'trending' | 'recent' = 'foryou', searches: string[] = []): Promise<FeedItem[]> => {
    try {
      const searchParam = searches.length ? `&searches=${encodeURIComponent(searches.join(','))}` : '';
      const data = await fetchWithAuth(`/api/feed/foryou?tab=${tab}${searchParam}`);
      return data;
    } catch (error) {
      console.error('[FeedService] getForYouFeed error:', error);
      return [];
    }
  },

  interact: async (itemType: string, itemId: string, interactionType: 'view' | 'click' | 'upvote' | 'comment'): Promise<void> => {
    try {
      await fetchWithAuth('/api/feed/interact', {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId, interactionType })
      });
    } catch (error) {
      console.error('[FeedService] interact error:', error);
    }
  }
};
