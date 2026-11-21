import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { getCommunity, updateCommunity, type CommunityInput } from '../../services/communityService';
import { deleteEvent, listCommunityEvents } from '../../services/eventService';
import { validateCommunityForm, type CommunityDetail, type CommunityForm, type EventCard } from '../../lib/communities';
import { CommunityFields, Field, field, pickImage, uploadImage } from '../../components/communities/CommunityFields';
import { MembersPanel } from '../../components/communities/MembersPanel';
import { VerificationPanel } from '../../components/communities/VerificationPanel';
import { EventForm } from '../../components/communities/EventForm';
import { ConfirmSheet } from '../../components/communities/ConfirmSheet';
import { Tabs } from '../../components/ui/Tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

export const wrapPage = (children: ReactNode) => <div className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">{children}</div>;

/** Same cache key as CommunityPage so both share one fetch. */
export function useCommunity(slug: string) {
  const { appUser } = useAuth();
  const viewer = appUser?.uid ?? 'anon';
  const q = useQuery({ queryKey: ['community', viewer, appUser?.collegeId ?? '', slug], queryFn: () => getCommunity(slug), retry: false });
  return { q, viewer, uid: appUser?.uid ?? '' };
}

function PageSection({ detail, onChanged }: { detail: CommunityDetail; onChanged: () => Promise<unknown> }) {
  const [f, setF] = useState<CommunityForm>({
    name: detail.name, category: detail.category, description: detail.description ?? '',
    instagram: detail.links.instagram ?? '', linkedin: detail.links.linkedin ?? '', website: detail.links.website ?? '', email: detail.links.email ?? '',
  });
  const [recruit, setRecruit] = useState((detail.recruitment_until ?? '').slice(0, 10));
  const [achievements, setAchievements] = useState(detail.achievements ?? '');
  const [advisor, setAdvisor] = useState(detail.faculty_advisor ?? '');
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof CommunityForm) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pick = (setter: (f: File | null) => void, label: string) => pickImage(setter, (m) => setErrors((p) => ({ ...p, [label]: m })));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const v = validateCommunityForm(f);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const [logo_url, banner_url] = await Promise.all([uploadImage(logo), uploadImage(banner)]);
      const links: Record<string, string> = {};
      for (const k of ['instagram', 'linkedin', 'website', 'email'] as const) if (f[k].trim()) links[k] = f[k].trim();
      const patch: Partial<CommunityInput> = {
        name: f.name.trim(), category: f.category, description: f.description.trim(), links,
        achievements: achievements.trim() || null, faculty_advisor: advisor.trim() || null, recruitment_until: recruit || null,
        // no new file: resend the stored URL so the image is kept
        ...(logo_url ? { logo_url } : { logo_url: detail.logo_url }), ...(banner_url ? { banner_url } : { banner_url: detail.banner_url }),
      };
      const r = await updateCommunity(detail.slug, patch);
      if (r.statusReset) toast('Name changed — your page needs to be verified again');
      else toast.success('Page saved');
      await onChanged();
    } catch (err: any) {
      setServerError(err?.message || 'Could not save the page');
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <CommunityFields f={f} errors={errors} onChange={set} onLogo={pick(setLogo, 'logo')} onBanner={pick(setBanner, 'banner')} nameLocked={detail.kind === 'mcg'} />
      <Field id="advisor" label="Faculty advisor (optional)">
        <input id="advisor" className={field} value={advisor} maxLength={120} onChange={(e) => setAdvisor(e.target.value)} />
      </Field>
      <Field id="achievements" label="Achievements (optional)">
        <textarea id="achievements" className={`${field} py-2`} rows={3} maxLength={2000} value={achievements} onChange={(e) => setAchievements(e.target.value)} />
      </Field>
      <Field id="recruitment" label="Recruitment open until (optional)">
        <input id="recruitment" type="date" className={field} value={recruit} onChange={(e) => setRecruit(e.target.value)} />
      </Field>
      {serverError && <p role="alert" className="text-[15px] text-danger">{serverError}</p>}
      <Button type="submit" loading={busy}>Save page</Button>
    </form>
  );
}

function EventsSection({ detail, viewer, onChanged }: { detail: CommunityDetail; viewer: string; onChanged: () => Promise<unknown> }) {
  const q = useQuery({ queryKey: ['community-events', viewer, detail.slug], queryFn: () => listCommunityEvents(detail.slug) });
  const [editing, setEditing] = useState<EventCard | null>(null);
  const [deleting, setDeleting] = useState<EventCard | null>(null);
  const [error, setError] = useState('');
  const del = useMutation({
    mutationFn: (e: EventCard) => deleteEvent(e.id),
    onSuccess: async () => { setDeleting(null); setError(''); await onChanged(); },
    onError: (e: Error) => { setDeleting(null); setError(e.message || 'Could not delete the event'); },
  });
  const isOfficial = detail.status === 'official' || detail.kind === 'mcg';

  if (editing) {
    return <EventForm slug={detail.slug} isOfficial={isOfficial} initial={editing} onCancel={() => setEditing(null)}
      onSaved={() => { setEditing(null); toast.success('Event saved'); void onChanged(); }} />;
  }
  return (
    <div className="space-y-3">
      <Link to={`/c/${detail.slug}/events/new`} className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">Add event</Link>
      {error && <p role="alert" className="text-[15px] text-danger">{error}</p>}
      {q.isPending && <Skeleton className="h-20 w-full rounded-card" />}
      {q.isError && <Button onClick={() => void q.refetch()}>Retry loading events</Button>}
      {q.isSuccess && q.data.length === 0 && <p className="text-[15px] text-ink-muted">No events yet</p>}
      {q.isSuccess && q.data.length > 0 && (
        <ul className="divide-y divide-line rounded-card bg-surface shadow-card">
          {q.data.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{e.title}</span>
                <span className="block text-[13px] text-ink-muted">{e.type} · {new Date(e.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
              <Button size="sm" variant="secondary" onClick={() => setEditing(e)} aria-label={`Edit ${e.title}`}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => setDeleting(e)} aria-label={`Delete ${e.title}`}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmSheet open={deleting !== null} title="Delete event?" body={deleting ? `"${deleting.title}" will be removed for everyone. This can't be undone.` : ''}
        confirmLabel="Delete" busy={del.isPending} onClose={() => setDeleting(null)} onConfirm={() => deleting && del.mutate(deleting)} />
    </div>
  );
}

export function ManageCommunityPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { q, viewer, uid } = useCommunity(slug);
  const [tab, setTab] = useState('');

  if (q.isPending) return wrapPage(<Skeleton className="h-56 w-full rounded-card" />);
  if (q.isError) {
    return wrapPage(<div className="rounded-card bg-surface p-6 text-center shadow-card"><p className="mb-3 text-[17px] font-semibold text-ink">Couldn't load this page</p><Button onClick={() => void q.refetch()}>Retry</Button></div>);
  }
  const d = q.data;
  const role = d.viewer.status === 'active' ? d.viewer.role : null;
  if (role !== 'admin' && role !== 'core') return <Navigate to={`/c/${slug}`} replace />;

  const tabs = role === 'admin'
    ? [{ id: 'page', label: 'Page' }, { id: 'members', label: 'Members' }, { id: 'events', label: 'Events' }, { id: 'verification', label: 'Verification' }]
    : [{ id: 'members', label: 'Members' }, { id: 'events', label: 'Events' }];
  const current = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const changed = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['community', viewer] }),
    qc.invalidateQueries({ queryKey: ['community-team', slug] }),
    qc.invalidateQueries({ queryKey: ['community-members', slug] }),
    qc.invalidateQueries({ queryKey: ['community-events', viewer, slug] }),
  ]);

  return wrapPage(
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[22px] font-bold text-ink">Manage {d.name}</h1>
        <Button variant="ghost" onClick={() => navigate(`/c/${slug}`)}>View page</Button>
      </div>
      <Tabs label="Manage sections" items={tabs} value={current} onChange={setTab} />
      <div role="tabpanel" aria-labelledby={`tab-${current}`}>
        {current === 'page' && <PageSection detail={d} onChanged={changed} />}
        {current === 'members' && <MembersPanel slug={slug} viewerId={uid} viewerRole={role} onChanged={changed} />}
        {current === 'events' && <EventsSection detail={d} viewer={viewer} onChanged={changed} />}
        {current === 'verification' && <VerificationPanel detail={d} onChanged={() => void changed()} />}
      </div>
    </>,
  );
}
