import { useRef, useState, type ReactNode } from 'react';
import { Sheet } from '../../components/ui/Sheet';

// Sheet-based confirm (focus trap, Esc, focus return). With `typeName`, confirm stays disabled until it is typed.
// `children` holds extra fields (reason, duration); `error` is a server error shown inline.
export function ConfirmSheet({ open, onClose, title, message, confirmLabel, danger, typeName, onConfirm, children, error, confirmDisabled }: {
  open: boolean; onClose: () => void; title: string; message: string; confirmLabel: string; danger?: boolean; typeName?: string; onConfirm: () => void;
  children?: ReactNode; error?: string; confirmDisabled?: boolean;
}) {
  const [typed, setTyped] = useState('');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const close = () => { setTyped(''); onClose(); };
  const btn = 'min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50';
  return (
    <Sheet open={open} onClose={close} title={title} initialFocusRef={typeName ? undefined : cancelRef}>
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        {children}
        {typeName && (
          <label className="block text-sm font-bold text-gray-800">Type the page name to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1 w-full min-h-[44px] px-3 rounded-xl border border-gray-300 font-normal" />
          </label>
        )}
        {error && <p role="alert" className="text-sm font-bold text-rose-700">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button ref={cancelRef} className={`${btn} bg-gray-100 text-gray-900`} onClick={close}>Cancel</button>
          <button className={`${btn} ${danger ? 'bg-rose-700' : 'bg-emerald-700'} text-white`} disabled={confirmDisabled || (!!typeName && typed.trim() !== typeName)}
            onClick={() => { setTyped(''); onConfirm(); }}>{confirmLabel}</button>
        </div>
      </div>
    </Sheet>
  );
}
