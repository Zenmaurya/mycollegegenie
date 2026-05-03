import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown,
  Clock, 
  User, 
  GraduationCap, 
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ForumPost } from '../types';
import { ForumService } from '../services/forumService';
import { auth } from '../firebase';
import { DU_COURSES, SUB_CATEGORIES } from '../constants';

import { toast } from 'sonner';

export const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  
  // Create Post Form State
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    course: '',
    topic: SUB_CATEGORIES[0]
  });

  useEffect(() => {
    setLimitCount(10);
  }, [selectedCourse, selectedTopic]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = ForumService.getPosts(selectedCourse, selectedTopic, limitCount + 1, (fetchedPosts) => {
      if (fetchedPosts.length > limitCount) {
        setPosts(fetchedPosts.slice(0, limitCount));
        setHasMore(true);
      } else {
        setPosts(fetchedPosts);
        setHasMore(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedCourse, selectedTopic, limitCount]);

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!newPost.course) {
      toast.error('Please select a course.');
      return;
    }

    try {
      await ForumService.createPost({
        ...newPost,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous'
      });
      setIsCreateModalOpen(false);
      setNewPost({ title: '', content: '', course: '', topic: SUB_CATEGORIES[0] });
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post. Please try again.');
    }
  };

  const handleUpvote = (postId: string, upvotes: string[]) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to upvote.');
      return;
    }
    const isUpvoted = upvotes.includes(auth.currentUser.uid);
    ForumService.toggleUpvote(postId, auth.currentUser.uid, isUpvoted);
  };

  const handleDownvote = (postId: string, downvotes: string[]) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to downvote.');
      return;
    }
    const isDownvoted = downvotes.includes(auth.currentUser.uid);
    ForumService.toggleDownvote(postId, auth.currentUser.uid, isDownvoted);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24">
      <Helmet>
        <title>DU Student Forum - Ask Questions & Discuss | MyCollegeGenie</title>
        <meta name="description" content="Join Delhi University students in discussions about exams, courses, college events and campus life. Ask questions and get answers from real DU students." />
        <meta name="keywords" content="Delhi University forum, DU student community, DU discussion, Delhi University help" />
        <link rel="canonical" href="https://mycollegegenie.in/forum" />
      </Helmet>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
        <div className="text-center md:text-left">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-2 flex items-center justify-center md:justify-start gap-3">
            <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-purple-600" />
            Discussion <span className="text-purple-600">Forums</span>
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-sm uppercase tracking-widest px-4 sm:px-0">Connect, share, and learn with fellow DU students.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all w-full md:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Start Discussion
        </motion.button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-4 sm:p-6 shadow-xl shadow-purple-900/5 mb-8 sm:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="sm:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-purple-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all outline-none font-medium text-xs sm:text-base"
            />
          </div>
          <div className="relative group">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-purple-600 transition-colors" />
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all outline-none font-bold appearance-none text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer"
            >
              <option value="All">All Courses</option>
              {DU_COURSES.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-purple-600 transition-colors" />
            <select 
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all outline-none font-bold appearance-none text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer"
            >
              <option value="All">All Topics</option>
              {SUB_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-bold">Loading discussions...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id}
              className="bg-white border border-gray-100 rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-sm hover:shadow-xl hover:border-purple-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-50 text-purple-600 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {post.course}
                    </span>
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-50 text-gray-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {post.topic}
                    </span>
                  </div>
                  <Link to={`/forum/${post.id}`}>
                    <h3 className="text-base sm:text-2xl font-black text-gray-900 mb-1 sm:mb-3 group-hover:text-purple-600 transition-colors leading-tight truncate sm:whitespace-normal">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-xs sm:text-base text-gray-500 line-clamp-1 sm:line-clamp-2 mb-3 sm:mb-6 font-medium leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[9px] sm:text-sm text-gray-400 font-bold">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <div className="w-5 h-5 sm:w-8 sm:h-8 shrink-0 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <User className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="truncate max-w-[100px] sm:max-w-xs">{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <Clock className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 sm:gap-4 md:border-l md:border-gray-50 md:pl-8 min-w-0 sm:min-w-[140px] pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                  <div className="flex md:flex-col gap-2 w-full max-w-[180px] md:max-w-none">
                    <button 
                      onClick={() => handleUpvote(post.id, post.upvotes)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-black transition-all ${
                        auth.currentUser && post.upvotes.includes(auth.currentUser.uid)
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-lg">{post.upvotes.length}</span>
                    </button>
                    <button 
                      onClick={() => handleDownvote(post.id, post.downvotes)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl font-black transition-all ${
                        auth.currentUser && post.downvotes.includes(auth.currentUser.uid)
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-lg">{post.downvotes.length}</span>
                    </button>
                  </div>
                  <Link 
                    to={`/forum/${post.id}`}
                    className="flex-none md:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl sm:rounded-2xl font-bold transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-base">{post.commentCount}</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200"
          >
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-8 rotate-3">
              <MessageSquare className="w-12 h-12 text-purple-200" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4">No discussions found</h3>
            <p className="text-gray-500 max-w-md mx-auto text-lg font-medium px-6">
              We couldn't find any discussions matching your search. Why not start a new one?
            </p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-8 bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-purple-600/20 hover:scale-105 transition-transform"
            >
              Start First Discussion
            </button>
          </motion.div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && filteredPosts.length > 0 && (
          <div className="flex justify-center pt-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLimitCount(prev => prev + 10)}
              className="bg-white border border-gray-200 text-gray-600 px-10 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md hover:border-purple-200 hover:text-purple-600 transition-all flex items-center gap-3"
            >
              <RefreshCw className="w-5 h-5" />
              Load More Discussions
            </motion.button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Start a Discussion</h2>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="p-6 space-y-6">
                {!auth.currentUser ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to start a discussion. Join the community to ask questions and share insights.
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
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Title</label>
                      <input 
                        required
                        type="text"
                        placeholder="What's on your mind?"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all outline-none font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Course</label>
                        <select 
                          required
                          value={newPost.course}
                          onChange={(e) => setNewPost({...newPost, course: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all outline-none font-medium cursor-pointer"
                        >
                          <option value="" disabled>Select Course</option>
                          {DU_COURSES.map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Topic</label>
                        <select 
                          value={newPost.topic}
                          onChange={(e) => setNewPost({...newPost, topic: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all outline-none font-medium cursor-pointer"
                        >
                          {SUB_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Content</label>
                      <textarea 
                        required
                        rows={5}
                        placeholder="Describe your question or insight in detail..."
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all outline-none font-medium resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20"
                    >
                      Post Discussion
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
