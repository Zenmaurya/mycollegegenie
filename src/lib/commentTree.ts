/** Pure comment-thread helpers (no network/env imports so they run in node:test). */
import type { Comment } from '../types';

export const MAX_DEPTH = 3;
export type CommentNode = Comment & { replies: CommentNode[]; depth: number };
export type CommentSort = 'relevant' | 'newest';

const score = (c: Comment) => c.upvotes.length - c.downvotes.length;
const time = (c: Comment) => new Date(c.createdAt).getTime() || 0;

export function buildCommentTree(comments: Comment[], bestId: string | null, sort: CommentSort) {
  const nodes = new Map<string, CommentNode>();
  for (const c of comments) nodes.set(c.id, { ...c, replies: [], depth: 1 });

  const roots: CommentNode[] = [];
  for (const n of nodes.values()) {
    const parent = n.parentId ? nodes.get(n.parentId) : undefined;
    if (parent && parent !== n) parent.replies.push(n);
    else roots.push(n); // top-level, or orphan whose parent is gone
  }

  // Depth is assigned top-down so it is right whatever order the API returned.
  const seen = new Set<string>();
  const walk = (n: CommentNode, d: number) => {
    seen.add(n.id);
    n.depth = d;
    n.replies.sort((a, b) => time(a) - time(b));
    n.replies.forEach((r) => walk(r, d + 1));
  };
  roots.forEach((r) => walk(r, 1));
  // Parent cycles never reach a root; break each one and surface the comment.
  for (const n of nodes.values()) {
    if (seen.has(n.id)) continue;
    const p = n.parentId ? nodes.get(n.parentId) : undefined;
    if (p) p.replies = p.replies.filter((r) => r !== n);
    roots.push(n);
    walk(n, 1);
  }

  roots.sort(sort === 'newest' ? (a, b) => time(b) - time(a) : (a, b) => score(b) - score(a) || time(b) - time(a));

  const i = bestId ? roots.findIndex((r) => r.id === bestId) : -1;
  const best = i >= 0 ? roots.splice(i, 1)[0] : null;
  return { best, roots };
}

/** Only the post author may mark, and only a top-level comment. */
export function canMarkBest(userId: string | undefined, postAuthorId: string, depth: number): boolean {
  return !!userId && userId === postAuthorId && depth === 1;
}
