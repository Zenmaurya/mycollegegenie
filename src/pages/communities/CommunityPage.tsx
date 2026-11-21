import { useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getCommunity } from '../../services/communityService';
import type { PostKind } from '../../lib/communities';
import { Composer } from '../../components/feed/Composer';
import { CommunityHeader } from '../../components/communities/CommunityHeader';
import { PostsTab } from '../../components/communities/PostsTab';
import { DiscussionTab } from '../../components/communities/DiscussionTab';
import { EventsTab } from '../../components/communities/EventsTab';
import { TeamTab } from '../../components/communities/TeamTab';
import { AboutTab } from '../../components/communities/AboutTab';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const TABS = [
  { id: 'posts', label: 'Posts' }, { id: 'discussion', label: 'Discussion' }, { id: 'events', label: 'Events' },
  { id: 'team', label: 'Team' }, { id: 'about', label: 'About' },
];
const UNAVAILABLE = 'This page is unavailable';

export function CommunityPage() {
  const { slug = '', tab } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { appUser } = useAuth();
  const viewer = appUser?.uid ?? 'anon';
  const [reportOpen, setReportOpen] = useState(false);
  const [composeKind, setComposeKind] = useState<PostKind | null>(null);

  const q = useQuery({ queryKey: ['community', viewer, appUser?.collegeId ?? '', slug], queryFn: () => getCommunity(slug), retry: false });
  const current = tab ?? 'posts';
  if (tab && !TABS.some((t) => t.id === tab)) return <Navigate to={`/c/${slug}`} replace />;

  const wrap = (children: ReactNode) => <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">{children}</div>;
  if (q.isPending) return wrap(<><Skeleton className="h-56 w-full rounded-card" /><Skeleton className="h-24 w-full rounded-card" /></>);
  if (q.isError) {
    const gone = q.error instanceof Error && q.error.message === UNAVAILABLE;
    return wrap(
      <div className="rounded-card bg-surface p-6 text-center shadow-card">
        <p className="mb-3 text-[17px] font-semibold text-ink">{gone ? UNAVAILABLE : "Couldn't load this page"}</p>
        {gone ? <Button onClick={() => navigate('/c')}>Browse societies</Button> : <Button onClick={() => void q.refetch()}>Retry</Button>}
      </div>,
    );
  }

  const d = q.data;
  const role = d.viewer.status === 'active' ? d.viewer.role : null;
  // prefix match: refreshes both the official and discussion lists
  const posted = () => {
    void qc.invalidateQueries({ queryKey: ['community-posts', viewer, slug] });
    void qc.invalidateQueries({ queryKey: ['feed'] });
  };

  return wrap(
    <>
      <CommunityHeader detail={d} onChanged={() => Promise.all([
        qc.invalidateQueries({ queryKey: ['community', viewer] }),
        qc.invalidateQueries({ queryKey: ['community-team', slug] }),
        qc.invalidateQueries({ queryKey: ['community-posts', viewer, slug] }),
        qc.invalidateQueries({ queryKey: ['community-events', viewer, slug] }),
      ])} onReport={() => setReportOpen(true)} />
      <Tabs label="Society sections" items={TABS} value={current} onChange={(id) => navigate(id === 'posts' ? `/c/${slug}` : `/c/${slug}/${id}`)} />
      <div role="tabpanel" aria-labelledby={`tab-${current}`} className="space-y-3">
        {current === 'posts' && <PostsTab detail={d} onCreate={() => setComposeKind('official')} />}
        {current === 'discussion' && <DiscussionTab detail={d} onStart={() => setComposeKind('discussion')} />}
        {current === 'events' && <EventsTab detail={d} />}
        {current === 'team' && <TeamTab slug={slug} />}
        {current === 'about' && <AboutTab detail={d} />}
      </div>
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} itemType="community" itemId={d.id} title="Report page" />
      <Composer open={composeKind !== null} onClose={() => setComposeKind(null)} onPosted={posted}
        initialKind={composeKind ?? undefined} community={{ id: d.id, name: d.name, kind: d.kind, role }} />
    </>,
  );
}
