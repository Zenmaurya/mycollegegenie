import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck, Bookmark, EyeOff, Flag, Link2, MessageCircle, Repeat2, Share2, Sparkles, Wind } from 'lucide-react';
import { useComposer } from '../shell/AppShell';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { Menu } from '../ui/Menu';
import { ForumService } from '../../services/forumService';
import { topicLabel } from '../../constants';
import { applyVote, removePostFromFeed, timeAgo } from '../../lib/feed';
import type { ForumPost } from '../../types';
import { PhotoGrid } from './PhotoGrid';
import { Avatar } from '../ui/Avatar';
import { UserLink } from '../profile/UserLink';
import { ReportSheet } from '../communities/ReportSheet';

// Particle end offsets (px) for the reaction effects.
const SPARK_DIRS = [[0, -24], [17, -17], [24, 0], [17, 15], [-17, 15], [-24, 0], [-17, -17]];
const POOF_DIRS = [[-10, -20], [0, -28], [10, -20], [-4, -12], [6, -14]];

function PostCardImpl({ post, isSaved, onToggleSave }: { post: ForumPost; isSaved: boolean; onToggleSave: (id: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reporting, setReporting] = useState(false);
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { open: openComposer } = useComposer();
  const [fx, setFx] = useState<{ kind: 'spark' | 'poof'; n: number } | null>(null);
  const uid = user?.id;
  // ✨ Spark = MCG's one positive reaction (stored as an upvote); downvotes are no longer shown
  const sparks = post.upvotes.length;
  const sparked = !!uid && post.upvotes.includes(uid);
  const poofed = !!uid && post.downvotes.includes(uid);
  const detailUrl = `/post/${post.id}`;

  const vote = async (dir: 'up' | 'down') => {
    if (!uid) {
      toast('Log in to vote', {
        action: {
          label: 'Log in',
          onClick: () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }),
        },
      });
      return;
    }
    // Play the effect only when turning a reaction on; n restarts the animation on repeat taps.
    if (dir === 'up' ? !sparked : !poofed) setFx((f) => ({ kind: dir === 'up' ? 'spark' : 'poof', n: (f?.n ?? 0) + 1 }));
    const snapshot = qc.getQueriesData({ queryKey: ['feed'] });
    qc.setQueriesData({ queryKey: ['feed'] }, (d: any) => applyVote(d, post.id, uid, dir));
    try {
      if (dir === 'up') await ForumService.toggleUpvote(post.id, uid, post.upvotes.includes(uid));
      else await ForumService.toggleDownvote(post.id, uid, post.downvotes.includes(uid));
    } catch {
      snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Couldn't vote. Please try again.");
    }
  };

  const notInterested = async () => {
    if (!uid) { navigate('/login', { state: { from: { pathname: location.pathname } } }); return; }
    const snapshot = qc.getQueriesData({ queryKey: ['feed'] });
    qc.setQueriesData({ queryKey: ['feed'] }, (d: any) => removePostFromFeed(d, post.id));
    try {
      await ForumService.hidePost(post.id);
      toast("Post hidden. You'll see less like this.", {
        action: {
          label: 'Undo',
          onClick: () => { ForumService.unhidePost(post.id).catch(() => {}).finally(() => qc.invalidateQueries({ queryKey: ['feed'] })); },
        },
      });
    } catch (e) {
      snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't hide this post. Please try again.");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${detailUrl}`;
    const data = { title: post.title, text: `${post.title} · MyCollegeGenie`, url };
    if (navigator.share && navigator.canShare?.(data)) {
      try { await navigator.share(data); } catch { /* user cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  // Repost = a new post of your own that quotes this one and links back to it.
  const repost = () => {
    if (!uid) { navigate('/login', { state: { from: { pathname: location.pathname } } }); return; }
    const body = (post.content || '').trim();
    const quote = body.length > 240 ? `${body.slice(0, 240)}…` : body;
    openComposer({ title: `Repost: ${post.title}`.slice(0, 150), content: `${quote ? `${quote}\n\n` : ''}Original post: ${window.location.origin}${detailUrl}` });
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${detailUrl}`); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isLong = (post.content || '').length > 280;

  return (
    <article
      onClick={() => navigate(detailUrl)}
      className="cursor-pointer rounded-card border border-line/70 bg-surface p-4 shadow-card transition-[box-shadow,border-color] hover:border-brand/25 hover:shadow-float"
    >
      {/* One row: who · course · when on the left (truncates), topic and menu pinned right */}
      <header className="mb-2 flex items-center gap-2 text-[13px] text-ink-muted">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap">
          {post.community ? (
            <>
              <Link to={`/c/${post.community.slug}`} onClick={stop} className="inline-flex min-h-6 min-w-0 shrink items-center gap-1.5 font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand">
                <Avatar src={post.community.logoUrl} name={post.community.name} size="sm" />
                <span className="truncate">{post.community.name}</span>
                {post.community.status === 'official' && <BadgeCheck className="h-4 w-4 shrink-0 text-highlight" aria-label="Official" />}
              </Link>
              <span aria-hidden>·</span><UserLink username={post.authorUsername} className="inline-flex min-w-0 items-center truncate">{post.authorName || 'Student'}</UserLink>
            </>
          ) : (
            <>
              <Avatar name={post.authorName || 'Student'} size="sm" />
              <UserLink username={post.authorUsername} className="inline-flex min-w-0 items-center truncate font-semibold text-ink">{post.authorName || 'Student'}</UserLink>
            </>
          )}
          {post.course && <><span aria-hidden>·</span><span className="truncate">{post.course}</span></>}
          <span aria-hidden>·</span>
          <time dateTime={post.createdAt} className="shrink-0">{timeAgo(post.createdAt)}</time>
        </div>
        {post.topic && (
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[12px] font-semibold text-ink">{topicLabel(post.topic)}</span>
        )}
        <span className="-mr-2 shrink-0" onClick={stop}>
          <Menu label="More actions" items={[
            { label: isSaved ? 'Remove from saved' : 'Save', icon: <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />, onSelect: () => onToggleSave(post.id) },
            { label: 'Copy link', icon: <Link2 className="h-5 w-5" />, onSelect: copyLink },
            ...(uid && post.authorId === uid ? [] : [{ label: 'Hide (not interested)', icon: <EyeOff className="h-5 w-5" />, onSelect: notInterested }]),
            ...(uid && post.authorId === uid ? [] : [{ label: 'Report', icon: <Flag className="h-5 w-5" />, danger: true, onSelect: () => (uid ? setReporting(true) : navigate('/login', { state: { from: { pathname: location.pathname } } })) }]),
          ]} />
        </span>
      </header>

      <h3 className="mb-1 text-[17px] font-semibold leading-snug text-ink">
        <Link to={detailUrl} onClick={stop} className="hover:underline">{post.title}</Link>
      </h3>
      {post.content && (
        <p className={`whitespace-pre-line text-[15px] leading-relaxed text-ink ${expanded ? '' : 'line-clamp-4'}`}>{post.content}</p>
      )}
      {isLong && !expanded && (
        <button type="button" onClick={(e) => { stop(e); setExpanded(true); }} className="mt-1 text-[13px] font-semibold text-brand">
          Read more
        </button>
      )}

      {post.images && post.images.length > 0 && <div className="mt-3"><PhotoGrid images={post.images} /></div>}

      <footer className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-muted" onClick={stop}>
        <span className="flex items-center rounded-full bg-canvas" role="group" aria-label="React">
          <button type="button" onClick={() => vote('up')} aria-pressed={sparked}
            aria-label={`Spark, ${sparks} ${sparks === 1 ? 'spark' : 'sparks'}`}
            className={`relative flex min-h-11 items-center gap-1.5 rounded-l-full pl-4 pr-3 transition-colors focus-visible:outline-2 focus-visible:outline-brand ${sparked ? 'bg-brand-soft text-brand' : 'hover:bg-line'}`}>
            <Sparkles key={fx?.kind === 'spark' ? fx.n : 0} className={`h-4 w-4 ${sparked ? 'fill-current' : ''} ${fx?.kind === 'spark' ? 'mcg-pop' : ''}`} aria-hidden /> {sparks}
            {fx?.kind === 'spark' && SPARK_DIRS.map(([dx, dy], i) => (
              <span key={`${fx.n}-${i}`} aria-hidden className="mcg-fx mcg-spark" style={{ '--dx': `${dx}px`, '--dy': `${dy}px` } as React.CSSProperties}>✦</span>
            ))}
          </button>
          <span className="h-5 w-px bg-line" aria-hidden />
          {/* Poof = the genie's down-vote: it only lowers ranking and the count stays private */}
          <button type="button" onClick={() => vote('down')} aria-pressed={poofed} aria-label="Poof (not useful)" title="Poof: not useful"
            className={`relative flex min-h-11 items-center gap-1 rounded-r-full pl-2 pr-4 transition-colors focus-visible:outline-2 focus-visible:outline-brand ${poofed ? 'bg-ink/10 text-ink' : 'hover:bg-line'}`}>
            <Wind key={fx?.kind === 'poof' ? fx.n : 0} className={`h-4 w-4 ${fx?.kind === 'poof' ? 'mcg-pop' : ''}`} aria-hidden /><span className="sr-only xl:not-sr-only">Poof</span>
            {fx?.kind === 'poof' && POOF_DIRS.map(([dx, dy], i) => (
              <span key={`${fx.n}-${i}`} aria-hidden className="mcg-fx mcg-puff" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${i * 40}ms` } as React.CSSProperties} />
            ))}
          </button>
        </span>
        <Link to={detailUrl} className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand" aria-label={`${post.commentCount} comments`}>
          <MessageCircle className="h-4 w-4" /> {post.commentCount}
        </Link>
        <button type="button" onClick={repost} title="Repost to your feed" className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand">
          <Repeat2 className="h-4 w-4" aria-hidden /><span className="sr-only xl:not-sr-only">Repost</span>
        </button>
        <button type="button" onClick={share} className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand">
          <Share2 className="h-4 w-4" aria-hidden /><span className="sr-only xl:not-sr-only">Share</span>
        </button>
      </footer>
      {reporting && <span onClick={stop}><ReportSheet open onClose={() => setReporting(false)} itemType="post" itemId={post.id} title="Report post" /></span>}
    </article>
  );
}

export const PostCard = React.memo(PostCardImpl);
