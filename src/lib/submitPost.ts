/** Composer submit flow: validate → upload all photos → create post. No post is created if any upload fails. */

export const MAX_POST_PHOTOS = 4;

export type PostDraft = { title: string; content: string; topic: string; course: string; files: Blob[] };

export type NewPost = { title: string; content: string; topic: string; course: string; images: string[] };

export type SubmitDeps = {
  upload(b: Blob): Promise<string>;
  create(p: NewPost): Promise<string>;
};

export async function submitPost(draft: PostDraft, deps: SubmitDeps): Promise<string> {
  const title = draft.title.trim();
  const content = draft.content.trim();
  if (!title) throw new Error('Title likhna zaroori hai');
  if (title.length > 200) throw new Error('Title 200 characters se chhota rakho');
  if (!content) throw new Error('Kuch text likho');
  if (content.length > 5000) throw new Error('Text 5000 characters se chhota rakho');
  if (draft.files.length > MAX_POST_PHOTOS) throw new Error(`Max ${MAX_POST_PHOTOS} photos laga sakte ho`);

  const images = await Promise.all(draft.files.map((f) => deps.upload(f)));
  return deps.create({ title, content, topic: draft.topic, course: draft.course, images });
}
