import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageCircle,
  Clock, Send, Trash2, AlertCircle, ChevronRight,
  ChevronUp, ChevronDown, Check
} from 'lucide-react';
import { ForumPost, Comment } from '../types';
import type { SupabaseAuthUser } from '../types';
import { ForumService } from '../services/forumService';
import { ForumPostSkeleton } from '../components/ui/Skeletons';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { UploaderProfilePopover } from '../components/UploaderProfilePopover';

import { cn, TOPIC_COLORS, timeAgo, shortenCourse } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

function Avatar({ name, size = 8 }: { name: string; size?: number }) {
  const colors = ['from-brand-primary to-mark', 'from-blue-400 to-cyan-400', 'from-emerald-400 to-teal-400', 'from-orange-400 to-amber-400'];
  const color = name ? colors[name.charCodeAt(0) % colors.length] : colors[0];
  const sizeClass = size === 7 ? 'w-7 h-7' : size === 8 ? 'w-8 h-8' : size === 10 ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black shrink-0`}
      style={{ fontSize: size <= 7 ? 10 : 12 }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  );
}

export const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, openAuthModal } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isDeleteCommentModalOpen, setIsDeleteCommentModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    try {
      const fetchedPost = await ForumService.getPost(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setComments(await ForumService.getComments(postId));
      } else {
        toast.error('Post not found');
        navigate('/forum');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvotePost = async () => {
    if (!post || !currentUser) { openAuthModal('Sign in to vote.'); return; }
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

  const handleDownvotePost = async () => {
    if (!post || !currentUser) { openAuthModal('Sign in to vote.'); return; }
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
      <div className="w-full">
        <div className="layout-2col">
          <div>
            <ForumPostSkeleton />
            <div className="mt-8">
              <ForumPostSkeleton />
              <ForumPostSkeleton />
            </div>
          </div>
          <div className="hidden lg:block"></div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];
  const downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];
  const isUpvoted = currentUser && upvotes.includes(currentUser.id);
  const isDownvoted = currentUser && downvotes.includes(currentUser.id);
  const score = upvotes.length - downvotes.length;

  const GUILDS = [
    { id: 'GossipGenie', name: 'Gossip Nest', bgColor: '#7C3AED' },
    { id: 'ScholarSphere', name: 'Scholar Spot', bgColor: '#0D9488' },
    { id: 'CareerCrucible', name: 'Career Hub', bgColor: '#475569' },
    { id: 'FestFrenzy', name: 'Fest Arena', bgColor: '#F59E0B' },
    { id: 'CodeCave', name: 'Code Cave', bgColor: '#10B981' }
  ];
  const postGuild = GUILDS.find(g => g.id === post.topic);

  return (
    <>
      <Helmet>
        <title>{post.title} | My College Genie</title>
        <meta name="description" content={post.content.substring(0, 150)} />
      </Helmet>

      <div className="w-full">
        <div className="layout-2col">
          {/* Main Thread Content */}
          <div>
            <div className="crumbs">
              <Link to="/forum" className="hover:text-brand transition-colors">Forum</Link> / <b>{shortenCourse(post.course)}</b> / Question
            </div>

            <div className="thread-q">
              <div className="qcard-top flex items-center gap-2 mb-3 flex-wrap">
                {postGuild && (
                  <span 
                    style={{ backgroundColor: `${postGuild.bgColor}15`, color: postGuild.bgColor }}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-current font-mono"
                  >
                    g/{postGuild.name.replace(/\s+/g, '')}
                  </span>
                )}
                {post.course && <span className="subj-tag">{shortenCourse(post.course)}</span>}
                <span className={`stamp ${comments.length > 0 ? 'solved' : 'open'}`}>
                  {comments.length > 0 ? 'Answered' : 'Open'}
                </span>
                
                {(currentUser?.role === 'admin' || currentUser?.id === post.authorId) && (
                  <button onClick={() => setIsDeletePostModalOpen(true)}
                    className="ml-auto text-ink-faint hover:text-red-500 transition-colors" title="Delete Post">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h1>{post.title}</h1>
              
              <div className="body-text whitespace-pre-wrap">
                {post.content}
              </div>
              
              <div className="qcard-meta mt-4 flex justify-between items-center">
                <div className="flex gap-4">
                  <span className="item">
                    <span className="avatar w-5 h-5">{post.authorName?.[0]?.toUpperCase() || 'U'}</span> 
                    {post.authorName}
                  </span>
                  <span className="item"><Clock className="w-[14px] h-[14px]"/> Posted {timeAgo(post.createdAt)}</span>
                </div>
                
                <div className="flex items-center bg-surface-sunk rounded-md border border-line">
                  <button onClick={handleUpvotePost} className={`px-2 py-1 hover:text-brand ${isUpvoted ? 'text-brand' : 'text-ink-soft'}`}>
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{score}</span>
                  <button onClick={handleDownvotePost} className={`px-2 py-1 hover:text-brand ${isDownvoted ? 'text-brand' : 'text-ink-soft'}`}>
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold font-['Inter']">{comments.length} answers</h3>
              <select className="btn btn-sm font-inherit bg-surface border border-line rounded px-2 py-1 text-xs text-ink">
                <option>Top voted</option>
                <option>Newest</option>
              </select>
            </div>

            {/* Answers */}
            <div className="mt-4">
              {comments.length > 0 ? (
                comments.map((comment, index) => {
                  const cUpvotes = Array.isArray(comment.upvotes) ? comment.upvotes : [];
                  const cDownvotes = Array.isArray(comment.downvotes) ? comment.downvotes : [];
                  const cScore = cUpvotes.length - cDownvotes.length;
                  const cUpvoted = currentUser && cUpvotes.includes(currentUser.id);
                  const cDownvoted = currentUser && cDownvotes.includes(currentUser.id);
                  
                  const isBest = index === 0 && cScore > 0;
                  
                  return (
                    <div key={comment.id} className={`answer ${isBest ? 'best' : ''}`}>
                      <div className="vote flex flex-col items-center gap-1">
                        <button onClick={async () => {
                          if (!postId || !currentUser) { openAuthModal('Sign in to vote.'); return; }
                          try {
                            const res = await ForumService.toggleCommentUpvote(postId, comment.id, currentUser.id, !!cUpvoted);
                            if (res && res.upvotes) setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: res.upvotes as string[], downvotes: res.downvotes as string[] } : c));
                          } catch(e) {}
                        }} className={`hover:text-brand ${cUpvoted ? 'text-brand' : 'text-ink-faint'}`}>
                          <ChevronUp className="w-5 h-5" strokeWidth={2.5}/>
                        </button>
                        <span className="n font-bold text-sm">{cScore}</span>
                        <button onClick={async () => {
                          if (!postId || !currentUser) { openAuthModal('Sign in to vote.'); return; }
                          try {
                            const res = await ForumService.toggleCommentDownvote(postId, comment.id, currentUser.id, !!cDownvoted);
                            if (res && res.downvotes) setComments(prev => prev.map(c => c.id === comment.id ? { ...c, upvotes: res.upvotes as string[], downvotes: res.downvotes as string[] } : c));
                          } catch(e) {}
                        }} className={`hover:text-brand ${cDownvoted ? 'text-brand' : 'text-ink-faint'}`}>
                          <ChevronDown className="w-5 h-5" strokeWidth={2.5}/>
                        </button>
                      </div>
                      
                      <div className="answer-body">
                        {isBest && (
                          <div className="best-flag">
                            <Check className="w-[14px] h-[14px]"/> Marked as best answer
                          </div>
                        )}
                        <div className="answer-author flex justify-between">
                          <span className="flex items-center gap-2">
                            <span className="avatar w-5 h-5 bg-ink text-white rounded-full flex items-center justify-center text-[10px]">{comment.authorName?.[0]?.toUpperCase()}</span>
                            {comment.authorName} · Answered {timeAgo(comment.createdAt)}
                          </span>
                          
                          {(currentUser?.id === comment.authorId || currentUser?.role === 'admin') && comment.authorId !== 'deleted' && (
                            <button onClick={() => { setCommentToDelete(comment.id); setIsDeleteCommentModalOpen(true); }}
                              className="text-ink-faint hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="body-text whitespace-pre-wrap">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="answer justify-center text-ink-soft py-8">
                  No answers yet. Be the first to answer!
                </div>
              )}
            </div>

            {/* Composer */}
            {currentUser ? (
              <form className="composer" onSubmit={handleAddComment}>
                <textarea 
                  placeholder="Write your answer — include the steps, not just the result."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={!newComment.trim() || isSubmitting} className="btn btn-primary disabled:opacity-50">
                    {isSubmitting ? 'Posting...' : 'Post answer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                <span className="text-ink-soft text-sm">Sign in to post an answer.</span>
                <button onClick={() => openAuthModal('Sign in to post an answer.')} className="btn btn-primary">Sign in</button>
              </div>
            )}
          </div>

          {/* Right Rail */}
          <div className="hidden lg:block">
            <div className="rail-card">
              <h4>About this question</h4>
              <ul className="rail-list">
                <li>Asked <b>{timeAgo(post.createdAt)}</b></li>
                <li>Score <b>{score}</b></li>
                <li>Answers <b>{comments.length}</b></li>
              </ul>
            </div>
            
            <div className="rail-card">
              <h4>Related threads</h4>
              <ul className="rail-list flex flex-col items-start gap-3">
                <li className="block"><a href="#" className="hover:text-brand font-bold text-sm">Difference between fiscal and monetary multiplier effects</a></li>
                <li className="block"><a href="#" className="hover:text-brand font-bold text-sm">IS-LM with open economy assumptions</a></li>
                <li className="block"><a href="#" className="hover:text-brand font-bold text-sm">2022 end-sem Q4 full solution</a></li>
              </ul>
            </div>
          </div>
          
        </div>
      </div>

      <ConfirmationModal isOpen={isDeletePostModalOpen} onClose={() => setIsDeletePostModalOpen(false)}
        onConfirm={confirmDeletePost} title="Delete Post"
        message="Are you sure? All comments will also be deleted." confirmText="Delete" type="danger" />
      <ConfirmationModal isOpen={isDeleteCommentModalOpen} onClose={() => setIsDeleteCommentModalOpen(false)}
        onConfirm={confirmDeleteComment} title="Delete Comment"
        message="Are you sure you want to delete this comment?" confirmText="Delete" type="danger" />
    </>
  );
};
