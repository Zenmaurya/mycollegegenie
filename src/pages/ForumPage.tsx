import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Search, Plus, Filter, ChevronRight,
  MessageCircle, ThumbsUp, ThumbsDown, Clock,
  GraduationCap, X, AlertCircle, RefreshCw, TrendingUp,
  Bookmark, Flame, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ForumPost } from '../types';
import type { SupabaseAuthUser } from '../types';
import { ForumService } from '../services/forumService';
import { getCurrentUser, supabase } from '../supabase';
import { College_COURSES, SUB_CATEGORIES } from '../constants';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export const FORUM_TOPICS = ['General', 'Doubt', 'Exam Tips', 'Notes', 'Placement', 'Events'] as const;

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

export const ForumPage: React.FC<{ user?: any }> = ({ user: propUser }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const currentUser = propUser ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'top'>('new');
  const [newPost, setNewPost] = useState({ title: '', content: '', course: '', topic: 'General' });

  useEffect(() => { setLimitCount(10); }, [selectedCourse, selectedTopic, activeTab]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const fetched = await ForumService.getPosts(selectedCourse, selectedTopic, limitCount + 1, undefined, activeTab);
      if (fetched.length > limitCount) { setPosts(fetched.slice(0, limitCount)); setHasMore(true); }
      else { setPosts(fetched); setHasMore(false); }
    } catch (err) {
      console.error('Failed to fetch forum posts:', err);
      toast.error('Could not load discussions. Please try again.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [selectedCourse, selectedTopic, limitCount, activeTab]);


  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = propUser;
    if (!user) return;
    if (!newPost.title.trim()) { toast.error('Please enter a title.'); return; }
    if (!newPost.course) { toast.error('Please select a course.'); return; }
    if (!newPost.content.trim()) { toast.error('Please write some content.'); return; }
    try {
      await ForumService.createPost({ ...newPost, authorId: user.id, authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous' });
      toast.success('Discussion posted!');
      setIsCreateModalOpen(false);
      setNewPost({ title: '', content: '', course: '', topic: 'General' });
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post.');
    }
  };

  const handleUpvote = async (postId: string, rawUpvotes: string[]) => {
    const user = propUser;
    if (!user) { toast.error('Sign in to vote.'); return; }
    const upvotes = Array.isArray(rawUpvotes) ? rawUpvotes : [];
    try {
      const res = await ForumService.toggleUpvote(postId, user.id, upvotes.includes(user.id));
      if (res && res.upvotes) {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
          downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
        } : p));
      }
    } catch (err) { toast.error('Failed to vote'); }
  };

  const handleDownvote = async (postId: string, rawDownvotes: string[]) => {
    const user = propUser;
    if (!user) { toast.error('Sign in to vote.'); return; }
    const downvotes = Array.isArray(rawDownvotes) ? rawDownvotes : [];
    try {
      const res = await ForumService.toggleDownvote(postId, user.id, downvotes.includes(user.id));
      if (res && res.downvotes) {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          upvotes: Array.isArray(res.upvotes) ? res.upvotes : [],
          downvotes: Array.isArray(res.downvotes) ? res.downvotes : []
        } : p));
      }
    } catch (err) { toast.error('Failed to vote'); }
  };

  return (
    <div className="min-h-screen bg-transparent pt-2 sm:pt-6 pb-12">
      <Helmet>
        <title>Student Forum - Ask Questions & Discuss | MyCollegeGenie</title>
        <meta name="description" content="Join college students across India in discussions about exams, courses, fests, placements, and campus life." />
        <link rel="canonical" href="https://mycollegegenie.in/forum" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Hero Header */}
        <div className="relative bg-white/50 backdrop-blur-md border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-xl shadow-purple-900/5 mb-6 sm:mb-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full blur-[80px] opacity-40 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-200 rounded-full blur-[80px] opacity-40 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest mb-3 border border-purple-100">
                <Sparkles className="w-3 h-3" /> Student Community
              </div>
              <h1 className="text-2xl sm:text-5xl font-black text-gray-900 tracking-tight mb-1 sm:mb-2">
                Discussion <span className="text-purple-600">Forums</span>
              </h1>
              <p className="text-gray-500 font-medium text-xs sm:text-base">Connect, ask, and learn with fellow college students.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 sm:px-8 py-2.5 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-purple-600/25 transition-all w-full md:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" /> Start Discussion
            </motion.button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white/60 backdrop-blur-md border border-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-sm mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search discussions..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 outline-none text-[11px] sm:text-sm font-medium transition-all" />
          </div>
          <div className="w-full sm:w-auto relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
              className="w-full text-ellipsis overflow-hidden pl-8 sm:pl-9 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 outline-none text-[9px] sm:text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer transition-all">
              <option value="All">All Courses</option>
              {College_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-auto relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}
              className="w-full text-ellipsis overflow-hidden pl-8 sm:pl-9 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500/15 focus:border-purple-500 outline-none text-[9px] sm:text-xs font-bold uppercase tracking-wider appearance-none cursor-pointer transition-all">
              <option value="All">All Topics</option>
              {FORUM_TOPICS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-2 mb-6">
          {(['hot', 'new', 'top'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${activeTab === tab ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200 hover:text-purple-600'}`}>
              {tab === 'hot' && <Flame className="w-3.5 h-3.5" />}
              {tab === 'new' && <Sparkles className="w-3.5 h-3.5" />}
              {tab === 'top' && <TrendingUp className="w-3.5 h-3.5" />}
              {tab}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 font-medium self-center">{filteredPosts.length} discussions</span>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex p-4 gap-4">
                  {/* Vote simulated column */}
                  <div className="flex flex-col items-center gap-2 w-10 shrink-0">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                  </div>
                  {/* Main simulated details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-4.5 w-16 rounded-full" />
                      <Skeleton className="h-4.5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4 rounded-full" />
                    <Skeleton className="h-3.5 w-full rounded-full" />
                    <Skeleton className="h-3.5 w-2/3 rounded-full" />
                    <div className="pt-2 border-t border-gray-50 flex items-center gap-3">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="h-3.5 w-24 rounded-full" />
                      <Skeleton className="h-3.5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post, i) => {
              const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];
              const downvotes = Array.isArray(post.downvotes) ? post.downvotes : [];
              const isUpvoted = currentUser && upvotes.includes(currentUser.id);
              const isDownvoted = currentUser && downvotes.includes(currentUser.id);
              const score = upvotes.length - downvotes.length;
              const topicColor = TOPIC_COLORS[post.topic] || 'bg-gray-50 text-gray-600 border-gray-200';

              return (
                <motion.div key={post.id} layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-white border border-gray-100 rounded-2xl sm:rounded-[1.8rem] overflow-hidden shadow-sm hover:shadow-[0_12px_36px_rgba(147,51,234,0.06)] hover:border-purple-200/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Desktop Vote Column - Hidden on Mobile */}
                    <div className="hidden sm:flex flex-col items-center gap-1.5 px-3 py-5 bg-gray-50/50 border-r border-gray-100/60 w-14 shrink-0 justify-start">
                      <button onClick={() => handleUpvote(post.id, post.upvotes)}
                        className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isUpvoted ? 'text-purple-600 bg-purple-100/60 shadow-sm' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'}`}>
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span className={`text-xs font-black tabular-nums ${score > 0 ? 'text-purple-600' : score < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                        {score}
                      </span>
                      <button onClick={() => handleDownvote(post.id, post.downvotes)}
                        className={`p-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isDownvoted ? 'text-rose-500 bg-rose-100/60 shadow-sm' : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Main Card Content */}
                    <div className="flex-1 p-4 sm:p-6 min-w-0 flex flex-col">
                      
                      {/* Premium Header: Author Profile + Tags */}
                      <div className="flex items-center justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Social Author Avatar */}
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-md shadow-purple-500/10 transition-transform group-hover:scale-105 duration-300">
                            {post.authorName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-black text-gray-800 leading-none mb-1 truncate">
                              {post.authorName}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                              <Clock className="w-2.5 h-2.5" /> {timeAgo(post.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Shortened Tags */}
                        <div className="flex items-center gap-1.5 shrink-0 max-w-[50%] overflow-hidden">
                          <span className="px-2 py-0.5 bg-purple-50/80 text-purple-600 text-[9px] font-black uppercase tracking-wider rounded-full border border-purple-100/60 truncate" title={post.course}>
                            {shortenCourse(post.course)}
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border truncate ${topicColor}`}>
                            {post.topic}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link to={`/forum/${post.id}`}>
                        <h3 className="text-[15px] sm:text-[18px] font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      {/* Content Preview */}
                      <p className="text-[13px] sm:text-[14px] text-gray-500 line-clamp-3 font-medium leading-relaxed mb-4">
                        {post.content}
                      </p>

                      {/* Interactivity Row (Footer) */}
                      <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto gap-3">
                        
                        {/* Mobile Vote Pill - Only Visible on Mobile */}
                        <div className="sm:hidden flex items-center bg-gray-50/90 rounded-xl p-0.5 border border-gray-100/80">
                          <button onClick={() => handleUpvote(post.id, post.upvotes)}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${isUpvoted ? 'text-purple-600 bg-purple-100/50 shadow-sm' : 'text-gray-400'}`}>
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <span className={`text-[11px] font-black px-2 tabular-nums min-w-[20px] text-center ${score > 0 ? 'text-purple-600' : score < 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                            {score}
                          </span>
                          <button onClick={() => handleDownvote(post.id, post.downvotes)}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${isDownvoted ? 'text-rose-500 bg-rose-100/50 shadow-sm' : 'text-gray-400'}`}>
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Comments Count Pill */}
                        <Link to={`/forum/${post.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/80 hover:bg-purple-50 hover:text-purple-600 text-gray-500 border border-gray-100/50 hover:border-purple-100/50 rounded-xl transition-all duration-200 font-bold text-[11px]">
                          <MessageCircle className="w-4 h-4 shrink-0 text-gray-400 hover:text-purple-500" />
                          <span>{post.commentCount} <span className="hidden xs:inline">comments</span></span>
                        </Link>

                        {/* Premium View/Action Button */}
                        <Link to={`/forum/${post.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 text-purple-600 hover:text-purple-700 rounded-xl transition-all duration-200 font-black text-[10px] uppercase tracking-wider shrink-0">
                          <span>View</span> <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-24 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl">
              <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-purple-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">No discussions found</h3>
              <p className="text-gray-500 max-w-sm mx-auto font-medium mb-6">Be the first to start a conversation in this topic!</p>
              <button onClick={() => setIsCreateModalOpen(true)}
                className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-600/20 transition-all">
                Start Discussion
              </button>
            </motion.div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && filteredPosts.length > 0 && (
            <div className="flex justify-center pt-6">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setLimitCount(p => p + 10)}
                className="flex items-center gap-2 px-8 py-3.5 bg-white border border-gray-200 hover:border-purple-300 hover:text-purple-600 text-gray-600 rounded-2xl font-bold text-sm shadow-sm transition-all">
                <RefreshCw className="w-4 h-4" /> Load More
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {createPortal(
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" style={{ position: 'fixed', inset: 0 }}>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: '92vh' }}
            >
              {/* Drag handle (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-gray-900 leading-tight">Start a Discussion</h2>
                    <p className="text-[11px] text-gray-400 font-medium leading-tight">Ask, share & connect with college students</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1">
                <form id="forum-create-form" onSubmit={handleCreatePost}>
                  {!currentUser ? (
                    <div className="flex flex-col items-center py-12 px-6 text-center gap-4">
                      <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900 mb-1">Sign in Required</h3>
                        <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto">You need to be signed in to post a discussion.</p>
                      </div>
                      <Link to="/login" onClick={() => setIsCreateModalOpen(false)}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm shadow-md shadow-purple-600/20 transition-all">
                        Sign In to Continue
                      </Link>
                    </div>
                  ) : (
                    <div className="px-5 py-4 space-y-4">

                      {/* Author strip */}
                      <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                          {(currentUser.user_metadata?.full_name || currentUser.email)?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                          </p>
                          <p className="text-[10px] text-purple-500 font-semibold">Verified Student</p>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                          Title <span className="text-red-400 font-black">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={120}
                          placeholder="What's your question or topic?"
                          value={newPost.title}
                          onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm font-medium text-gray-800 placeholder-gray-400 transition-all"
                        />
                        <p className="text-[10px] text-gray-400 font-medium text-right">{newPost.title.length}/120</p>
                      </div>

                      {/* Course + Topic row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                            Course <span className="text-red-400 font-black">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={newPost.course}
                              onChange={e => setNewPost({ ...newPost, course: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm font-medium text-gray-800 cursor-pointer transition-all appearance-none pr-8"
                            >
                              <option value="" disabled>Pick course</option>
                              {College_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Topic</label>
                          <div className="relative">
                            <select
                              value={newPost.topic}
                              onChange={e => setNewPost({ ...newPost, topic: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm font-medium text-gray-800 cursor-pointer transition-all appearance-none pr-8"
                            >
                              {FORUM_TOPICS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Topic preview chip */}
                      {newPost.topic && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-medium">Preview tags:</span>
                          {newPost.course && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-100">
                              {newPost.course}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border ${TOPIC_COLORS[newPost.topic] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {newPost.topic}
                          </span>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                          Details <span className="text-red-400 font-black">*</span>
                        </label>
                        <textarea
                          required
                          rows={5}
                          maxLength={2000}
                          placeholder="Describe your question in detail. Include what you've tried, what you need help with, etc."
                          value={newPost.content}
                          onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm font-medium text-gray-800 placeholder-gray-400 resize-none transition-all leading-relaxed"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-gray-400 font-medium">Be specific — better questions get better answers!</p>
                          <p className={`text-[10px] font-bold ${newPost.content.length > 1800 ? 'text-orange-500' : 'text-gray-400'}`}>
                            {newPost.content.length}/2000
                          </p>
                        </div>
                      </div>

                      {/* Spacer for sticky footer */}
                      <div className="h-2" />
                    </div>
                  )}
                </form>
              </div>

              {/* Sticky Footer Submit */}
              {currentUser && (
                <div className="px-5 py-3.5 border-t border-gray-100 bg-white shrink-0">
                  <button
                    type="submit"
                    form="forum-create-form"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl font-black text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Post Discussion
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};


