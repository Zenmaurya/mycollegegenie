import { useState, type ReactElement } from 'react';
import { CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { Menu } from '../ui/Menu';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { UserLink } from '../profile/UserLink';
import { timeAgo } from '../../lib/feed';
import { MAX_DEPTH, isDeletedComment, type CommentNode } from '../../lib/commentTree';

// key is declared because @types/react is not installed, so tsc will not add it to JSX props.
interface Props {
  key?: string;
  node: CommentNode;
  uid?: string;
  isBest?: boolean;
  canMarkBest: boolean;
  canDelete: (node: CommentNode) => boolean;
  onVote: (node: CommentNode) => void;
  onReply: (node: CommentNode) => void;
  onMarkBest: (node: CommentNode | null) => void;
  onDelete: (node: CommentNode) => void;
  onReport?: (node: CommentNode) => void;
}

export function CommentItem(props: Props): ReactElement {
  const { node, uid, isBest, canMarkBest, canDelete, onVote, onReply, onMarkBest, onDelete, onReport } = props;
  const [open, setOpen] = useState(false);
  const voted = !!uid && node.upvotes.includes(uid);
  const deleted = isDeletedComment(node);
  const pending = node.id.startsWith('tmp-');
  const atCap = node.depth >= MAX_DEPTH;
  const btn = 'flex min-h-11 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-ink-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50';

  return (
    <li className={node.depth > 1 ? 'mt-2 border-l-2 border-line pl-3' : 'mt-3'}>
      <div className="flex gap-2">
        <Avatar name={node.authorName || 'Student'} size="sm" />
        <div className="min-w-0 flex-1">
          <div className={`rounded-card px-3 py-2 ${isBest ? 'border-2 border-ink bg-surface' : 'bg-canvas'}`}>
            <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-muted">
              <UserLink username={node.authorUsername} className="font-semibold text-ink">{node.authorName || 'Student'}</UserLink>
              {isBest && !deleted && <Badge tone="success">Best answer</Badge>}
            </div>
            <p className={`mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed ${deleted ? 'italic text-ink-muted' : 'text-ink'}`}>{node.content}</p>
          </div>
          <div className="flex flex-wrap items-center">
            <time dateTime={node.createdAt} className="px-1 text-[13px] text-ink-muted">{pending ? 'sending…' : timeAgo(node.createdAt)}</time>
            {!deleted && <button type="button" onClick={() => onVote(node)} disabled={pending} aria-pressed={voted} aria-label={`Spark, ${node.upvotes.length} ${node.upvotes.length === 1 ? 'spark' : 'sparks'}`} className={`${btn} ${voted ? 'text-brand' : ''}`}>
              <Sparkles className={`h-4 w-4 ${voted ? 'fill-current' : ''}`} aria-hidden /> {node.upvotes.length}
            </button>}
            {!atCap && !pending && !deleted && <button type="button" onClick={() => onReply(node)} className={btn}>Reply</button>}
            {canMarkBest && !pending && !deleted && (
              <button type="button" onClick={() => onMarkBest(isBest ? null : node)} className={btn}>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> {isBest ? 'Unmark best answer' : 'Mark as best answer'}
              </button>
            )}
            {canDelete(node) && !pending && !deleted && (
              <button type="button" onClick={() => onDelete(node)} aria-label="Delete comment" className={btn}><Trash2 className="h-4 w-4" aria-hidden /></button>
            )}
            {onReport && !pending && !deleted && node.authorId !== uid && (
              <span className="ml-auto"><Menu label="More comment actions" items={[{ label: 'Report', danger: true, onSelect: () => onReport(node) }]} /></span>
            )}
          </div>
          {node.replies.length > 0 && (atCap && !open ? (
            <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-[13px] font-semibold text-brand">
              Continue thread ({node.replies.length})
            </button>
          ) : (
            <ul>{node.replies.map((r) => <CommentItem key={r.id} {...props} node={r} isBest={false} canMarkBest={false} />)}</ul>
          ))}
        </div>
      </div>
    </li>
  );
}
