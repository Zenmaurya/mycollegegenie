import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../context/ResourceContext';
import { resolveAvatar } from '../../constants/avatars';
import { courseShort } from '../../lib/notes';
import { PROFILE_TABS, tabFromParam, type Profile, type ProfileItem, type ProfileStats, type ProfileTab } from '../../lib/profiles';
import { formatRent } from '../../lib/stays';
import { timeAgo } from '../../lib/feed';
import { ProfileService } from '../../services/profileService';
import { VerifiedBadge } from '../../components/VerifiedBadge';
import { PostCard } from '../../components/feed/PostCard';
import { NoteCard } from '../../components/notes/NoteCard';
import { StayCard } from '../../components/stays/StayCard';
import { ReportSheet } from '../../components/communities/ReportSheet';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Menu } from '../../components/ui/Menu';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs } from '../../components/ui/Tabs';

const EMPTY: Record<ProfileTab, string> = {
  posts: 'No posts yet', comments: 'No comments yet', notes: 'No notes yet', listings: 'No listings yet', saved: 'Nothing saved yet',
};

function ProfileAvatar({ profile }: { profile: Profile }) {
  const av = resolveAvatar(profile.photoUrl ?? '');
  return av
    ? <span role="img" aria-label={profile.displayName} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${av.bg}`}>{av.emoji}</span>
    : <Avatar src={profile.photoUrl} name={profile.displayName} size="lg" />;
}

function ItemView({ item, saved, onToggleSave }: { item: ProfileItem; saved: ReadonlySet<string>; onToggleSave: (id: string) => void }) {
  switch (item.kind) {
    case 'post': return <PostCard post={item.post} isSaved={saved.has(item.post.id)} onToggleSave={onToggleSave} />;
    case 'note': return <NoteCard note={item.note} saved={saved.has(item.note.id)} onToggleSave={onToggleSave} />;
    case 'stay': return <StayCard stay={item.stay} />;
    case 'comment':
      return (
        <Link to={`/post/${item.postId}`} className="block rounded-card bg-surface p-3 shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
          <p className="line-clamp-1 text-[13px] text-ink-muted">On {item.postTitle} · {timeAgo(item.createdAt)}</p>
          <p className="mt-1 line-clamp-3 text-[15px] text-ink">{item.content}</p>
        </Link>
      );
    case 'exchange':
      return (
        <Link to="/campus-exchange" className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card hover:shadow-float focus-visible:outline-2 focus-visible:outline-brand">
          {item.item.imageUrl && <img src={item.item.imageUrl} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0">
            <p className="line-clamp-1 text-[15px] font-semibold text-ink">{item.item.title}</p>
            <p className="text-[13px] text-ink-muted">{item.item.type} · {formatRent(item.item.price)}</p>
          </div>
        </Link>
      );
  }
}

function TabPanel({ username, tab }: { username: string; tab: ProfileTab }) {
  const { appUser } = useAuth();
  const { savedResourceIds, toggleSave } = useResources();
  const saved = useMemo(() => new Set(savedResourceIds), [savedResourceIds]);
  const onToggleSave = useCallback((id: string) => { void toggleSave(id); }, [toggleSave]);
  const q = useInfiniteQuery({
    queryKey: ['profile-tab', username, tab, appUser?.uid ?? 'anon'],
    queryFn: ({ pageParam }) => ProfileService.tab(username, tab, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
    retry: false,
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (q.isLoading) return <div className="space-y-3 py-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (q.isError) return <EmptyState title="Could not load this tab" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  if (!items.length) return <EmptyState title={EMPTY[tab]} body="Nothing to show here right now." />;
  const stacked = tab === 'posts' || tab === 'comments';
  return (
    <div className="py-4">
      <ul className={stacked ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
        {items.map((it, i) => <li key={`${it.kind}-${i}`} className="min-w-0"><ItemView item={it} saved={saved} onToggleSave={onToggleSave} /></li>)}
      </ul>
      {q.hasNextPage && <div className="mt-4 text-center"><Button variant="secondary" loading={q.isFetchingNextPage} onClick={() => void q.fetchNextPage()}>Load more</Button></div>}
    </div>
  );
}

function Header({ profile, stats, isOwner }: { profile: Profile; stats: ProfileStats; isOwner: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [reporting, setReporting] = useState(false);
  const details = [profile.collegeName, profile.course && courseShort(profile.course), profile.batchYear && `Batch ${profile.batchYear}`].filter(Boolean).join(' · ');
  const joined = stats.joined ? new Date(stats.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`); toast.success('Link copied'); }
    catch { toast.error("Couldn't copy the link"); }
  };
  const report = () => {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }); return; }
    setReporting(true);
  };
  const numbers: [string, string | number][] = [['Posts', stats.posts], ['Answers', stats.answers], ['Notes', stats.notes], ['Joined', joined]];
  return (
    <header className="space-y-4">
      <div className="flex items-start gap-4">
        <ProfileAvatar profile={profile} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-bold leading-tight text-ink">
            <span className="break-words">{profile.displayName}</span>
            {profile.isVerified && <VerifiedBadge size="sm" showLabel={false} />}
            {profile.role && <Badge tone="brand">{profile.role === 'admin' ? 'Admin' : 'Moderator'}</Badge>}
          </h1>
          <p className="text-[15px] text-ink-muted">@{profile.username}</p>
          {details && <p className="mt-1 text-[13px] text-ink-muted">{details}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isOwner && <Link to="/settings" className="inline-flex min-h-11 items-center rounded-sm border border-ink px-3 text-[14px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand">Edit profile</Link>}
          <Menu label="Profile actions" items={[{ label: 'Copy link', onSelect: () => void copy() }, ...(isOwner ? [] : [{ label: 'Report user', onSelect: report, danger: true }])]} />
        </div>
      </div>
      {profile.bio && <p className="whitespace-pre-line text-[15px] text-ink">{profile.bio}</p>}
      {profile.interests.length > 0 && <p className="text-[13px] text-ink-muted">{profile.interests.join(' · ')}</p>}
      <dl className="grid grid-cols-4 gap-2 rounded-card bg-surface p-3 text-center shadow-card">
        {numbers.map(([k, v]) => (
          <div key={k}><dd className="text-[17px] font-bold text-ink">{v || (k === 'Joined' ? '-' : 0)}</dd><dt className="text-[12px] text-ink-muted">{k}</dt></div>
        ))}
      </dl>
      {!isOwner && <ReportSheet open={reporting} onClose={() => setReporting(false)} itemType="user" itemId={profile.id} title="Report user" />}
    </header>
  );
}

export function UserProfilePage() {
  const { username = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // the answer depends on who is asking, so the viewer is part of the key
  const q = useQuery({ queryKey: ['profile', username, appUser?.uid ?? 'anon'], queryFn: () => ProfileService.get(username), retry: false });
  const redirect = q.data && 'redirect' in q.data ? q.data.redirect : null;
  useEffect(() => { if (redirect) navigate(`/u/${redirect}${location.search}`, { replace: true }); }, [redirect, navigate, location.search]);

  if (q.isLoading || redirect) return <div className="mx-auto max-w-3xl space-y-4 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (q.isError && (q.error as { status?: number }).status !== 404) {
    return <EmptyState title="Could not load this profile" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />;
  }
  if (q.isError || !q.data || 'redirect' in q.data) {
    return (
      <>
        <Helmet><title>Profile | MyCollegeGenie</title><meta name="robots" content="noindex" /></Helmet>
        <EmptyState title="This profile isn't available" body="It may not exist, or it isn't shared with you." action={<Link to="/" className="font-semibold text-brand hover:underline">Go home</Link>} />
      </>
    );
  }
  const { profile, stats, isOwner } = q.data;
  const tab = tabFromParam(params.get('tab'), isOwner);
  const tabs = PROFILE_TABS.filter((t) => t.id !== 'saved' || isOwner);
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-24 md:pb-4">
      <Helmet>
        <title>{`${profile.displayName} (@${profile.username}) | MyCollegeGenie`}</title>
        {profile.visibility !== 'everyone' && <meta name="robots" content="noindex" />}
      </Helmet>
      <Header profile={profile} stats={stats} isOwner={isOwner} />
      <Tabs label="Profile sections" items={tabs} value={tab} onChange={(id) => setParams(id === 'posts' ? {} : { tab: id }, { replace: true })} />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <Fragment key={`${profile.username}-${tab}`}><TabPanel username={profile.username} tab={tab} /></Fragment>
      </div>
    </div>
  );
}
