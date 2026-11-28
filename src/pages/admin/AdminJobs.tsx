import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jobFacts, KIND_LABEL, type Job } from '../../lib/jobs';
import { JobsService } from '../../services/jobsService';
import { ConfirmSheet } from './ConfirmSheet';

const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';

// Posts from unverified posters: approve makes them public, reject deletes them.
export function AdminJobs() {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState<Job | null>(null);
  const q = useInfiniteQuery({
    queryKey: ['admin-jobs-pending'], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => JobsService.pending(pageParam), getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const done = () => { void qc.invalidateQueries({ queryKey: ['admin-jobs-pending'] }); setRejecting(null); };
  const act = useMutation({
    mutationFn: ({ j, kind }: { j: Job; kind: 'approve' | 'reject' }) => (kind === 'approve' ? JobsService.approve(j.id) : JobsService.remove(j.id)),
    onSuccess: (_r, { kind }) => { toast.success(kind === 'approve' ? 'Post approved' : 'Post rejected'); void qc.invalidateQueries({ queryKey: ['jobs'] }); done(); },
    onError: (e) => { toast.error(e instanceof Error ? e.message : 'Action failed'); done(); },
  });
  const rows = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section aria-labelledby="jobs-h" className="space-y-4">
      <h2 id="jobs-h" className="text-xl font-black text-gray-900">Job posts waiting for approval</h2>
      {q.isLoading ? <p className="text-gray-600">Loading...</p> : q.isError ? <p className="text-rose-700">Could not load job posts.</p>
        : !rows.length ? <p className="text-gray-600">No posts waiting</p> : (
        <ul className="space-y-3">
          {rows.map((j) => (
            <li key={j.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0 text-sm text-gray-800 space-y-1">
                <Link to={`/jobs/${j.id}`} className="font-black text-purple-700 underline break-words">{j.title}</Link>
                <p>{KIND_LABEL[j.kind]} · {jobFacts(j)} · by {j.posterName || 'a member'}</p>
                {j.applyUrl && <p className="break-all">Apply link: {j.applyUrl}</p>}
                <p className="whitespace-pre-line break-words">{j.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-start">
                <button type="button" className={`${btn} bg-emerald-700 text-white`} disabled={act.isPending} aria-label={`Approve ${j.title}`} onClick={() => act.mutate({ j, kind: 'approve' })}>Approve</button>
                <button type="button" className={`${btn} bg-rose-700 text-white`} disabled={act.isPending} aria-label={`Reject ${j.title}`} onClick={() => setRejecting(j)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {q.hasNextPage && <button type="button" className={`${btn} bg-gray-100 text-gray-900`} disabled={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</button>}
      <ConfirmSheet open={!!rejecting} onClose={() => setRejecting(null)} title="Reject this post?" message={`"${rejecting?.title ?? ''}" will be deleted. This can't be undone.`}
        confirmLabel="Reject" danger confirmDisabled={act.isPending} onConfirm={() => rejecting && act.mutate({ j: rejecting, kind: 'reject' })} />
    </section>
  );
}
