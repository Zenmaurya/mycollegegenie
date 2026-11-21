import type { ModAction } from '../../services/reportService';

export type AdminAction = 'hide' | 'unhide' | 'remove_official' | 'delete';

/** Mirrors the backend: moderators hide/unhide; only admins remove_official/delete. */
export function societyActionsFor(role: string | undefined, s: { isHidden: boolean; official?: boolean; society?: boolean }): AdminAction[] {
  if (role !== 'admin' && role !== 'moderator') return [];
  const out: AdminAction[] = [s.isHidden ? 'unhide' : 'hide'];
  // MCG pages can be neither deleted nor un-officialled (backend 400s)
  if (role === 'admin' && s.society !== false) {
    if (s.official) out.push('remove_official');
    out.push('delete');
  }
  return out;
}

/** Proof is shown as a link only when it is a valid https: URL. */
export function proofLink(proof: string): string | null {
  try { return new URL(proof.trim()).protocol === 'https:' ? proof.trim() : null; } catch { return null; }
}


/** Mirrors backend moderationActionsFor (utils/moderation.js), with hide/unhide narrowed to the item's current state. */
export function adminActionsFor(role: string | undefined, itemType: string, isHidden: boolean, targetBanned = false): ModAction[] {
  if (!['community', 'event', 'post', 'comment', 'user'].includes(itemType)) return [];
  let a: ModAction[];
  if (role === 'admin') {
    a = itemType === 'user' ? ['dismiss', 'warn', 'ban', 'unban']
      : ['dismiss', 'hide', 'unhide', 'delete', 'warn', 'ban', 'unban', ...(itemType === 'community' ? ['remove_official' as const] : [])];
  } else if (role === 'moderator') a = itemType === 'user' ? ['dismiss', 'warn'] : ['dismiss', 'hide', 'unhide', 'warn'];
  else return [];
  return a.filter((x) => x !== (isHidden ? 'hide' : 'unhide') && (x !== 'unban' || targetBanned));
}
