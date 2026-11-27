import { Link } from 'react-router-dom';
import { ExternalLink, Newspaper } from 'lucide-react';
import type { NewsItem } from '../../types';
import { mentionsPastAcademicCycle } from '../../lib/news';

// The SOL scraper fills summary with the same boilerplate on every notice; hide it.
const BOILERPLATE = /^official notice from /i;

function host(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

export function NewsCard({ item }: { item: NewsItem }) {
  const summary = item.summary && !BOILERPLATE.test(item.summary) ? item.summary : '';
  const site = item.url ? host(item.url) : null;
  const linkClass = 'mt-2 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand';

  return (
    <article className="rounded-card bg-surface p-4 shadow-card">
      <p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">
          <Newspaper className="h-3.5 w-3.5" aria-hidden />{item.college || 'News'}
        </span>
        {item.date && <time dateTime={item.date}>{item.dateSource === 'listed' ? `Added ${item.date}` : item.dateSource === 'notice' ? `Notice date ${item.date}` : item.date}</time>}
        {mentionsPastAcademicCycle(item.title) && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 font-semibold text-ink">Past academic cycle</span>
        )}
      </p>
      <h3 className="line-clamp-3 text-[16px] font-semibold leading-snug text-ink">{item.title}</h3>
      {summary && <p className="mt-1 line-clamp-2 text-[15px] text-ink-muted">{summary}</p>}
      {item.url ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {site ? `Open on ${site}` : 'Read more'} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      ) : (
        <Link to="/news" className={linkClass}>Read more →</Link>
      )}
    </article>
  );
}
