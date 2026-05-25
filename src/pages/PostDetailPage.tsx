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

export function shortenCourse(courseName: string): string {
  if (!courseName) return 'General';
  const bracketMatch = courseName.match(/\[([^\]]+)\]/);
  if (bracketMatch) return bracketMatch[1];
  const parenMatch = courseName.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const content = parenMatch[1];
    if (content.length <= 10) return content;
  }
  const courseLower = courseName.toLowerCase();
  if (courseLower.includes('economics')) return courseLower.includes('hons') ? 'B.A. Econ (H)' : 'B.A. Econ';
  if (courseLower.includes('computer science')) return courseLower.includes('hons') ? 'B.Sc. CS (H)' : 'B.Sc. CS';
  if (courseLower.includes('political science')) return courseLower.includes('hons') ? 'B.A. Pol Sci (H)' : 'B.A. Pol Sci';
  if (courseLower.includes('information technology')) return 'B.Tech IT';
  if (courseLower.includes('business economics')) return 'B.A. BBE';
  if (courseLower.includes('elementary education')) return 'B.El.Ed';
  if (courseLower.includes('mathematical sciences')) return 'B.Sc. Math Sci';
  if (courseLower.includes('physical sciences')) return 'B.Sc. Phys Sci';
  if (courseLower.includes('life sciences')) return 'B.Sc. Life Sci';
  if (courseLower.includes('english')) return courseLower.includes('hons') ? 'B.A. Eng (H)' : 'B.A. Eng';
  if (courseLower.includes('history')) return courseLower.includes('hons') ? 'B.A. Hist (H)' : 'B.A. Hist';
  if (courseLower.includes('philosophy')) return courseLower.includes('hons') ? 'B.A. Phil (H)' : 'B.A. Phil';
  if (courseLower.includes('geography')) return courseLower.includes('hons') ? 'B.A. Geog (H)' : 'B.A. Geog';
  if (courseLower.includes('psychology')) return courseLower.includes('hons') ? 'B.A. Psych (H)' : 'B.A. Psych';
  if (courseLower.includes('sociology')) return courseLower.includes('hons') ? 'B.A. Soc (H)' : 'B.A. Soc';
  if (courseLower.includes('sanskrit')) return courseLower.includes('hons') ? 'B.A. Skt (H)' : 'B.A. Skt';
  if (courseLower.includes('hindi')) return courseLower.includes('hons') ? 'B.A. Hindi (H)' : 'B.A. Hindi';
  if (courseLower.includes('botany')) return courseLower.includes('hons') ? 'B.Sc. Bot (H)' : 'B.Sc. Bot';
  if (courseLower.includes('chemistry')) return courseLower.includes('hons') ? 'B.Sc. Chem (H)' : 'B.Sc. Chem';
  if (courseLower.includes('physics')) return courseLower.includes('hons') ? 'B.Sc. Phys (H)' : 'B.Sc. Phys';
  if (courseLower.includes('zoology')) return courseLower.includes('hons') ? 'B.Sc. Zool (H)' : 'B.Sc. Zool';
  if (courseLower.includes('mathematics')) return courseLower.includes('hons') ? 'B.Sc. Math (H)' : 'B.Sc. Math';
  if (courseLower.includes('statistics')) return courseLower.includes('hons') ? 'B.Sc. Stats (H)' : 'B.Sc. Stats';
  if (courseLower.includes('microbiology')) return courseLower.includes('hons') ? 'B.Sc. Micro (H)' : 'B.Sc. Micro';
  if (courseLower.includes('biomedical science')) return courseLower.includes('hons') ? 'B.Sc. BioMed (H)' : 'B.Sc. BioMed';
  if (courseLower.includes('electronics')) return courseLower.includes('hons') ? 'B.Sc. Elec (H)' : 'B.Sc. Elec';
  if (courseLower.includes('instrumentation')) return courseLower.includes('hons') ? 'B.Sc. Inst (H)' : 'B.Sc. Inst';
  if (courseLower.includes('geology')) return courseLower.includes('hons') ? 'B.Sc. Geol (H)' : 'B.Sc. Geol';
  if (courseLower.includes('anthropology')) return courseLower.includes('hons') ? 'B.Sc. Anthro (H)' : 'B.Sc. Anthro';
  if (courseLower.includes('food technology')) return courseLower.includes('hons') ? 'B.Sc. Food Tech (H)' : 'B.Sc. Food Tech';
  if (courseLower.includes('polymer science')) return courseLower.includes('hons') ? 'B.Sc. Poly Sci (H)' : 'B.Sc. Poly Sci';
  if (courseLower.includes('b.com. (hons.)')) return 'B.Com (H)';
  if (courseLower.includes('b.com. programme')) return 'B.Com Prog';
  if (courseLower.includes('b.a. programme')) return 'B.A. Prog';
  return courseName.length > 22 ? courseName.substring(0, 20) + '…' : courseName;
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
    const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];
    try {
      const res = await ForumService.toggleUpvote(post.id, currentUser.id, upvotes.includes(currentUser.id));
      if (res && res.upvotes) {
        setPost(prev => prev ? {
          ...prev,
          upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
          downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
        } : prev);
      }
    } catch (err) {
      toast.error('Failed to vote');
    }
  };

  const handleDownvote = async () => {
    if (!post || !currentUser) { toast.error('Sign in to vote.'); return; }
    const downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];
    try {
      const res = await ForumService.toggleDownvote(post.id, currentUser.id, downvotes.includes(currentUser.id));
      if (res && res.downvotes) {
        setPost(prev => prev ? {
          ...prev,
          upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
          downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
        } : prev);
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

  const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];
  const downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];
  const isUpvoted = currentUser && upvotes.includes(currentUser.id);
  const isDownvoted = currentUser && downvotes.includes(currentUser.id);
  const score = upvotes.length - downvotes.length;
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
        className="bg-white border border-gray-100 rounded-2xl sm:rounded-[1.8rem] overflow-hidden shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row">
          {/* Vote Column - Hidden on Mobile */}
          <div className="hidden sm:flex flex-col items-center gap-1.5 px-3 py-5 bg-gray-50/50 border-r border-gray-100/60 w-14 shrink-0 justify-start">
            <button onClick={handleUpvote}
              className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isUpvoted ? 'text-purple-600 bg-purple-100/60 shadow-sm' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
              <ThumbsUp className="w-4 h-4" />
            </button>
            <span className={`text-xs font-black tabular-nums ${score > 0 ? 'text-purple-600' : score < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
              {score}
            </span>
            <button onClick={handleDownvote}
              className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isDownvoted ? 'text-rose-500 bg-rose-100/60 shadow-sm' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 min-w-0 flex flex-col">
            
            {/* Premium Header: Author Profile + Tags + Delete */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <UploaderProfilePopover uploaderName={post.authorName} uploaderId={post.authorId}>
                  <div className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-md shadow-purple-500/10 group-hover:scale-105 transition-transform duration-300">
                      {post.authorName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-gray-800 leading-none mb-1 group-hover:text-purple-600 transition-colors truncate">
                        {post.authorName}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(post.createdAt)}
                      </span>
                    </div>
                  </div>
                </UploaderProfilePopover>
              </div>

              {/* Tags + Delete */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0 max-w-[150px] overflow-hidden">
                  <span className="px-2 py-0.5 bg-purple-50/80 text-purple-600 text-[9px] font-black uppercase tracking-wider rounded-full border border-purple-100/60 truncate" title={post.course}>
                    {shortenCourse(post.course)}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border truncate ${topicColor}`}>
                    {post.topic}
                  </span>
                </div>
                
                {(currentUser?.role === 'admin' || currentUser?.id === post.authorId) && (
                  <button onClick={() => setIsDeletePostModalOpen(true)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0" title="Delete Post">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 leading-snug tracking-tight mb-3">
              {post.title}
            </h1>

            {/* Body */}
            <p className="text-[14px] sm:text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap font-medium mb-6">
              {post.content}
            </p>

            {/* Interactivity Row (Footer) */}
            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto gap-3">
              
              {/* Mobile Vote Pill - Only Visible on Mobile */}
              <div className="sm:hidden flex items-center bg-gray-50/90 rounded-xl p-0.5 border border-gray-100/80">
                <button onClick={handleUpvote}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${isUpvoted ? 'text-purple-600 bg-purple-100/50 shadow-sm' : 'text-gray-400'}`}>
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <span className={`text-[11px] font-black px-2 tabular-nums min-w-[20px] text-center ${score > 0 ? 'text-purple-600' : score < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                  {score}
                </span>
                <button onClick={handleDownvote}
                  className={`p-1.5 rounded-lg transition-all duration-200 ${isDownvoted ? 'text-rose-500 bg-rose-100/50 shadow-sm' : 'text-gray-400'}`}>
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comments Count Pill */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 text-gray-500 border border-gray-100/50 rounded-xl font-bold text-[11px] ml-auto sm:ml-0">
                <MessageCircle className="w-4 h-4 shrink-0 text-gray-400" />
                <span>{comments.length} comments</span>
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
              const cUpvotes = Array.isArray(comment.upvotes) ? comment.upvotes : [];
              const cDownvotes = Array.isArray(comment.downvotes) ? comment.downvotes : [];
              const cScore = cUpvotes.length - cDownvotes.length;
              const cUpvoted = currentUser && cUpvotes.includes(currentUser.id);
              const cDownvoted = currentUser && cDownvotes.includes(currentUser.id);
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
                          setComments(prev => prev.map(c => c.id === comment.id ? {
                            ...c,
                            upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
                            downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
                          } : c));
                        }
                      } catch(e) { toast.error('Failed to vote'); }
                    }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all ${cUpvoted ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                      <ThumbsUp className="w-3 h-3" />
                      <span>{cUpvotes.length}</span>
                    </button>
                    <button onClick={async () => {
                      if (!postId || !currentUser) { toast.error('Sign in to vote.'); return; }
                      try {
                        const res = await ForumService.toggleCommentDownvote(postId, comment.id, currentUser.id, !!cDownvoted);
                        if (res && res.downvotes) {
                          setComments(prev => prev.map(c => c.id === comment.id ? {
                            ...c,
                            upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
                            downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
                          } : c));
                        }
                      } catch(e) { toast.error('Failed to vote'); }
                    }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all ${cDownvoted ? 'text-rose-500 bg-rose-50' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                      <ThumbsDown className="w-3 h-3" />
                      <span>{cDownvotes.length}</span>
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
