import { useCallback, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Pin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../context/ResourceContext';
import { ForumService } from '../../services/forumService';
import { moderatePost } from '../../services/reportService';
import { composerKinds, type CommunityDetail } from '../../lib/communities';
import { PostCard } from '../feed/PostCard';
import { Badge } from '../ui/Badge';
import { Menu } from '../ui/Menu';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { ConfirmSheet } from './ConfirmSheet';
import type { ForumPost } from '../../types';

type Kind = 'official' | 'discussion';
export const postsKey = (viewer: string, slug: string, kind: Kind) => ['community-posts', viewer, slug, kind];

/** Posts of one kind for a page, with pinned/locked markers and the admin/core moderation menu. */
export function PostList({ detail, kind, action, emptyTitle, emptyBody }: { detail: CommunityDetail; kind: Kind; action?: ReactNode; emptyTitle: string; emptyBody: string }) {
  const { appUser } = useAuth();
  const qc = useQueryClient();
  const { savedResourceIds, toggleSave } = useResources();
  const onToggleSave = useCallback((id: string) => { void toggleSave(id); }, [toggleSave]);
  const [removing, setRemoving] = useState<ForumPost | null>(null);
  const [busy, setBusy] = useState(false);
  const key = postsKey(appUser?.uid ?? 'anon', detail.slug, kind);
  const q = useQuery({ queryKey: key, queryFn: () => ForumService.getCommunityPosts(detail.slug, kind) });
  const mod = detail.viewer.status === 'active' && (detail.viewer.role === 'admin' || detail.viewer.role === 'core');

  const run = async (id: string, action: Parameters<typeof moderatePost>[1]) => {
    setBusy(true);
    try { await moderatePost(id, action); await qc.invalidateQueries({ queryKey: key }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the post'); }
    finally { setBusy(false); setRemoving(null); }
  };

  return (
    <div className="space-y-3">
      {action}
      {q.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-32 w-full rounded-card" />)}
      {q.isError && (
        <div className="rounded-card bg-surface p-6 text-center shadow-card">
          <p className="mb-3 text-[15px] text-ink">Couldn't load posts</p>
          <Button onClick={() => void q.refetch()}>Retry</Button>
        </div>
      )}
      {q.isSuccess && q.data.length === 0 && <div className="rounded-card bg-surface shadow-card"><EmptyState title={emptyTitle} body={emptyBody} /></div>}
      {q.isSuccess && q.data.map((p) => (
        <div key={p.id} className="relative space-y-1">
          {(p.isPinned || p.isLocked) && (
            <div className="flex items-center gap-2 px-1">
              {p.isPinned && <Badge tone="brand"><Pin className="mr-1 h-3.5 w-3.5" aria-hidden />Pinned</Badge>}
              {p.isLocked && <Badge><Lock className="mr-1 h-3.5 w-3.5" aria-hidden />Locked</Badge>}
            </div>
          )}
          {mod && (
            <span className="absolute right-16 top-3 z-10">
              <Menu label={`Moderate: ${p.title}`} items={[
                { label: p.isPinned ? 'Unpin' : 'Pin', onSelect: () => void run(p.id, p.isPinned ? 'unpin' : 'pin') },
                { label: p.isLocked ? 'Unlock' : 'Lock', onSelect: () => void run(p.id, p.isLocked ? 'unlock' : 'lock') },
                { label: 'Remove', danger: true, onSelect: () => setRemoving(p) },
              ]} />
            </span>
          )}
          <PostCard post={p} isSaved={savedResourceIds.includes(p.id)} onToggleSave={onToggleSave} />
        </div>
      ))}
      <ConfirmSheet open={!!removing} title="Remove post?" body="This post will be removed from the page for everyone." confirmLabel="Remove" busy={busy}
        onClose={() => setRemoving(null)} onConfirm={() => removing && void run(removing.id, 'remove')} />
    </div>
  );
}

export function PostsTab({ detail, onCreate }: { detail: CommunityDetail; onCreate: () => void }) {
  const role = detail.viewer.status === 'active' ? detail.viewer.role : null;
  const canOfficial = composerKinds(role, detail.kind).includes('official');
  return (
    <PostList detail={detail} kind="official" emptyTitle="No posts yet" emptyBody="Official posts from this society will show up here."
      action={canOfficial ? <Button onClick={onCreate}>Create post</Button> : undefined} />
  );
}
