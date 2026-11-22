import { Fragment, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { insightLine, SHARING_LABEL, TYPE_LABEL, type Insight, type Sharing, type StayType } from '../../lib/stays';
import { StaysService } from '../../services/staysService';
import { CollegePicker, type CollegeValue } from '../onboarding/CollegePicker';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/button';

interface Props {
  onClose: () => void;
  initial?: { college?: { id: string; name: string }; area?: string; type?: StayType; sharing?: Sharing };
}

const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

// Mounted only while open, so each open starts fresh. The caller makes sure the viewer is logged in.
export function RentReportSheet({ onClose, initial }: Props) {
  const qc = useQueryClient();
  const [college, setCollege] = useState<CollegeValue>(initial?.college ? { id: initial.college.id, name: initial.college.name, short_name: '', campus: '' } : null);
  const [area, setArea] = useState(initial?.area ?? '');
  const [type, setType] = useState<StayType>(initial?.type ?? 'pg');
  const [sharing, setSharing] = useState<Sharing>(initial?.sharing ?? 'double');
  const [rent, setRent] = useState('');
  const [meals, setMeals] = useState(false);
  const [year, setYear] = useState(YEARS[0]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ insight: Insight; place: string } | null>(null);

  const collegeId = college && 'id' in college ? college.id : '';
  const rentNum = Number(rent);
  const rentOk = Number.isInteger(rentNum) && rentNum >= 1000 && rentNum <= 60000;
  const ready = rentOk && (!!collegeId || !!area.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      const r = await StaysService.reportRent({
        ...(collegeId ? { college_id: collegeId } : {}), ...(area.trim() ? { area: area.trim() } : {}),
        type, sharing, rent: rentNum, meals, year,
      });
      void qc.invalidateQueries({ queryKey: ['stays-insight'] });
      void qc.invalidateQueries({ queryKey: ['stay'] });
      setDone({ insight: r.insight, place: (college && 'name' in college ? college.name : '') || area.trim() });
    } catch (err) {
      toast.error((err as { status?: number }).status === 429 ? 'Daily limit reached. Try again tomorrow.' : err instanceof Error ? err.message : "Couldn't save your rent. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="What do you pay?" dismissible={!busy}>
      {done ? (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <h3 className="text-[17px] font-bold text-ink">Thanks! Want to list your PG/room so juniors can find it?</h3>
          <p className="text-[15px] text-ink-muted">{insightLine(done.insight, done.place, sharing) ?? 'Not enough reports yet — add yours'}</p>
          <Link to="/stays/new" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-brand">List your place</Link>
          <Button variant="ghost" onClick={onClose}>Not now</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <p className="text-[13px] text-ink-muted">Your rent is never shown on its own. We only show a range once 5 students have reported.</p>
          <CollegePicker value={college} onChange={setCollege} />
          <div>
            <label htmlFor="rent-area" className="block text-[13px] font-semibold text-ink">Or type the area</label>
            <input id="rent-area" value={area} onChange={(e) => setArea(e.target.value)} maxLength={120} placeholder="e.g. Kamla Nagar" className={inputCls} />
          </div>
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-ink">Type</legend>
            <div className="flex flex-wrap gap-2">{(Object.keys(TYPE_LABEL) as StayType[]).map((t) => <Fragment key={t}><Chip selected={type === t} onToggle={() => setType(t)}>{TYPE_LABEL[t]}</Chip></Fragment>)}</div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-ink">Sharing</legend>
            <div className="flex flex-wrap gap-2">{(Object.keys(SHARING_LABEL) as Sharing[]).map((s) => <Fragment key={s}><Chip selected={sharing === s} onToggle={() => setSharing(s)}>{SHARING_LABEL[s]}</Chip></Fragment>)}</div>
          </fieldset>
          <div>
            <label htmlFor="rent-amount" className="block text-[13px] font-semibold text-ink">Monthly rent (₹1,000–₹60,000)</label>
            <input id="rent-amount" type="number" inputMode="numeric" min={1000} max={60000} step={1} value={rent} onChange={(e) => setRent(e.target.value)} className={inputCls} />
          </div>
          <fieldset>
            <legend className="mb-1 text-[13px] font-semibold text-ink">Meals included?</legend>
            <div className="flex gap-2"><Chip selected={meals} onToggle={() => setMeals(true)}>Yes</Chip><Chip selected={!meals} onToggle={() => setMeals(false)}>No</Chip></div>
          </fieldset>
          <div>
            <label htmlFor="rent-year" className="block text-[13px] font-semibold text-ink">Year</label>
            <select id="rent-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Button type="submit" disabled={!ready} loading={busy}>Submit</Button>
        </form>
      )}
    </Sheet>
  );
}
