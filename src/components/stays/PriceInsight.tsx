import { insightLine, type Insight, type Sharing } from '../../lib/stays';
import { Button } from '../ui/button';

interface Props {
  insight: Insight | null | undefined;
  placeName: string;
  sharing: Sharing;
  /** Opens the "What do you pay?" sheet. */
  onAdd: () => void;
}

export function PriceInsight({ insight, placeName, sharing, onAdd }: Props) {
  const line = insightLine(insight, placeName, sharing);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-surface p-3 shadow-card">
      <p className="min-w-0 flex-1 text-[15px] text-ink" aria-live="polite">{line ?? 'Not enough reports yet — add yours'}</p>
      <Button variant="secondary" onClick={onAdd}>What do you pay?</Button>
    </div>
  );
}
