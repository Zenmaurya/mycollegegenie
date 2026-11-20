import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowBigDown, ArrowBigUp, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ForumService } from '../../services/forumService';
import { topicLabel } from '../../constants';
import { timeAgo } from '../../lib/feed';
import type { ForumPost } from '../../types';
import { PhotoGrid } from './PhotoGrid';

type Votes = { up: string[]; down: string[] };

function applyVote(v: Votes, uid: string, dir: 'up' | 'down'): Votes {
  const has = (dir === 'up' ? v.up : v.down).includes(uid);
  const up = v.up.filter((x) => x !== uid);
  const down = v.down.filter((x) => x !== uid);
  if (has) return { up, down }; // clicking the same arrow again removes the vote
  return dir === 'up' ? { up: [...up, uid], down } : { up, down: [...down, uid] };
}

export function PostCard({ post }: { post: ForumPost }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [votes, setVotes] = useState<Votes>({ up: post.upvotes, down: post.downvotes });
  const [expanded, setExpanded] = useState(false);
  const uid = user?.id;
  const score = votes.up.length - votes.down.length;
  const detailUrl = `/forum/${post.id}`;

  const vote = async (dir: 'up' | 'down') => {
    if (!uid) { toast('Log in to vote'); return; }
    const before = votes;
    setVotes(applyVote(votes, uid, dir));
    try {
      if (dir === 'up') await ForumService.toggleUpvote(post.id, uid, before.up.includes(uid));
      else await ForumService.toggleDownvote(post.id, uid, before.down.includes(uid));
    } catch {
      setVotes(before);
      toast.error("Couldn't vote. Please try again.");
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

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isLong = (post.content || '').length > 280;

  return (
    <article
      onClick={() => navigate(detailUrl)}
      className="cursor-pointer rounded-card bg-surface p-4 shadow-card transition-colors hover:bg-white/80"
    >
      <header className="mb-2 flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink-muted">
        <span className="font-semibold text-ink">{post.authorName || 'Student'}</span>
        {post.course && <><span aria-hidden>·</span><span className="truncate">{post.course}</span></>}
        <span aria-hidden>·</span>
        <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
        {post.topic && (
          <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-[12px] font-semibold text-brand">{topicLabel(post.topic)}</span>
        )}
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

      <footer className="mt-3 flex items-center gap-1 text-[13px] font-semibold text-ink-muted" onClick={stop}>
        <div className="flex items-center rounded-full bg-canvas">
          <button type="button" onClick={() => vote('up')} aria-label="Upvote" aria-pressed={!!uid && votes.up.includes(uid)}
            className={`rounded-full p-1.5 hover:bg-line ${uid && votes.up.includes(uid) ? 'text-brand-accent' : ''}`}>
            <ArrowBigUp className="h-5 w-5" />
          </button>
          <span className="min-w-[2ch] text-center text-ink" aria-label={`Score ${score}`}>{score}</span>
          <button type="button" onClick={() => vote('down')} aria-label="Downvote" aria-pressed={!!uid && votes.down.includes(uid)}
            className={`rounded-full p-1.5 hover:bg-line ${uid && votes.down.includes(uid) ? 'text-brand' : ''}`}>
            <ArrowBigDown className="h-5 w-5" />
          </button>
        </div>
        <Link to={detailUrl} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-canvas" aria-label={`${post.commentCount} comments`}>
          <MessageCircle className="h-4 w-4" /> {post.commentCount}
        </Link>
        <button type="button" onClick={share} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-canvas">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </footer>
    </article>
  );
}
