/** Renders page 1 of a PDF to a WebP (<= 400 px wide) in the browser. pdfjs is imported lazily so it stays out of the main bundle. */
export async function renderPdfThumb(file: File): Promise<{ blob: Blob; pageCount: number }> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default; // same worker setup as FlipbookPage
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(1, 400 / base.width) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    // Safari ignores 'image/webp' and returns a PNG; the caller uploads blob.type as-is.
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.8));
    if (!blob) throw new Error('Could not encode thumbnail');
    return { blob, pageCount: pdf.numPages };
  } finally {
    void pdf.destroy();
  }
}
