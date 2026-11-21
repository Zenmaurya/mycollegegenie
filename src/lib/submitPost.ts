/** Composer submit flow: validate → upload all photos → create post. No post is created if any upload fails. */

export const MAX_POST_PHOTOS = 4;

export type PostDraft = { title: string; content: string; topic: string; course: string; files: Blob[]; communityId?: string; postKind?: 'official' | 'discussion' };

export type NewPost = { title: string; content: string; topic: string; course: string; images: string[]; communityId?: string; postKind?: 'official' | 'discussion' };

export type SubmitDeps = {
  upload(b: Blob): Promise<string>;
  create(p: NewPost): Promise<string>;
};

export async function submitPost(draft: PostDraft, deps: SubmitDeps): Promise<string> {
  const title = draft.title.trim();
  const content = draft.content.trim();
  if (!title) throw new Error('Please add a title');
  if (title.length > 200) throw new Error('Title must be 200 characters or less');
  if (!content) throw new Error('Please write something');
  if (content.length > 5000) throw new Error('Text must be 5000 characters or less');
  if (draft.files.length > MAX_POST_PHOTOS) throw new Error(`You can add up to ${MAX_POST_PHOTOS} photos`);

  const images = await Promise.all(draft.files.map((f) => deps.upload(f)));
  const page = draft.communityId && draft.postKind ? { communityId: draft.communityId, postKind: draft.postKind } : {};
  return deps.create({ title, content, topic: draft.topic, course: draft.course, images, ...page });
}
