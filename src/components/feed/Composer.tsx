import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ForumService } from '../../services/forumService';
import { FORUM_TOPICS, topicLabel } from '../../constants';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';
import { Sheet } from '../ui/Sheet';
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

  // Prefill the student's course once their profile loads
  useEffect(() => {
    if (appUser?.course) setCourse((c) => c || appUser.course || '');
  }, [appUser?.course]);

  if (!open) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Photo[] = [];
    for (const file of Array.from(list)) {
      if (!isSupportedImageType(file.type)) {
        toast.error('This photo format is not supported (use JPG, PNG or WebP)');
        continue;
      }
      if (photos.length + next.length >= MAX_POST_PHOTOS) {
        toast.error(`You can add up to ${MAX_POST_PHOTOS} photos`);
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
      toast.success('Posted!');
      reset();
      onPosted(id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Create post" dismissible={!sending} initialFocusRef={titleRef}>
        {!user ? (
          <div className="p-6 text-center text-[15px] text-ink">
            <p className="mb-4">Log in to create a post</p>
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
                placeholder="Title (e.g. Looking for a hackathon team?)"
                aria-label="Post title"
                className="w-full rounded-lg border border-line px-3 py-2 text-[15px] font-semibold text-ink outline-none focus:border-brand"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Ask a question or share something..."
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
                      <img src={p.preview} alt={`Selected photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
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
                Post
              </button>
            </div>
          </form>
        )}
    </Sheet>
  );
}
