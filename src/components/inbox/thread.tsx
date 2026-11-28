// The parts a 1:1 conversation and a group thread share.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Send } from 'lucide-react';
import { MAX_MESSAGE, type ChatMessage } from '../../lib/inbox';
import { Button } from '../ui/button';

// A transformed ancestor breaks position: fixed, so the mobile composer is portaled (see NoteActions).
export function useIsDesktop() {
  const mq = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const [on, setOn] = useState(mq);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 768px)');
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return on;
}

/** Scrolls to the newest message on first load, after my own message, or when already at the bottom; never while reading older ones. */
export function useStickToBottom(lastId: string | undefined, lastMine: boolean) {
  const end = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  useEffect(() => {
    // capture: the desktop thread scrolls inside its own box, mobile scrolls the window
    const f = () => {
      const el = end.current;
      if (!el?.parentElement) return;
      atBottom.current = el.getBoundingClientRect().top < Math.min(window.innerHeight, el.parentElement.getBoundingClientRect().bottom) + 150;
    };
    document.addEventListener('scroll', f, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', f, { capture: true });
  }, []);
  useEffect(() => {
    if (lastId && (atBottom.current || lastMine)) end.current?.scrollIntoView?.({ block: 'end' });
  }, [lastId, lastMine]);
  return end;
}

export function Dock({ desktop, children }: { desktop: boolean; children: React.ReactNode }) {
  const box = <div className={desktop ? 'border-t border-line bg-surface p-3' : 'fixed inset-x-0 bottom-16 z-50 border-t border-line bg-surface p-3'}>{children}</div>;
  return desktop ? box : createPortal(box, document.body);
}

export function Composer({ onSend, sending, reason, desktop }: { onSend: (text: string) => Promise<boolean>; sending: boolean; reason: string | null; desktop: boolean }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const off = !!reason;
  const submit = async () => {
    if (!trimmed || sending || off) return;
    if (await onSend(trimmed)) setText('');
  };
  return (
    <Dock desktop={desktop}>
      {reason && <p className="mb-2 text-[13px] text-ink-muted">{reason}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text} rows={2} maxLength={MAX_MESSAGE} disabled={off} aria-label="Message"
          placeholder={off ? reason! : 'Write a message'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }}
          className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:bg-canvas"
        />
        <Button onClick={() => void submit()} disabled={!trimmed || off} loading={sending} aria-label="Send message" className="h-11 w-11 shrink-0 px-0"><Send className="h-5 w-5" aria-hidden /></Button>
      </div>
      {text.length > MAX_MESSAGE - 200 && <p className="mt-1 text-right text-[12px] text-ink-muted">{text.length}/{MAX_MESSAGE}</p>}
    </Dock>
  );
}

export function Bubble({ m, seen }: { m: ChatMessage; seen?: boolean }) {
  if (m.is_system) return <li className="py-1 text-center text-[13px] italic text-ink-muted">{m.content.replace(/^System:\s*/, '')}</li>;
  return (
    <li className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
      {m.senderName && <span className="px-1 text-[12px] font-semibold text-ink-muted">{m.senderName}</span>}
      <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-[15px] ${m.mine ? 'bg-brand text-white' : 'bg-surface text-ink shadow-card'}`}>{m.content}</p>
      {seen && <span className="px-1 text-[12px] text-ink-muted">Seen</span>}
    </li>
  );
}
