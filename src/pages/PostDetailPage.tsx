import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle,
  Clock, Send, Trash2, AlertCircle, ChevronRight
} from 'lucide-react';
import { ForumPost, Comment } from '../types';
import type { SupabaseAuthUser } from '../types';
import { ForumService } from '../services/forumService';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { UploaderProfilePopover } from '../components/UploaderProfilePopover';

const TOPIC_COLORS: Record<string, string> = {
  'Exam Tips': 'bg-amber-50 text-amber-700 border-amber-200',
  'Doubt': 'bg-blue-50 text-blue-700 border-blue-200',
  'Notes': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'General': 'bg-gray-50 text-gray-600 border-gray-200',
  'Placement': 'bg-purple-50 text-purple-700 border-purple-200',
  'Events': 'bg-pink-50 text-pink-700 border-pink-200',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ['from-purple-400 to-pink-400', 'from-blue-400 to-cyan-400', 'from-emerald-400 to-teal-400', 'from-orange-400 to-amber-400'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black shrink-0`}
      style={{ fontSize: size <= 7 ? 10 : 12 }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<SupabaseAuthUser | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user ?? null));
  }, []);

  const fetchData = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const fetchedPost = await ForumService.getPost(postId);
      if (fetchedPost) setPost(fetchedPost);
      else { navigate('/forum'); return; }
      setComments(await ForumService.getComments(postId));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvote = async () => {
    if (!post || !currentUser) { toast.error('Sign in to vote.'); return; }
    try {
      const res = await ForumService.toggleUpvote(post.id, currentUser.id, post.upvotes.includes(currentUser.id));
      if (res && res.upvotes) {
        setPost(prev => prev ? { ...prev, upvotes: res.upvotes, downvotes: res.downvotes } : prev);
      }
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const handleDownvote = async () => {
    if (!post || !currentUser) { toast.error('Sign in to vote.'); return; }
    try {
      const res = await ForumService.toggleDownvote(post.id, currentUser.id, post.downvotes.includes(currentUser.id));
      if (res && res.downvotes) {
        setPost(prev => prev ? { ...prev, upvotes: res.upvotes, downvotes: res.downvotes } : prev);
      }
    } catch (err) {
      toast.error('Failed to vote');
    }
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
      toast.success('Comment added!');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!postId || !commentToDelete) return;
    try {
      await ForumService.deleteComment(postId, commentToDelete);
      toast.success('Comment deleted.');
      fetchData();
    } catch { toast.error('Failed to delete comment.'); }
    finally { setIsDeleteCommentModalOpen(false); }
  };

  const confirmDeletePost = async () => {
    if (!post) return;
    try {
      await ForumService.deletePost(post.id);
      toast.success('Post deleted.');
      navigate('/forum');
    } catch { toast.error('Failed to delete post.'); }
    finally { setIsDeletePostModalOpen(false); }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 font-medium text-sm">Loading discussion...</p>
      </div>
    );
  }

  if (!post) return null;

  const isUpvoted = currentUser && post.upvotes.includes(currentUser.id);
  const isDownvoted = currentUser && post.downvotes.includes(currentUser.id);
  const score = post.upvotes.length - post.downvotes.length;
  const topicColor = TOPIC_COLORS[post.topic] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 pt-8 sm:pt-10 pb-16">
      <Helmet>
        <title>{post.title} | MyCollegeGenie Forum</title>
        <meta name="description" content={post.content.substring(0, 150)} />
        <meta property="og:title" content={`${post.title} | MyCollegeGenie Forum`} />
        <meta property="og:description" content={post.content.substring(0, 150)} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            "headline": post.title,
            "text": post.content,
            "datePublished": post.createdAt,
            "author": {
              "@type": "Person",
              "name": post.authorName
            },
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/CommentAction",
              "userInteractionCount": comments.length
            }
          })}
        </script>
      </Helmet>

      {/* Back Button */}
      <button onClick={() => navigate(-1 as any)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-purple-600 mb-5 transition-colors group">
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Forums
      </button>

      {/* Post Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-5">
        <div className="flex">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1 px-3 py-5 bg-gray-50/70 border-r border-gray-100 w-14 shrink-0">
            <button onClick={handleUpvote}
              className={`p-1.5 rounded-lg transition-all ${isUpvoted ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
              <ThumbsUp className="w-4 h-4" />
            </button>
            <span className={`text-sm font-black tabular-nums ${score > 0 ? 'text-purple-600' : score < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
              {score}
            </span>
            <button onClick={handleDownvote}
              className={`p-1.5 rounded-lg transition-all ${isDownvoted ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 min-w-0">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-100">
                {post.course}
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${topicColor}`}>
                {post.topic}
              </span>
            </div>

            {/* Title */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 leading-snug tracking-tight">
                {post.title}
              </h1>
              {(currentUser?.role === 'admin' || currentUser?.id === post.authorId) && (
                <button onClick={() => setIsDeletePostModalOpen(true)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0" title="Delete Post">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-wrap font-medium mb-4">
              {post.content}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
              <UploaderProfilePopover uploaderName={post.authorName} uploaderId={post.authorId}>
                <div className="flex items-center gap-2">
                  <Avatar name={post.authorName} size={6} />
                  <span className="text-xs font-bold text-gray-700">{post.authorName}</span>
                </div>
              </UploaderProfilePopover>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeAgo(post.createdAt)}
              </span>
              <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> {comments.length} comments
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comments Section */}
      <div className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Comments</h2>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-black rounded-full border border-purple-100">
            {comments.length}
          </span>
        </div>

        {/* Comment Input */}
        {currentUser ? (
          <form onSubmit={handleAddComment}>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/10 transition-all">
              <div className="flex items-start gap-3 p-3">
                <Avatar name={currentUser.user_metadata?.full_name || currentUser.email || 'U'} size={7} />
                <textarea
                  rows={2}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 bg-transparent outline-none resize-none text-sm font-medium text-gray-700 placeholder-gray-400 mt-1"
                />
              </div>
              <div className="flex justify-end px-3 pb-2.5 border-t border-gray-50 pt-2">
                <button type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-sm shadow-purple-600/20">
                  {isSubmitting
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-3 h-3" />
                  }
                  Comment
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Sign in to comment</p>
                <p className="text-xs text-gray-400 font-medium">Join the Student Community discussion</p>
              </div>
            </div>
            <Link to="/login"
              className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-all shrink-0">
              Sign In <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Comments List */}
        <AnimatePresence>
          {comments.length > 0 ? (
            comments.map((comment, i) => {
              const cScore = (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0);
              const cUpvoted = currentUser && comment.upvotes?.includes(currentUser.id);
              const cDownvoted = currentUser && comment.downvotes?.includes(currentUser.id);
              return (
                <motion.div key={comment.id} layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white border border-gray-100 rounded-xl p-3.5 sm:p-4 shadow-sm group hover:border-gray-200 transition-colors"
                >
                  {/* Comment Header */}
                  <div className="flex items-center gap-2.5 mb-2">
                    {comment.authorId === 'deleted' ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={comment.authorName} size={7} />
                        <span className="text-sm font-black text-gray-400 italic">{comment.authorName}</span>
                      </div>
                    ) : (
                      <UploaderProfilePopover uploaderName={comment.authorName} uploaderId={comment.authorId}>
                        <div className="flex items-center gap-2">
                          <Avatar name={comment.authorName} size={7} />
                          <span className="text-sm font-black text-gray-800 hover:text-purple-600 transition-colors">{comment.authorName}</span>
                        </div>
                      </UploaderProfilePopover>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    {(currentUser?.id === comment.authorId || currentUser?.role === 'admin') && comment.authorId !== 'deleted' && (
                      <button onClick={() => { setCommentToDelete(comment.id); setIsDeleteCommentModalOpen(true); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Comment Content */}
                  <p className={`text-sm leading-relaxed font-medium mb-2.5 pl-9 ${comment.authorId === 'deleted' ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                    {comment.content}
                  </p>

                  {/* Comment Votes */}
                  <div className="flex items-center gap-1.5 pl-9">
                    <button onClick={async () => {
                      if (!postId || !currentUser) { toast.error('Sign in to vote.'); return; }
                      try {
                        const res = await ForumService.toggleCommentUpvote(postId, comment.id, currentUser.id, !!cUpvoted);
                        if (res && res.upvotes) {
                          setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: res.upvotes, downvotes: res.downvotes } : c));
                        }
                      } catch(e) { toast.error('Failed to vote'); }
                    }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all ${cUpvoted ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                      <ThumbsUp className="w-3 h-3" />
                      <span>{comment.upvotes?.length || 0}</span>
                    </button>
                    <button onClick={async () => {
                      if (!postId || !currentUser) { toast.error('Sign in to vote.'); return; }
                      try {
                        const res = await ForumService.toggleCommentDownvote(postId, comment.id, currentUser.id, !!cDownvoted);
                        if (res && res.downvotes) {
                          setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: res.upvotes, downvotes: res.downvotes } : c));
                        }
                      } catch(e) { toast.error('Failed to vote'); }
                    }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all ${cDownvoted ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                      <ThumbsDown className="w-3 h-3" />
                      <span>{comment.downvotes?.length || 0}</span>
                    </button>
                    <span className={`ml-1 text-xs font-black tabular-nums ${cScore > 0 ? 'text-purple-600' : cScore < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {cScore > 0 ? `+${cScore}` : cScore}
                    </span>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
              <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">No comments yet. Be first!</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmationModal isOpen={isDeletePostModalOpen} onClose={() => setIsDeletePostModalOpen(false)}
        onConfirm={confirmDeletePost} title="Delete Post"
        message="Are you sure? All comments will also be deleted." confirmText="Delete" type="danger" />
      <ConfirmationModal isOpen={isDeleteCommentModalOpen} onClose={() => setIsDeleteCommentModalOpen(false)}
        onConfirm={confirmDeleteComment} title="Delete Comment"
        message="Are you sure you want to delete this comment?" confirmText="Delete" type="danger" />
    </div>
  );
};
