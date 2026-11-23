import { Link, useSearchParams } from 'react-router-dom';
import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { peopleTabFromParam } from '../../lib/people';
import { PeopleService } from '../../services/peopleService';
import { PersonList, PersonResults } from '../../components/people/PersonList';
import { EmptyState } from '../../components/ui/EmptyState';
import { Tabs } from '../../components/ui/Tabs';

const EMPTY = {
  suggestions: ['No suggestions yet', 'Add your college and interests in settings to see people you may know.'],
  requests: ['No requests', 'When someone asks to connect, it shows up here.'],
} as const satisfies Record<string, [string, string]>;

export function FindPeoplePage() {
  const { appUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState('');
  const term = useDebounce(text.trim(), 350);
  const tab = peopleTabFromParam(params.get('tab'));
  const username = appUser?.username;

  const requests = useQuery({ queryKey: ['people', 'requests'], queryFn: PeopleService.requests, retry: false });
  const suggestions = useQuery({ queryKey: ['people', 'suggestions'], queryFn: PeopleService.suggestions, retry: false, enabled: tab === 'suggestions' && term.length < 2 });
  const search = useQuery({ queryKey: ['people', 'search', term], queryFn: () => PeopleService.search(term), retry: false, enabled: term.length >= 2 });

  const n = requests.data?.length ?? 0;
  const tabs = [
    { id: 'suggestions', label: 'Suggestions' }, { id: 'requests', label: n ? `Requests (${n})` : 'Requests' },
    { id: 'connections', label: 'Connections' }, { id: 'following', label: 'Following' }, { id: 'followers', label: 'Followers' },
  ];
  const searching = text.trim().length >= 2;

  let body;
  if (searching) {
    body = <PersonResults people={search.data ?? []} loading={term.length < 2 || search.isLoading} error={search.isError} onRetry={() => void search.refetch()} empty={['No one found', 'Try another name or username.']} />;
  } else if (tab === 'suggestions') {
    body = <PersonResults people={suggestions.data ?? []} loading={suggestions.isLoading} error={suggestions.isError} onRetry={() => void suggestions.refetch()} empty={EMPTY.suggestions} />;
  } else if (tab === 'requests') {
    body = <PersonResults people={requests.data ?? []} loading={requests.isLoading} error={requests.isError} onRetry={() => void requests.refetch()} empty={EMPTY.requests} />;
  } else if (!username) {
    body = <EmptyState title="Pick a username first" body="Your lists show up once you have a @username." action={<Link to="/settings" className="font-semibold text-brand hover:underline">Open settings</Link>} />;
  } else {
    body = <Fragment key={tab}><PersonList username={username} list={tab} /></Fragment>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 pb-24 md:pb-4">
      <Helmet><title>Find people | MyCollegeGenie</title><meta name="robots" content="noindex" /></Helmet>
      <h1 className="text-[22px] font-bold text-ink">Find people</h1>
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} maxLength={40} placeholder="Search by name or @username" aria-label="Search people"
        className="min-h-11 w-full rounded-full border border-line bg-surface px-4 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
      <Tabs label="People" items={tabs} value={tab} onChange={(id) => { setText(''); setParams(id === 'suggestions' ? {} : { tab: id }, { replace: true }); }} />
      <div role="tabpanel" aria-labelledby={`tab-${tab}`}>{body}</div>
    </div>
  );
}
