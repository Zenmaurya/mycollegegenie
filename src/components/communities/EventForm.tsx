import { useState, type FormEvent } from 'react';
import { EVENT_TYPES, EVENT_MODES, ELIGIBILITY, type EventCard } from '../../lib/communities';
import { eventToForm, emptyEventForm, toIsoWithOffset, validateEventForm, type EventFormValues } from '../../lib/eventForm';
import { createEvent, updateEvent, type EventInput } from '../../services/eventService';
import { Field, field, aria, pickImage, uploadImage } from './CommunityFields';
import { Button } from '../ui/button';

interface Props { slug: string; isOfficial: boolean; initial?: EventCard; onSaved: () => void; onCancel: () => void }

export function EventForm({ slug, isOfficial, initial, onSaved, onCancel }: Props) {
  const [f, setF] = useState<EventFormValues>(() => (initial ? eventToForm(initial) : emptyEventForm()));
  const [poster, setPoster] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof EventFormValues) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const err = (k: string) => errors[k] || undefined;
  const a = (k: string) => aria(k, err(k));
  const text = (k: keyof EventFormValues, label: string, extra: Record<string, unknown> = {}) => (
    <Field id={k} label={label} error={err(k)}>
      <input id={k} className={field} value={f[k]} onChange={set(k)} {...extra} {...a(k)} />
    </Field>
  );
  const select = (k: 'type' | 'mode' | 'eligibility', label: string, options: readonly string[]) => (
    <Field id={k} label={label} error={err(k)}>
      <select id={k} className={field} value={f[k]} onChange={set(k)} required {...a(k)}>
        <option value="">Choose</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const v = validateEventForm(f, { isOfficial });
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const poster_url = (await uploadImage(poster)) ?? initial?.poster_url ?? null;
      const num = (s: string) => (s.trim() ? Number(s) : null);
      const input: EventInput = {
        title: f.title.trim(), type: f.type, mode: f.mode, eligibility: f.eligibility, eligibility_note: f.eligibility === 'Specific' ? f.eligibility_note.trim() : null,
        starts_at: toIsoWithOffset(f.starts_at), ends_at: f.ends_at ? toIsoWithOffset(f.ends_at) : null, register_by: f.register_by ? toIsoWithOffset(f.register_by) : null,
        team_size_min: num(f.team_size_min), team_size_max: num(f.team_size_max), entry_fee: num(f.entry_fee) ?? 0, prize: f.prize.trim() || null,
        register_url: f.register_url.trim() || null, venue: f.venue.trim() || null, contact: f.contact.trim() || null,
        rounds: f.rounds.trim() || null, rules: f.rules.trim() || null, poster_url,
      };
      if (initial) await updateEvent(initial.id, input); else await createEvent(slug, input);
      onSaved();
    } catch (er: any) {
      setServerError(er?.message || 'Could not save the event');
      setBusy(false);
    }
  };

  const hint = isOfficial ? undefined : 'Fees and prizes need an Official page';
  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-card bg-surface p-4 shadow-card">
      <h2 className="text-[19px] font-bold text-ink">{initial ? 'Edit event' : 'Add event'}</h2>
      {text('title', 'Title', { maxLength: 150, required: true })}
      {select('type', 'Type', EVENT_TYPES)}
      {select('mode', 'Mode', EVENT_MODES)}
      {text('venue', 'Venue or link (optional)', { maxLength: 200 })}
      {select('eligibility', 'Who can take part', ELIGIBILITY)}
      {f.eligibility === 'Specific' && text('eligibility_note', 'Who exactly', { maxLength: 200 })}
      <Field id="starts_at" label="Starts" error={err('starts_at')}>
        <input id="starts_at" type="datetime-local" className={field} value={f.starts_at} onChange={set('starts_at')} required {...a('starts_at')} />
      </Field>
      <Field id="ends_at" label="Ends (optional)" error={err('ends_at')}>
        <input id="ends_at" type="datetime-local" className={field} value={f.ends_at} onChange={set('ends_at')} {...a('ends_at')} />
      </Field>
      <Field id="register_by" label="Registration closes (optional)" error={err('register_by')}>
        <input id="register_by" type="datetime-local" className={field} value={f.register_by} onChange={set('register_by')} {...a('register_by')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="team_size_min" label="Team size min" error={err('team_size_min')}>
          <input id="team_size_min" type="number" inputMode="numeric" min={1} max={20} className={field} value={f.team_size_min} onChange={set('team_size_min')} {...a('team_size_min')} />
        </Field>
        <Field id="team_size_max" label="Team size max" error={err('team_size_max')}>
          <input id="team_size_max" type="number" inputMode="numeric" min={1} max={20} className={field} value={f.team_size_max} onChange={set('team_size_max')} {...a('team_size_max')} />
        </Field>
      </div>
      <Field id="entry_fee" label="Entry fee in ₹ (blank is free)" error={err('entry_fee')} hint={hint}>
        <input id="entry_fee" type="number" inputMode="numeric" min={0} max={100000} className={field} value={f.entry_fee} onChange={set('entry_fee')} disabled={!isOfficial} {...aria('entry_fee', err('entry_fee'), !isOfficial)} />
      </Field>
      <Field id="prize" label="Prize (optional)" error={err('prize')} hint={hint}>
        <input id="prize" className={field} value={f.prize} onChange={set('prize')} maxLength={200} disabled={!isOfficial} {...aria('prize', err('prize'), !isOfficial)} />
      </Field>
      <Field id="register_url" label="Registration link (optional)" error={err('register_url')}>
        <input id="register_url" type="url" inputMode="url" placeholder="https://..." className={field} value={f.register_url} onChange={set('register_url')} {...a('register_url')} />
      </Field>
      {text('contact', 'Contact (optional)', { maxLength: 200 })}
      <Field id="rounds" label="Rounds (optional)">
        <textarea id="rounds" className={`${field} py-2`} rows={3} maxLength={5000} value={f.rounds} onChange={set('rounds')} />
      </Field>
      <Field id="rules" label="Rules (optional)">
        <textarea id="rules" className={`${field} py-2`} rows={3} maxLength={5000} value={f.rules} onChange={set('rules')} />
      </Field>
      <Field id="poster" label={initial?.poster_url ? 'Replace poster (optional)' : 'Poster (optional)'} error={err('poster')}>
        <input id="poster" type="file" accept="image/jpeg,image/png,image/webp" className={field}
          onChange={pickImage(setPoster, (m) => setErrors((p) => ({ ...p, poster: m })))} {...a('poster')} />
      </Field>
      {serverError && <p role="alert" className="text-[15px] text-danger">{serverError}</p>}
      <div className="flex gap-2">
        <Button type="submit" loading={busy}>{initial ? 'Save event' : 'Add event'}</Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
      </div>
    </form>
  );
}
