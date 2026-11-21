import { composerKinds, type CommunityDetail } from '../../lib/communities';
import { Button } from '../ui/button';
import { PostList } from './PostsTab';

export function DiscussionTab({ detail, onStart }: { detail: CommunityDetail; onStart: () => void }) {
  const role = detail.viewer.status === 'active' ? detail.viewer.role : null;
  const canStart = composerKinds(role, detail.kind).includes('discussion');
  return (
    <PostList detail={detail} kind="discussion" emptyTitle="No discussions yet" emptyBody="Members can start a discussion here."
      action={canStart
        ? <Button onClick={onStart}>Start a discussion</Button>
        : <p className="rounded-card bg-canvas px-4 py-3 text-[14px] text-ink-muted">Only members can start discussions. You can read along.</p>} />
  );
}
