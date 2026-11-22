import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
import { NOTES_COURSES } from '../../lib/notes';
import { NotesService, type NoteFilters } from '../../services/notesService';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';
import { Segmented } from '../ui/Segmented';
import { Button } from '../ui/button';

export type FilterDraft = { course: string; semester: string; subjectCode: string; type: string; year: string; minRating: string; college: string; sort: string };
export const TYPE_OPTIONS = [{ v: '', l: 'All' }, { v: 'PYQ', l: 'PYQs' }, { v: 'Note', l: 'Notes' }, { v: 'Syllabus', l: 'Syllabus' }, { v: 'Book', l: 'Books' }];
export const SORT_OPTIONS = [{ value: 'helpful', label: 'Most helpful' }, { value: 'new', label: 'Newest' }, { value: 'downloads', label: 'Most downloaded' }];

export const toNoteFilters = (q: string, d: FilterDraft): NoteFilters => ({
  q, type: d.type, course: d.course, semester: d.semester, subjectCode: d.subjectCode, year: d.year, minRating: d.minRating,
  college: d.college === 'mine' ? 'mine' : undefined, sort: (d.sort || 'helpful') as NoteFilters['sort'],
});

const field = 'min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const label = 'mb-1 block text-[15px] font-semibold text-ink';

interface Props {
  /** 'pick' edits only the default course and semester used by the sections. */
  mode: 'filters' | 'pick';
  initial: FilterDraft;
  q: string;
  hasCollege: boolean;
  onApply: (d: FilterDraft) => void;
  onClose: () => void;
}

export function NotesFilterSheet({ mode, initial, q, hasCollege, onApply, onClose }: Props) {
  const [d, setD] = useState(initial);
  const set = (k: keyof FilterDraft, v: string) => setD((p) => ({ ...p, [k]: v }));
  const dd = useDebounce(d, 300); // the count query is rate-limited, so don't refetch per keystroke
  const count = useQuery({
    queryKey: ['notes-count', q, dd],
    queryFn: () => NotesService.list(toNoteFilters(q, dd), undefined, 1),
    enabled: mode === 'filters',
    select: (p) => p.total,
  });
  const reset: FilterDraft = { course: '', semester: '', subjectCode: '', type: '', year: '', minRating: '', college: '', sort: '' };

  return (
    <Sheet open onClose={onClose} title={mode === 'pick' ? 'Pick your course' : 'Filters'}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label htmlFor="nf-course" className={label}>Course</label>
          <select id="nf-course" value={d.course} onChange={(e) => set('course', e.target.value)} className={field}>
            <option value="">Any course</option>
            {NOTES_COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nf-sem" className={label}>Semester</label>
          <select id="nf-sem" value={d.semester} onChange={(e) => set('semester', e.target.value)} className={field}>
            <option value="">Any semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        {mode === 'filters' && (
          <>
            <div>
              <label htmlFor="nf-code" className={label}>Subject / paper code</label>
              <input id="nf-code" value={d.subjectCode} onChange={(e) => set('subjectCode', e.target.value.trim())} placeholder="e.g. 32341101" className={field} />
            </div>
            <div>
              <span className={label}>Type</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Type">
                {TYPE_OPTIONS.map((t) => <Fragment key={t.v}><Chip selected={d.type === t.v} onToggle={() => set('type', t.v)}>{t.l}</Chip></Fragment>)}
              </div>
            </div>
            {d.type === 'PYQ' && (
              <div>
                <label htmlFor="nf-year" className={label}>Year</label>
                <input id="nf-year" inputMode="numeric" maxLength={4} value={d.year} onChange={(e) => set('year', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 2024" className={field} />
              </div>
            )}
            <div className="flex flex-wrap gap-2" role="group" aria-label="More">
              <Chip selected={d.minRating === '4'} onToggle={() => set('minRating', d.minRating === '4' ? '' : '4')}>Rating 4★+</Chip>
              {hasCollege && <Chip selected={d.college === 'mine'} onToggle={() => set('college', d.college === 'mine' ? '' : 'mine')}>My college only</Chip>}
            </div>
            <div>
              <span className={label}>Sort</span>
              <Segmented label="Sort" options={SORT_OPTIONS} value={d.sort || 'helpful'} onChange={(v) => set('sort', v)} />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 border-t border-line p-4">
        <Button variant="secondary" onClick={() => setD(reset)}>Reset</Button>
        <Button className="flex-1" onClick={() => onApply(d)}>
          {mode === 'pick' ? 'Done' : count.data == null ? 'Show results' : `Show ${count.data} resources`}
        </Button>
      </div>
    </Sheet>
  );
}
