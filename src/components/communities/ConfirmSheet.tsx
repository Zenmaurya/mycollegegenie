import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/button';

interface Props { open: boolean; title: string; body: string; confirmLabel: string; busy?: boolean; onConfirm: () => void; onClose: () => void }

export function ConfirmSheet({ open, title, body, confirmLabel, busy, onConfirm, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title} dismissible={!busy}>
      <div className="space-y-4 p-4">
        <p className="text-[15px] text-ink">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </Sheet>
  );
}
