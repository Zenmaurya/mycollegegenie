import { useEffect, useRef, useState } from 'react';
import { previewKind } from '../../lib/notes';
import { Skeleton } from '../ui/skeleton';

const FRAME = 'aspect-[4/3] w-full rounded-card border border-line bg-canvas';
const NOTICE = `${FRAME} flex items-center justify-center px-4 text-center text-[15px] text-ink-muted`;

/** First two pages of a PDF on canvas. pdfjs is imported here only, so it stays out of the main bundle. */
function PdfPages({ url, thumb }: { url: string; thumb?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let dead = false;
    let doc: { destroy: () => Promise<void> } | null = null;
    (async () => {
      const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default; // same worker setup as FlipbookPage
      const pdf = await pdfjs.getDocument(url).promise;
      doc = pdf;
      for (let n = 1; n <= Math.min(2, pdf.numPages); n++) {
        const page = await pdf.getPage(n);
        // Render at shown width x screen density (capped) so text is sharp on phones/retina, not a blurry upscale.
        const cssWidth = host.current?.clientWidth || 800;
        const scale = Math.min(4, (cssWidth / page.getViewport({ scale: 1 }).width) * (window.devicePixelRatio || 1));
        const viewport = page.getViewport({ scale: Math.max(1.5, scale) });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = 'h-auto w-full rounded-card border border-line bg-white';
        canvas.setAttribute('aria-label', `Page ${n}`);
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;
        if (dead) return;
        host.current?.appendChild(canvas);
      }
      setState('ready');
    })().catch(() => { if (!dead) setState('failed'); });
    return () => { dead = true; void doc?.destroy(); };
  }, [url]);

  if (state === 'failed') return <p className={NOTICE}>Preview is not available. Use Open to read the full file.</p>;
  return (
    <>
      {state === 'loading' && (thumb ? <img src={thumb} alt="" className="h-auto w-full rounded-card border border-line bg-white" /> : <Skeleton className={FRAME} />)}
      <div ref={host} className="space-y-3" />
    </>
  );
}

export default function NotePreview({ link, title, thumb }: { link: string; title: string; thumb?: string | null }) {
  const { kind, id } = previewKind(link);
  if (kind === 'pdf') return <PdfPages url={link} thumb={thumb} />;
  if (kind === 'drive') return <iframe title={title} src={`https://drive.google.com/file/d/${id}/preview`} className={FRAME} allow="autoplay" loading="lazy" />;
  if (kind === 'youtube') return <iframe title={title} src={`https://www.youtube.com/embed/${id}`} className={FRAME} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />;
  if (kind === 'image') return <img src={link} alt={title} className="h-auto w-full rounded-card border border-line" />;
  return <p className={NOTICE}>No inline preview for this link. Use Open to view it.</p>;
}
