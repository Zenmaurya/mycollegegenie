import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createCommunity } from '../../services/communityService';
import { validateCommunityForm, type CommunityForm } from '../../lib/communities';
import { OnboardingFlow } from '../../components/onboarding/OnboardingFlow';
import { Button } from '../../components/ui/button';
import { CommunityFields, pickImage, uploadImage } from '../../components/communities/CommunityFields';

export function CreateCommunityPage() {
  const { user, appUser, isAuthLoading, refreshAppUser } = useAuth();
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
        <p className="text-[15px] text-ink-muted">Society pages belong to a college. Choose yours to continue.</p>
        <OnboardingFlow startStep={1} onDone={() => void refreshAppUser()} />
      </div>
    );
  }

  const set = (k: keyof CommunityForm) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const pick = (setter: (f: File | null) => void, label: string) => pickImage(setter, (m) => setErrors((p) => ({ ...p, [label]: m })));
  const upload = uploadImage;

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

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-[680px] space-y-4 px-3 py-4 sm:px-4">
      <h1 className="text-[22px] font-bold text-ink">Create society page</h1>
      <p className="text-[15px] text-ink-muted">New pages start as Unverified. Ask MCG to verify your page from Manage.</p>

      <CommunityFields f={f} errors={errors} onChange={set} onLogo={pick(setLogo, 'logo')} onBanner={pick(setBanner, 'banner')} />

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
