import { useState } from 'react';
import { toast } from 'sonner';
import { requestVerification } from '../../services/communityService';
import type { CommunityDetail } from '../../lib/communities';
import { Field, field, aria, pickImage, uploadImage } from './CommunityFields';
import { Button } from '../ui/button';

type Method = 'instagram' | 'email' | 'letter';
const METHODS: { id: Method; label: string; proof: string }[] = [
  { id: 'instagram', label: 'Instagram', proof: 'Your Instagram handle' },
  { id: 'email', label: 'Email', proof: 'Official college email' },
  { id: 'letter', label: 'Letter', proof: 'Letter from your faculty advisor (image)' },
];
const card = 'space-y-2 rounded-card bg-surface p-4 shadow-card';

// The server holds the request and its code (detail.viewer.verification); onChanged refetches it.
export function VerificationPanel({ detail, onChanged }: { detail: CommunityDetail; onChanged: () => void }) {
  const [method, setMethod] = useState<Method>('instagram');
  const [proof, setProof] = useState('');
  const [letter, setLetter] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (detail.status === 'official') return <p className={`${card} text-[15px] font-semibold text-ink`}>This page is Official</p>;
  if (detail.kind !== 'society') return <p className={`${card} text-[15px] text-ink`}>This page does not need verification.</p>;

  const v = detail.viewer.verification;
  if (v?.status === 'pending') {
    return (
      <div className={card}>
        <p className="text-[15px] font-semibold text-ink">Verification pending</p>
        {v.method === 'instagram'
          ? <p className="text-[15px] text-ink">Add this code to your Instagram bio. MCG will check it and verify your page. <strong className="font-mono text-[17px]">{v.code}</strong></p>
          : <p className="text-[15px] text-ink-muted">MCG will check your {v.method === 'email' ? 'email' : 'letter'} and verify your page.</p>}
      </div>
    );
  }

  const m = METHODS.find((x) => x.id === method)!;
  const submit = async () => {
    setError('');
    let value = proof.trim();
    if (method === 'letter' ? !letter : !value) { setError(method === 'letter' ? 'Choose the letter image' : 'This is required'); return; }
    setBusy(true);
    try {
      if (method === 'letter') value = (await uploadImage(letter)) as string;
      await requestVerification(detail.slug, method, value);
      toast.success('Verification request sent');
    } catch (e: any) {
      if (e?.status !== 409) setError(e?.message || 'Could not send the request'); // 409: already pending, the refetch shows it
    } finally { setBusy(false); onChanged(); }
  };

  return (
    <div className="space-y-4 rounded-card bg-surface p-4 shadow-card">
      {v?.status === 'rejected' && <p role="note" className="text-[15px] font-semibold text-danger">Your last request was not approved. You can send a new one.</p>}
      <p className="text-[15px] text-ink-muted">Get the Official badge to list fees and prizes and appear outside your college.</p>
      <fieldset>
        <legend className="mb-1 text-[15px] font-semibold text-ink">Method</legend>
        <div className="flex flex-wrap gap-4">
          {METHODS.map((x) => (
            <label key={x.id} className="flex min-h-11 items-center gap-2 text-[15px] text-ink">
              <input type="radio" name="method" checked={method === x.id} onChange={() => { setMethod(x.id); setError(''); }} /> {x.label}
            </label>
          ))}
        </div>
      </fieldset>
      {method === 'instagram' && <p className="text-[15px] text-ink-muted">Enter your handle to get your code. You will add it to your Instagram bio next.</p>}
      {method === 'letter' ? (
        <Field id="proof" label={m.proof} error={error}>
          <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={pickImage(setLetter, setError)} {...aria('proof', error || undefined)} />
        </Field>
      ) : (
        <Field id="proof" label={m.proof} error={error}>
          <input id="proof" className={field} value={proof} maxLength={1000} onChange={(e) => setProof(e.target.value)} type={method === 'email' ? 'email' : 'text'} {...aria('proof', error || undefined)} />
        </Field>
      )}
      <Button onClick={() => void submit()} loading={busy}>{method === 'instagram' ? 'Get your code' : 'Send request'}</Button>
    </div>
  );
}
