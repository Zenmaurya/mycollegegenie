import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck, Bookmark, MessageCircle, Share2, Sparkles } from 'lucide-react';
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
import { ReportSheet } from '../communities/ReportSheet';

function PostCardImpl({ post, isSaved, onToggleSave }: { post: ForumPost; isSaved: boolean; onToggleSave: (id: string) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reporting, setReporting] = useState(false);
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const uid = user?.id;
  // ✨ Spark = MCG's one positive reaction (stored as an upvote); downvotes are no longer shown
  const sparks = post.upvotes.length;
  const sparked = !!uid && post.upvotes.includes(uid);
  const detailUrl = `/post/${post.id}`;

  const vote = async (dir: 'up' | 'down') => {
    if (!uid) { toast('Log in to vote'); return; }
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

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${detailUrl}`); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isLong = (post.content || '').length > 280;

  return (
    <article
      onClick={() => navigate(detailUrl)}
      className="cursor-pointer rounded-card bg-surface p-4 shadow-card transition-shadow hover:shadow-float"
    >
      <header className="mb-2 flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink-muted">
        {post.community ? (
          <>
            <Link to={`/c/${post.community.slug}`} onClick={stop} className="inline-flex min-h-6 items-center gap-1.5 font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand">
              <Avatar src={post.community.logoUrl} name={post.community.name} size="sm" />
              {post.community.name}
              {post.community.status === 'official' && <BadgeCheck className="h-4 w-4 text-highlight" aria-label="Official" />}
            </Link>
            <span aria-hidden>·</span><span>{post.authorName || 'Student'}</span>
          </>
        ) : (
          <span className="font-semibold text-ink">{post.authorName || 'Student'}</span>
        )}
        {post.course && <><span aria-hidden>·</span><span className="truncate">{post.course}</span></>}
        <span aria-hidden>·</span>
        <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        {post.topic && (
          <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[12px] font-semibold text-ink">{topicLabel(post.topic)}</span>
        )}
        <span className={post.topic ? '' : 'ml-auto'} onClick={stop}>
          <Menu label="More actions" items={[
            { label: 'Copy link', onSelect: copyLink },
            ...(uid && post.authorId === uid ? [] : [{ label: 'Not interested', onSelect: notInterested }]),
            ...(uid && post.authorId === uid ? [] : [{ label: 'Report', danger: true, onSelect: () => (uid ? setReporting(true) : navigate('/login', { state: { from: { pathname: location.pathname } } })) }]),
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
        <button type="button" onClick={() => vote('up')} aria-pressed={sparked}
          aria-label={`Spark, ${sparks} ${sparks === 1 ? 'spark' : 'sparks'}`}
          className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 transition-colors focus-visible:outline-2 focus-visible:outline-brand ${sparked ? 'bg-brand-soft text-brand' : 'bg-canvas hover:bg-line'}`}>
          <Sparkles className={`h-4 w-4 ${sparked ? 'fill-current' : ''}`} aria-hidden /> {sparks}
        </button>
        <Link to={detailUrl} className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand" aria-label={`${post.commentCount} comments`}>
          <MessageCircle className="h-4 w-4" /> {post.commentCount}
        </Link>
        <button type="button" onClick={share} className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button type="button" onClick={() => onToggleSave(post.id)} aria-pressed={isSaved} className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4 hover:bg-line focus-visible:outline-2 focus-visible:outline-brand">
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current text-ink' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
        </button>
      </footer>
      {reporting && <span onClick={stop}><ReportSheet open onClose={() => setReporting(false)} itemType="post" itemId={post.id} title="Report post" /></span>}
    </article>
  );
}

export const PostCard = React.memo(PostCardImpl);
