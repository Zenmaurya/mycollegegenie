import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowBigDown, ArrowBigUp, ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { ForumService } from '../services/forumService';
import { topicLabel } from '../constants';

const TOPIC_BLURB: Record<string, string> = {
  General: 'Anything on student life that does not fit elsewhere.',
  Doubt: 'Questions from students, answered by seniors and peers.',
  'Exam Tips': 'Study plans, past papers and last-minute advice.',
  Notes: 'Share and find notes for your courses.',
  Placement: 'Internships, interviews and placement prep.',
  Events: 'Fests, workshops and campus happenings.',
};
import { applyVote, timeAgo, toggleVote } from '../lib/feed';
import { buildCommentTree, canMarkBest, type CommentNode, type CommentSort } from '../lib/commentTree';
import type { Comment, ForumPost } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/EmptyState';
import { Menu } from '../components/ui/Menu';
import { ReportSheet } from '../components/communities/ReportSheet';
import type { ReportItemType } from '../services/reportService';
import { Skeleton } from '../components/ui/skeleton';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { PhotoGrid } from '../components/feed/PhotoGrid';
import { CommentItem } from '../components/post/CommentItem';
import { CommentComposer } from '../components/post/CommentComposer';
import { UserLink } from '../components/profile/UserLink';


export function PostPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user, appUser, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reportTarget, setReportTarget] = useState<{ type: ReportItemType; id: string } | null>(null);
  const qc = useQueryClient();
  const uid = user?.id;
  const [sort, setSort] = useState<CommentSort>('relevant');
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [replyErr, setReplyErr] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'post' } | { kind: 'comment'; node: CommentNode } | null>(null);

  const postKey = ['post', id];
  const commentsKey = ['comments', id];
  const { data: post, isLoading, isError, refetch } = useQuery({ queryKey: postKey, queryFn: () => ForumService.getPost(id), enabled: !!id, retry: 1 });
  const { data: comments = [] } = useQuery({ queryKey: commentsKey, queryFn: () => ForumService.getComments(id), enabled: !!id });
  const { data: related = [] } = useQuery({
    queryKey: ['related', post?.topic],
    queryFn: () => ForumService.getPosts(undefined, post!.topic, 6),
    enabled: !!post?.topic,
  });

  const tree = useMemo(() => buildCommentTree(comments, post?.bestCommentId ?? null, sort), [comments, post?.bestCommentId, sort]);

  const requireLogin = (msg: string) => { if (uid) return true; openAuthModal(msg); return false; };

  const patchComments = (fn: (list: Comment[]) => Comment[]) => qc.setQueryData<Comment[]>(commentsKey, (l) => fn(l ?? []));

  const addComment = useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) => ForumService.addComment(id, content, parentId),
    onMutate: async ({ content, parentId }) => {
      await qc.cancelQueries({ queryKey: commentsKey });
      const prev = qc.getQueryData<Comment[]>(commentsKey);
      patchComments((l) => [...l, {
        id: `tmp-${Date.now()}`, postId: id, authorId: uid ?? '', authorName: appUser?.displayName || 'You', authorUsername: appUser?.username ?? null,
        content, createdAt: new Date().toISOString(), upvotes: [], downvotes: [], parentId: parentId ?? null,
      }]);
      return { prev };
    },
    onError: (e, _v, ctx) => {
      qc.setQueryData(commentsKey, ctx?.prev);
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'Only members can reply in this discussion') setReplyErr(msg);
      else toast.error(msg || "Couldn't post your comment.");
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: commentsKey }); qc.invalidateQueries({ queryKey: ['feed'] }); },
  });

  const bestMut = useMutation({
    mutationFn: (commentId: string | null) => ForumService.setBestAnswer(id, commentId),
    onMutate: (commentId) => {
      const prev = qc.getQueryData<ForumPost | null>(postKey);
      qc.setQueryData<ForumPost | null>(postKey, (p) => (p ? { ...p, bestCommentId: commentId } : p));
      return { prev };
    },
    onError: (e, _v, ctx) => { qc.setQueryData(postKey, ctx?.prev); toast.error(e instanceof Error ? e.message : "Couldn't update the best answer."); },
    onSettled: () => qc.invalidateQueries({ queryKey: postKey }),
  });

  const delComment = useMutation({
    mutationFn: (n: CommentNode) => ForumService.deleteComment(id, n.id),
    onSuccess: () => toast.success('Comment deleted.'),
    onError: () => toast.error("Couldn't delete the comment."),
    onSettled: () => { qc.invalidateQueries({ queryKey: commentsKey }); qc.invalidateQueries({ queryKey: postKey }); qc.invalidateQueries({ queryKey: ['feed'] }); },
  });

  const votePost = async (dir: 'up' | 'down') => {
    if (!post || !requireLogin('Log in to vote')) return;
    const prev = qc.getQueryData<ForumPost | null>(postKey);
    const feedPrev = qc.getQueriesData({ queryKey: ['feed'] });
    const v = toggleVote({ up: post.upvotes, down: post.downvotes }, uid!, dir);
    qc.setQueryData<ForumPost | null>(postKey, { ...post, upvotes: v.up, downvotes: v.down });
    qc.setQueriesData({ queryKey: ['feed'] }, (d: any) => applyVote(d, post.id, uid!, dir));
    try {
      if (dir === 'up') await ForumService.toggleUpvote(post.id, uid!, post.upvotes.includes(uid!));
      else await ForumService.toggleDownvote(post.id, uid!, post.downvotes.includes(uid!));
    } catch {
      qc.setQueryData(postKey, prev);
      feedPrev.forEach(([k, d]) => qc.setQueryData(k, d));
      toast.error("Couldn't vote. Please try again.");
    }
  };

  const voteComment = async (n: CommentNode) => {
    if (!requireLogin('Log in to vote')) return;
    const prev = qc.getQueryData<Comment[]>(commentsKey);
    patchComments((l) => l.map((c) => {
      if (c.id !== n.id) return c;
      const v = toggleVote({ up: c.upvotes, down: c.downvotes }, uid!, 'up');
      return { ...c, upvotes: v.up, downvotes: v.down };
    }));
    try { await ForumService.toggleCommentUpvote(id, n.id, uid!, n.upvotes.includes(uid!)); }
    catch { qc.setQueryData(commentsKey, prev); toast.error("Couldn't vote. Please try again."); }
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${id}`;
    if (navigator.share) { try { await navigator.share({ title: post?.title, url }); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* blocked */ }
  };

  const submit = async (content: string) => {
    if (!requireLogin('Log in to comment')) throw new Error('auth');
    setReplyErr('');
    await addComment.mutateAsync({ content, parentId: replyTo?.id });
    setReplyTo(null);
  };

  const isAdmin = appUser?.role === 'admin';
  const startReport = (type: ReportItemType, rid: string) => {
    if (uid) setReportTarget({ type, id: rid });
    else navigate('/login', { state: { from: { pathname: location.pathname } } });
  };
  const canDelete = (n: CommentNode) => !!uid && (n.authorId === uid || isAdmin) // backend: comment author or admin only;

  if (isLoading) return <div className="mx-auto w-full max-w-2xl space-y-3 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32 w-full" /><Skeleton className="h-20 w-full" /></div>;
  if (isError) return <div className="mx-auto w-full max-w-2xl"><EmptyState title="Couldn't load this post" body="Check your connection and try again." action={<Button onClick={() => refetch()}>Retry</Button>} /></div>;
  if (!post) return <div className="mx-auto w-full max-w-2xl"><EmptyState title="Post not found" body="It may have been deleted." action={<Link to="/" className="font-semibold text-brand">Back to Home</Link>} /></div>;

  const score = post.upvotes.length - post.downvotes.length;
  const row = (n: CommentNode, isBest = false) => (
    <CommentItem key={n.id} node={n} uid={uid} isBest={isBest} canMarkBest={canMarkBest(uid, post.authorId, n.depth)} canDelete={canDelete}
      onVote={voteComment} onReply={(c) => { if (requireLogin('Log in to reply')) setReplyTo(c); }}
      onMarkBest={(c) => bestMut.mutate(c ? c.id : null)} onDelete={(c) => setConfirm({ kind: 'comment', node: c })} onReport={(c) => startReport('comment', c.id)} />
  );
  const pill = 'flex h-11 w-11 items-center justify-center rounded-full hover:bg-line focus-visible:outline-2 focus-visible:outline-brand';
  const relatedPosts = related.filter((p) => p.id !== post.id).slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-6 px-0 md:px-4">
      <Helmet>
        <title>{post.title} | MyCollegeGenie</title>
        <meta name="description" content={post.content.substring(0, 150)} />
      </Helmet>
      <div className="min-w-0 flex-1">
        <article className="bg-surface p-4">
          <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="mb-3 flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-muted focus-visible:outline-2 focus-visible:outline-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
          <header className="mb-2 flex flex-wrap items-center gap-x-1.5 text-[13px] text-ink-muted">
            <Avatar name={post.authorName || 'Student'} size="sm" />
            <UserLink username={post.authorUsername} className="font-semibold text-ink">{post.authorName || 'Student'}</UserLink>
            {post.course && <><span aria-hidden>·</span><span className="truncate">{post.course}</span></>}
            <span aria-hidden>·</span><time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            {post.topic && <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[12px] font-semibold text-ink">{topicLabel(post.topic)}</span>}
            <span className={post.topic ? '' : 'ml-auto'}><Menu label="More actions" items={[
              ...(post.authorId === uid ? [] : [{ label: 'Report', danger: true, onSelect: () => startReport('post', post.id) }]),
              ...(uid && (post.authorId === uid || isAdmin) ? [{ label: 'Delete post', danger: true, onSelect: () => setConfirm({ kind: 'post' }) }] : []),
            ]} /></span>
          </header>
          <h1 className="mb-2 text-[22px] font-bold leading-snug text-ink">{post.title}</h1>
          {post.content && <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-ink">{post.content}</p>}
          {post.images && post.images.length > 0 && <div className="mt-3"><PhotoGrid images={post.images} /></div>}
          <footer className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink-muted">
            <div className="flex items-center rounded-full bg-canvas">
              <button type="button" onClick={() => votePost('up')} aria-label="Upvote" aria-pressed={!!uid && post.upvotes.includes(uid)} className={`${pill} ${uid && post.upvotes.includes(uid) ? 'text-brand' : ''}`}><ArrowBigUp className="h-5 w-5" /></button>
              <span className="min-w-[2ch] text-center text-ink" aria-label={`Score ${score}`}>{score}</span>
              <button type="button" onClick={() => votePost('down')} aria-label="Downvote" aria-pressed={!!uid && post.downvotes.includes(uid)} className={`${pill} ${uid && post.downvotes.includes(uid) ? 'text-brand' : ''}`}><ArrowBigDown className="h-5 w-5" /></button>
            </div>
            <span className="flex min-h-11 items-center gap-1.5 rounded-full bg-canvas px-4"><MessageCircle className="h-4 w-4" aria-hidden /> {comments.length}</span>
            <Button variant="ghost" onClick={share} className="rounded-full bg-canvas"><Share2 className="h-4 w-4" aria-hidden /> Share</Button>
          </footer>
        </article>

        <section aria-label="Comments" className="mt-2 bg-surface px-4 pb-4 pt-3">
          <h2 className="flex flex-wrap items-center text-[17px] font-bold text-ink">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            <span aria-hidden className="mx-2 text-ink-muted">·</span>
            <label className="flex items-center text-[14px] font-semibold text-ink-muted">
              Sort:
              <select value={sort} onChange={(e) => setSort(e.target.value as CommentSort)} className="min-h-11 bg-transparent pl-1 text-ink focus-visible:outline-2 focus-visible:outline-brand">
                <option value="relevant">Most relevant</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </h2>
          {comments.length === 0 ? (
            <EmptyState title="No comments yet" body="Be the first to reply." />
          ) : (
            <ul>{tree.best && row(tree.best, true)}{tree.roots.map((n) => row(n))}</ul>
          )}
        </section>
        {post.isLocked ? (
          <p className="sticky bottom-16 z-30 border-t border-line bg-surface px-4 py-3 text-[15px] text-ink-muted md:bottom-0">This discussion is locked</p>
        ) : (<>
        {replyErr && <p role="alert" className="bg-surface px-4 pt-3 text-[13px] text-danger">{replyErr}</p>}
        <CommentComposer name={uid ? (appUser?.displayName || 'you') : null} replyKey={replyTo?.id ?? null} onRequireLogin={() => requireLogin('Log in to comment')} replyingTo={replyTo ? replyTo.authorName || 'Student' : null} onCancelReply={() => setReplyTo(null)} onSubmit={submit} />
        </>)}
      </div>

      <aside aria-label="Topic info" className="hidden w-72 shrink-0 space-y-3 lg:block">
        {post.topic && (
          <div className="rounded-card bg-surface p-4">
            <h2 className="text-[15px] font-bold text-ink">About {topicLabel(post.topic)}</h2>
            <p className="mt-1 text-[14px] text-ink-muted">{TOPIC_BLURB[post.topic] || 'Posts on this topic.'}</p>
            <Link to={`/?topic=${encodeURIComponent(post.topic)}`} className="mt-2 flex min-h-11 items-center text-[14px] font-semibold text-brand focus-visible:outline-2 focus-visible:outline-brand">More in {topicLabel(post.topic)}</Link>
          </div>
        )}
        {relatedPosts.length > 0 && (
          <div className="rounded-card bg-surface p-4">
            <h2 className="mb-2 text-[15px] font-bold text-ink">Related posts</h2>
            <ul className="space-y-1">
              {relatedPosts.map((p) => (
                <li key={p.id}><Link to={`/post/${p.id}`} className="block min-h-11 rounded-sm py-2 text-[14px] font-semibold text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand">{p.title}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {reportTarget && <ReportSheet open onClose={() => setReportTarget(null)} itemType={reportTarget.type} itemId={reportTarget.id} title={reportTarget.type === 'post' ? 'Report post' : 'Report comment'} />}
      <ConfirmationModal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        type="danger"
        title={confirm?.kind === 'post' ? 'Delete post?' : 'Delete comment?'}
        message={confirm?.kind === 'post' ? 'This permanently removes the post and its comments.' : 'This also removes its replies.'}
        confirmText="Delete"
        onConfirm={async () => {
          const c = confirm; setConfirm(null);
          if (c?.kind === 'comment') delComment.mutate(c.node);
          else if (c) {
            try { await ForumService.deletePost(id); toast.success('Post deleted.'); qc.invalidateQueries({ queryKey: ['feed'] }); navigate('/'); }
            catch { toast.error("Couldn't delete the post."); }
          }
        }}
      />
    </div>
  );
}
