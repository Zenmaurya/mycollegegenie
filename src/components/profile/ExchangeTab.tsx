import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { ExchangeService } from '../../services/exchangeService';
import type { Listing } from '../../lib/exchange';
import { ItemCard } from '../exchange/ItemCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

const linkBtn = 'inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-brand';

export const ExchangeTab: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['my-exchange', user?.id], queryFn: ExchangeService.mine, enabled: !!user });
  // Owner-deleted items stay in the table as hidden rows; they are gone as far as the owner is concerned.
  const items = (q.data ?? []).filter((i) => i.hiddenReason !== 'owner');

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['my-exchange'] });
    void qc.invalidateQueries({ queryKey: ['exchange'] });
    void qc.invalidateQueries({ queryKey: ['exchange-sections'] });
    void qc.invalidateQueries({ queryKey: ['exchange-item'] });
  };

  const act = useMutation({
    mutationFn: async ({ item, action }: { item: Listing; action: 'active' | 'reserved' | 'sold' | 'delete' }) => {
      setBusyId(item.id);
      if (action === 'delete') await ExchangeService.remove(item.id); else await ExchangeService.setStatus(item.id, action);
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Could not update the listing.'),
    onSettled: () => setBusyId(null),
  });
  const run = (item: Listing, action: 'active' | 'reserved' | 'sold' | 'delete') => {
    if (action === 'delete' && !window.confirm('Delete this listing? This cannot be undone.')) return;
    act.mutate({ item, action });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">Your listings</h2>
        <Link to="/exchange/sell" className="text-[15px] font-semibold text-brand hover:underline">Sell something</Link>
      </div>

      {q.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3"><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /></div>
      ) : q.isError ? (
        <EmptyState title="Could not load your listings" body="Check your connection and try again." action={<Button onClick={() => void q.refetch()}>Try again</Button>} />
      ) : items.length === 0 ? (
        <EmptyState title="No listings yet" body="You haven't posted anything on Campus Exchange." action={<Link to="/exchange/sell" className="font-semibold text-brand hover:underline">Create your first listing</Link>} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <li key={item.id} className="space-y-2">
                <div className={item.status === 'sold' ? 'opacity-60' : undefined}><ItemCard item={item} /></div>
                <p className="text-[13px] font-semibold text-ink-muted">{item.isHidden ? 'Hidden by moderators' : item.status === 'sold' ? 'Sold' : item.status === 'reserved' ? 'Reserved' : 'Active'}</p>
                <div className="flex flex-wrap gap-2">
                  {!item.isHidden && <Link to={`/exchange/${item.id}/edit`} className={linkBtn}>Edit</Link>}
                  {!item.isHidden && item.status !== 'sold' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(item, item.status === 'reserved' ? 'active' : 'reserved')}>{item.status === 'reserved' ? 'Available' : 'Reserve'}</Button>}
                  {!item.isHidden && item.status !== 'sold' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(item, 'sold')}>Mark sold</Button>}
                  {!item.isHidden && item.status === 'sold' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(item, 'active')}>Relist</Button>}
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => run(item, 'delete')}>Delete</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
