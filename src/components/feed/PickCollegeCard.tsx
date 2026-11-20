import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shouldShowCollegeCard } from '../../lib/onboarding';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/button';

const KEY = 'mcg_college_card_dismissed';

export function PickCollegeCard() {
  const { appUser, refreshAppUser } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const [open, setOpen] = useState(false);

  const notNow = () => {
    setDismissed(true);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  };

  // Close first; the card may unmount once appUser has a college, which would strand focus on <body>.
  const close = () => {
    setOpen(false);
    void refreshAppUser(); // step 1 may already be saved even if the user bailed out
    setTimeout(() => {
      if (document.activeElement === document.body || !document.activeElement) {
        document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
      }
    }, 100);
  };

  if (!shouldShowCollegeCard(appUser, dismissed)) return null;
  return (
    <>
      <div className="flex items-start gap-3 rounded-card bg-surface p-4 shadow-card">
        <GraduationCap className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold text-ink">Pick your college</p>
          <p className="mt-1 text-[15px] text-ink-muted">See your college's societies, events and people.</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setOpen(true)}>Choose college</Button>
            <Button variant="ghost" onClick={notNow}>Not now</Button>
          </div>
        </div>
      </div>
      <Sheet open={open} onClose={close} title="Set up your profile">
        <div className="flex-1 overflow-y-auto p-4">
          <OnboardingFlow startStep={1} onDone={close} />
        </div>
      </Sheet>
    </>
  );
}
