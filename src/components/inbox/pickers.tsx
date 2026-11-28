import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '../../hooks/useDebounce';
import { MAX_GROUP_NAME, matchesQuery } from '../../lib/inbox';
import { InboxService, type PickPerson } from '../../services/inboxService';
import { PeopleService } from '../../services/peopleService';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/button';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/skeleton';

const input = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Try again.');
const Note = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-[14px] text-ink-muted">{children}</p>;

function Row({ p, children }: { p: PickPerson; children?: ReactNode }) {
  return (
    <>
      <Avatar src={p.photoUrl} name={p.displayName} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{p.displayName}</span>
        {p.username && <span className="block truncate text-[13px] text-ink-muted">@{p.username}</span>}
      </span>
      {children}
    </>
  );
}

/** Checklist of the connections who can be added (the server decides who that is). */
export function MemberPicker({ groupId, selected, onChange }: { groupId?: string; selected: string[]; onChange: (ids: string[]) => void }) {
  const [text, setText] = useState('');
  const q = useQuery({ queryKey: ['inbox', 'addable', groupId ?? 'new'], queryFn: () => InboxService.addable(groupId), retry: false, staleTime: 0 });
  const people = (q.data ?? []).filter((p) => matchesQuery(text, p.displayName, p.username));
  return (
    <div className="space-y-2">
      <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search your connections" aria-label="Search your connections" className={input} />
      {q.isLoading ? <Skeleton className="h-24 w-full" />
        : q.isError ? <Note>Could not load your connections.</Note>
        : !q.data?.length ? <Note>Only your connections can be added. Connect with people from Find people first.</Note>
        : !people.length ? <Note>No one found.</Note>
        : (
          <ul>
            {people.map((p) => (
              <li key={p.id}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
                  <Row p={p}>
                    <input type="checkbox" className="h-5 w-5 accent-[var(--color-brand)]" checked={selected.includes(p.id)}
                      onChange={(e) => onChange(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))} />
                  </Row>
                </label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

export function NewGroupSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const create = useMutation({
    mutationFn: () => InboxService.createGroup(name.trim(), ids),
    onSuccess: (g) => { void qc.invalidateQueries({ queryKey: ['inbox'] }); onClose(); navigate(`/inbox/g/${encodeURIComponent(g.id)}`); },
    onError: (e) => toast.error(errText(e)),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); if (name.trim() && ids.length && !create.isPending) create.mutate(); };
  return (
    <Sheet open onClose={onClose} title="New group" dismissible={!create.isPending}>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <label htmlFor="group-name" className="mb-1 block text-[13px] font-semibold text-ink">Group name</label>
            <input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_GROUP_NAME} className={input} />
          </div>
          <MemberPicker selected={ids} onChange={setIds} />
        </div>
        <div className="border-t border-line p-3">
          <Button type="submit" className="w-full" disabled={!name.trim() || !ids.length} loading={create.isPending}>{ids.length ? `Create group (${ids.length + 1} members)` : 'Create group'}</Button>
        </div>
      </form>
    </Sheet>
  );
}

/** Your connections first; typing 2+ letters searches everyone. */
export function NewMessageSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const term = useDebounce(text.trim(), 350);
  const searching = text.trim().length >= 2;
  const mine = useQuery({ queryKey: ['inbox', 'addable', 'new'], queryFn: () => InboxService.addable(), retry: false, staleTime: 0 });
  const found = useQuery({ queryKey: ['people', 'search', term], queryFn: () => PeopleService.search(term), enabled: term.length >= 2, retry: false });
  const start = useMutation({
    mutationFn: (userId: string) => InboxService.start({ userId }),
    onSuccess: (c) => { onClose(); navigate(`/inbox/${encodeURIComponent(c.id)}`); },
    onError: (e) => toast.error(errText(e)),
  });
  const q = searching ? found : mine;
  const people: PickPerson[] = (searching ? found.data : mine.data) ?? [];
  return (
    <Sheet open onClose={onClose} title="New message">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        <input type="search" value={text} onChange={(e) => setText(e.target.value)} maxLength={40} placeholder="Search by name or @username" aria-label="Search people" className={input} />
        {q.isLoading || (searching && term.length < 2) ? <Skeleton className="h-24 w-full" />
          : q.isError ? <Note>Could not load people.</Note>
          : !people.length ? <Note>{searching ? 'No one found.' : 'Search for someone by name to start a chat.'}</Note>
          : (
            <ul>
              {people.map((p) => (
                <li key={p.id}>
                  <button type="button" disabled={start.isPending} onClick={() => start.mutate(p.id)} className="flex min-h-12 w-full items-center gap-3 rounded-lg py-1 text-left hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
                    <Row p={p} />
                  </button>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Sheet>
  );
}
