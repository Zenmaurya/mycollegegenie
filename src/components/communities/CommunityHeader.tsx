import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { joinButton, type CommunityDetail } from '../../lib/communities';
import { follow, join, leave, unfollow } from '../../services/communityService';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Menu } from '../ui/Menu';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/button';
import { ConfirmSheet } from './ConfirmSheet';

interface Props { detail: CommunityDetail; onChanged: () => Promise<unknown> | void; onReport: () => void }

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

export function CommunityHeader({ detail: d, onChanged, onReport }: Props) {
  const { user, refreshAppUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const jb = joinButton(d);
  const manager = d.viewer.status === 'active' && (d.viewer.role === 'admin' || d.viewer.role === 'core');
  const recruiting = !!d.recruitment_until && d.recruitment_until.slice(0, 10) >= today();
  const toLogin = () => navigate('/login', { state: { from: { pathname: location.pathname } } });

  const act = async (fn: () => Promise<unknown>, fail: string) => {
    setBusy(true);
    try { await fn(); await onChanged(); }
    catch (e) { toast.error(e instanceof Error ? e.message : fail); }
    finally { setBusy(false); setLeaving(false); }
  };

  const onFollow = () => (user ? act(() => (d.viewer.following ? unfollow(d.slug) : follow(d.slug)), 'Could not update follow') : toLogin());
  const onJoin = () => {
    if (jb.action === 'login') return toLogin();
    if (jb.action === 'pick_college') return setCollegeOpen(true);
    if (jb.action === 'leave') return setLeaving(true);
    if (jb.action === 'join' || jb.action === 'request') void act(() => join(d.slug), 'Could not send your request');
  };
  const closeCollege = () => { setCollegeOpen(false); void refreshAppUser(); void onChanged(); };

  const menu = [
    { label: 'Report page', danger: true, onSelect: () => (user ? onReport() : toLogin()) },
    ...(manager ? [{ label: 'Manage', onSelect: () => navigate(`/c/${d.slug}/manage`) }] : []),
  ];
  const stats = [d.category, `${d.followers} ${d.followers === 1 ? 'follower' : 'followers'}`, `${d.members} ${d.members === 1 ? 'member' : 'members'}`];

  return (
    <header className="overflow-hidden rounded-card bg-surface shadow-card">
      {d.status === 'unverified' && (
        <p role="note" className="bg-canvas px-4 py-2 text-[14px] font-semibold text-ink">Unverified — not checked by MCG</p>
      )}
      {d.banner_url ? <img src={d.banner_url} alt="" className="h-28 w-full object-cover sm:h-36" /> : <div aria-hidden className="h-16 bg-brand-soft sm:h-24" />}
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar src={d.logo_url} name={d.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold leading-tight text-ink">{d.name}</h1>
            <p className="text-[14px] text-ink-muted">{d.college?.short_name ?? 'MyCollegeGenie'}</p>
            <div className="mt-1">
              {d.status === 'official'
                ? <Badge tone="success"><BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden />Official</Badge>
                : <Badge>Unverified</Badge>}
            </div>
          </div>
          <Menu label="More actions" items={menu} />
        </div>
        <p className="text-[14px] text-ink-muted">{stats.join(' · ')}</p>
        {recruiting && (
          <Link to={`/c/${d.slug}/events`} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">
            Recruitment open till {new Date(d.recruitment_until!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →
          </Link>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant={d.viewer.following ? 'secondary' : 'primary'} aria-pressed={d.viewer.following} disabled={busy} onClick={() => void onFollow()}>
            {d.viewer.following ? 'Following' : 'Follow'}
          </Button>
          <Button variant="secondary" disabled={busy || (!jb.action)} onClick={onJoin}>{jb.label}</Button>
        </div>
      </div>

      <ConfirmSheet open={leaving} title={jb.label === 'Requested' ? 'Cancel your request?' : 'Leave this society?'}
        body={jb.label === 'Requested' ? 'Your request to join will be withdrawn.' : `You will no longer be a member of ${d.name}.`}
        confirmLabel={jb.label === 'Requested' ? 'Cancel request' : 'Leave'} busy={busy}
        onClose={() => setLeaving(false)} onConfirm={() => void act(() => leave(d.slug), 'Could not leave')} />
      <Sheet open={collegeOpen} onClose={closeCollege} title="Set up your profile">
        <div className="flex-1 overflow-y-auto p-4"><OnboardingFlow startStep={1} onDone={closeCollege} /></div>
      </Sheet>
    </header>
  );
}
