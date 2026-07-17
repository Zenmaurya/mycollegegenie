/**
 * ImageSlider.tsx
 * ─────────────────
 * Reusable 3-image upload + auto-sliding display component.
 *
 * Usage — Display mode (card/modal):
 *   <ImageSlider images={['url1', 'url2', 'url3']} autoPlay />
 *
 * Usage — Upload mode (form):
 *   <ImageSlider
 *     images={selectedImages}
 *     editable
 *     onImagesChange={setSelectedImages}
 *     maxImages={3}
 *     accentColor="#ec4899"
 *   />
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Camera, X, Plus, ImageOff, Maximize2 } from 'lucide-react';

/**
 * Generates an optimized Cloudinary URL with specified width, height, and cropping.
 * Uses automatic format selection (WebP/AVIF) and automatic quality compression.
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  width?: number,
  height?: number,
  crop: string = 'fill'
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url; // Skip external images

  // If it already has transformations (e.g. contains '/w_'), return it
  if (url.includes('/w_') || url.includes('/q_') || url.includes('/f_')) return url;

  // Build the transformation string
  const parts = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);
  parts.push('q_auto');
  parts.push('f_auto');
  const transform = parts.join(',');

  // Inject the transformation string after '/upload/'
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}

interface ImageSliderProps {
  images: string[];                          // URLs to display
  editable?: boolean;                        // Show upload controls
  onImagesChange?: (imgs: string[]) => void; // Called when images change
  maxImages?: number;                        // Default 3
  autoPlay?: boolean;                        // Auto-slide every 3s
  aspectRatio?: string;                      // CSS aspect-ratio, e.g. '4/3'
  accentColor?: string;                      // Dot + button color
  className?: string;
  onUpload?: (file: File) => Promise<string>; // Upload fn → returns URL
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images = [],
  editable = false,
  onImagesChange,
  maxImages = 3,
  autoPlay = false,
  aspectRatio = '4/3',
  accentColor = '#7c3aed',
  className = '',
  onUpload,
}) => {
  const [current, setCurrent] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalImages = images.length;

  // ── Auto-play ────────────────────────────────────────────
  const startAutoPlay = useCallback(() => {
    if (!autoPlay || totalImages <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % totalImages);
    }, 3500);
  }, [autoPlay, totalImages]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  // Reset current index if images array shrinks
  useEffect(() => {
    if (current >= totalImages && totalImages > 0) setCurrent(totalImages - 1);
  }, [totalImages, current]);

  // ── Navigation ───────────────────────────────────────────
  const goTo = (idx: number) => {
    stopAutoPlay();
    setCurrent(idx);
    startAutoPlay();
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((current - 1 + totalImages) % totalImages);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo((current + 1) % totalImages);
  };

  // ── Touch Swipe ──────────────────────────────────────────
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goTo((current + 1) % totalImages) : goTo((current - 1 + totalImages) % totalImages);
  };

  // ── Upload ───────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || !onImagesChange) return;
    const remaining = maxImages - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of toProcess) {
      // Validate
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5MB max

      try {
        if (onUpload) {
          // Use provided upload function (Cloudinary, etc.)
          const url = await onUpload(file);
          newUrls.push(url);
        } else {
          // Fallback: local object URL for preview only
          newUrls.push(URL.createObjectURL(file));
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    if (newUrls.length > 0) {
      const updated = [...images, ...newUrls];
      onImagesChange(updated);
      setCurrent(updated.length - 1);
    }
    setIsUploading(false);
  };

  const removeImage = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    if (!onImagesChange) return;
    const updated = images.filter((_, i) => i !== idx);
    onImagesChange(updated);
    setCurrent(Math.max(0, idx - 1));
  };

  // ── Render: empty editable ───────────────────────────────
  if (editable && images.length === 0) {
    return (
      <div
        style={{ aspectRatio }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
          dragOver ? 'border-brand-primary bg-brand-surface/50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'
        } ${className}`}
      >
        <Camera className="w-8 h-8 text-gray-300" />
        <div className="text-center">
          <p className="text-sm font-bold text-gray-400">Add Photos</p>
          <p className="text-xs text-gray-300 mt-0.5">Up to {maxImages} images · Max 5MB each</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  // ── Render: no images, display mode ──────────────────────
  if (!editable && images.length === 0) {
    return (
      <div
        style={{ aspectRatio }}
        className={`w-full rounded-2xl bg-gray-100 flex items-center justify-center ${className}`}
      >
        <ImageOff className="w-8 h-8 text-gray-300" />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl group select-none ${className}`}
      style={{ aspectRatio }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {/* ── Slides ── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={images[current] + current}
          src={getOptimizedCloudinaryUrl(images[current], 600, undefined, 'limit')}
          alt={`Image ${current + 1}`}
          onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          loading="lazy"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
         <div className="bg-black/40 backdrop-blur-sm p-1.5 rounded-lg text-white">
            <Maximize2 className="w-4 h-4" />
         </div>
      </div>

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      {totalImages > 1 && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none" />
      )}

      {/* ── Prev / Next arrows (only if >1 image) ── */}
      {totalImages > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* ── Dot Indicators ── */}
      {totalImages > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); goTo(i); }}
              className={`transition-all rounded-full ${
                i === current ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Image counter badge ── */}
      {totalImages > 1 && (
        <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {current + 1}/{totalImages}
        </div>
      )}

      {/* ── Editable controls ── */}
      {editable && (
        <>
          {/* Remove current image button */}
          <button
            onClick={e => removeImage(e, current)}
            className="absolute top-2.5 left-2.5 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-all"
            title="Remove this image"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Add more images button (if under limit) */}
          {images.length < maxImages && (
            <button
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/90 hover:bg-white text-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Photo {images.length}/{maxImages}
            </button>
          )}

          {/* Upload loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </>
      )}
      {/* ── FullScreen Lightbox ── */}
      <AnimatePresence>
        {isFullScreen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setIsFullScreen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-12"
              onClick={e => e.stopPropagation()}
            >
              {/* Top Navigation Bar */}
              <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-[1000] bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="flex items-center gap-2 text-white font-medium bg-white/10 hover:bg-white/20 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Back</span>
                </button>
                <div className="text-white text-xs sm:text-sm font-bold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md tracking-widest">
                  {current + 1} / {totalImages}
                </div>
              </div>

              <img
                src={getOptimizedCloudinaryUrl(images[current], 1200, undefined, 'limit')}
                alt={`Fullscreen ${current + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />

              {totalImages > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all z-50"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all z-50"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); goTo(i); }}
                        className={`transition-all rounded-full ${
                          i === current ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Thumbnail strip (for modal/detail view) ───────────────────
export const ImageThumbnailStrip: React.FC<{
  images: string[];
  current: number;
  onSelect: (i: number) => void;
}> = ({ images, current, onSelect }) => {
  if (images.length <= 1) return null;
  return (
    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
      {images.map((url, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
            i === current ? 'border-brand-primary scale-95' : 'border-transparent opacity-60 hover:opacity-100'
          }`}
        >
          <img src={getOptimizedCloudinaryUrl(url, 120, 120, 'fill')} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        </button>
      ))}
    </div>
  );
};
