import { Fragment, lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../context/ResourceContext';
import { fetchWithAuth } from '../../lib/apiClient';
import { courseShort, previewKind } from '../../lib/notes';
import { NotesService, type RatingResult } from '../../services/notesService';
import type { Resource } from '../../types';
import { CommentComposer } from '../../components/post/CommentComposer';
import { NoteActions } from '../../components/notes/NoteActions';
import { NotesSection } from '../../components/notes/NotesSection';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { UserLink } from '../../components/profile/UserLink';

const loadNotePreview = () => import('../../components/notes/NotePreview');
const NotePreview = lazy(loadNotePreview);
// Fetch the preview code and PDF engine alongside the note data, not after it. A failed warm-up is ignored; the preview imports them again.
void Promise.all([loadNotePreview(), import('pdfjs-dist')]).catch(() => {});

type Tab = 'about' | 'tips' | 'discussion';
// exam-tips rows carry `tip`, comments rows carry `content`
interface Row { id: string; user_name: string; tip?: string; content?: string }

function Feed({ id, kind }: { id: string; kind: 'tips' | 'discussion' }) {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const path = `/api/resources/${encodeURIComponent(id)}/${kind === 'tips' ? 'exam-tips' : 'comments'}`;
  const key = ['note-feed', id, kind];
  const list = useQuery<Row[]>({ queryKey: key, queryFn: () => fetchWithAuth(path) });
  const post = async (text: string) => {
    try {
      const row = await fetchWithAuth(path, { method: 'POST', body: JSON.stringify(kind === 'tips' ? { tip: text } : { content: text }) });
      qc.setQueryData<Row[]>(key, (prev) => [row, ...(prev ?? [])]);
    } catch (e) { toast.error('Could not post. Try again.'); throw e; }
  };
  const rows = list.data ?? [];
  return (
    <div>
      {list.isLoading ? <Skeleton className="h-24 w-full" />
        : rows.length === 0 ? <EmptyState title={kind === 'tips' ? 'No exam tips yet' : 'No comments yet'} body={kind === 'tips' ? 'Share what to focus on for the exam.' : 'Be the first to comment.'} />
        : (
          <ul className="space-y-3 py-3">
            {rows.map((r) => (
              <li key={r.id} className="rounded-card bg-surface p-3 shadow-card">
                <p className="text-[13px] font-semibold text-ink">{r.user_name}</p>
                <p className="text-[15px] text-ink">{r.tip ?? r.content}</p>
              </li>
            ))}
          </ul>
        )}
      <CommentComposer
        name={appUser?.displayName ?? null} replyingTo={null} replyKey={null} onCancelReply={() => {}}
        onRequireLogin={() => navigate('/login', { state: { from: { pathname: location.pathname + location.search } } })}
        onSubmit={post}
      />
    </div>
  );
}

export function NoteDetailPage() {
  const { id = '' } = useParams();
  const { savedResourceIds, toggleSave } = useResources();
  const [tab, setTab] = useState<Tab>('about');
  const [rated, setRated] = useState<{ id: string; r: RatingResult } | null>(null);

  const q = useQuery({ queryKey: ['note', id], queryFn: () => NotesService.get(id), retry: false });
  useEffect(() => { setTab('about'); }, [id]);
  const note: Resource | undefined = useMemo(() => q.data && (rated?.id === q.data.id ? { ...q.data, ...rated.r } : q.data), [q.data, rated]);

  const more = useQuery({
    queryKey: ['note-more', id, q.data?.subjectCode, q.data?.course, q.data?.semester],
    enabled: !!q.data,
    queryFn: async () => {
      const n = q.data!;
      const bySubject = n.subjectCode ? (await NotesService.list({ subjectCode: n.subjectCode })).items.filter((x) => x.id !== id) : [];
      if (bySubject.length) return bySubject;
      return (await NotesService.list({ course: n.course, semester: n.semester })).items.filter((x) => x.id !== id);
    },
  });

  const saved = useMemo(() => new Set(savedResourceIds), [savedResourceIds]);
  const onToggleSave = useCallback((rid: string) => { void toggleSave(rid); }, [toggleSave]);

  if (q.isLoading) return <div className="mx-auto max-w-5xl space-y-4 p-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="aspect-[4/3] w-full" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) {
    return <EmptyState title="Could not load this resource" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  }
  if (q.isError || !note) {
    return <EmptyState title="This resource isn't available" body="It may have been removed or is waiting for approval." action={<Link to="/notes" className="font-semibold text-brand hover:underline">Browse notes</Link>} />;
  }

  const facts = [note.type, note.year, note.pageCount ? `${note.pageCount} pages` : '', note.uploadDate && `Uploaded ${note.uploadDate}`].filter(Boolean).join(' · ');
  const crumbs = [note.course && courseShort(note.course), note.semester ? `Sem ${note.semester}` : '', note.subjectCode].filter(Boolean).join(' › ');
  const stats = [note.ratingAvg != null ? `★ ${note.ratingAvg.toFixed(1)} (${note.ratingCount})` : '', note.downloads ? `Helped ${note.downloads}` : ''].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 pb-40 md:pb-4">
      <Helmet><title>{note.title} | MyCollegeGenie</title></Helmet>
      <header className="space-y-1">
        {crumbs && <p className="text-[13px] text-ink-muted">{crumbs}</p>}
        <h1 className="text-[22px] font-bold leading-tight text-ink">{note.title}</h1>
        <p className="text-[13px] text-ink-muted">{facts}</p>
        {stats && <p className="text-[13px] text-ink-muted">{stats}</p>}
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {note.link ? (
            <Suspense fallback={note.thumbnailUrl ? <img src={note.thumbnailUrl} alt="" className="h-auto w-full rounded-card border border-line bg-white" /> : <Skeleton className="aspect-[4/3] w-full" />}>
              <NotePreview link={note.link} title={note.title} thumb={note.thumbnailUrl} />
            </Suspense>
          ) : (
            // The API hides links from logged-out viewers (shared links land here): show the first page and a way in.
            <div className="relative overflow-hidden rounded-card border border-line bg-surface">
              {note.thumbnailUrl && <img src={note.thumbnailUrl} alt="" className="max-h-[420px] w-full object-cover object-top" />}
              <div className={`${note.thumbnailUrl ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/95 to-transparent pt-16' : ''} p-4 text-center`}>
                <p className="text-[17px] font-bold text-ink">Log in free to open the full {note.type === 'PYQ' ? 'paper' : 'file'}</p>
                <p className="mb-3 text-[13px] text-ink-muted">Takes 10 seconds. Download, save and rate it.</p>
                <Link to="/login" state={{ from: { pathname: `/notes/${note.id}` } }} className="inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-brand">Log in to view</Link>
              </div>
            </div>
          )}
          {previewKind(note.link).kind === 'pdf' && <Link to={`/flipbook/${note.id}`} className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">Open full</Link>}

          <Tabs
            label="Resource details" value={tab} onChange={(v) => setTab(v as Tab)}
            items={[{ id: 'about', label: 'About' }, { id: 'tips', label: 'Exam tips' }, { id: 'discussion', label: 'Discussion' }]}
          />
          <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === 'about' && (
              <div className="space-y-3 py-3">
                <p className="whitespace-pre-line text-[15px] text-ink">{note.description || 'No description yet.'}</p>
                {note.tags.length > 0 && <p className="text-[13px] text-ink-muted">{note.tags.map((t) => `#${t}`).join(' ')}</p>}
                <p className="text-[13px] text-ink-muted">Uploaded by <UserLink username={note.uploaderUsername} className="font-semibold text-ink">{note.uploader || 'a student'}</UserLink></p>
              </div>
            )}
            {tab === 'tips' && <Fragment key={`${id}-tips`}><Feed id={id} kind="tips" /></Fragment>}
            {tab === 'discussion' && <Fragment key={`${id}-discussion`}><Feed id={id} kind="discussion" /></Fragment>}
          </div>
        </div>
        <aside><Fragment key={note.id}><NoteActions note={note} saved={saved.has(note.id)} onToggleSave={onToggleSave} onRated={(r) => setRated({ id: note.id, r })} /></Fragment></aside>
      </div>

      <NotesSection title="More from this subject" notes={more.data ?? []} savedIds={saved} onToggleSave={onToggleSave} />
    </div>
  );
}
