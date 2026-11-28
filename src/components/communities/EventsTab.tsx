import { Fragment, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { canRegister, type CommunityDetail, type EventCard } from '../../lib/communities';
import { listCommunityEvents, setInterest } from '../../services/eventService';
import { EventCardView } from './EventCardView';
import { ReportSheet } from './ReportSheet';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

export function EventsTab({ detail }: { detail: CommunityDetail }) {
  const { user, appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [reporting, setReporting] = useState<EventCard | null>(null);
  const key = ['community-events', appUser?.uid ?? 'anon', detail.slug];
  const q = useQuery({ queryKey: key, queryFn: () => listCommunityEvents(detail.slug) });
  const register = canRegister(detail, appUser?.collegeId);
  const isMember = detail.viewer.status === 'active' && !!detail.viewer.role;
  const isMod = isMember && (detail.viewer.role === 'admin' || detail.viewer.role === 'core');
  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname } } });

  const toggle = async (e: EventCard) => {
    if (!user) return toLogin();
    try { await setInterest(e.id, !e.interested); await qc.invalidateQueries({ queryKey: key }); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not update interest'); }
  };
  const report = (e: EventCard) => (user ? setReporting(e) : toLogin());

  return (
    <div className="space-y-3">
      {isMember && <Link to={`/c/${detail.slug}/events/new`} className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">{isMod ? 'Add event' : 'Submit event'}</Link>}
      {q.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-40 w-full rounded-card" />)}
      {q.isError && (
        <div className="rounded-card bg-surface p-6 text-center shadow-card">
          <p className="mb-3 text-[15px] text-ink">Couldn't load events</p>
          <Button onClick={() => void q.refetch()}>Retry</Button>
        </div>
      )}
      {q.isSuccess && q.data.length === 0 && <div className="rounded-card bg-surface shadow-card"><EmptyState title="No events yet" body="Upcoming events from this society will show up here." /></div>}
      {q.isSuccess && q.data.length > 0 && (
        <ul className="space-y-3">
          {q.data.map((e) => <Fragment key={e.id}><EventCardView event={e} now={new Date()} canRegister={register} onToggleInterest={toggle} onReport={report} /></Fragment>)}
        </ul>
      )}
      {reporting && <ReportSheet open onClose={() => setReporting(null)} itemType="event" itemId={reporting.id} title="Report event" />}
    </div>
  );
}
