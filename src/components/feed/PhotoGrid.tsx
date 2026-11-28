import React from 'react';

/** 1 = full width, 2 = side by side, 3 = one large + two stacked, 4 = 2×2. */
export function PhotoGrid({ images }: { images: string[] }) {
  const pics = images.slice(0, 4);
  if (pics.length === 0) return null;

  const img = (src: string, i: number, extra = '') => (
    <img key={src + i} src={src} alt={`Post photo ${i + 1}`} loading="lazy" decoding="async" className={`h-full w-full bg-canvas object-cover ${extra}`} />
  );

  if (pics.length === 1) {
    // Whole photo, never cropped: a blurred copy fills the letterbox around it.
    return (
      // Box follows the photo's own shape (wide fills the width, tall is capped at 560px and centred).
      // w-full keeps a width before load (a 0-width lazy image never loads); height follows the photo.
      <div className="relative min-h-40 overflow-hidden rounded-xl border border-line/70 bg-canvas">
        <img src={pics[0]} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl" />
        <img src={pics[0]} alt="Post photo 1" loading="lazy" decoding="async" className="relative block h-auto max-h-[560px] w-full object-contain" />
      </div>
    );
  }
  if (pics.length === 3) {
    return (
      <div className="grid aspect-[16/10] grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg">
        <div className="row-span-2">{img(pics[0], 0)}</div>
        {img(pics[1], 1)}
        {img(pics[2], 2)}
      </div>
    );
  }
  return (
    <div className={`grid gap-1 overflow-hidden rounded-lg ${pics.length === 2 ? 'aspect-[16/9] grid-cols-2' : 'aspect-square grid-cols-2 grid-rows-2'}`}>
      {pics.map((p, i) => img(p, i))}
    </div>
  );
}
