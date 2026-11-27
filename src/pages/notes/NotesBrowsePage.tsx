import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../context/ResourceContext';
import { COURSE_METADATA } from '../../constants';
import { shouldLoadMore } from '../../lib/feed';
import { canonicalCourse, courseShort, currentSemester, withPickDefaults } from '../../lib/notes';
import { fetchWithAuth } from '../../lib/apiClient';
import { NotesService } from '../../services/notesService';
import { NotesSection } from '../../components/notes/NotesSection';
import { NoteCard } from '../../components/notes/NoteCard';
import { NotesFilterSheet, SORT_OPTIONS, TYPE_OPTIONS, toNoteFilters, type FilterDraft } from '../../components/notes/NotesFilterSheet';
import { Chip } from '../../components/ui/Chip';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';

const PICK_KEY = 'mcg.notes.pick';
type Pick = { course: string; semester: string };
const EMPTY: FilterDraft = { course: '', semester: '', subjectCode: '', type: '', year: '', minRating: '', college: '', sort: '', stream: '' };
const KEYS = Object.keys(EMPTY) as (keyof FilterDraft)[];
const TYPE_PLURAL: Record<string, string> = { PYQ: 'PYQs', Note: 'notes', Book: 'books', Syllabus: 'syllabus', Playlist: 'playlists' };
const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4';

function readPick(): Pick | null {
  try {
    const p = JSON.parse(localStorage.getItem(PICK_KEY) || 'null');
    return p && typeof p.course === 'string' && typeof p.semester === 'string' ? p : null;
  } catch { return null; }
}

export function NotesBrowsePage() {
  const { appUser } = useAuth();
  const { savedResourceIds, toggleSave } = useResources();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const [sheet, setSheet] = useState<'filters' | 'pick' | null>(null);
  const [stored, setStored] = useState<Pick | null>(readPick);
  const [yearPick, setYearPick] = useState<number | null>(null);

  const q = params.get('q') ?? '';
  const draft = useMemo<FilterDraft>(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ''])) as FilterDraft, [params]);
  const [qInput, setQInput] = useState(q);
  useEffect(() => {
    if (params.get('focus') !== 'search') return;
    searchRef.current?.focus();
    const next = new URLSearchParams(params);
    next.delete('focus');
    setParams(next, { replace: true });
  }, [params, setParams]);
  // sort alone keeps the sections view
  const filtersActive = !!q || KEYS.some((k) => k !== 'sort' && draft[k]);

  const profilePick = useMemo<Pick>(() => {
    const course = canonicalCourse(appUser?.course ?? null);
    if (!course) return { course: '', semester: '' };
    const sem = currentSemester(appUser?.batchYear ?? null, new Date(), COURSE_METADATA[course]?.semesters ?? 6);
    return { course, semester: sem ? String(sem) : '' };
  }, [appUser?.course, appUser?.batchYear]);
  const pick = stored ?? profilePick;

  const savedIds = useMemo(() => new Set(savedResourceIds), [savedResourceIds]);
  const toggleRef = useRef(toggleSave);
  toggleRef.current = toggleSave;
  const onToggleSave = useCallback((id: string) => { void toggleRef.current(id); }, []);

  // Leaving sections mode (tab, subject tile, search) keeps the viewer's default course/semester.
  const setParam = useCallback((next: Record<string, string>, keepPick = true) => {
    setParams((prev) => {
      let out = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) { if (v) out.set(k, v); else out.delete(k); }
      const wasActive = !!prev.get('q') || KEYS.some((k) => k !== 'sort' && prev.get(k));
      const active = !!out.get('q') || KEYS.some((k) => k !== 'sort' && out.get(k));
      if (keepPick && !wasActive && active) out = withPickDefaults(out, pick);
      return out;
    }, { replace: true });
  }, [setParams, pick]);

  // search box -> ?q= after a short pause
  useEffect(() => {
    if (qInput.trim() === q) return;
    const t = setTimeout(() => setParam({ q: qInput.trim() }), 300);
    return () => clearTimeout(t);
  }, [qInput, q, setParam]);
  useEffect(() => setQInput(q), [q]);

  const apply = (d: FilterDraft) => {
    if (sheet === 'pick') {
      const p = { course: d.course, semester: d.semester };
      setStored(p);
      try { localStorage.setItem(PICK_KEY, JSON.stringify(p)); } catch { /* storage blocked */ }
    } else setParam(d, false);
    setSheet(null);
  };

  const filters = useMemo(() => toNoteFilters(q, draft), [q, draft]);
  const results = useInfiniteQuery({
    queryKey: ['notes', appUser?.uid ?? 'anon', filters],
    queryFn: ({ pageParam }) => NotesService.list(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    enabled: filtersActive,
  });
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? 0;

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = results;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !shouldLoadMore({ hasNextPage, isFetchingNextPage, isError })) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) void fetchNextPage(); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, isError, fetchNextPage, items.length]);

  const sections = useQuery({
    queryKey: ['notes-sections', pick.course, pick.semester],
    queryFn: () => NotesService.sections(pick.course || undefined, Number(pick.semester) || undefined),
    enabled: !filtersActive,
  });
  const byYear = sections.data?.byYear ?? [];
  const yearGroup = byYear.find((g) => g.year === yearPick) ?? byYear[0];

  const request = async () => {
    const course = draft.course || pick.course;
    if (!appUser) { toast.error('You must be signed in to request material.'); return; }
    if (!course) { toast.error('Pick a course first.'); return; }
    try {
      await fetchWithAuth('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          course, semester: draft.semester || pick.semester,
          materialType: draft.type === 'Note' || !draft.type ? 'Notes' : draft.type,
          details: [draft.subjectCode, q].filter(Boolean).join(' ') || 'Requested from the notes page',
        }),
      });
      toast.success('Material requested successfully!');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to submit request'); }
  };

  const chips: { key: string; label: string }[] = [];
  if (q) chips.push({ key: 'q', label: `"${q}"` });
  if (draft.course) chips.push({ key: 'course', label: courseShort(draft.course) });
  if (draft.semester) chips.push({ key: 'semester', label: `Sem ${draft.semester}` });
  if (draft.stream) chips.push({ key: 'stream', label: draft.stream });
  if (draft.subjectCode) chips.push({ key: 'subjectCode', label: draft.subjectCode });
  if (draft.type) chips.push({ key: 'type', label: TYPE_OPTIONS.find((t) => t.v === draft.type)?.l ?? draft.type });
  if (draft.year) chips.push({ key: 'year', label: draft.year });
  if (draft.minRating) chips.push({ key: 'minRating', label: `${draft.minRating}★+` });
  if (draft.college) chips.push({ key: 'college', label: 'My college' });
  if (draft.sort) chips.push({ key: 'sort', label: SORT_OPTIONS.find((s) => s.value === draft.sort)?.label ?? draft.sort });

  const target = draft.subjectCode || (draft.course && courseShort(draft.course)) || 'this search';
  const typeLabel = TYPE_PLURAL[draft.type] ?? 'resources';
  const courseOpens = filtersActive ? 'filters' : 'pick';
  const showPick = !filtersActive;

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-3 pb-8 sm:px-4">
      <Helmet><title>Notes & PYQs | MyCollegeGenie</title></Helmet>
      <div className="sticky top-0 z-20 -mx-3 space-y-3 bg-canvas px-3 pb-2 pt-4 sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold text-ink">Notes & PYQs</h1>
          <Link to="/notes/upload" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">
            <Plus className="h-4 w-4" aria-hidden /> Upload
          </Link>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            ref={searchRef}
            type="search" value={qInput} onChange={(e) => setQInput(e.target.value)}
            aria-label="Search notes" placeholder="Search notes, PYQs, subject code e.g. 32341101…"
            className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand"
          />
        </div>
        <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:px-0" role="group" aria-label="Filters">
          <Chip selected={!!(draft.course || (showPick && pick.course))} onToggle={() => setSheet(courseOpens)}>
            {draft.course ? courseShort(draft.course) : showPick && pick.course ? courseShort(pick.course) : 'Pick your course'}
          </Chip>
          <Chip selected={!!(draft.semester || (showPick && pick.semester))} onToggle={() => setSheet(courseOpens)}>
            {draft.semester ? `Sem ${draft.semester}` : showPick && pick.semester ? `Sem ${pick.semester}` : 'Semester'}
          </Chip>
          <Chip selected={!!draft.subjectCode} onToggle={() => setSheet('filters')}>{draft.subjectCode || 'Subject'}</Chip>
          <Chip selected={!!draft.sort} onToggle={() => setSheet('filters')}>{SORT_OPTIONS.find((s) => s.value === (draft.sort || 'helpful'))?.label}</Chip>
          <Chip selected={false} onToggle={() => setSheet('filters')}>Filters</Chip>
        </div>
        <Tabs label="Type" items={TYPE_OPTIONS.map((t) => ({ id: t.v || 'all', label: t.l }))} value={draft.type || 'all'} onChange={(id) => setParam({ type: id === 'all' ? '' : id })} />
      </div>

      {filtersActive ? (
        <div id={`panel-${draft.type || 'all'}`} role="tabpanel" aria-labelledby={`tab-${draft.type || 'all'}`} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-ink" aria-live="polite">{results.isSuccess ? `${total} ${total === 1 ? 'result' : 'results'}` : ''}</p>
            {chips.map((c) => <Fragment key={c.key}><Chip selected removable onRemove={() => setParam({ [c.key]: '' })}>{c.label}</Chip></Fragment>)}
            <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>Clear all</Button>
          </div>
          {results.isPending && <div className={GRID}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-card" />)}</div>}
          {results.isError && !items.length && (
            <div className="rounded-card bg-surface p-6 text-center shadow-card">
              <p className="mb-3 text-[15px] text-ink">Couldn't load resources</p>
              <Button onClick={() => void results.refetch()}>Retry</Button>
            </div>
          )}
          {results.isSuccess && items.length === 0 && (
            <div className="rounded-card bg-surface shadow-card">
              <EmptyState
                title={`No ${typeLabel} for ${target} yet`}
                body="Request it and we'll look for it, or upload your own."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => void request()}>Request material</Button>
                    <Link to="/notes/upload" className="inline-flex min-h-11 items-center rounded-sm border border-ink px-4 text-[15px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">Upload</Link>
                  </div>
                }
              />
            </div>
          )}
          {items.length > 0 && (
            <ul className={GRID}>
              {items.map((n) => <li key={n.id}><NoteCard note={n} saved={savedIds.has(n.id)} onToggleSave={onToggleSave} /></li>)}
            </ul>
          )}
          <div ref={sentinel} aria-hidden className="h-1" />
          {isFetchingNextPage && <Skeleton className="h-40 w-full rounded-card" />}
          {isError && items.length > 0 && <Button variant="secondary" className="mx-auto flex" onClick={() => void fetchNextPage()}>Couldn't load more. Retry</Button>}
        </div>
      ) : (
        <div id="panel-all" role="tabpanel" aria-labelledby="tab-all" className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[15px] text-ink-muted">
              {pick.course ? <>For you · {courseShort(pick.course)}{pick.semester && ` · Semester ${pick.semester}`}</> : 'Popular across DU'}
            </p>
            <Button variant="ghost" onClick={() => setSheet('pick')}>{pick.course ? 'Change ›' : 'Pick your course ›'}</Button>
          </div>
          {sections.isPending && [0, 1].map((i) => <Skeleton key={i} className="h-64 w-full rounded-card" />)}
          {sections.isError && (
            <div className="rounded-card bg-surface p-6 text-center shadow-card">
              <p className="mb-3 text-[15px] text-ink">Couldn't load notes</p>
              <Button onClick={() => void sections.refetch()}>Retry</Button>
            </div>
          )}
          {sections.isSuccess && (
            <>
              <NotesSection title="Top rated for you" notes={sections.data.topRated} savedIds={savedIds} onToggleSave={onToggleSave} />
              {yearGroup && (
                <NotesSection
                  title="PYQs by year" notes={yearGroup.items} savedIds={savedIds} onToggleSave={onToggleSave}
                  header={
                    <div className="scrollbar-hide flex gap-2 overflow-x-auto" role="group" aria-label="Year">
                      {byYear.map((g) => <Fragment key={g.year}><Chip selected={g.year === yearGroup.year} onToggle={() => setYearPick(g.year)}>{String(g.year)}</Chip></Fragment>)}
                    </div>
                  }
                />
              )}
              {sections.data.subjects.length >= 2 && (
                <section aria-label="Subjects" className="space-y-2">
                  <h2 className="text-[17px] font-bold text-ink">Subjects</h2>
                  <ul className={GRID}>
                    {sections.data.subjects.map((s) => (
                      <li key={s.code}>
                        <button type="button" onClick={() => setParam({ subjectCode: s.code })} className="flex min-h-11 w-full flex-col items-start rounded-card bg-surface p-3 text-left shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
                          <span className="line-clamp-2 text-[15px] font-semibold text-ink">{s.title || s.code}</span>
                          <span className="text-[13px] text-ink-muted">{s.code} · {s.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <NotesSection title="New this week" notes={sections.data.newThisWeek} savedIds={savedIds} onToggleSave={onToggleSave} />
              <Link to="/playlists" className="flex min-h-11 items-center justify-between rounded-card bg-surface px-4 text-[15px] font-semibold text-ink shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
                Playlists for your course <span aria-hidden>›</span>
              </Link>
            </>
          )}
        </div>
      )}

      {sheet && (
        <NotesFilterSheet
          mode={sheet} q={q} hasCollege={!!(appUser?.collegeId || appUser?.college)} onApply={apply} onClose={() => setSheet(null)}
          initial={sheet === 'pick' ? { ...EMPTY, ...pick } : filtersActive ? draft : { ...draft, ...pick }}
        />
      )}
    </div>
  );
}
