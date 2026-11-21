import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EventForm } from '../../components/communities/EventForm';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { useCommunity, wrapPage } from './ManageCommunityPage';

export function NewEventPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { q, viewer, role } = useCommunity(slug);

  if (q.isPending) return wrapPage(<Skeleton className="h-56 w-full rounded-card" />);
  if (q.isError) return wrapPage(<Button onClick={() => void q.refetch()}>Retry</Button>);
  const d = q.data;
  if (!role) return <Navigate to={`/c/${slug}`} replace />;

  const back = () => navigate(`/c/${slug}/events`);
  const cancel = () => navigate(`/c/${slug}/manage?tab=events`);
  return wrapPage(
    <EventForm slug={slug} isOfficial={d.status === 'official' || d.kind === 'mcg'} onCancel={cancel}
      onSaved={async () => {
        await Promise.all([
          qc.invalidateQueries({ queryKey: ['community', viewer] }),
          qc.invalidateQueries({ queryKey: ['community-team', slug] }),
          qc.invalidateQueries({ queryKey: ['community-members', slug] }),
          qc.invalidateQueries({ queryKey: ['community-events', viewer, slug] }),
        ]);
        toast.success('Event added');
        back();
      }} />,
  );
}
