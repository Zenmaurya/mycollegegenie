import { useState } from 'react';
import { toast } from 'sonner';
import { requestVerification } from '../../services/communityService';
import type { CommunityDetail } from '../../lib/communities';
import { Field, field, pickImage, uploadImage } from './CommunityFields';
import { Button } from '../ui/button';

type Method = 'instagram' | 'email' | 'letter';
const METHODS: { id: Method; label: string; proof: string }[] = [
  { id: 'instagram', label: 'Instagram', proof: 'Your Instagram handle' },
  { id: 'email', label: 'Email', proof: 'Official college email' },
  { id: 'letter', label: 'Letter', proof: 'Letter from your faculty advisor (image)' },
];

export function VerificationPanel({ detail, onChanged }: { detail: CommunityDetail; onChanged: () => void }) {
  const [method, setMethod] = useState<Method>('instagram');
  const [proof, setProof] = useState('');
  const [letter, setLetter] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);

  if (detail.status === 'official') return <p className="rounded-card bg-surface p-4 text-[15px] font-semibold text-ink shadow-card">This page is Official</p>;
  if (detail.kind !== 'society') return <p className="rounded-card bg-surface p-4 text-[15px] text-ink shadow-card">This page does not need verification.</p>;

  const m = METHODS.find((x) => x.id === method)!;
  const submit = async () => {
    setError('');
    let value = proof.trim();
    if (method === 'letter' ? !letter : !value) { setError(method === 'letter' ? 'Choose the letter image' : 'This is required'); return; }
    setBusy(true);
    try {
      if (method === 'letter') value = (await uploadImage(letter)) as string;
      const r = await requestVerification(detail.slug, method, value);
      setCode(r.code); setPending(true);
      toast.success('Verification request sent');
      onChanged();
    } catch (e: any) {
      if (e?.status === 409) setPending(true); // a request is already waiting
      else setError(e?.message || 'Could not send the request');
    } finally { setBusy(false); }
  };

  if (pending) {
    return (
      <div className="space-y-2 rounded-card bg-surface p-4 shadow-card">
        <p className="text-[15px] font-semibold text-ink">Verification pending</p>
        <p className="text-[15px] text-ink-muted">MCG will review your request. You can't send another until it is decided.</p>
        {code && method === 'instagram' && <p className="text-[15px] text-ink">Keep this code in your Instagram bio: <strong className="font-mono text-[17px]">{code}</strong></p>}
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-card bg-surface p-4 shadow-card">
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
      {method === 'instagram' && <p className="text-[15px] text-ink">Add this code to your Instagram bio, then press Submit. Your code is shown after you press Submit.</p>}
      {method === 'letter' ? (
        <Field id="proof" label={m.proof} error={error}>
          <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={pickImage(setLetter, setError)} />
        </Field>
      ) : (
        <Field id="proof" label={m.proof} error={error}>
          <input id="proof" className={field} value={proof} maxLength={1000} onChange={(e) => setProof(e.target.value)} type={method === 'email' ? 'email' : 'text'} />
        </Field>
      )}
      <Button onClick={() => void submit()} loading={busy}>Submit</Button>
    </div>
  );
}
