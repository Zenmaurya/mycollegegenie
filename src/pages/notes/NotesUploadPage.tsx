import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, FileText, Link2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { COURSE_METADATA } from '../../constants';
import { DIVISIONS, MAIN_COURSES, STREAMS, canonicalCourse, joinCourse, splitCourse, currentSemester, titleFromFilename, uploadProblem, yearFromTitle } from '../../lib/notes';
import { renderPdfThumb } from '../../lib/pdfThumb';
import { uploadFile } from '../../services/resourceService';
import { NotesService } from '../../services/notesService';
import type { Resource, ResourceType } from '../../types';
import { NoteCard } from '../../components/notes/NoteCard';
import { Segmented } from '../../components/ui/Segmented';
import { Button } from '../../components/ui/button';

type Thumb = { blob: Blob; pageCount: number };

const MAX_SIZE = 15 * 1024 * 1024; // same limit as ResourceUploadModal
const ACCEPT = {
  'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'image/gif': ['.gif'],
};
const TYPES: ResourceType[] = ['Note', 'PYQ', 'Book', 'Syllabus', 'Playlist'];
const SUBCATEGORY: Record<ResourceType, string> = { Note: 'Lecture Notes', PYQ: 'PYQs', Book: 'Reference Books', Syllabus: 'Syllabus', Playlist: 'Lecture Notes' };
const FOLDER: Record<ResourceType, 'notes' | 'pyqs' | 'books' | 'resources'> = { Note: 'notes', PYQ: 'pyqs', Book: 'books', Syllabus: 'resources', Playlist: 'resources' };
const DIRECT_EXT = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
const STEPS = ['File', 'Details', 'Publish'];
const field = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const label = 'mb-1 block text-[15px] font-semibold text-ink';

export function NotesUploadPage() {
  const { user, appUser, isAuthLoading } = useAuth();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [type, setType] = useState<ResourceType>('Note');
  const [title, setTitle] = useState('');
  const [mainCourse, setMainCourse] = useState('');
  const [division, setDivision] = useState(''); // '' = common to all divisions / not mentioned
  const [stream, setStream] = useState(''); // '' = same for Regular, SOL and NCWEB
  const [semester, setSemester] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [yearInput, setYearInput] = useState<string | null>(null); // null = follow the title
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const thumbJob = useRef<Promise<Thumb | null>>(Promise.resolve(null));
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doneId, setDoneId] = useState<string | null>(null);

  // Prefill course/semester once the profile is known.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !appUser) return;
    prefilled.current = true;
    const c = canonicalCourse(appUser.course ?? null);
    if (!c) return;
    const sp = splitCourse(c);
    setMainCourse(sp.main);
    setDivision(sp.division);
    const sem = currentSemester(appUser.batchYear ?? null, new Date(), COURSE_METADATA[c]?.semesters ?? 6);
    if (sem) setSemester(String(sem));
  }, [appUser]);

  const course = joinCourse(mainCourse, division);
  const divisions = DIVISIONS[mainCourse] ?? [];

  const clearFile = () => { setFile(null); setThumb(null); thumbJob.current = Promise.resolve(null); };

  const onDrop = useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setLink('');
    setTitle((t) => t || titleFromFilename(f.name));
    setThumb(null);
    thumbJob.current = f.type === 'application/pdf'
      ? renderPdfThumb(f).then((r) => { setThumb(r); return r; }).catch(() => null) // a thumbnail failure never blocks publishing
      : Promise.resolve(null);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxFiles: 1, multiple: false, maxSize: MAX_SIZE,
    onDropRejected: (r) => toast.error(r[0]?.errors[0]?.code === 'file-too-large'
      ? 'File too large. Maximum 15 MB. Try compressing your PDF first.'
      : 'Invalid file type. Please upload a PDF or an image (PNG, JPG, WebP, GIF).'),
  } as any); // same cast as ResourceUploadModal: v15 typings demand drag handlers

  useEffect(() => {
    if (!thumb) { setThumbUrl(null); return; }
    const u = URL.createObjectURL(thumb.blob);
    setThumbUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [thumb]);

  const subjects = useQuery({
    queryKey: ['notes-subjects', course, semester],
    queryFn: () => NotesService.sections(course || undefined, Number(semester) || undefined),
    enabled: !!user && !!course,
    staleTime: 5 * 60_000,
  }).data?.subjects ?? [];
  const knownSubject = subjects.find((s) => s.code === subjectCode);

  const year = type === 'PYQ' ? (yearInput ?? String(yearFromTitle(title) ?? '')) : '';
  const yearNum = year ? Number(year) : null;
  const trimmedLink = link.trim();
  const maxSem = COURSE_METADATA[course]?.semesters ?? COURSE_METADATA[mainCourse]?.semesters ?? 8;
  const courseOptions = mainCourse && !MAIN_COURSES.includes(mainCourse) ? [mainCourse, ...MAIN_COURSES] : MAIN_COURSES;

  const fileProblem = uploadProblem({ type, hasFile: !!file, link }) ?? '';
  const detailsProblem = !title.trim() ? 'Add a title.' : !course ? 'Pick a course.' : !semester ? 'Pick a semester.'
    : yearNum != null && (yearNum < 2010 || yearNum > 2035) ? 'Year must be between 2010 and 2035.' : '';

  const preview = useMemo<Resource>(() => ({
    id: 'preview', title: title.trim() || 'Untitled', description, type, subCategory: SUBCATEGORY[type], course, semester: Number(semester) || 0,
    subjectCode, tags: [], link: '', uploader: appUser?.displayName ?? '', uploadDate: '', ratings: [], reports: [],
    thumbnailUrl: thumbUrl, pageCount: thumb?.pageCount ?? null, year: yearNum, isApproved: false, stream: stream || null,
  }), [title, description, type, course, semester, subjectCode, thumbUrl, thumb, yearNum, appUser, stream]);

  if (isAuthLoading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />;

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setProgress(0);
    try {
      let finalLink = trimmedLink;
      if (file) finalLink = await uploadFile(file, FOLDER[type], { course, subject: knownSubject?.title ?? title, subjectCode }, setProgress);
      let thumbnailUrl: string | null = null;
      let pageCount: number | null = null;
      const t = file ? await thumbJob.current : null;
      if (t) {
        pageCount = t.pageCount > 2000 ? null : t.pageCount; // API rejects page_count > 2000
        try {
          // Safari returns PNG for WebP requests: upload with the blob's real type.
          const ext = t.blob.type === 'image/webp' ? 'webp' : t.blob.type === 'image/jpeg' ? 'jpg' : 'png';
          thumbnailUrl = await uploadFile(new File([t.blob], `thumb.${ext}`, { type: t.blob.type }), 'thumbnails');
        } catch (e) { console.warn('[notes upload] thumbnail upload failed', e); }
      }
      const isDirectLink = !file && DIRECT_EXT.some((ext) => trimmedLink.toLowerCase().endsWith(ext));
      const id = await NotesService.create({
        title: title.trim(), description, type, course, semester: Number(semester), subCategory: SUBCATEGORY[type], subjectCode,
        tags: tags.split(',').map((x) => x.trim()).filter(Boolean), link: finalLink,
        directDownloadLink: file ? finalLink : isDirectLink ? trimmedLink : '', thumbnailUrl, pageCount, year: yearNum, stream: stream || null,
      });
      setDoneId(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally { setBusy(false); }
  };

  const reset = () => {
    clearFile();
    setStep(0); setLink(''); setTitle(''); setSubjectCode(''); setYearInput(null); setTags(''); setDescription('');
    setDoneId(null); setProgress(0);
  };

  const share = async () => {
    const url = `${window.location.origin}/notes/${doneId}`;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(url); toast.success('Link copied!'); } catch { /* clipboard blocked */ }
  };

  if (doneId) {
    return (
      <main className="mx-auto flex min-h-[70dvh] w-full max-w-[560px] flex-col items-center justify-center gap-3 px-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
        <h1 className="text-[22px] font-bold text-ink">Goes live after a quick check</h1>
        <p className="text-[15px] text-ink-muted">Thanks for sharing. We review every upload before it appears for others.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={share}>Share</Button>
          <Button onClick={reset}>Upload another</Button>
        </div>
        <p className="text-[13px] text-ink-muted">Others can open it once it's approved.</p>
        <Link to="/notes" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand hover:underline">Back to notes</Link>
      </main>
    );
  }

  const problem = step === 0 ? fileProblem : step === 1 ? detailsProblem || fileProblem : '';
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-[640px] flex-col gap-4 px-4 py-4">
      <h1 className="text-[22px] font-bold text-ink">Upload to Notes</h1>
      <ol className="flex gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}
            className={`flex-1 border-b-2 pb-1 text-[13px] font-semibold ${i === step ? 'border-ink text-ink' : i < step ? 'border-brand text-ink-muted' : 'border-line text-ink-muted'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div className="flex-1 space-y-4">
        {step === 0 && (
          <>
            <div {...getRootProps()} className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed p-4 text-center ${isDragActive ? 'border-brand bg-brand-soft' : 'border-line bg-surface'}`}>
              <input {...getInputProps()} aria-label="Choose a PDF or image" />
              {file ? (
                <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <FileText className="h-5 w-5" aria-hidden /> {file.name}
                  <button type="button" aria-label="Remove file" className="grid h-11 w-11 place-items-center" onClick={(e) => { e.stopPropagation(); clearFile(); }}><X className="h-4 w-4" /></button>
                </span>
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-ink">{isDragActive ? 'Drop it here' : 'Tap to choose a file, or drag it here'}</p>
                  <p className="text-[13px] text-ink-muted">PDF or image, up to 15 MB</p>
                </>
              )}
            </div>
            <div>
              <label htmlFor="up-link" className={label}><Link2 className="mr-1 inline h-4 w-4" aria-hidden />Or paste a Google Drive / YouTube link</label>
              <input id="up-link" type="url" value={link} disabled={!!file} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/..." className={field} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <span className={label}>Type</span>
              <Segmented label="Type" options={TYPES.map((t) => ({ value: t, label: t }))} value={type} onChange={(v) => setType(v as ResourceType)} />
            </div>
            <div>
              <label htmlFor="up-title" className={label}>Title</label>
              <input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={field} />
            </div>
            <div>
              <label htmlFor="up-course" className={label}>Course</label>
              <select id="up-course" value={mainCourse} onChange={(e) => { setMainCourse(e.target.value); setDivision(''); }} className={field}>
                <option value="">Select a course</option>
                {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {divisions.length > 0 && (
              <div>
                <label htmlFor="up-division" className={label}>Subject combination</label>
                <select id="up-division" value={division} onChange={(e) => setDivision(e.target.value)} className={field} aria-describedby="up-division-hint">
                  <option value="">Not mentioned / common to all</option>
                  {divisions.map((d) => <option key={d} value={d}>with {d}</option>)}
                </select>
                <p id="up-division-hint" className="mt-1 text-[13px] text-ink-muted">If the paper only names the course, keep "common to all". It will show for every combination.</p>
              </div>
            )}
            <div>
              <label htmlFor="up-sem" className={label}>Semester</label>
              <select id="up-sem" value={semester} onChange={(e) => setSemester(e.target.value)} className={field}>
                <option value="">Select a semester</option>
                {Array.from({ length: maxSem }, (_, i) => i + 1).map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>For students of</span>
              <Segmented label="For students of" options={[{ value: '', label: 'All' }, ...STREAMS.map((x) => ({ value: x, label: x }))]} value={stream} onChange={setStream} />
              <p className="mt-1 text-[13px] text-ink-muted">Pick SOL, NCWEB or Regular only if this paper or material is just for them. "All" shows it to everyone.</p>
            </div>
            <div>
              <label htmlFor="up-code" className={label}>Subject or paper code (optional)</label>
              <input id="up-code" list="up-subjects" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value.trim())} placeholder="Search or type a code, e.g. 32341101" className={field} />
              <datalist id="up-subjects">
                {subjects.map((s) => <option key={s.code} value={s.code}>{`${s.code} — ${s.title}`}</option>)}
              </datalist>
            </div>
            {type === 'PYQ' && (
              <div>
                <label htmlFor="up-year" className={label}>Exam year</label>
                <input id="up-year" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYearInput(e.target.value.replace(/\D/g, ''))} placeholder="e.g. 2024" className={field} />
              </div>
            )}
            <div>
              <label htmlFor="up-tags" className={label}>Tags (optional, comma separated)</label>
              <input id="up-tags" value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="up-desc" className={label}>Description (optional)</label>
              <textarea id="up-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} py-2`} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[15px] text-ink-muted">This is how your upload will look to others. It goes live after a quick check.</p>
            <div className="mx-auto w-48" inert>
              <NoteCard note={preview} saved={false} onToggleSave={() => {}} />
            </div>
            {busy && file && (
              <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress" className="h-2 overflow-hidden rounded-full bg-canvas">
                <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        )}
      </div>

      {problem && <p role="alert" className="text-[13px] text-danger">{problem}</p>}
      <div className="sticky bottom-0 flex gap-2 bg-canvas py-2">
        {step > 0 && <Button variant="secondary" disabled={busy} onClick={() => setStep(step - 1)}>Back</Button>}
        {step < 2
          ? <Button className="flex-1" disabled={!!problem} onClick={() => setStep(step + 1)}>Next</Button>
          : <Button className="flex-1" loading={busy} onClick={publish}>Publish</Button>}
      </div>
    </main>
  );
}
