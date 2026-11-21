import type { ChangeEvent, ReactNode } from 'react';
import { CATEGORIES, type CommunityForm } from '../../lib/communities';
import { ForumService } from '../../services/forumService';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';

export const field = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60';

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[15px] font-semibold text-ink">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-[13px] text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

/** Compresses and uploads an image; null when no file. */
export const uploadImage = async (file: File | null) => (file ? ForumService.uploadPostImage(await compressImage(file)) : null);

/** onChange handler for an image input: type-checks, reports through setError, hands the file on. */
export const pickImage = (setter: (f: File | null) => void, setError: (msg: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  if (file && !isSupportedImageType(file.type)) { setError('Use a JPG, PNG or WebP image'); return; }
  setError('');
  setter(file);
};

export const aria = (id: string, error?: string, hint?: boolean) => {
  const ids = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ');
  return { ...(error ? { 'aria-invalid': true } : {}), ...(ids ? { 'aria-describedby': ids } : {}) };
};

interface Props {
  f: CommunityForm;
  errors: Partial<Record<string, string>>;
  onChange: (k: keyof CommunityForm) => (e: { target: { value: string } }) => void;
  onLogo: (e: ChangeEvent<HTMLInputElement>) => void;
  onBanner: (e: ChangeEvent<HTMLInputElement>) => void;
  nameLocked?: boolean;
}

/** Shared by Create and Manage: name, category, description, images, links. */
export function CommunityFields({ f, errors: e, onChange: set, onLogo, onBanner, nameLocked }: Props) {
  const img = 'image/jpeg,image/png,image/webp';
  return (
    <>
      <Field id="name" label="Society name" error={e.name || undefined}>
        <input id="name" className={field} value={f.name} onChange={set('name')} maxLength={80} required disabled={nameLocked} {...aria('name', e.name || undefined)} />
      </Field>
      <Field id="category" label="Category" error={e.category || undefined}>
        <select id="category" className={field} value={f.category} onChange={set('category')} required {...aria('category', e.category || undefined)}>
          <option value="">Choose a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field id="description" label="Short description (optional)" error={e.description || undefined} hint={`${f.description.length}/1000`}>
        <textarea id="description" className={`${field} py-2`} rows={4} value={f.description} onChange={set('description')} {...aria('description', e.description || undefined, true)} />
      </Field>
      <Field id="logo" label="Logo (optional)" error={e.logo || undefined}>
        <input id="logo" type="file" accept={img} className={field} onChange={onLogo} {...aria('logo', e.logo || undefined)} />
      </Field>
      <Field id="banner" label="Banner (optional)" error={e.banner || undefined}>
        <input id="banner" type="file" accept={img} className={field} onChange={onBanner} {...aria('banner', e.banner || undefined)} />
      </Field>
      <Field id="instagram" label="Instagram link (optional)" error={e.instagram || undefined}>
        <input id="instagram" type="url" inputMode="url" placeholder="https://instagram.com/..." className={field} value={f.instagram} onChange={set('instagram')} {...aria('instagram', e.instagram || undefined)} />
      </Field>
      <Field id="linkedin" label="LinkedIn link (optional)" error={e.linkedin || undefined}>
        <input id="linkedin" type="url" inputMode="url" placeholder="https://linkedin.com/..." className={field} value={f.linkedin} onChange={set('linkedin')} {...aria('linkedin', e.linkedin || undefined)} />
      </Field>
      <Field id="website" label="Website (optional)" error={e.website || undefined}>
        <input id="website" type="url" inputMode="url" placeholder="https://..." className={field} value={f.website} onChange={set('website')} {...aria('website', e.website || undefined)} />
      </Field>
      <Field id="email" label="Contact email (optional)" error={e.email || undefined}>
        <input id="email" type="email" className={field} value={f.email} onChange={set('email')} {...aria('email', e.email || undefined)} />
      </Field>
    </>
  );
}
