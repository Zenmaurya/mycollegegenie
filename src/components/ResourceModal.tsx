import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import DOMPurify from 'dompurify';
import {
  X, MessageCircle, Lightbulb, User, Calendar, Flag,
  BookOpen, Globe, Download, Share2, ExternalLink,
  PlayCircle, Youtube, ChevronLeft, Star, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../supabase';
import { config } from '../lib/config';
import { UploaderProfilePopover } from './UploaderProfilePopover';
import type { Resource, SupabaseAuthUser, User as AppUser } from '../types';

interface ResourceModalProps {
  resource: Resource | null;
  onClose: () => void;
  user: SupabaseAuthUser | null;
  appUser: AppUser | null;
  resources: Resource[];
  onRate: (resourceId: string, rating: number) => Promise<void>;
  onShare: (resource: Resource) => void;
  onOpenReport: () => void;
  getAverageRating: (ratings?: number[]) => number;
}

interface Comment { id: string; user_name: string; content: string; created_at: string; }
interface ExamTip { id: string; user_name: string; tip: string; }

export function ResourceModal({
  resource,
  onClose,
  user,
  appUser,
  resources,
  onRate,
  onShare,
  onOpenReport,
  getAverageRating,
}: ResourceModalProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [modalView, setModalView] = useState<'main' | 'comments' | 'tips'>('main');
  const [comments, setComments] = useState<Comment[]>([]);
  const [tips, setTips] = useState<ExamTip[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTip, setNewTip] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isPostingTip, setIsPostingTip] = useState(false);

  // Reset view when resource changes
  useEffect(() => {
    if (resource) setModalView('main');
  }, [resource?.id]);

  // Fetch comments and tips when resource opens
  useEffect(() => {
    if (!resource) return;
    fetch(`${config.apiUrl}/api/resources/${resource.id}/comments`)
      .then((r) => r.json()).then(setComments).catch(() => {});
    fetch(`${config.apiUrl}/api/resources/${resource.id}/exam-tips`)
      .then((r) => r.json()).then(setTips).catch(() => {});
  }, [resource?.id]);

  // Listen for tab-switch events from ResourceCard
  useEffect(() => {
    const handleOpenTab = (e: CustomEvent) => {
      if (e.detail === 'comments' || e.detail === 'tips') setModalView(e.detail);
    };
    window.addEventListener('openResourceTab', handleOpenTab as EventListener);
    return () => window.removeEventListener('openResourceTab', handleOpenTab as EventListener);
  }, []);

  const handleClose = () => {
    setModalView('main');
    setComments([]);
    setTips([]);
    setNewComment('');
    setNewTip('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('resourceId');
      return next;
    }, { replace: true });
    onClose();
  };

  const handlePostComment = async () => {
    if (!user || !resource || !newComment.trim()) return;
    setIsPostingComment(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${config.apiUrl}/api/resources/${resource.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data, ...prev]);
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePostTip = async () => {
    if (!user || !resource || !newTip.trim()) return;
    setIsPostingTip(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${config.apiUrl}/api/resources/${resource.id}/exam-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tip: newTip.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTips((prev) => [data, ...prev]);
        setNewTip('');
        toast.success('Exam tip added!');
      } else {
        toast.error(data.error || 'Failed to post tip');
      }
    } catch {
      toast.error('Failed to post tip');
    } finally {
      setIsPostingTip(false);
    }
  };

  // Get YouTube video ID for playlist thumbnail
  const getPlaylistVideoId = (link: string) => {
    try {
      const u = new URL(link);
      const videoId = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.replace(/^\//, '') : null);
      return videoId;
    } catch {
      return null;
    }
  };

  if (!resource) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="py-3 px-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setModalView('main'); }}
                className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
                  resource.type === 'Note' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' :
                  resource.type === 'PYQ' ? 'bg-violet-100 text-violet-600 hover:bg-violet-200' :
                  'bg-rose-100 text-rose-600 hover:bg-rose-200'
                }`}
              >
                {resource.type}
              </button>
              <span className="text-xs text-gray-500 font-bold shrink-0 bg-gray-100 px-2 py-1 rounded-md">Sem {resource.semester}</span>

              <button onClick={(e) => { e.stopPropagation(); setModalView('comments'); }} className={`hidden sm:flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-colors ml-2 ${modalView === 'comments' ? 'text-purple-600' : 'text-gray-400 hover:text-purple-600'}`}>
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Comments</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalView('tips'); }} className={`hidden sm:flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-colors ${modalView === 'tips' ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}>
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Exam Tips</span>
              </button>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={(e) => { e.stopPropagation(); setModalView('comments'); }} className={`sm:hidden p-1.5 rounded-md transition-colors ${modalView === 'comments' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-purple-600 hover:bg-gray-50'}`}>
                <MessageCircle className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setModalView('tips'); }} className={`sm:hidden p-1.5 rounded-md transition-colors ${modalView === 'tips' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-yellow-600 hover:bg-gray-50'}`}>
                <Lightbulb className="w-4 h-4" />
              </button>
              <button onClick={() => { onOpenReport(); }} className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] sm:text-xs font-bold transition-colors">
                <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Report</span>
              </button>
              <button onClick={handleClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 sm:p-6 custom-scrollbar text-left">
            {/* Playlist YouTube thumbnail */}
            {resource.type === 'Playlist' && resource.link && (() => {
              const videoId = getPlaylistVideoId(resource.link);
              if (!videoId) return null;
              return (
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 sm:mb-5 bg-gray-100 relative">
                  <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={resource.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-black/10" />
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <PlayCircle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600" />
                    </div>
                  </a>
                </div>
              );
            })()}

            <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 text-gray-900 leading-tight break-words">{resource.title}</h2>
            <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2.5 sm:mb-5 break-words">
              {resource.course}
              {resource.subjectCode && <span className="ml-1 sm:ml-2 text-gray-400">({resource.subjectCode})</span>}
            </p>

            {modalView === 'main' && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">Uploaded By</p>
                    <UploaderProfilePopover uploaderName={(resource as any).uploader || 'Anonymous'} uploaderId={(resource as any).uploaderId} resources={resources} />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">Upload Date</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-900 truncate">
                      {(resource as any).uploadDate ? new Date((resource as any).uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              {modalView === 'main' ? (
                <>
                  <div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</h4>
                    <div
                      className="text-slate-600/70 leading-relaxed prose prose-sm max-w-none text-sm sm:text-base font-medium"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.description || 'No description provided for this resource.') }}
                    />
                  </div>

                  <div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tags</h4>
                    <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
                      {resource.tags.map((tag) => (
                        <span key={tag} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 rounded-md text-[10px] sm:text-xs text-gray-600 border border-gray-200">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rate this resource</h4>
                      <div className="flex items-center gap-1 text-pink-600">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold">{getAverageRating((resource as any).ratings)}</span>
                        <span className="text-[10px] text-gray-500 font-medium ml-1">({(resource as any).ratings?.length || 0} ratings)</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => onRate(resource.id, star)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group">
                          <Star className={`w-5 h-5 transition-colors ${star <= Math.round(getAverageRating((resource as any).ratings)) ? 'text-pink-600 fill-current' : 'text-gray-300 group-hover:text-pink-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin reports section */}
                  {appUser?.role === 'admin' && (resource as any).reports?.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Active Reports ({(resource as any).reports.length})
                      </h4>
                      <div className="space-y-3">
                        {(resource as any).reports.map((report: any, idx: number) => (
                          <div key={idx} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                            <p className="text-sm text-gray-700 mb-2">{report.reason}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{new Date(report.date).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : modalView === 'comments' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalView('main')} className="p-1 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Student Comments ({comments.length})
                    </h4>
                  </div>
                  {user ? (
                    <div className="flex gap-2">
                      <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePostComment()} placeholder="Write a comment..." maxLength={1000} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500" />
                      <button onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {isPostingComment ? '...' : 'Post'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium">Sign in to leave a comment</p>
                  )}
                  <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
                    {comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[150px] text-gray-400">
                        <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm font-medium">No comments yet — be the first!</p>
                      </div>
                    ) : comments.map((c) => (
                      <div key={c.id} className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0 mb-1.5 sm:mb-2">
                          <span className="font-black text-gray-900 text-xs sm:text-sm">{c.user_name}</span>
                          <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <span className="text-gray-600 text-xs sm:text-sm font-medium">{c.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalView('main')} className="p-1 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Exam Tips ({tips.length})
                    </h4>
                  </div>
                  {user ? (
                    <div className="flex gap-2">
                      <input value={newTip} onChange={(e) => setNewTip(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePostTip()} placeholder="Share an exam tip..." maxLength={500} className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                      <button onClick={handlePostTip} disabled={isPostingTip || !newTip.trim()} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                        {isPostingTip ? '...' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium">Sign in to share exam tips</p>
                  )}
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 sm:p-5 shadow-sm min-h-[150px] max-h-[280px] overflow-y-auto">
                    {tips.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[120px] text-yellow-600/50">
                        <Lightbulb className="w-8 h-8 mb-2" />
                        <p className="text-sm font-medium">No exam tips yet — share yours!</p>
                      </div>
                    ) : (
                      <ul className="list-disc pl-5 text-yellow-800 space-y-2 text-xs sm:text-sm font-medium">
                        {tips.map((t) => (
                          <li key={t.id}>{t.tip}<span className="ml-2 text-[10px] text-yellow-600/60">— {t.user_name}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row flex-wrap gap-3 border-t border-gray-100">
                {(resource.type === 'Note' || resource.type === 'PYQ') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { handleClose(); navigate(`/flipbook/${resource.id}`); }}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Read Flipbook</span>
                  </motion.button>
                )}
                <motion.a
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href={resource.link || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/20"
                >
                  {resource.type === 'Playlist' ? <Youtube className="w-4 h-4 shrink-0" /> : <Globe className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{resource.type === 'Playlist' ? 'Watch Playlist' : 'View Source'}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </motion.a>
                {resource.directDownloadLink && (
                  <motion.a
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    href={resource.directDownloadLink} download
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download</span>
                  </motion.a>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onShare(resource)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden md:inline">Share</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
