import { test } from 'node:test';
import assert from 'node:assert';
import { emptyJobDraft, jobDraftToPayload, jobFacts, jobProblem, JOB_REPORT_REASONS, mapJob, slotsLeft, statusLabel } from './jobs';

test('report reasons match the backend', () => {
  assert.deepStrictEqual([...JOB_REPORT_REASONS], ['Asks for money', 'Fake company', 'Misleading pay', 'Spam', 'Other']);
});

test('jobFacts shows pay only for jobs/internships, Unpaid when unpaid', () => {
  assert.strictEqual(jobFacts({ company: 'Acme', location: 'Delhi', mode: 'hybrid', paid: true, pay: '₹15k/month', kind: 'internship' }), 'Acme · Delhi · Hybrid · ₹15k/month');
  assert.strictEqual(jobFacts({ company: 'Acme', location: '', mode: 'remote', paid: false, pay: null, kind: 'internship' }), 'Acme · Remote · Unpaid');
  assert.strictEqual(jobFacts({ company: 'Acme', location: '', mode: 'remote', paid: true, pay: 'x', kind: 'referral' }), 'Acme · Remote');
});

test('slotsLeft and statusLabel', () => {
  assert.strictEqual(slotsLeft({ slots: 5, slotsUsed: 2 }), 3);
  assert.strictEqual(slotsLeft({ slots: null, slotsUsed: 0 }), null);
  assert.strictEqual(statusLabel('referral', 'accepted'), 'Referred');
  assert.strictEqual(statusLabel('job', 'accepted'), 'Shortlisted');
  assert.strictEqual(statusLabel('job', 'declined'), 'Not taken forward');
});

test('jobProblem and payload', () => {
  const d = { ...emptyJobDraft('job'), title: 'SDE', company: 'Acme', description: 'A role building our product for real.' };
  assert.strictEqual(jobProblem(d), null);
  assert.ok(jobProblem({ ...d, applyMode: 'link', applyUrl: 'javascript:x' }));
  assert.ok(jobProblem({ ...d, kind: 'referral', slots: '0' }));
  const p = jobDraftToPayload({ ...d, kind: 'referral', applyMode: 'link', applyUrl: 'https://x.com', slots: '3' });
  assert.strictEqual(p.apply_mode, 'mcg');
  assert.strictEqual(p.apply_url, null);
  assert.strictEqual(p.slots, 3);
  assert.strictEqual(jobDraftToPayload({ ...d, paid: false, pay: '10k' }).pay, null);
});

test('mapJob maps detail extras only when present', () => {
  const j = mapJob({ id: '1', kind: 'job', title: 't', company: 'c', mode: 'remote', apply_mode: 'mcg', slots_used: 0, paid: 1 });
  assert.strictEqual(j.isMine, undefined);
  assert.strictEqual(mapJob({ id: '1', is_mine: true, live: false, my_application: null }).isMine, true);
});
