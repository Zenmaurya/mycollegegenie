import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import type { NewsItem } from '../../types';

export function NewsCard({ item }: { item: NewsItem }) {
  const meta = [item.college, item.date].filter(Boolean).join(' · ');
  const readClass = 'mt-2 inline-block text-[15px] font-semibold text-brand';

  return (
    <article className="rounded-card bg-surface p-4 shadow-card">
      <p className="mb-1 flex items-center gap-1.5 text-[13px] text-ink-muted">
        <Newspaper className="h-4 w-4 text-brand" aria-hidden />
        {meta || 'News'}
      </p>
      <h3 className="text-[17px] font-semibold leading-snug text-ink">{item.title}</h3>
      {item.summary && <p className="mt-1 line-clamp-2 text-[15px] text-ink">{item.summary}</p>}
      {item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className={readClass}>Read more →</a>
      ) : (
        <Link to="/news" className={readClass}>Read more →</Link>
      )}
    </article>
  );
}
