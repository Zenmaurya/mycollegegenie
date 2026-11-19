import { test } from 'node:test';
import assert from 'node:assert';
import { submitPost, type PostDraft } from './submitPost';

const draft = (over: Partial<PostDraft> = {}): PostDraft => ({
  title: 'Hackathon team?', content: 'Koi hai?', topic: 'Doubt', course: 'B.Com', files: [], ...over,
});
const blob = () => new Blob(['x']);

function fakeDeps(failOnUpload?: number) {
  const calls = { upload: 0, create: [] as any[] };
  return {
    calls,
    deps: {
      upload: async () => {
        calls.upload += 1;
        if (calls.upload === failOnUpload) throw new Error('upload fail');
        return `u${calls.upload}`;
      },
      create: async (p: any) => { calls.create.push(p); return 'post-1'; },
    },
  };
}

test('creates post with uploaded urls in order', async () => {
  const { calls, deps } = fakeDeps();
  const id = await submitPost(draft({ files: [blob(), blob()] }), deps);
  assert.strictEqual(id, 'post-1');
  assert.strictEqual(calls.create.length, 1);
  assert.deepStrictEqual(calls.create[0].images, ['u1', 'u2']);
  assert.strictEqual(calls.create[0].title, 'Hackathon team?');
});

test('does not create post when an upload fails', async () => {
  const { calls, deps } = fakeDeps(2);
  await assert.rejects(submitPost(draft({ files: [blob(), blob()] }), deps), /upload fail/);
  assert.strictEqual(calls.create.length, 0);
});

test('rejects empty title', async () => {
  const { calls, deps } = fakeDeps();
  await assert.rejects(submitPost(draft({ title: '   ' }), deps));
  assert.strictEqual(calls.upload, 0);
});

test('rejects 5 files', async () => {
  const { calls, deps } = fakeDeps();
  await assert.rejects(submitPost(draft({ files: [blob(), blob(), blob(), blob(), blob()] }), deps));
  assert.strictEqual(calls.upload, 0);
});

test('rejects too-long title and empty content', async () => {
  const { deps } = fakeDeps();
  await assert.rejects(submitPost(draft({ title: 'a'.repeat(201) }), deps));
  await assert.rejects(submitPost(draft({ content: '' }), deps));
});
