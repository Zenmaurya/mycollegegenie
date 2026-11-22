import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { InboxService } from '../../services/inboxService';
import { Button } from '../ui/button';

type Target = { listingType: string; listingId: string } | { userId: string };

/** Starts (or reopens) a chat, then opens it. Logged-out visitors go to login first. Callers hide it on their own listing/profile. */
export function MessageButton({ target, className, variant = 'secondary' }: { target: Target; className?: string; variant?: 'primary' | 'secondary' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!user) { navigate('/login', { state: { from: { pathname: location.pathname + location.search } } }); return; }
    setBusy(true);
    try { navigate(`/inbox/${encodeURIComponent((await InboxService.start(target)).id)}`); } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start the chat. Try again.'); // 403 blocked / 429 limit carry the server's text
      setBusy(false);
    }
  };
  return <Button variant={variant} loading={busy} onClick={() => void go()} className={className}><MessageSquare className="h-5 w-5" aria-hidden /> Message</Button>;
}
