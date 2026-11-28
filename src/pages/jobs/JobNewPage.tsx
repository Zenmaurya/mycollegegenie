import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { emptyJobDraft, EXPIRY_DAYS, jobDraftToPayload, jobProblem, KIND_LABEL, MODE_LABEL, type JobDraft, type JobKind, type WorkMode } from '../../lib/jobs';
import { JobsService } from '../../services/jobsService';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const card = 'space-y-3 rounded-card bg-surface p-4 shadow-card';
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="block text-[13px] font-semibold text-ink">{label}</label>{children}{hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}</div>;
}

function WorkEmailCard({ domain, pending }: { domain: string | null; pending: string | null }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(!!pending);
  const send = useMutation({ mutationFn: () => JobsService.sendCode(email.trim()), onSuccess: () => { setSent(true); toast.success('Code sent. Check your work inbox.'); }, onError: (e) => toast.error(errMsg(e)) });
  const verify = useMutation({ mutationFn: () => JobsService.verifyCode(code.trim()), onSuccess: () => { toast.success('Work email verified'); void qc.invalidateQueries({ queryKey: ['jobs-me'] }); }, onError: (e) => toast.error(errMsg(e)) });
  if (domain) return <p className="flex items-center gap-2 rounded-sm bg-success/10 p-3 text-[15px] font-semibold text-[#0B6E3E]"><BadgeCheck className="h-5 w-5" aria-hidden /> Verified @{domain}. Your posts go live at once.</p>;
  return (
    <section className={card} aria-labelledby="we-h">
      <h2 id="we-h" className="text-[17px] font-bold text-ink">Verify your work email</h2>
      <p className="text-[13px] text-ink-muted">Use your company or college email (not Gmail). Verified posts go live at once and show a badge. Without it, an admin checks your post first. Referrals need it.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (email.trim()) send.mutate(); }}>
        <label htmlFor="we-email" className="sr-only">Work email</label>
        <input id="we-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
        <Button type="submit" variant="secondary" className="mt-1" loading={send.isPending}>{sent ? 'Resend' : 'Send code'}</Button>
      </form>
      {sent && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) verify.mutate(); }}>
          <label htmlFor="we-code" className="sr-only">6-digit code</label>
          <input id="we-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit code" className={inputCls} />
          <Button type="submit" className="mt-1" loading={verify.isPending}>Verify</Button>
        </form>
      )}
    </section>
  );
}

export function JobNewPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [d, setD] = useState<JobDraft>(emptyJobDraft());
  const me = useQuery({ queryKey: ['jobs-me'], queryFn: JobsService.me, enabled: !!user });
  const domain = me.data?.workEmail?.domain ?? null;
  const upd = (p: Partial<JobDraft>) => setD((x) => ({ ...x, ...p }));
  const create = useMutation({
    mutationFn: () => JobsService.create(jobDraftToPayload(d)),
    onSuccess: (r) => { toast.success(r.live ? 'Your post is live' : 'Sent for review. It goes live once an admin approves it.'); void qc.invalidateQueries({ queryKey: ['jobs'] }); void qc.invalidateQueries({ queryKey: ['jobs-mine'] }); navigate(`/jobs/${r.id}`); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (loading) return <div className="mx-auto max-w-2xl p-4"><Skeleton className="h-40 w-full" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: { pathname: '/jobs/new' } }} replace />;

  const referral = d.kind === 'referral';
  const problem = referral && !domain ? 'Verify your work email to offer referrals' : jobProblem(d);
  const submit = (e: FormEvent) => { e.preventDefault(); if (problem) { toast.error(problem); return; } if (!create.isPending) create.mutate(); };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24">
      <Helmet><title>Post an opportunity | MyCollegeGenie</title></Helmet>
      <h1 className="text-[22px] font-bold text-ink">Post an opportunity</h1>
      {me.isPending ? <Skeleton className="h-24 w-full" /> : <WorkEmailCard domain={domain} pending={me.data?.pendingEmail ?? null} />}

      <form onSubmit={submit} className={card} noValidate>
        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">What are you posting?</legend>
          <div className="flex flex-wrap gap-2">{(Object.keys(KIND_LABEL) as JobKind[]).map((k) => <Chip key={k} selected={d.kind === k} onToggle={() => upd({ kind: k })}>{k === 'referral' ? 'I can refer' : KIND_LABEL[k]}</Chip>)}</div>
          {referral && <p className="mt-2 text-[13px] text-ink-muted">Students send you a request with their resume. You accept or decline each one. Accepting opens a chat.</p>}
        </fieldset>
        <Field id="jn-title" label={referral ? 'Roles or teams you can refer for' : 'Role title'}><input id="jn-title" value={d.title} onChange={(e) => upd({ title: e.target.value })} maxLength={120} placeholder={referral ? 'e.g. SDE and analyst roles' : 'e.g. Marketing Intern'} className={inputCls} /></Field>
        <Field id="jn-company" label="Company or organisation"><input id="jn-company" value={d.company} onChange={(e) => upd({ company: e.target.value })} maxLength={80} className={inputCls} /></Field>
        <Field id="jn-loc" label="City (optional)"><input id="jn-loc" value={d.location} onChange={(e) => upd({ location: e.target.value })} maxLength={80} placeholder="e.g. Delhi" className={inputCls} /></Field>
        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">Work mode</legend>
          <div className="flex flex-wrap gap-2">{(Object.keys(MODE_LABEL) as WorkMode[]).map((m) => <Chip key={m} selected={d.mode === m} onToggle={() => upd({ mode: m })}>{MODE_LABEL[m]}</Chip>)}</div>
        </fieldset>
        {!referral && (
          <>
            <fieldset>
              <legend className="mb-1 text-[13px] font-semibold text-ink">Pay</legend>
              <div className="flex flex-wrap gap-2"><Chip selected={d.paid} onToggle={() => upd({ paid: true })}>Paid</Chip><Chip selected={!d.paid} onToggle={() => upd({ paid: false })}>Unpaid</Chip></div>
            </fieldset>
            {d.paid && <Field id="jn-pay" label="Stipend or salary (optional)"><input id="jn-pay" value={d.pay} onChange={(e) => upd({ pay: e.target.value })} maxLength={60} placeholder="e.g. ₹15,000 / month" className={inputCls} /></Field>}
            <fieldset>
              <legend className="mb-1 text-[13px] font-semibold text-ink">How do students apply?</legend>
              <div className="flex flex-wrap gap-2"><Chip selected={d.applyMode === 'mcg'} onToggle={() => upd({ applyMode: 'mcg' })}>On MCG</Chip><Chip selected={d.applyMode === 'link'} onToggle={() => upd({ applyMode: 'link' })}>Company site link</Chip></div>
            </fieldset>
            {d.applyMode === 'link' && <Field id="jn-url" label="Application link"><input id="jn-url" type="url" value={d.applyUrl} onChange={(e) => upd({ applyUrl: e.target.value })} maxLength={500} placeholder="https://" className={inputCls} /></Field>}
          </>
        )}
        {referral && <Field id="jn-slots" label="How many referrals can you give?"><input id="jn-slots" type="number" min={1} max={50} value={d.slots} onChange={(e) => upd({ slots: e.target.value })} className={inputCls} /></Field>}
        <Field id="jn-desc" label="Details" hint="Skills needed, duration, eligibility. Never ask students for money."><textarea id="jn-desc" rows={6} value={d.description} onChange={(e) => upd({ description: e.target.value })} maxLength={4000} className={inputCls} /></Field>
        <fieldset>
          <legend className="mb-1 text-[13px] font-semibold text-ink">Close after</legend>
          <div className="flex flex-wrap gap-2">{EXPIRY_DAYS.map((n) => <Chip key={n} selected={d.expiresInDays === n} onToggle={() => upd({ expiresInDays: n })}>{`${n} days`}</Chip>)}</div>
        </fieldset>
        <Button type="submit" className="w-full" loading={create.isPending} disabled={referral && !domain}>{domain ? 'Publish' : 'Send for review'}</Button>
      </form>
    </div>
  );
}
