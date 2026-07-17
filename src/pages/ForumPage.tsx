import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Filter, MessageSquare, Clock, Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { SupabaseAuthUser, ForumPost } from '../types';
import { ForumService } from '../services/forumService';
import { ForumPostSkeleton } from '../components/ui/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import { toast } from 'sonner';

interface ForumPageProps {
  user: SupabaseAuthUser | null;
}

interface Guild {
  id: string;
  name: string;
  description: string;
  tag: string;
  gradient: string;
  textColor: string;
  bgColor: string;
}

const DEFAULT_GUILDS: Guild[] = [
  {
    id: 'GossipGenie',
    name: 'Gossip Nest',
    description: 'Secrets, DU confessions, anonymous campus gossip, and lighthearted chit-chat.',
    tag: 'g/GossipNest',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
    textColor: '#ffffff',
    bgColor: '#7C3AED'
  },
  {
    id: 'ScholarSphere',
    name: 'Scholar Spot',
    description: 'Academic resources, exam discussions, study tips, notes, and syllabus walkthroughs.',
    tag: 'g/ScholarSpot',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
    textColor: '#ffffff',
    bgColor: '#0D9488'
  },
  {
    id: 'CareerCrucible',
    name: 'Career Hub',
    description: 'Internship alerts, placement preparation resources, resume feedback, and career guides.',
    tag: 'g/CareerHub',
    gradient: 'linear-gradient(135deg, #475569 0%, #312E81 100%)',
    textColor: '#ffffff',
    bgColor: '#475569'
  },
  {
    id: 'FestFrenzy',
    name: 'Fest Arena',
    description: 'Delhi University college fests, star lineup announcements, ticket drops, and society trials.',
    tag: 'g/FestArena',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #E11D48 100%)',
    textColor: '#ffffff',
    bgColor: '#F59E0B'
  },
  {
    id: 'CodeCave',
    name: 'Code Cave',
    description: 'Hackathons, open-source projects, coding bugs, stack recommendations, and collaboration.',
    tag: 'g/CodeCave',
    gradient: 'linear-gradient(135deg, #10B981 0%, #0891B2 100%)',
    textColor: '#ffffff',
    bgColor: '#10B981'
  }
];

export const ForumPage: React.FC<ForumPageProps> = ({ user }) => {
  const { openAuthModal } = useAuth();
  const [guilds, setGuilds] = useState<Guild[]>(DEFAULT_GUILDS);
  const [activeTab, setActiveTab] = useState('Hot');
  const [activeChip, setActiveChip] = useState('All courses');
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Guild Creation State
  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [isCreatingGuild, setIsCreatingGuild] = useState(false);

  const fetchGuilds = async () => {
    try {
      const data = await ForumService.getGuilds();
      if (Array.isArray(data) && data.length > 0) {
        // Map backend snake_case to frontend camelCase
        const mapped = data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          tag: g.tag,
          gradient: g.gradient,
          textColor: g.text_color || '#ffffff',
          bgColor: g.bg_color || '#7C3AED'
        }));
        setGuilds(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch guilds from backend:', err);
    }
  };

  useEffect(() => {
    fetchGuilds();
  }, []);

  // Create Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCourse, setPostCourse] = useState('All');
  const [postTopic, setPostTopic] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { debouncedSearch } = useFilters();

  const displayPosts = React.useMemo(() => {
    let list = posts;
    if (activeTab === 'Unanswered') {
      list = list.filter(p => (p.commentCount || 0) === 0);
    }
    const q = debouncedSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(p => 
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (p.course || '').toLowerCase().includes(q) ||
        (p.authorName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, activeTab, debouncedSearch]);

  const fetchPosts = () => {
    setIsLoading(true);
    let sort: 'hot' | 'new' | 'top' = 'new';
    if (activeTab === 'Hot') sort = 'hot';
    if (activeTab === 'Top') sort = 'top';

    const queryCourse = activeChip === 'All courses' ? 'All' : activeChip;
    const queryTopic = selectedGuildId || 'All';
    
    ForumService.getPosts(queryCourse, queryTopic, 30, (fetchedPosts) => {
      setPosts(fetchedPosts);
      setIsLoading(false);
    }, sort);
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, activeChip, selectedGuildId]);

  const activeGuild = guilds.find(g => g.id === selectedGuildId);

  const handleOpenCreateModal = () => {
    if (!user) {
      openAuthModal('Please sign in to publish a post in the Guilds!');
      return;
    }
    setPostTitle('');
    setPostContent('');
    setPostCourse('All');
    setPostTopic(selectedGuildId || 'General');
    setIsModalOpen(true);
  };

  const handleCreatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('Please fill in both title and content.');
      return;
    }
    setIsSubmitting(true);
    try {
      await ForumService.createPost({
        title: postTitle,
        content: postContent,
        course: postCourse === 'All' ? '' : postCourse,
        topic: postTopic,
        authorId: user?.id || '',
        authorName: user?.email ? user.email.split('@')[0] : 'Anonymous'
      });
      toast.success('Your thread has been published successfully! 🚀');
      setIsModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create thread. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateGuildModal = () => {
    if (!user) {
      openAuthModal('Please sign in to create a community guild!');
      return;
    }
    setNewGuildName('');
    setNewGuildDesc('');
    setIsGuildModalOpen(true);
  };

  const handleCreateGuildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim() || !newGuildDesc.trim()) {
      toast.error('Please enter community name and description.');
      return;
    }
    setIsCreatingGuild(true);
    try {
      await ForumService.createGuild(newGuildName, newGuildDesc);
      toast.success('Community guild created successfully! 🎉');
      setIsGuildModalOpen(false);
      setNewGuildName('');
      setNewGuildDesc('');
      await fetchGuilds();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create community guild.');
    } finally {
      setIsCreatingGuild(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>My College Genie — Forum Guilds</title>
      </Helmet>

      <div className="w-full px-4 pt-0 pb-12 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar: Guilds Navigation */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <div className="font-['Fraunces'] font-bold text-lg text-[var(--brand)] px-2 mb-1 flex items-center justify-between">
            <span>Guilds</span>
            <button 
              onClick={handleOpenCreateGuildModal}
              className="text-xs bg-[var(--brand)] text-white hover:bg-[var(--brand-ink)] px-2.5 py-1 rounded-md flex items-center gap-1 font-sans transition-all font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-[var(--paper)] shadow-sm font-sans">
            <button
              onClick={() => setSelectedGuildId(null)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition-all ${!selectedGuildId ? 'bg-[var(--paper)] text-[var(--brand)] font-bold' : 'text-[var(--ink-faint)] hover:bg-[var(--paper)]/50 hover:text-[var(--ink)]'}`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>All Guilds</span>
            </button>
            
            <div className="h-[1px] bg-gray-100 my-1" />
            
            {guilds.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGuildId(g.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition-all ${selectedGuildId === g.id ? 'bg-[var(--paper)] text-[var(--brand)] font-bold' : 'text-[var(--ink-faint)] hover:bg-[var(--paper)]/50 hover:text-[var(--ink)]'}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.bgColor }} />
                <span className="flex-1 truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right Feed */}
        <div className="flex-1 min-w-0">
          
          {/* Dynamic Guild Header Banner */}
          {activeGuild ? (
            <div 
              style={{ background: activeGuild.gradient }}
              className="rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden"
            >
              <div className="relative z-10">
                <h1 className="font-['Fraunces'] font-bold text-2xl mb-1">
                  {activeGuild.name}
                </h1>
                <p className="text-white/90 text-sm font-medium leading-relaxed max-w-2xl mb-4">
                  {activeGuild.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-white/25 px-2.5 py-1 rounded-md">
                    {activeGuild.tag}
                  </span>
                </div>
              </div>
              {/* Abstract decorative circles for background premium feel */}
              <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute left-[30%] top-[-20px] w-32 h-32 bg-white/5 rounded-full blur-lg pointer-events-none" />
            </div>
          ) : (
            <div className="bg-[var(--brand)] rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="font-['Fraunces'] font-bold text-2xl mb-1">
                  Genie Guilds
                </h1>
                <p className="text-white/95 text-sm font-medium leading-relaxed max-w-2xl">
                  Welcome to the college discussion commons. Explore specialized guilds for gossip, resources, placement preparation, and DU campus lifestyle.
                </p>
              </div>
              <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
            </div>
          )}

          {/* Navigation tabs & course chips */}
          <div className="tabs">
            {['Hot', 'New', 'Top', 'Unanswered'].map(tab => (
              <div 
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="chiprow mt-2">
            {['All courses', 'B.A. Economics', 'B.A. English', 'B.A. Hindi', 'B.A. Geography'].map(chip => (
              <div 
                key={chip}
                className={`chip ${activeChip === chip ? 'active' : ''}`}
                onClick={() => setActiveChip(chip)}
              >
                {chip}
              </div>
            ))}
            <div className="chip cursor-not-allowed opacity-50 ml-auto">
              <Filter className="w-[13px] h-[13px]" />
              Topic
            </div>
          </div>

          {/* Post Feed List */}
          <div className="mt-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="mb-4"><ForumPostSkeleton /></div>)
            ) : displayPosts.length === 0 ? (
              <div className="text-center text-[var(--ink-soft)] py-12 bg-white border border-[var(--paper)] rounded-2xl">
                <p className="text-base font-semibold">No discussions in this Guild yet.</p>
                <p className="text-xs text-gray-400 mt-1">Check back later or click Ask above to start a discussion!</p>
              </div>
            ) : (
              displayPosts.map(q => {
                const score = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
                const authorInitials = q.authorName?.substring(0, 2).toUpperCase() || 'AN';
                const timeString = new Date(q.createdAt).toLocaleDateString();
                
                // Find matching guild for styling
                const postGuild = guilds.find(g => g.id === q.topic);
                
                return (
                  <Link to={`/forum/${q.id}`} key={q.id} className="qcard block hover:border-[var(--brand)] transition-colors !flex border border-[var(--paper)] rounded-xl bg-white shadow-sm p-4 mb-3">
                    <div className="vote flex flex-col items-center justify-center bg-gray-50/50 px-2 rounded-lg border border-gray-100/50">
                      <span className="n font-bold text-gray-700 text-sm">{score}</span>
                    </div>
                    <div className="qcard-body pl-4">
                      <div className="qcard-top flex items-center gap-2 mb-2 flex-wrap">
                        {postGuild && (
                          <span 
                            style={{ backgroundColor: `${postGuild.bgColor}15`, color: postGuild.bgColor }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-current font-mono"
                          >
                            g/{postGuild.name.replace(/\s+/g, '')}
                          </span>
                        )}
                        {q.course && (
                          <span className="subj-tag !bg-[var(--paper)] !text-[var(--brand)] text-[10.5px]">
                            {q.course}
                          </span>
                        )}
                        <span className={`stamp text-[10px] px-1.5 py-0.5 rounded ${q.commentCount > 0 ? 'solved text-emerald-700 bg-emerald-50' : 'open text-gray-500 bg-gray-50'}`}>
                          {q.commentCount > 0 ? `${q.commentCount} replies` : 'No replies yet'}
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-bold hover:text-[var(--brand)] transition-colors text-base mb-1.5">{q.title}</h3>
                      <p className="snippet text-gray-500 text-sm line-clamp-2 leading-relaxed mb-3">{q.content}</p>
                      
                      <div className="qcard-meta flex items-center gap-4 text-xs text-gray-400 font-sans">
                        <span className="item">
                          <span className="avatar w-5 h-5 bg-[var(--paper)] text-[var(--brand)] font-bold text-[9px] rounded-full flex items-center justify-center mr-1">
                            {authorInitials}
                          </span> 
                          {q.authorName || 'Anonymous'}
                        </span>
                        <span className="item">
                          <MessageSquare className="w-3.5 h-3.5" /> 
                          {q.commentCount || 0} reply{(q.commentCount || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="item">
                          <Clock className="w-3.5 h-3.5" /> 
                          {timeString}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Guild Modal */}
      {createPortal(
        <AnimatePresence>
          {isGuildModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop overlay (completely transparent or light black tint with blur) */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGuildModalOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              />
              
              {/* Modal Box */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden border border-gray-100 flex flex-col"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-['Fraunces'] font-bold text-xl text-[var(--brand)]">Create a Community</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-sans">Start a new discussion guild for your campus</p>
                  </div>
                  <button 
                    onClick={() => setIsGuildModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateGuildSubmit} className="p-6 flex flex-col gap-4 font-sans">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Community Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. DU Foodies, Dyal Singh Confessions"
                      value={newGuildName}
                      onChange={e => setNewGuildName(e.target.value)}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="What is this community about? Keep it short and catchy..."
                      value={newGuildDesc}
                      onChange={e => setNewGuildDesc(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--brand)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingGuild}
                    className="w-full bg-[var(--brand)] hover:bg-[var(--brand-ink)] text-white py-3 rounded-xl font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isCreatingGuild ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Community</span>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
