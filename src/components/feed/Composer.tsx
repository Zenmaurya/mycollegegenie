import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ForumService } from '../../services/forumService';
import { FORUM_TOPICS, topicLabel } from '../../constants';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';
import { submitPost, MAX_POST_PHOTOS } from '../../lib/submitPost';

interface ComposerProps {
  open: boolean;
  onClose(): void;
  onPosted(id: string): void;
}

type Photo = { file: File; preview: string };

export function Composer({ open, onClose, onPosted }: ComposerProps) {
  const { user, appUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState<string>('General');
  const [course, setCourse] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [sending, setSending] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  // Prefill the student's course once their profile loads
  useEffect(() => {
    if (appUser?.course) setCourse((c) => c || appUser.course || '');
  }, [appUser?.course]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // stop the page behind the modal from scrolling
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sendingRef.current) { onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // Keep keyboard focus inside the dialog
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Photo[] = [];
    for (const file of Array.from(list)) {
      if (!isSupportedImageType(file.type)) {
        toast.error('Ye photo format support nahi hai (JPG, PNG, WebP chalega)');
        continue;
      }
      if (photos.length + next.length >= MAX_POST_PHOTOS) {
        toast.error(`Max ${MAX_POST_PHOTOS} photos laga sakte ho`);
        break;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    if (next.length) setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const reset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setTitle(''); setContent(''); setTopic('General'); setPhotos([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const files = await Promise.all(photos.map((p) => compressImage(p.file)));
      const id = await submitPost(
        { title, content, topic, course, files },
        { upload: ForumService.uploadPostImage, create: (p) => ForumService.createPost(p as any) },
      );
      toast.success('Post ho gaya!');
      reset();
      onPosted(id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Post nahi ho paya, dobara try karo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 md:items-center md:p-4" onClick={() => !sending && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        className="flex h-full w-full flex-col bg-surface md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-card md:shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="composer-title" className="text-[17px] font-bold text-ink">Post banao</h2>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Band karo" className="rounded-full p-2 text-ink-muted hover:bg-canvas">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-6 text-center text-[15px] text-ink">
            <p className="mb-4">Post karne ke liye login karo</p>
            <Link to="/login" onClick={onClose} className="inline-block rounded-full bg-brand px-5 py-2 font-semibold text-white">Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-3 p-4">
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Title (jaise: Hackathon ke liye team chahiye?)"
                aria-label="Post title"
                className="w-full rounded-lg border border-line px-3 py-2 text-[15px] font-semibold text-ink outline-none focus:border-brand"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Kuch poochho ya share karo..."
                aria-label="Post text"
                className="w-full resize-none rounded-lg border border-line px-3 py-2 text-[15px] text-ink outline-none focus:border-brand"
              />

              <div role="radiogroup" aria-label="Topic" className="flex flex-wrap gap-2">
                {FORUM_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={topic === t}
                    onClick={() => setTopic(t)}
                    className={`rounded-full border px-3 py-1 text-[13px] font-semibold ${topic === t ? 'border-brand bg-brand text-white' : 'border-line text-ink-muted hover:bg-canvas'}`}
                  >
                    {topicLabel(t)}
                  </button>
                ))}
              </div>

              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Course (optional)"
                aria-label="Course"
                className="w-full rounded-lg border border-line px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={p.preview} className="relative aspect-square overflow-hidden rounded-lg bg-canvas">
                      <img src={p.preview} alt={`Chuni hui photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} aria-label={`Photo ${i + 1} hatao`} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-3">
              <label className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-muted hover:bg-canvas ${photos.length >= MAX_POST_PHOTOS ? 'pointer-events-none opacity-50' : ''}`}>
                <ImagePlus className="h-5 w-5 text-brand-accent" />
                Photo ({photos.length}/{MAX_POST_PHOTOS})
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              </label>
              <button type="submit" disabled={sending} className="flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-[15px] font-semibold text-white disabled:opacity-60">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Post karo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
