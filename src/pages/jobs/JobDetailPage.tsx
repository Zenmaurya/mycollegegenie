import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { BadgeCheck, ExternalLink, Flag, Share2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { jobFacts, KIND_LABEL, slotsLeft, statusLabel, type Job } from '../../lib/jobs';
import { JobsService, type Applicant } from '../../services/jobsService';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { UserLink } from '../../components/profile/UserLink';
import { Badge } from '../../components/ui/Badge';
import { Sheet } from '../../components/ui/Sheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const card = 'space-y-2 rounded-card bg-surface p-4 shadow-card';
const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

function ApplySheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['jobs-me'], queryFn: JobsService.me });
  const [resume, setResume] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [target, setTarget] = useState('');
  const resumeUrl = resume ?? me.data?.resumeUrl ?? '';
  const referral = job.kind === 'referral';
  const send = useMutation({
    mutationFn: () => JobsService.apply(job.id, { note: note.trim(), resume_url: resumeUrl.trim(), ...(referral ? { target: target.trim() } : {}) }),
    onSuccess: () => { toast.success(referral ? 'Referral request sent' : 'Application sent'); void qc.invalidateQueries({ queryKey: ['job', job.id] }); void qc.invalidateQueries({ queryKey: ['jobs-applied'] }); onClose(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); if (!send.isPending) send.mutate(); };
  return (
    <Sheet open onClose={onClose} title={referral ? `Ask for a referral at ${job.company}` : `Apply: ${job.title}`}>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {referral && (
          <div>
            <label htmlFor="ja-target" className="block text-[13px] font-semibold text-ink">Role or job link you want a referral for</label>
            <input id="ja-target" required value={target} onChange={(e) => setTarget(e.target.value)} maxLength={200} placeholder="e.g. SDE Intern, or the careers page link" className={inputCls} />
          </div>
        )}
        <div>
          <label htmlFor="ja-resume" className="block text-[13px] font-semibold text-ink">Resume link</label>
          <input id="ja-resume" required type="url" value={resumeUrl} onChange={(e) => setResume(e.target.value)} maxLength={500} placeholder="Google Drive or LinkedIn link" className={inputCls} />
          <p className="mt-1 text-[12px] text-ink-muted">Make sure "anyone with the link" can view it. We save it for next time.</p>
        </div>
        <div>
          <label htmlFor="ja-note" className="block text-[13px] font-semibold text-ink">Short note (optional)</label>
          <textarea id="ja-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={4} placeholder="Why you're a good fit" className={inputCls} />
        </div>
        <Button type="submit" loading={send.isPending}>{referral ? 'Send request' : 'Send application'}</Button>
      </form>
    </Sheet>
  );
}

function Applicants({ job }: { job: Job }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ['job-applicants', job.id], queryFn: () => JobsService.applications(job.id) });
  const decide = useMutation({
    mutationFn: ({ a, status }: { a: Applicant; status: 'accepted' | 'declined' }) => JobsService.decide(a.id, status),
    onSuccess: (r, { status }) => {
      void qc.invalidateQueries({ queryKey: ['job-applicants', job.id] }); void qc.invalidateQueries({ queryKey: ['job', job.id] });
      if (status === 'accepted') toast.success('Done. A chat is open in your inbox.', r.sessionId ? { action: { label: 'Open chat', onClick: () => navigate(`/inbox/${r.sessionId}`) } } : undefined);
    },
    onError: (e) => toast.error(errMsg(e)),
  });
  const referral = job.kind === 'referral';
  return (
    <section aria-labelledby="applicants-h" className="space-y-2">
      <h2 id="applicants-h" className="text-[17px] font-bold text-ink">{referral ? 'Referral requests' : 'Applicants'} ({q.data?.length ?? 0})</h2>
      {q.isPending && <Skeleton className="h-20 w-full" />}
      {q.isError && <p className="text-[15px] text-ink">Couldn't load applicants.</p>}
      {q.data?.length === 0 && <p className="text-[15px] text-ink-muted">No one yet. Share the post to reach more students.</p>}
      <ul className="space-y-2">
        {q.data?.map((a) => (
          <li key={a.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[15px] font-semibold text-ink"><UserLink username={a.username}>{a.display_name || 'A student'}</UserLink></p>
              <Badge tone={a.status === 'accepted' ? 'success' : 'neutral'}>{statusLabel(job.kind, a.status)}</Badge>
            </div>
            {a.target && <p className="text-[13px] text-ink">For: {a.target}</p>}
            {a.note && <p className="whitespace-pre-line text-[15px] text-ink">{a.note}</p>}
            <a href={a.resume_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-[15px] font-semibold text-brand hover:underline">Resume <ExternalLink className="h-4 w-4" aria-hidden /></a>
            {a.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ a, status: 'accepted' })}>{referral ? 'Accept & refer' : 'Shortlist'}</Button>
                <Button size="sm" variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ a, status: 'declined' })}>Decline</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function JobDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<'apply' | 'report' | null>(null);
  const q = useQuery({ queryKey: ['job', id, user?.id ?? 'anon'], queryFn: () => JobsService.get(id), retry: false });
  const job = q.data;
  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } });
  const needLogin = (fn: () => void) => () => (user ? fn() : toLogin());
  const close = useMutation({
    mutationFn: (closed: boolean) => JobsService.setClosed(id, closed),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['job', id] }); void qc.invalidateQueries({ queryKey: ['jobs-mine'] }); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const del = useMutation({
    mutationFn: () => JobsService.remove(id),
    onSuccess: () => { toast.success('Post deleted'); void qc.invalidateQueries({ queryKey: ['jobs-mine'] }); navigate('/jobs?view=mine'); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) return <EmptyState title="Could not load this post" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  if (!job) return <EmptyState title="This post isn't available" body="It may have closed, expired or been removed." action={<Link to="/jobs" className="font-semibold text-brand hover:underline">Browse jobs</Link>} />;

  const left = slotsLeft(job);
  const mine = !!job.isMine;
  const share = async () => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    if (navigator.share) { try { await navigator.share({ title: job.title, url }); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* blocked */ }
  };
  const status = job.isHidden ? 'Hidden by moderators' : !job.isApproved ? 'In review: an admin will check it soon' : job.isClosed ? 'Closed' : !job.live ? 'Expired' : null;

  let action = null;
  if (!mine && job.live) {
    if (job.myApplication) action = <p className="text-[15px] font-semibold text-ink">You {job.kind === 'referral' ? 'requested a referral' : 'applied'}: {statusLabel(job.kind, job.myApplication.status)}</p>;
    else if (job.applyMode === 'link' && job.applyUrl) action = <a href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Apply on company site <ExternalLink className="h-4 w-4" aria-hidden /></a>;
    else action = <Button className="w-full" onClick={needLogin(() => setSheet('apply'))}>{job.kind === 'referral' ? 'Request referral' : 'Apply on MCG'}</Button>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-24">
      <Helmet><title>{`${job.title} at ${job.company} | MyCollegeGenie`}</title></Helmet>
      {status && (mine || job.isHidden) && <p role="status" className="rounded-sm border border-line bg-surface p-3 text-[15px] font-semibold text-ink">{status}</p>}
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{KIND_LABEL[job.kind]}</Badge>
          {job.verifiedDomain ? <Badge tone="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden />Verified @{job.verifiedDomain}</Badge> : <Badge>Not verified</Badge>}
          {left != null && <Badge>{left} of {job.slots} referral slots left</Badge>}
        </div>
        <h1 className="text-[22px] font-bold leading-tight text-ink">{job.title}</h1>
        <p className="text-[15px] text-ink-muted">{jobFacts(job)}</p>
        <p className="text-[13px] text-ink-muted">Posted by <UserLink username={job.posterUsername}>{job.posterName || 'a member'}</UserLink> · closes {new Date(job.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      </header>

      <p className="flex items-start gap-2 rounded-sm border border-line bg-surface p-3 text-[13px] text-ink">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> MCG never asks for fees. Never pay to apply or to get a referral. Report posts that ask for money.
      </p>

      <div className={card}>
        {action}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => void share()}><Share2 className="h-5 w-5" aria-hidden /> Share</Button>
          {!mine && job.isApproved && <Button variant="ghost" onClick={needLogin(() => setSheet('report'))}><Flag className="h-5 w-5" aria-hidden /> Report</Button>}
          {mine && !job.isHidden && job.isApproved && <Button variant="secondary" disabled={close.isPending} onClick={() => close.mutate(!job.isClosed)}>{job.isClosed ? 'Reopen' : 'Close post'}</Button>}
          {mine && <Button variant="ghost" disabled={del.isPending} onClick={() => { if (window.confirm('Delete this post and all its applications?')) del.mutate(); }}>Delete</Button>}
        </div>
      </div>

      <section aria-label="About the role"><p className="whitespace-pre-line text-[15px] text-ink">{job.description}</p></section>
      {mine && job.applyMode === 'mcg' && <Applicants job={job} />}

      {sheet === 'apply' && <ApplySheet job={job} onClose={() => setSheet(null)} />}
      {sheet === 'report' && <ReportSheet open onClose={() => setSheet(null)} itemType="job" itemId={job.id} title="Report this post" />}
    </div>
  );
}
