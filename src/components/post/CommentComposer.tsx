import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { IconButton } from '../ui/IconButton';

interface Props {
  replyingTo: string | null;
  onCancelReply: () => void;
  onSubmit: (content: string) => Promise<void>;
}

// Sticky above the mobile tab bar (64px); flush to the bottom on md+.
export function CommentComposer({ replyingTo, onCancelReply, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const content = text.trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content || busy) return;
    setBusy(true);
    try { await onSubmit(content); setText(''); } catch { /* caller toasts; keep the draft */ } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="sticky bottom-16 z-30 border-t border-line bg-surface px-4 py-3 md:bottom-0">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between rounded-sm bg-canvas pl-3 text-[13px] text-ink-muted">
          <span>Replying to <span className="font-semibold text-ink">{replyingTo}</span></span>
          <IconButton label="Cancel reply" icon={X} onClick={onCancelReply} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
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
