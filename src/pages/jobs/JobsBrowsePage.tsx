import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { BadgeCheck, Plus, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { jobFacts, KIND_LABEL, MODE_LABEL, slotsLeft, statusLabel, type Job, type JobKind, type WorkMode } from '../../lib/jobs';
import { JobsService } from '../../services/jobsService';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const TABS: { v: JobKind; l: string }[] = [{ v: 'internship', l: 'Internships' }, { v: 'job', l: 'Jobs' }, { v: 'referral', l: 'Referrals' }];
const card = 'block space-y-1.5 rounded-card bg-surface p-4 shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand';

export function JobRow({ job, mine }: { job: Job; mine?: boolean }) {
  const left = slotsLeft(job);
  const state = !mine ? null : job.isHidden ? 'Hidden' : !job.isApproved ? 'In review' : job.isClosed ? 'Closed' : new Date(job.expiresAt) < new Date() ? 'Expired' : 'Live';
  return (
    <Link to={`/jobs/${job.id}`} className={card}>
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">{KIND_LABEL[job.kind]}</Badge>
        {job.verifiedDomain && <Badge tone="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden />Verified @{job.verifiedDomain}</Badge>}
        {left != null && <Badge>{left} {left === 1 ? 'slot' : 'slots'} left</Badge>}
        {state && <Badge>{state}</Badge>}
      </span>
      <span className="block text-[17px] font-bold text-ink">{job.title}</span>
      <span className="block text-[13px] text-ink-muted">{jobFacts(job)}</span>
      {mine && <span className="block text-[13px] text-ink">{job.applicantCount ?? 0} {job.applicantCount === 1 ? 'applicant' : 'applicants'}</span>}
    </Link>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return <EmptyState title="Couldn't load" body="Check your connection and try again." action={<Button onClick={onRetry}>Retry</Button>} />;
}

function MyActivity() {
  const posts = useQuery({ queryKey: ['jobs-mine'], queryFn: JobsService.mine });
  const applied = useQuery({ queryKey: ['jobs-applied'], queryFn: JobsService.applied });
  return (
    <div className="space-y-6">
      <section aria-labelledby="my-posts" className="space-y-2">
        <h2 id="my-posts" className="text-[17px] font-bold text-ink">My posts</h2>
        {posts.isPending && <Skeleton className="h-24 w-full rounded-card" />}
        {posts.isError && <LoadError onRetry={() => void posts.refetch()} />}
        {posts.data?.length === 0 && <p className="text-[15px] text-ink-muted">You haven't posted anything yet.</p>}
        <ul className="space-y-3">{posts.data?.map((j) => <li key={j.id}><JobRow job={j} mine /></li>)}</ul>
      </section>
      <section aria-labelledby="my-apps" className="space-y-2">
        <h2 id="my-apps" className="text-[17px] font-bold text-ink">My applications</h2>
        {applied.isPending && <Skeleton className="h-24 w-full rounded-card" />}
        {applied.isError && <LoadError onRetry={() => void applied.refetch()} />}
        {applied.data?.length === 0 && <p className="text-[15px] text-ink-muted">No applications yet.</p>}
        <ul className="space-y-3">
          {applied.data?.map((a) => (
            <li key={a.id}>
              <Link to={`/jobs/${a.job_id}`} className={card}>
                <Badge tone={a.status === 'accepted' ? 'success' : 'neutral'}>{statusLabel(a.kind, a.status)}</Badge>
                <span className="block text-[15px] font-bold text-ink">{a.title}</span>
                <span className="block text-[13px] text-ink-muted">{a.company}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function JobsBrowsePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? '';
  const mine = !!user && get('view') === 'mine';
  // URL values are untrusted: unknown enums are ignored.
  const kind: JobKind = TABS.find((t) => t.v === get('kind'))?.v ?? 'internship';
  const mode = Object.keys(MODE_LABEL).includes(get('mode')) ? get('mode') : '';
  const paid = kind !== 'referral' && get('paid') === '1' ? '1' : '';
  const verified = get('verified') === '1' ? '1' : '';
  const q = get('q');
  const [qInput, setQInput] = useState(q);

  const set = (next: Record<string, string>) => setParams((prev) => {
    const out = new URLSearchParams(prev);
    for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
    return out;
  }, { replace: true });
  useEffect(() => setQInput(q), [q]);
  useEffect(() => {
    if (qInput.trim() === q) return;
    const t = setTimeout(() => set({ q: qInput.trim() }), 300);
    return () => clearTimeout(t);
  }, [qInput, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = { kind, mode, paid, verified, q };
  const list = useInfiniteQuery({
    queryKey: ['jobs', filters], queryFn: ({ pageParam }) => JobsService.list(filters, pageParam),
    initialPageParam: undefined as string | undefined, getNextPageParam: (p) => p.nextCursor ?? undefined, enabled: !mine,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = !!(mode || paid || verified || q);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 pb-24 sm:px-4">
      <Helmet>
        <title>Internships, Jobs & Referrals | MyCollegeGenie</title>
        <meta name="description" content="Internships, jobs and employee referrals for Delhi University students." />
        <link rel="canonical" href="https://mycollegegenie.in/jobs" />
      </Helmet>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-bold text-ink">Internships & Jobs</h1>
        <Link to="/jobs/new" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand"><Plus className="h-4 w-4" aria-hidden /> Post</Link>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sections">
        {TABS.map((t) => <span key={t.v}><Chip selected={!mine && kind === t.v} onToggle={() => set({ kind: t.v, view: '' })}>{t.l}</Chip></span>)}
        {user && <Chip selected={mine} onToggle={() => set({ view: 'mine' })}>My activity</Chip>}
      </div>

      {mine ? <MyActivity /> : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} maxLength={60} aria-label="Search by role, company or city" placeholder="Search role, company or city"
              className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filters">
            {(Object.keys(MODE_LABEL) as WorkMode[]).map((m) => <span key={m}><Chip selected={mode === m} onToggle={() => set({ mode: mode === m ? '' : m })}>{MODE_LABEL[m]}</Chip></span>)}
            {kind !== 'referral' && <Chip selected={!!paid} onToggle={() => set({ paid: paid ? '' : '1' })}>Paid only</Chip>}
            <Chip selected={!!verified} onToggle={() => set({ verified: verified ? '' : '1' })}>Verified only</Chip>
          </div>
          <p className="rounded-sm border border-line bg-surface p-3 text-[13px] text-ink">MCG never asks for fees. Never pay to apply or to get a referral.</p>
          {list.isPending && <Skeleton className="h-24 w-full rounded-card" />}
          {list.isError && !items.length && <LoadError onRetry={() => void list.refetch()} />}
          {list.isSuccess && !items.length && <EmptyState title="Nothing here yet" body={filtered ? 'Try removing a filter or searching for something else.' : 'Know of an opening? Post it for other students.'} />}
          <ul className="space-y-3">{items.map((j) => <li key={j.id}><JobRow job={j} /></li>)}</ul>
          {list.hasNextPage && <Button variant="secondary" className="mx-auto flex" loading={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>Load more</Button>}
        </>
      )}
    </div>
  );
}
