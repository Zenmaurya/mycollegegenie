import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { closesIn, deadlineSoon } from '../../lib/communities';
import { listSavedEvents } from '../../services/eventService';

const KEY = 'mcg_deadline_banner_dismissed';

export function DeadlineBanner() {
  const { appUser } = useAuth();
  const uid = appUser?.uid;
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const q = useQuery({ queryKey: ['events-saved', uid], queryFn: () => listSavedEvents(), enabled: !!uid && !dismissed });
  if (!uid || dismissed || !q.data) return null;
  const now = new Date();
  const soon = deadlineSoon(q.data.items, now);
  if (!soon.length) return null;
  const first = soon[0];
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  };
  return (
    <div role="status" className="flex items-center gap-2 rounded-card bg-brand-soft p-3 text-[14px] text-ink shadow-card">
      <p className="min-w-0 flex-1">
        <span className="font-semibold">{first.title}</span> — registration closes {closesIn(first.register_by!, now)}
        {soon.length > 1 && <span className="text-ink-muted"> · +{soon.length - 1} more</span>}
      </p>
      <Link to="/explore/competitions?tab=saved" className="inline-flex min-h-11 items-center px-2 font-semibold text-brand-hover underline focus-visible:outline-2 focus-visible:outline-brand">View</Link>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
