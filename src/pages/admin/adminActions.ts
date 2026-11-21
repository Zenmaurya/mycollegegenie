export type AdminAction = 'hide' | 'unhide' | 'remove_official' | 'delete';

/** Mirrors the backend: moderators hide/unhide; only admins remove_official/delete. */
export function adminActionsFor(role: string | undefined, s: { isHidden: boolean; official?: boolean }): AdminAction[] {
  if (role !== 'admin' && role !== 'moderator') return [];
  const out: AdminAction[] = [s.isHidden ? 'unhide' : 'hide'];
  if (role === 'admin') {
    if (s.official) out.push('remove_official');
    out.push('delete');
  }
  return out;
}

/** Proof is shown as a link only when it is a valid https: URL. */
export function proofLink(proof: string): string | null {
  try { return new URL(proof.trim()).protocol === 'https:' ? proof.trim() : null; } catch { return null; }
}
