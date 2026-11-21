import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/button';
import { follow, listCommunities, unfollow } from '../../services/communityService';
import { categoriesForInterests, mergeSuggestions } from '../../lib/onboarding';

interface Props { collegeId: string | null; interests: string[]; onEmpty: () => void }

export function SuggestedSocieties({ collegeId, interests, onEmpty }: Props) {
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const q = useQuery({
    queryKey: ['onboarding-societies', collegeId, interests],
    queryFn: async () => {
      const atCollege = collegeId ? (await listCommunities({ college: collegeId })).items : [];
      // Three categories at most keeps this to four requests.
      const byInterest = (await Promise.all(categoriesForInterests(interests).slice(0, 3).map((category) => listCommunities({ category })))).flatMap((r) => r.items);
      return mergeSuggestions(atCollege, byInterest);
    },
  });
  const empty = q.isSuccess && q.data.length === 0;
  useEffect(() => { if (empty || q.isError) onEmpty(); }, [empty, q.isError, onEmpty]);

  const toggle = async (slug: string, on: boolean) => {
    setFollowed((m) => ({ ...m, [slug]: !on }));
    try { await (on ? unfollow(slug) : follow(slug)); }
    catch (e) { setFollowed((m) => ({ ...m, [slug]: on })); toast.error(e instanceof Error ? e.message : 'Could not update follow'); }
  };

  return (
    <>
      <h2 className="mt-1 text-[22px] font-bold text-ink">Suggested societies</h2>
      {q.isPending && <p className="mt-4 text-[15px] text-ink-muted">Finding societies…</p>}
      <ul className="mt-4 space-y-2">
        {q.data?.map((c) => {
          const on = followed[c.slug] ?? c.following ?? false;
          return (
            <li key={c.id} className="flex items-center gap-3">
              <Avatar src={c.logo_url} name={c.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                <span className="block truncate text-[13px] text-ink-muted">{[c.college?.short_name, c.category].filter(Boolean).join(' · ')}</span>
              </span>
              <Button variant={on ? 'secondary' : 'primary'} aria-pressed={on} aria-label={`${on ? 'Unfollow' : 'Follow'} ${c.name}`} onClick={() => void toggle(c.slug, on)}>
                {on ? 'Following' : 'Follow'}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
