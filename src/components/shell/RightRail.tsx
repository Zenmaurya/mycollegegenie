import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ClipboardList, Newspaper, Sparkles, TrendingUp } from 'lucide-react';
import type { NewsItem } from '../../types';
import { FOOTER_LINKS } from './navItems';
import { getFeedPage } from '../../services/feedService';
import { NotesService } from '../../services/notesService';
import { uniqueByTitle } from '../../lib/feed';
import { courseShort } from '../../lib/notes';
import { useUpcomingEvents } from '../feed/EventsStrip';
import { dateBlock, eventHref } from '../../lib/events';

function RailCard({ title, icon, to, children }: { title: string; icon: React.ReactNode; to: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">{icon}{title}</h2>
        <Link to={to} className="text-[13px] font-semibold text-brand">See all</Link>
      </div>
      {children}
    </section>
  );
}

export function RightRail({ news }: { news: NewsItem[] }) {
  const events = useUpcomingEvents().slice(0, 3);
  const latest = uniqueByTitle(news.filter((n) => n.category !== 'Event'), (n) => n.title).slice(0, 4);
  const trending = useQuery({
    queryKey: ['rail-trending'],
    queryFn: () => getFeedPage({ tab: 'trending' }),
    staleTime: 5 * 60_000,
    select: (p) => p.items.flatMap((it) => (it.kind === 'post' ? [it.post] : [])).slice(0, 4),
  }).data ?? [];
  const pyqs = useQuery({
    queryKey: ['rail-top-pyqs'],
    queryFn: () => NotesService.list({ type: 'PYQ', sort: 'downloads' }, undefined, 4),
    staleTime: 5 * 60_000,
  }).data?.items ?? [];

  return (
    <div className="space-y-4">
      {trending.length > 0 && (
        <RailCard title="Trending on MCG" icon={<TrendingUp className="h-4 w-4 text-brand" aria-hidden />} to="/">
          <ul className="divide-y divide-line">
            {trending.map((p) => (
              <li key={p.id} className="py-2.5 first:pt-0 last:pb-0">
                <Link to={`/post/${p.id}`} className="group block">
                  <p className="text-[12px] text-ink-muted">{p.authorName || 'Student'}{p.course ? ` · ${p.course}` : ''}</p>
                  <p className="line-clamp-2 text-[15px] font-semibold text-ink group-hover:underline">{p.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-muted"><Sparkles className="h-3 w-3" aria-hidden />{p.upvotes.length} · {p.commentCount} comments</p>
                </Link>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      {pyqs.length > 0 && (
        <RailCard title="Most downloaded PYQs" icon={<ClipboardList className="h-4 w-4 text-highlight" aria-hidden />} to="/notes?type=PYQ&sort=downloads">
          <ul className="space-y-2.5">
            {pyqs.map((n) => (
              <li key={n.id}>
                <Link to={`/notes/${n.id}`} className="group flex gap-3">
                  {n.thumbnailUrl
                    ? <img src={n.thumbnailUrl} alt="" loading="lazy" className="h-14 w-12 shrink-0 rounded-md border border-line bg-white object-cover object-top" />
                    : <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-md bg-highlight/15 text-highlight"><ClipboardList className="h-5 w-5" aria-hidden /></span>}
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:underline">{n.title}</span>
                    <span className="block truncate text-[12px] text-ink-muted">{[n.course && courseShort(n.course), n.semester ? `Sem ${n.semester}` : '', n.downloads ? `${n.downloads} downloads` : ''].filter(Boolean).join(' · ')}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </RailCard>
      )}
      {events.length > 0 && (
        <RailCard title="Upcoming events" icon={<Calendar className="h-4 w-4 text-brand-accent" aria-hidden />} to="/events">
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link to={eventHref(e.id)} className="block">
                  <p className="line-clamp-2 text-[15px] font-semibold text-ink">{e.title}</p>
                  <p className="text-[13px] text-ink-muted">{[`${dateBlock(e.starts_at).day} ${dateBlock(e.starts_at).month}`, e.community.college_short || e.community.name].join(' · ')}</p>
                </Link>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      {latest.length > 0 && (
        <RailCard title="College updates" icon={<Newspaper className="h-4 w-4 text-brand" aria-hidden />} to="/news">
          <ul className="space-y-3">
            {latest.map((n, i) => (
              <li key={n.id || i}>
                <a href={n.url || '/news'} target={n.url ? '_blank' : undefined} rel={n.url ? 'noopener noreferrer' : undefined} className="group block">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink group-hover:underline">{n.title}</p>
                  <p className="text-[12px] text-ink-muted">{[n.college, n.date].filter(Boolean).join(' · ')}</p>
                </a>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      <nav aria-label="Footer" className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[13px] text-ink-muted">
        {FOOTER_LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>)}
        <span>© MyCollegeGenie</span>
      </nav>
    </div>
  );
}
