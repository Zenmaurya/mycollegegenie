import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/Chip';
import { SuggestedSocieties } from './SuggestedSocieties';
import { CollegePicker, type CollegeValue } from './CollegePicker';
import { saveOnboarding } from '../../services/collegeService';
import { useAuth } from '../../context/AuthContext';
import { INTERESTS, batchYearFromStudyYear, buildOnboardingPayload } from '../../lib/onboarding';

type Payload = Parameters<typeof saveOnboarding>[0];

const inputCls = 'mt-1 min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-brand';
const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

export function OnboardingFlow({ onDone, startStep = 1 }: { onDone: () => void; startStep?: 1 | 2 | 3 }) {
  const { appUser, refreshAppUser } = useAuth();
  const [step, setStep] = useState<number>(startStep);
  const [college, setCollege] = useState<CollegeValue>(null);
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const collegeReady = !!college && ('id' in college || college.other.trim().length > 0);
  // Chosen in this flow, else the user's saved college (flow may start at step 2/3).
  const saved = appUser?.collegeId ? { id: appUser.collegeId } : appUser?.collegeOther ? { other: appUser.collegeOther } : null;
  const effective = college ?? saved;
  const collegePayload = () => buildOnboardingPayload(college);
  const coursePayload = () => buildOnboardingPayload(effective, {
    ...(course.trim() && { course: course.trim() }),
    ...(year && { batchYear: batchYearFromStudyYear(Number(year)) }),
  });
  const interestsPayload = () => buildOnboardingPayload(effective, { interests });
  const hasCourse = !!course.trim() || !!year;

  // Saves (if there is anything to save), then moves on. Server errors stay inline.
  const save = async (payload: (() => Payload) | null, then: () => void | Promise<void>) => {
    setBusy(true); setError('');
    try {
      if (payload) await saveOnboarding(payload());
      await then();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally { setBusy(false); }
  };
  const finish = async () => { await refreshAppUser(); onDone(); };
  const toStep3 = () => setStep(3);
  const toStep4 = () => setStep(4);
  // No societies to suggest (or the lookup failed): nothing to show, so finish.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const skipSocieties = useCallback(() => { finishRef.current().catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')); }, []);
  const toggle = (i: string) => setInterests(s => (s.includes(i) ? s.filter(x => x !== i) : [...s, i]));

  return (
    <div>
      <p className="text-[13px] font-semibold text-ink-muted" aria-live="polite">Step {step} of 4</p>

      {step === 1 && (
        <>
          <h2 className="mt-1 text-[22px] font-bold text-ink">Pick your college</h2>
          <div className="mt-4"><CollegePicker value={college} onChange={setCollege} /></div>
        </>
      )}
      {step === 2 && (
        <>
          <h2 className="mt-1 text-[22px] font-bold text-ink">Your course</h2>
          <label htmlFor="ob-course" className="mt-4 block text-[13px] font-semibold text-ink">Course</label>
          <input id="ob-course" className={inputCls} maxLength={100} placeholder="e.g. B.Com (Hons)" value={course} onChange={e => setCourse(e.target.value)} />
          <label htmlFor="ob-year" className="mt-4 block text-[13px] font-semibold text-ink">Year</label>
          <select id="ob-year" className={inputCls} value={year} onChange={e => setYear(e.target.value)}>
            <option value="">Select year</option>
            {YEARS.map((y, i) => <option key={y} value={i + 1}>{y} year</option>)}
          </select>
        </>
      )}
      {step === 3 && (
        <>
          <h2 className="mt-1 text-[22px] font-bold text-ink">What are you into?</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Interests">
            {INTERESTS.map(i => (
              <React.Fragment key={i}>
                <Chip selected={interests.includes(i)} onToggle={() => toggle(i)}>{i}</Chip>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
      {step === 4 && <SuggestedSocieties collegeId={effective && 'id' in effective ? effective.id : null} interests={interests} onEmpty={skipSocieties} />}

      {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}

      <div className="mt-6 flex items-center justify-end gap-2">
        {step === 2 && <Button variant="ghost" disabled={busy} onClick={toStep3}>Skip</Button>}
        {step === 3 && <Button variant="ghost" disabled={busy} onClick={() => toStep4()}>Skip</Button>}
        {step === 1 && <Button disabled={!collegeReady} loading={busy} onClick={() => void save(collegePayload, () => setStep(2))}>Continue</Button>}
        {step === 2 && <Button disabled={!hasCourse} loading={busy} onClick={() => void save(coursePayload, toStep3)}>Continue</Button>}
        {step === 3 && <Button disabled={interests.length === 0} loading={busy} onClick={() => void save(interestsPayload, toStep4)}>Continue</Button>}
        {step === 4 && <Button loading={busy} onClick={() => void save(null, finish)}>Done</Button>}
      </div>
    </div>
  );
}
