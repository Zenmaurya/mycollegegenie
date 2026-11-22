import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { REPORT_REASONS } from '../../lib/communities';
import { RESOURCE_REPORT_REASONS } from '../../lib/notes';
import { STAY_REPORT_REASONS } from '../../lib/stays';
import { report, type ReportItemType } from '../../services/reportService';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/button';

type Reason = (typeof REPORT_REASONS)[number] | (typeof RESOURCE_REPORT_REASONS)[number] | (typeof STAY_REPORT_REASONS)[number];
interface Props { open: boolean; onClose: () => void; itemType: ReportItemType; itemId: string; title: string; initialNote?: string }

export function ReportSheet({ open, onClose, itemType, itemId, title, initialNote = '' }: Props) {
  const [reason, setReason] = useState<Reason | ''>('');
  const [note, setNote] = useState(initialNote);
  const [busy, setBusy] = useState(false);
  const reasons: readonly Reason[] = itemType === 'resource' ? RESOURCE_REPORT_REASONS : itemType === 'stay' ? STAY_REPORT_REASONS : REPORT_REASONS;
  const needsNote = reason === 'Other';
  const ready = !!reason && (!needsNote || note.trim().length > 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      await report(itemType, itemId, reason as Reason, note.trim() || undefined);
      toast.success('Thanks — our team will review this.'); // a duplicate report gets the same message
      setReason(''); setNote('');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} dismissible={!busy}>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <fieldset className="space-y-1">
          <legend className="mb-1 text-[15px] font-semibold text-ink">Why are you reporting this?</legend>
          {reasons.map((r) => (
            <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
              <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="h-5 w-5 accent-[var(--color-brand)]" />
              {r}
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="report-note" className="mb-1 block text-[15px] font-semibold text-ink">Note{needsNote ? '' : ' (optional)'}</label>
          <textarea id="report-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} required={needsNote}
            className="w-full resize-none rounded-lg border border-line px-3 py-2 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand" />
          <p className="mt-1 text-right text-[13px] text-ink-muted">{note.length}/500</p>
        </div>
        <Button type="submit" disabled={!ready} loading={busy}>Send report</Button>
      </form>
    </Sheet>
  );
}
