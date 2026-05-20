import { supabase } from '../supabase';
import { ForumPost, Comment } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

export const ForumService = {
  // Posts
  getPosts: async (course?: string, topic?: string, limitCount: number = 30, callback?: (posts: ForumPost[]) => void, sort: 'hot' | 'new' | 'top' = 'new') => {
    try {
      const params = new URLSearchParams();
      if (course && course !== 'All') params.append('course', course);
      if (topic && topic !== 'All') params.append('topic', topic);
      params.append('limit', limitCount.toString());
      params.append('sort', sort);

      const data = await fetchWithAuth(`/api/forum/posts?${params.toString()}`);
      
      const posts: ForumPost[] = data.map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        authorId: p.author_id,
        authorName: p.author_name,
        course: p.course,
        topic: p.topic,
        createdAt: p.created_at,
        upvotes: p.upvotes || [],
        downvotes: p.downvotes || [],
        commentCount: p.comment_count || 0
      }));
      
      if (callback) callback(posts);
      return posts;
    } catch (error) {
      console.error('Failed to get posts:', error);
      if (callback) callback([]);
      return [];
    }
  },


  getPost: async (postId: string) => {
    try {
      const p = await fetchWithAuth(`/api/forum/posts/${postId}`);
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        authorId: p.author_id,
        authorName: p.author_name,
        course: p.course,
        topic: p.topic,
        createdAt: p.created_at,
        upvotes: p.upvotes || [],
        downvotes: p.downvotes || [],
        commentCount: p.comment_count || 0
      } as ForumPost;
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  },

  createPost: async (post: Omit<ForumPost, 'id' | 'createdAt' | 'commentCount' | 'upvotes' | 'downvotes'>) => {
    const data = await fetchWithAuth('/api/forum/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        course: post.course,
        topic: post.topic
      })
    });
    return data.id;
  },

  updatePost: async (_postId: string, _updates: Partial<ForumPost>) => {
    // Currently not supported in backend routes, but stubbed for future
    console.warn('Update post not implemented on backend');
  },

  deletePost: async (postId: string) => {
    await fetchWithAuth(`/api/forum/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  toggleUpvote: async (postId: string, _userId: string, _isUpvoted: boolean) => {
    return fetchWithAuth(`/api/forum/posts/${postId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'up' })
    });
  },

  toggleDownvote: async (postId: string, _userId: string, _isDownvoted: boolean) => {
    return fetchWithAuth(`/api/forum/posts/${postId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'down' })
    });
  },

  // Comments
  getComments: async (postId: string, callback?: (comments: Comment[]) => void) => {
    try {
      const data = await fetchWithAuth(`/api/forum/posts/${postId}/comments`);
      const comments: Comment[] = data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        authorId: c.author_id,
        authorName: c.author_name,
        content: c.content,
        createdAt: c.created_at,
        upvotes: c.upvotes || [],
        downvotes: c.downvotes || []
      }));
      if (callback) callback(comments);
      return comments;
    } catch (error) {
      console.error('Failed to get comments:', error);
      if (callback) callback([]);
      return [];
    }
  },

  addComment: async (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'upvotes' | 'downvotes'>) => {
    const data = await fetchWithAuth(`/api/forum/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: comment.content })
    });
    return data.id;
  },

  toggleCommentUpvote: async (postId: string, commentId: string, userId: string, isUpvoted: boolean) => {
    return fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'up' }),
    });
  },

  toggleCommentDownvote: async (postId: string, commentId: string, userId: string, isDownvoted: boolean) => {
    return fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ type: 'down' }),
    });
  },

  deleteComment: async (postId: string, commentId: string) => {
    await fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE'
    });
  }
};
