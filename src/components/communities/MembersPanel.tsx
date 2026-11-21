import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listMembers, updateMember, type MemberUpdate } from '../../services/communityService';
import type { CommunityMember, PageRole } from '../../lib/communities';
import { ConfirmSheet } from './ConfirmSheet';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { field } from './CommunityFields';

const ROLES: PageRole[] = ['admin', 'core', 'member'];
type Pending = { m: CommunityMember; kind: 'remove' } | { m: CommunityMember; kind: 'role'; role: PageRole };

interface Props { slug: string; viewerId: string; viewerRole: 'admin' | 'core'; onChanged: () => Promise<unknown> | void }

export function MembersPanel({ slug, viewerId, viewerRole, onChanged }: Props) {
  const isAdmin = viewerRole === 'admin';
  const active = useQuery({ queryKey: ['community-members', slug, 'active'], queryFn: () => listMembers(slug, 'active') });
  const pending = useQuery({ queryKey: ['community-members', slug, 'pending'], queryFn: () => listMembers(slug, 'pending') });
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: ({ m, u }: { m: CommunityMember; u: MemberUpdate }) => updateMember(slug, m.userId, u),
    onSuccess: async (_d, v) => { setError(''); setConfirm(null); if (v.u.action === 'remove') toast.success('Member removed'); await onChanged(); },
    onError: (e: Error) => { setError(e.message || 'Could not update the member'); setConfirm(null); },
  });
  const run = (m: CommunityMember, u: MemberUpdate) => mut.mutate({ m, u });

  const admins = (active.data ?? []).filter((m) => m.role === 'admin').length;
  const reload = (q: typeof active) => (
    <div className="rounded-card bg-surface p-4 text-center shadow-card">
      <p className="mb-3 text-[15px] text-ink">Couldn't load members</p><Button onClick={() => void q.refetch()}>Retry</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-[15px] text-danger">{error}</p>}

      <section aria-labelledby="pending-h" className="space-y-2">
        <h2 id="pending-h" className="text-[17px] font-bold text-ink">Join requests</h2>
        {pending.isPending && <Skeleton className="h-16 w-full rounded-card" />}
        {pending.isError && reload(pending)}
        {pending.isSuccess && pending.data.length === 0 && <p className="text-[15px] text-ink-muted">No pending requests</p>}
        {pending.isSuccess && pending.data.length > 0 && (
          <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
            {pending.data.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center gap-3 p-3">
                <Avatar src={m.avatar} name={m.displayName} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{m.displayName}</span>
                <Button onClick={() => run(m, { action: 'approve' })} disabled={mut.isPending} aria-label={`Approve ${m.displayName}`}>Approve</Button>
                <Button variant="secondary" onClick={() => run(m, { action: 'decline' })} disabled={mut.isPending} aria-label={`Decline ${m.displayName}`}>Decline</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="active-h" className="space-y-2">
        <h2 id="active-h" className="text-[17px] font-bold text-ink">Members</h2>
        {active.isPending && <Skeleton className="h-24 w-full rounded-card" />}
        {active.isError && reload(active)}
        {active.isSuccess && (
          <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
            {active.data.map((m) => {
              const self = m.userId === viewerId;
              const lastAdmin = m.role === 'admin' && admins <= 1;
              const title = titles[m.userId] ?? m.title ?? '';
              return (
                <li key={m.userId} className="space-y-2 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={m.avatar} name={m.displayName} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{m.displayName}{self && ' (you)'}</span>
                    {!isAdmin && <span className="text-[13px] capitalize text-ink-muted">{m.role}</span>}
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    {isAdmin && (
                      <div>
                        <label htmlFor={`role-${m.userId}`} className="mb-1 block text-[13px] font-semibold text-ink">Role</label>
                        <select id={`role-${m.userId}`} className={`${field} w-auto capitalize`} value={m.role} disabled={mut.isPending || (self && lastAdmin)}
                          onChange={(e) => e.target.value !== m.role && setConfirm({ m, kind: 'role', role: e.target.value as PageRole })}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {self && lastAdmin && <p className="mt-1 text-[13px] text-ink-muted">You are the only admin</p>}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="min-w-40 flex-1">
                        <label htmlFor={`title-${m.userId}`} className="mb-1 block text-[13px] font-semibold text-ink">Title</label>
                        <input id={`title-${m.userId}`} className={field} value={title} maxLength={60} placeholder="e.g. Treasurer"
                          onChange={(e) => setTitles((p) => ({ ...p, [m.userId]: e.target.value }))} />
                      </div>
                    )}
                    {isAdmin && title !== (m.title ?? '') && (
                      <Button variant="secondary" disabled={mut.isPending}
                        onClick={() => run(m, { action: 'set_role', title: title.trim() || null })} aria-label={`Save title for ${m.displayName}`}>Save title</Button>
                    )}
                    {(isAdmin || m.role !== 'admin') && !self && (
                      <Button variant="danger" disabled={mut.isPending} onClick={() => setConfirm({ m, kind: 'remove' })} aria-label={`Remove ${m.displayName}`}>Remove</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ConfirmSheet
        open={confirm !== null}
        title={confirm?.kind === 'remove' ? 'Remove member?' : 'Change role?'}
        body={confirm ? (confirm.kind === 'remove' ? `${confirm.m.displayName} will lose access to this page's member features.` : `Make ${confirm.m.displayName} ${confirm.role === 'admin' ? 'an admin' : `a ${confirm.role}`}?`) : ''}
        confirmLabel={confirm?.kind === 'remove' ? 'Remove' : 'Change role'}
        busy={mut.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && (confirm.kind === 'remove'
          ? run(confirm.m, { action: 'remove' })
          : mut.mutate({ m: confirm.m, u: { action: 'set_role', role: confirm.role } }, { onSuccess: () => toast.success('Role updated') }))}
      />
    </div>
  );
}
