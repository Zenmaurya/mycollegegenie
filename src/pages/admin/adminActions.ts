export type AdminAction = 'hide' | 'unhide' | 'remove_official' | 'delete';

/** Mirrors the backend: moderators hide/unhide; only admins remove_official/delete. */
export function adminActionsFor(role: string | undefined, s: { isHidden: boolean; official?: boolean; society?: boolean }): AdminAction[] {
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

/** Report-queue row actions: dismiss plus the moderation actions that apply to an item. */
export function reportActionsFor(role: string | undefined, isHidden: boolean): ('dismiss' | 'hide' | 'unhide' | 'delete')[] {
  return ['dismiss', ...adminActionsFor(role, { isHidden }).filter((a): a is 'hide' | 'unhide' | 'delete' => a !== 'remove_official')];
}
