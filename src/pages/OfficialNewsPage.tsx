import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { Helmet } from 'react-helmet-async';

import { getNews } from '../services/newsService';
import type { NewsItem } from '../types';
import { Skeleton } from '../components/ui/skeleton';

export function OfficialNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { debouncedSearch } = useFilters();

  const filteredNews = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return news;
    return news.filter(item => 
      (item.title || '').toLowerCase().includes(q) ||
      (item.summary || '').toLowerCase().includes(q) ||
      (item.college || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  }, [news, debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    getNews('News')
      .then(data => setNews(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="content">
      <Helmet>
        <title>College News | MyCollegeGenie</title>
      </Helmet>

      <div className="flex justify-end">
        <button className="btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{marginRight: 6}}><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>
          Filter by college
        </button>
      </div>

      {isLoading ? (
        Array(5).fill(0).map((_, i) => (
          <div className="news-item border border-gray-100 dark:border-gray-800" key={i}>
            <Skeleton className="news-thumb h-full w-[200px] rounded-none" />
            <div className="news-body flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-1/2" />
              <div className="news-meta mt-auto pt-2">
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))
      ) : filteredNews.length === 0 ? (
        <div className="mt-8 text-center text-ink-soft">No news items found.</div>
      ) : (
        filteredNews.map(item => (
          <div className="news-item" key={item.id}>
            <div className="news-thumb">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit'}} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              )}
            </div>
            <div className="news-body">
              <span className="news-tag">{item.category}</span>
              <h3>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.title}</a> : item.title}</h3>
              <p>{item.summary}</p>
              <div className="news-meta">
                <span>Posted by {item.submitted_by_name || 'Admin'}</span>
                <span>{item.date}</span>
                {item.college && <span> • {item.college}</span>}
              </div>
            </div>
          </div>
        ))
      )}

    </div>
  );
}
