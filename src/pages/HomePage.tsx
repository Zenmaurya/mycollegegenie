import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { GraduationCap, FileText, PlayCircle, Search, Youtube, Newspaper, ExternalLink, ChevronRight, BookOpen, Users, Globe, Award, Clock, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import { Resource, NewsItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ResourceCard } from '../components/ResourceCard';
import { WavePath } from '../components/WavePath';
import Marquee from '../components/ui/demo';
import { TestimonialModal } from '../components/TestimonialModal';
import { useEffect, useState } from 'react';

interface HomePageProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: any) => void;
  sortBy: 'Title' | 'Date' | 'Rating' | 'Course';
  setSortBy: (sort: 'Title' | 'Date' | 'Rating' | 'Course') => void;
  DU_COURSES: string[];
  isNewsLoading: boolean;
  newsItems: NewsItem[];
  resources: Resource[];
  savedResourceIds: string[];
  onSave: (id: string) => void;
  getAverageRating: (ratings?: number[]) => number;
  setSelectedResource: (resource: Resource) => void;
  handleShare: (resource: Resource) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  sortBy,
  setSortBy,
  DU_COURSES,
  isNewsLoading,
  newsItems,
  resources,
  savedResourceIds,
  onSave,
  getAverageRating,
  setSelectedResource,
  handleShare
}) => {
  const navigate = useNavigate();
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  
  const getFeatureColors = (color: string) => {
    switch (color) {
      case 'purple': return { bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'pink': return { bg: 'bg-pink-50', text: 'text-pink-600' };
      case 'orange': return { bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600' };
    }
  };

  return (
    <div className="overflow-x-hidden">
      <Helmet>
        <title>MyCollegeGenie - DU Notes, PYQs & Study Resources | Delhi University</title>
        <meta name="description" content="Access DU notes, previous year questions, YouTube playlists and college events for Delhi University students. Free study material for all DU courses." />
        <meta name="keywords" content="DU notes, Delhi University study material, DU PYQ, Delhi University previous year questions" />
        <link rel="canonical" href="https://mycollegegenie.in/" />
      </Helmet>
      {/* Hero Section */}
      <main className="relative min-h-[75vh] flex items-center pt-8 sm:pt-12 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 bg-transparent overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-[10%] text-indigo-600 hidden sm:block"
          >
            <Sparkles className="w-64 h-64" />
          </motion.div>
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-20 left-[5%] text-pink-600 hidden sm:block"
          >
            <FileText className="w-48 h-48" />
          </motion.div>
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600 hidden sm:block"
          >
            <PlayCircle className="w-[800px] h-[800px]" />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-3xl text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-purple-100 px-4 py-2 rounded-2xl mb-6 sm:mb-8 shadow-sm mx-auto lg:mx-0"
            >
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-widest">Student-Led Initiative</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 leading-[1.1] sm:leading-[0.9] tracking-tighter text-gray-900"
            >
              Ace Your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">DU Exams</span> <br className="hidden sm:block" />
              With Ease.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-gray-500 max-w-xl mb-8 sm:mb-12 leading-relaxed font-medium mx-auto lg:mx-0 px-2 sm:px-0"
            >
              Access thousands of Previous Year Questions, comprehensive notes, and curated YouTube playlists. Everything you need in one place.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link 
                to="/browse"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Search className="w-5 h-5" />
                Browse Resources
              </Link>
              <Link to="/playlists" className="bg-white text-gray-900 border border-gray-100 px-10 py-5 rounded-3xl font-black text-lg hover:bg-gray-50 hover:scale-105 transition-all shadow-xl shadow-gray-900/5 flex items-center justify-center gap-3">
                <Youtube className="w-5 h-5 text-rose-600" />
                Watch Playlists
              </Link>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-16 flex flex-col sm:flex-row items-center gap-8 border-t border-gray-100 pt-8 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="DU Student Profile Photo" referrerPolicy="no-referrer" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                  +10k
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Joined by 10,000+ Students</p>
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 bg-white border border-gray-100 p-8 rounded-[3rem] shadow-2xl shadow-purple-900/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-purple-50 p-6 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">Notes</h3>
                    <p className="text-xs text-gray-500 font-medium">Handwritten & typed notes from toppers.</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">Books</h3>
                    <p className="text-xs text-gray-500 font-medium">Standard textbooks & reference guides.</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-pink-50 p-6 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">PYQs</h3>
                    <p className="text-xs text-gray-500 font-medium">Last 10 years solved question papers.</p>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-[2rem] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">Playlists</h3>
                    <p className="text-xs text-gray-500 font-medium">Curated video lectures for every topic.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-30 animate-pulse" />
          </motion.div>
        </div>
      </main>

      {/* Latest from DU Section */}
      <div className="mb-4 sm:mb-6 w-full relative z-50 hidden sm:block">
        <WavePath className="text-black" />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pt-8 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Latest from DU</h2>
              <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest">Stay updated with campus life</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link 
              to="/news"
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] sm:text-xs font-bold text-purple-600 hover:bg-purple-50 transition-all uppercase tracking-widest text-center"
            >
              News
            </Link>
            <Link 
              to="/events"
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] sm:text-xs font-bold text-pink-600 hover:bg-pink-50 transition-all uppercase tracking-widest text-center"
            >
              Events
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* News Column */}
          <div className="space-y-4">
            {isNewsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 animate-pulse h-32" />
              ))
            ) : newsItems.filter(n => n.category === 'News').length > 0 ? (
              newsItems.filter(n => n.category === 'News').slice(0, 3).map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 10 }}
                  className="bg-white border border-gray-100 rounded-[2rem] p-6 transition-all cursor-pointer flex items-start gap-6 shadow-sm hover:shadow-xl hover:shadow-purple-600/5 group"
                  onClick={() => navigate(`/news?news=${encodeURIComponent(item.title)}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">News</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium">
                      {item.summary}
                    </p>
                    {item.college && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-purple-600">
                        <GraduationCap className="w-3 h-3" />
                        {item.college}
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No news available at the moment.</p>
              </div>
            )}
          </div>

          {/* Events Column */}
          <div className="space-y-4">
            {isNewsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 animate-pulse h-32" />
              ))
            ) : newsItems.filter(n => n.category === 'Event').length > 0 ? (
              newsItems.filter(n => n.category === 'Event').slice(0, 3).map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 10 }}
                  className="bg-white border border-gray-100 rounded-[2rem] p-6 transition-all cursor-pointer flex items-start gap-6 shadow-sm hover:shadow-xl hover:shadow-pink-600/5 group"
                  onClick={() => navigate(`/events?event=${encodeURIComponent(item.title)}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Event</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium">
                      {item.summary}
                    </p>
                    {item.college && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-pink-600">
                        <GraduationCap className="w-3 h-3" />
                        {item.college}
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-pink-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No events scheduled currently.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Resources Section */}
      <section id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-white/40 backdrop-blur-md rounded-[2.5rem] sm:rounded-[4rem] mb-16 sm:mb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 px-2 sm:px-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] sm:rounded-[1.5rem] bg-orange-100 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Top Resources</h2>
              <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest">Handpicked for your success</p>
            </div>
          </div>
          <Link 
            to="/browse"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] sm:text-xs font-bold text-purple-600 hover:bg-purple-50 transition-all uppercase tracking-widest shadow-sm w-full sm:w-auto"
          >
            Explore All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-2 sm:px-8">
          {resources.filter(r => r.isApproved !== false).slice(0, 4).map((resource) => (
            <ResourceCard 
              key={resource.id}
              resource={resource}
              onClick={setSelectedResource}
              onShare={handleShare}
              onSave={onSave}
              isSaved={savedResourceIds.includes(resource.id)}
              getAverageRating={getAverageRating}
            />
          ))}
        </div>
      </section>

      {/* Discussion Forum Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center bg-purple-900 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-12 lg:p-24 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center lg:text-left">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/30 flex items-center justify-center mb-6 sm:mb-8 backdrop-blur-xl border border-purple-400/30 mx-auto lg:mx-0">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 tracking-tight leading-tight">
              Join the DU <br className="hidden sm:block" />
              <span className="text-purple-300">Student Community</span>
            </h2>
            <p className="text-base sm:text-lg text-purple-100/80 mb-8 sm:mb-10 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 px-2 sm:px-0">
              Connect with fellow students, ask questions about courses, discuss exam strategies, and share your academic journey.
            </p>
            <Link 
              to="/forum"
              className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-purple-900 rounded-2xl font-black text-base sm:text-lg hover:bg-purple-50 transition-all shadow-2xl shadow-black/20 group w-full sm:w-auto"
            >
              Go to Forum
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative z-10 grid gap-6">
            {[
              { title: 'How to prepare for Microeconomics?', author: 'Rahul S.', replies: 12, time: '2h ago' },
              { title: 'Best books for Corporate Accounting?', author: 'Priya M.', replies: 8, time: '5h ago' },
              { title: 'Internal Assessment dates for Hansraj?', author: 'Amit K.', replies: 15, time: '1d ago' }
            ].map((post, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 10 }}
                className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl hover:bg-white/20 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-1">{post.title}</h3>
                </div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-purple-200/60">
                  <div className="flex items-center gap-4">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.replies} replies
                    </span>
                  </div>
                  <span>{post.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mb-16 sm:mb-24">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight">Why Students Love Us</h2>
          <p className="text-base sm:text-lg text-gray-500 font-medium px-2 sm:px-0">We're building the most comprehensive resource platform for Delhi University students.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            { icon: Users, title: 'Community Driven', desc: 'Resources uploaded and verified by students from top colleges.', color: 'purple' },
            { icon: Globe, title: 'Always Accessible', desc: 'Access your notes and PYQs anytime, anywhere, on any device.', color: 'pink' },
            { icon: Award, title: 'Quality Content', desc: 'Only the best, high-quality resources make it to our platform.', color: 'orange' },
          ].map((feature, i) => {
            const colors = getFeatureColors(feature.color);
            return (
              <div key={i} className="bg-white border border-gray-100 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-xl shadow-gray-900/5 hover:shadow-2xl transition-all group">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] ${colors.bg} flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.text}`} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 sm:mt-24">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">What students are saying</h3>
            <button 
              onClick={() => setIsTestimonialModalOpen(true)}
              className="mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
            >
              Share your experience
            </button>
          </div>
          <Marquee />
        </div>
      </section>

      <TestimonialModal 
        isOpen={isTestimonialModalOpen} 
        onClose={() => setIsTestimonialModalOpen(false)} 
      />

      {/* Quick Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32">
        <div className="bg-gray-900 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-16 grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
          
          {[
            { label: 'Resources', value: '10k+' },
            { label: 'Active Users', value: '25k+' },
            { label: 'Colleges', value: '70+' },
            { label: 'PYQs', value: '5k+' },
          ].map((stat, i) => (
            <div key={i} className="text-center relative z-10">
              <div className="text-xl sm:text-4xl lg:text-5xl font-black text-white mb-1 sm:mb-3 tracking-tighter">{stat.value}</div>
              <div className="text-[7px] sm:text-[10px] text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.3em] font-black">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
