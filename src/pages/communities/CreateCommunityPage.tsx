import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createCommunity } from '../../services/communityService';
import { ForumService } from '../../services/forumService';
import { compressImage, isSupportedImageType } from '../../lib/compressImage';
import { CATEGORIES, validateCommunityForm, type CommunityForm } from '../../lib/communities';
import { Button } from '../../components/ui/button';

const field = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[15px] font-semibold text-ink">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-[13px] text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

export function CreateCommunityPage() {
  const { user, appUser, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState<CommunityForm>({ name: '', category: '', description: '', instagram: '', linkedin: '', website: '', email: '' });
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState('');
  const [dup, setDup] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthLoading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: '/c/new' } }} />;
  if (appUser && !appUser.collegeId) {
    return (
      <div className="mx-auto w-full max-w-[680px] space-y-3 px-3 py-6 sm:px-4">
        <h1 className="text-[22px] font-bold text-ink">Pick your college first</h1>
        <p className="text-[15px] text-ink-muted">Society pages belong to a college. Choose yours, then come back.</p>
        <Link to="/c" className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white">Back to societies</Link>
      </div>
    );
  }

  const set = (k: keyof CommunityForm) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pick = (setter: (f: File | null) => void, label: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && !isSupportedImageType(file.type)) { setErrors((p) => ({ ...p, [label]: 'Use a JPG, PNG or WebP image' })); return; }
    setErrors((p) => ({ ...p, [label]: '' }));
    setter(file);
  };
  const upload = async (file: File | null) => (file ? ForumService.uploadPostImage(await compressImage(file)) : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(''); setDup(null);
    const v = validateCommunityForm(f);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const [logo_url, banner_url] = await Promise.all([upload(logo), upload(banner)]);
      const links: Record<string, string> = {};
      for (const k of ['instagram', 'linkedin', 'website', 'email'] as const) if (f[k].trim()) links[k] = f[k].trim();
      const { slug } = await createCommunity({ name: f.name.trim(), category: f.category, description: f.description.trim(), links, logo_url, banner_url });
      navigate(`/c/${slug}`);
    } catch (err: any) {
      if (err?.status === 409 && err.data?.slug) { setDup(err.data.slug); setServerError(`Already exists: ${f.name.trim()}`); }
      else setServerError(err?.message || 'Could not create the page');
      setBusy(false);
    }
  };

  const e = (k: string) => errors[k] || undefined;
  const d = (k: string) => (e(k) ? { 'aria-invalid': true, 'aria-describedby': `${k}-err` } : {});

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      <h1 className="text-[22px] font-bold text-ink">Create society page</h1>
      <p className="text-[15px] text-ink-muted">New pages start as Unverified. Ask MCG to verify your page from Manage.</p>

      <Field id="name" label="Society name" error={e('name')}>
        <input id="name" className={field} value={f.name} onChange={set('name')} maxLength={80} required {...d('name')} />
      </Field>
      <Field id="category" label="Category" error={e('category')}>
        <select id="category" className={field} value={f.category} onChange={set('category')} required {...d('category')}>
          <option value="">Choose a category</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field id="description" label="Short description (optional)" error={e('description')} hint={`${f.description.length}/1000`}>
        <textarea id="description" className={`${field} py-2`} rows={4} value={f.description} onChange={set('description')} {...d('description')} />
      </Field>
      <Field id="logo" label="Logo (optional)" error={e('logo')}>
        <input id="logo" type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={pick(setLogo, 'logo')} />
      </Field>
      <Field id="banner" label="Banner (optional)" error={e('banner')}>
        <input id="banner" type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={pick(setBanner, 'banner')} />
      </Field>
      <Field id="instagram" label="Instagram link (optional)" error={e('instagram')}>
        <input id="instagram" type="url" inputMode="url" placeholder="https://instagram.com/..." className={field} value={f.instagram} onChange={set('instagram')} {...d('instagram')} />
      </Field>
      <Field id="linkedin" label="LinkedIn link (optional)" error={e('linkedin')}>
        <input id="linkedin" type="url" inputMode="url" placeholder="https://linkedin.com/..." className={field} value={f.linkedin} onChange={set('linkedin')} {...d('linkedin')} />
      </Field>
      <Field id="website" label="Website (optional)" error={e('website')}>
        <input id="website" type="url" inputMode="url" placeholder="https://..." className={field} value={f.website} onChange={set('website')} {...d('website')} />
      </Field>
      <Field id="email" label="Contact email (optional)" error={e('email')}>
        <input id="email" type="email" className={field} value={f.email} onChange={set('email')} {...d('email')} />
      </Field>

      {serverError && (
        <p role="alert" className="text-[15px] text-danger">
          {serverError}{dup && <> <Link to={`/c/${dup}`} className="font-semibold underline">View page</Link></>}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>Create page</Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/c')}>Cancel</Button>
      </div>
    </form>
  );
}
