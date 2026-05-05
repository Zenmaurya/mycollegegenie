import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown,
  MessageCircle, 
  Clock, 
  User, 
  Send, 
  Trash2, 
  AlertCircle, 
  MoreVertical,
  Flag
} from 'lucide-react';
import { ForumPost, Comment } from '../types';
import { ForumService } from '../services/forumService';
import { supabase, getCurrentUser } from '../supabase';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  const fetchData = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    
    try {
      const fetchedPost = await ForumService.getPost(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
      } else {
        navigate('/forum');
        return;
      }

      const fetchedComments = await ForumService.getComments(postId);
      setComments(fetchedComments);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpvote = async () => {
    if (!post || !currentUser) {
      toast.error('Please sign in to upvote.');
      return;
    }
    const isUpvoted = post.upvotes.includes(currentUser.id);
    await ForumService.toggleUpvote(post.id, currentUser.id, isUpvoted);
    fetchData();
  };

  const handleDownvote = async () => {
    if (!post || !currentUser) {
      toast.error('Please sign in to downvote.');
      return;
    }
    const isDownvoted = post.downvotes.includes(currentUser.id);
    await ForumService.toggleDownvote(post.id, currentUser.id, isDownvoted);
    fetchData();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !newComment.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await ForumService.addComment(postId, {
        postId,
        authorId: currentUser.id,
        authorName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Anonymous',
        content: newComment.trim()
      });
      setNewComment('');
      toast.success('Comment added successfully!');
      fetchData();
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setIsDeleteCommentModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!postId || !commentToDelete) return;
    try {
      await ForumService.deleteComment(postId, commentToDelete);
      toast.success('Comment deleted successfully!');
      fetchData();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment.');
    } finally {
      setIsDeleteCommentModalOpen(false);
    }
  };

  const handleDeletePost = () => {
    setIsDeletePostModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!post) return;
    try {
      await ForumService.deletePost(post.id);
      toast.success('Post deleted successfully!');
      navigate('/forum');
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post.');
    } finally {
      setIsDeletePostModalOpen(false);
    }
  };

  const handleCommentUpvote = async (commentId: string, upvotes: string[]) => {
    if (!postId || !currentUser) {
      toast.error('Please sign in to upvote.');
      return;
    }
    const isUpvoted = upvotes?.includes(currentUser.id);
    await ForumService.toggleCommentUpvote(postId, commentId, currentUser.id, isUpvoted);
    fetchData();
  };

  const handleCommentDownvote = async (commentId: string, downvotes: string[]) => {
    if (!postId || !currentUser) {
      toast.error('Please sign in to downvote.');
      return;
    }
    const isDownvoted = downvotes?.includes(currentUser.id);
    await ForumService.toggleCommentDownvote(postId, commentId, currentUser.id, isDownvoted);
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold">Loading discussion...</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 sm:pt-24 pb-12 sm:pb-16">
      <Helmet>
        <title>{post ? `${post.title} | MyCollegeGenie Forum` : 'Forum Post | MyCollegeGenie'}</title>
        <meta name="description" content={post ? post.content.substring(0, 150) : "Join the discussion on MyCollegeGenie forum."} />
      </Helmet>
      <button 
        onClick={() => navigate('/forum')}
        className="flex items-center gap-2 text-gray-500 hover:text-purple-600 font-black uppercase tracking-widest mb-6 sm:mb-10 transition-colors group text-[9px] sm:text-xs px-1 sm:px-0"
      >
        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Forums
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-2xl shadow-purple-900/5 mb-8 sm:mb-12"
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-6">
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-50 text-purple-600 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg">
            {post.course}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-50 text-gray-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg">
            {post.topic}
          </span>
        </div>

        <div className="flex justify-between items-start gap-4 mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
            {post.title}
          </h1>
          {currentUser?.id === post.authorId && (
            <button 
              onClick={handleDeletePost}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        <p className="text-gray-600 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-12 whitespace-pre-wrap font-medium">
          {post.content}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 sm:pt-10 border-t border-gray-50">
          <div className="flex items-center gap-3 text-[9px] sm:text-xs text-gray-400 font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <span className="truncate max-w-[100px] sm:max-w-none text-gray-900">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={handleUpvote}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs transition-all ${
                currentUser && post.upvotes.includes(currentUser.id)
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 ${currentUser && post.upvotes.includes(currentUser.id) ? 'fill-current' : ''}`} />
              {post.upvotes.length} <span className="hidden xs:inline">Upvotes</span>
            </button>
            <button 
              onClick={handleDownvote}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs transition-all ${
                currentUser && post.downvotes.includes(currentUser.id)
                  ? 'bg-rose-600 text-white shadow-xl shadow-rose-600/20'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ThumbsDown className={`w-3 h-3 sm:w-4 sm:h-4 ${currentUser && post.downvotes.includes(currentUser.id) ? 'fill-current' : ''}`} />
              {post.downvotes.length} <span className="hidden xs:inline">Downvotes</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Comments Section */}
      <div className="space-y-6 sm:space-y-10">
        <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
          Comments
          <span className="text-xs sm:text-sm font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {comments.length}
          </span>
        </h2>

        <form onSubmit={handleAddComment} className="relative">
          {!currentUser ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-purple-900/5 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                <p className="text-gray-500 font-medium">
                  You need to be signed in to join the discussion.
                </p>
              </div>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20 block text-center"
              >
                Sign In to Continue
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-xl shadow-purple-900/5 focus-within:ring-2 focus-within:ring-purple-600/20 focus-within:border-purple-600 transition-all">
              <textarea 
                rows={3}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-2 bg-transparent outline-none font-medium resize-none text-sm sm:text-base"
              />
              <div className="flex justify-end pt-4">
                <button 
                  disabled={!newComment.trim() || isSubmitting || !currentUser}
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-2 transition-all shadow-xl shadow-purple-600/20"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                  Post Comment
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Comments List */}
        <div className="space-y-4 sm:space-y-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={comment.id}
                className="bg-white border border-gray-50 rounded-3xl p-5 sm:p-8 shadow-sm group"
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-black text-gray-900 tracking-tight">{comment.authorName}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {currentUser?.id === comment.authorId && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed mb-4">
                  {comment.content}
                </p>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleCommentUpvote(comment.id, comment.upvotes)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      currentUser && comment.upvotes?.includes(currentUser.id)
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${currentUser && comment.upvotes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                    {comment.upvotes?.length || 0}
                  </button>
                  <button 
                    onClick={() => handleCommentDownvote(comment.id, comment.downvotes)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      currentUser && comment.downvotes?.includes(currentUser.id)
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <ThumbsDown className={`w-3 h-3 ${currentUser && comment.downvotes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                    {comment.downvotes?.length || 0}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 sm:py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <MessageCircle className="w-10 h-10 sm:w-14 sm:h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-xs sm:text-sm font-black uppercase tracking-widest">No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isDeletePostModalOpen}
        onClose={() => setIsDeletePostModalOpen(false)}
        onConfirm={confirmDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? All comments will also be deleted."
        confirmText="Delete"
        type="danger"
      />

      <ConfirmationModal
        isOpen={isDeleteCommentModalOpen}
        onClose={() => setIsDeleteCommentModalOpen(false)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};
