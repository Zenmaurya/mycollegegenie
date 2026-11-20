import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/button';
import { IconButton } from '../ui/IconButton';

interface Props {
  /** null when the viewer is logged out */
  name: string | null;
  replyingTo: string | null;
  /** changes whenever a different comment is chosen for reply */
  replyKey: string | null;
  onCancelReply: () => void;
  onRequireLogin: () => void;
  onSubmit: (content: string) => Promise<void>;
}

// Sticky above the mobile tab bar (64px); flush to the bottom on md+. Collapsed until tapped or a reply starts.
export function CommentComposer({ name, replyingTo, replyKey, onCancelReply, onRequireLogin, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const content = text.trim();
  const expanded = open || !!replyingTo;

  // Opening (tap or Reply) focuses the textarea so the mobile keyboard opens and "Replying to" stays visible.
  useEffect(() => {
    if (!expanded) return;
    area.current?.focus();
    area.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expanded, replyKey]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content || busy) return;
    setBusy(true);
    try { await onSubmit(content); setText(''); setOpen(false); } catch { /* caller toasts; keep the draft */ } finally { setBusy(false); }
  };

  const shell = 'sticky bottom-16 z-30 border-t border-line bg-surface px-4 py-3 md:bottom-0';

  if (!expanded) {
    return (
      <div className={shell}>
        <button
          type="button"
          onClick={() => (name ? setOpen(true) : onRequireLogin())}
          className="flex min-h-11 w-full items-center gap-2 rounded-full border border-line bg-canvas px-2 text-left text-[15px] text-ink-muted focus-visible:outline-2 focus-visible:outline-brand"
        >
          {name ? <><Avatar name={name} size="sm" /> Comment as {name}</> : 'Log in to comment'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={shell}>
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-sm bg-canvas pl-3 text-[13px] text-ink-muted">
          <span>Replying to <span className="font-semibold text-ink">{replyingTo}</span></span>
          <IconButton label="Cancel reply" icon={X} onClick={onCancelReply} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={area}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          rows={1}
          aria-label={replyingTo ? `Reply to ${replyingTo}` : 'Add a comment'}
          placeholder={replyingTo ? 'Write a reply…' : 'Add a comment…'}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-sm border border-line bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-brand"
        />
        <Button type="submit" disabled={!content || busy}>{busy ? 'Posting…' : 'Post'}</Button>
      </div>
    </form>
  );
}
