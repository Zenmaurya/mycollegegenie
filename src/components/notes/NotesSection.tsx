import type { ReactNode } from 'react';
import type { Resource } from '../../types';
import { NoteCard } from './NoteCard';

interface Props {
  title: string;
  notes: Resource[];
  savedIds: ReadonlySet<string>;
  onToggleSave: (id: string) => void;
  /** e.g. year chips */
  header?: ReactNode;
}

// A section with fewer than 2 items is not shown (spec 5.2).
export function NotesSection({ title, notes, savedIds, onToggleSave, header }: Props) {
  if (notes.length < 2) return null;
  return (
    <section aria-label={title} className="space-y-2">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      {header}
      <ul className="scrollbar-none -mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-40 -mb-36 sm:mx-0 sm:px-0">
        {notes.map((n) => (
          <li key={n.id} className="w-40 shrink-0 snap-start sm:w-48"><NoteCard note={n} saved={savedIds.has(n.id)} onToggleSave={onToggleSave} /></li>
        ))}
      </ul>
    </section>
  );
}
