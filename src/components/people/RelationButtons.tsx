import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { PeopleService } from '../../services/peopleService';
import { applyAction, nextActions, type ConnectAction, type FollowAction, type Relation } from '../../lib/people';
import { Button } from '../ui/button';

type Action = ConnectAction | FollowAction | 'ignore';
const RUN: Record<Action, (id: string) => Promise<unknown>> = {
  connect: PeopleService.connect, accept: PeopleService.accept, follow: PeopleService.follow,
  cancel: PeopleService.disconnect, remove: PeopleService.disconnect, ignore: PeopleService.disconnect, unfollow: PeopleService.unfollow,
};

/** Connect/Requested/Accept/Connected plus Follow/Following. Updates at once and rolls back on error. Logged-out visitors go to login. */
export function RelationButtons({ userId, relation, compact }: { userId: string; relation: Relation; compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [rel, setRel] = useState(relation);
  const [prop, setProp] = useState(relation);
  const [busy, setBusy] = useState(false);
  if (relation !== prop) { setProp(relation); setRel(relation); } // the page refetched: take the server's word
  const { connect, follow } = nextActions(rel);

  const run = async (action: Action) => {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }); return; }
    if (action === 'remove' && !window.confirm('Remove this connection? You will still follow each other.')) return;
    const before = rel;
    setRel(applyAction(rel, action));
    setBusy(true);
    try {
      const res = await RUN[action](userId);
      if (res && typeof res === 'object' && 'connection' in res) setRel(res as Relation); // follow/connect/accept answer with the real state
    } catch (e) {
      setRel(before);
      toast.error(e instanceof Error ? e.message : 'Something went wrong. Try again.'); // 404 unavailable / 429 daily limit carry the server's text
    } finally {
      setBusy(false);
      void qc.invalidateQueries({ queryKey: ['profile'] });
      void qc.invalidateQueries({ queryKey: ['people', 'requests'] });
      void qc.invalidateQueries({ queryKey: ['people'], refetchType: 'none' }); // other cards/lists refetch on next view
      void qc.invalidateQueries({ queryKey: ['feed', 'following'], refetchType: 'none' });
    }
  };
  const size = compact ? 'sm' : 'md';
  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} variant={connect.action === 'connect' || connect.action === 'accept' ? 'primary' : 'secondary'} disabled={busy} onClick={() => void run(connect.action)}>{connect.label}</Button>
      {rel.connection === 'incoming' && <Button size={size} variant="ghost" disabled={busy} onClick={() => void run('ignore')}>Ignore</Button>}
      <Button size={size} variant="secondary" disabled={busy} aria-pressed={rel.following} onClick={() => void run(follow.action)}>{follow.label}</Button>
    </div>
  );
}
