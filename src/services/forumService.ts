import { fetchWithAuth, safeJsonParse, getFreshToken } from '../lib/apiClient';
import { supabase } from '../supabase';
import { ForumPost, Comment } from '../types';
import { mapPost } from '../lib/feed';
import { config } from '../lib/config';



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
      
      const posts: ForumPost[] = data.map(mapPost);
      
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
      return mapPost(p);
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  },

  createPost: async (post: Omit<ForumPost, 'id' | 'createdAt' | 'commentCount' | 'upvotes' | 'downvotes'>) => {
    try {
      const data = await fetchWithAuth('/api/forum/posts', {
        method: 'POST',
        body: JSON.stringify(post)
      });
      return data.id;
    } catch (error) {
      console.error('[forumService] createPost error:', error);
      throw error;
    }
  },

  /** Upload one post photo (already resized in the browser). Returns the Cloudinary URL. */
  uploadPostImage: async (file: Blob): Promise<string> => {
    const token = await getFreshToken();
    const formData = new FormData();
    formData.append('image', file, 'photo');
    const res = await fetch(`${config.apiUrl}/api/forum/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || 'Photo upload failed');
    }
    const data = await res.json();
    return data.url;
  },

  updatePost: async (_postId: string, _updates: Partial<ForumPost>) => {
    // Currently not supported in backend routes, but stubbed for future
    console.warn('Update post not implemented on backend');
  },

  deletePost: async (postId: string) => {
    try {
      await fetchWithAuth(`/api/forum/posts/${postId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('[forumService] deletePost error:', error);
      throw error;
    }
  },

  toggleUpvote: async (postId: string, _userId: string, _isUpvoted: boolean) => {
    try {
      return await fetchWithAuth(`/api/forum/posts/${postId}/vote`, {
        method: 'PATCH',
        body: JSON.stringify({ type: 'up' })
      });
    } catch (error) {
      console.error('[forumService] toggleUpvote error:', error);
      throw error;
    }
  },

  toggleDownvote: async (postId: string, _userId: string, _isDownvoted: boolean) => {
    try {
      return await fetchWithAuth(`/api/forum/posts/${postId}/vote`, {
        method: 'PATCH',
        body: JSON.stringify({ type: 'down' })
      });
    } catch (error) {
      console.error('[forumService] toggleDownvote error:', error);
      throw error;
    }
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
        upvotes: Array.isArray(c.upvotes) ? c.upvotes : [],
        downvotes: Array.isArray(c.downvotes) ? c.downvotes : []
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
    try {
      const data = await fetchWithAuth(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(comment)
      });
      return data.id;
    } catch (error) {
      console.error('[forumService] addComment error:', error);
      throw error;
    }
  },

  toggleCommentUpvote: async (postId: string, commentId: string, _userId: string, _isUpvoted: boolean) => {
    try {
      return await fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}/vote`, {
        method: 'PATCH',
        body: JSON.stringify({ type: 'up' })
      });
    } catch (error) {
      console.error('[forumService] toggleCommentUpvote error:', error);
      throw error;
    }
  },

  toggleCommentDownvote: async (postId: string, commentId: string, _userId: string, _isDownvoted: boolean) => {
    try {
      return await fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}/vote`, {
        method: 'PATCH',
        body: JSON.stringify({ type: 'down' })
      });
    } catch (error) {
      console.error('[forumService] toggleCommentDownvote error:', error);
      throw error;
    }
  },

  deleteComment: async (postId: string, commentId: string) => {
    try {
      await fetchWithAuth(`/api/forum/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('[forumService] deleteComment error:', error);
      throw error;
    }
  },

  // Guilds
  getGuilds: async () => {
    try {
      return await fetchWithAuth('/api/forum/guilds');
    } catch (error) {
      console.error('[forumService] getGuilds error:', error);
      return [];
    }
  },

  createGuild: async (name: string, description: string) => {
    try {
      return await fetchWithAuth('/api/forum/guilds', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      });
    } catch (error) {
      console.error('[forumService] createGuild error:', error);
      throw error;
    }
  }
};
