import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Search, Filter, GraduationCap, FileText, RefreshCw, Plus, ArrowUpDown, ChevronRight, Share2, Star, Clock, ExternalLink, LayoutGrid, List, PlayCircle, Bookmark } from 'lucide-react';
import { Resource } from '../types';

interface PlaylistPageProps {
  resources: Resource[];
  savedResourceIds: string[];
  onSave: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedSemester: string;
  setSelectedSemester: (sem: string) => void;
  sortBy: 'Title' | 'Date' | 'Rating' | 'Course';
  setSortBy: (sort: 'Title' | 'Date' | 'Rating' | 'Course') => void;
  visibleCount: number;
  setVisibleCount: (count: number | ((prev: number) => number)) => void;
  setSelectedResource: (resource: Resource) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  handleShare: (resource: Resource) => void;
  courses: string[];
  semesters: string[];
  getAverageRating: (ratings?: number[]) => number;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({
  resources,
  savedResourceIds,
  onSave,
  searchQuery,
  setSearchQuery,
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
  sortBy,
  setSortBy,
  visibleCount,
  setVisibleCount,
  setSelectedResource,
  setIsUploadModalOpen,
  handleShare,
  courses,
  semesters,
  getAverageRating
}) => {
  const filteredPlaylists = useMemo(() => {
    const filtered = resources.filter(resource => {
      if (resource.type !== 'Playlist') return false;
      
      const matchesQuery = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCourse = selectedCourse === 'All Courses' || resource.course === selectedCourse;
      const matchesSemester = selectedSemester === 'All Semesters' || resource.semester.toString() === selectedSemester;
      
      return matchesQuery && matchesCourse && matchesSemester;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      if (sortBy === 'Course') return a.course.localeCompare(b.course);
      if (sortBy === 'Date') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      if (sortBy === 'Rating') return getAverageRating(b.ratings) - getAverageRating(a.ratings);
      return 0;
    });
  }, [searchQuery, selectedCourse, selectedSemester, resources, sortBy, getAverageRating]);

  return (
    <div className="min-h-screen bg-transparent pt-8 sm:pt-12 pb-24">
      <Helmet>
        <title>DU Course YouTube Playlists & Video Lectures | MyCollegeGenie</title>
        <meta name="description" content="Curated YouTube playlists for all Delhi University courses. Study smarter with hand-picked video lectures for BA, BCom, BSc and more DU programmes." />
        <meta name="keywords" content="DU YouTube lectures, Delhi University video lectures, DU course playlist, Delhi University online study" />
        <link rel="canonical" href="https://mycollegegenie.in/playlists" />
      </Helmet>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Youtube className="w-7 h-7 sm:w-10 sm:h-10 text-rose-600" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 tracking-tight">Curated <span className="text-rose-600">Playlists</span></h1>
              <p className="text-base sm:text-lg text-gray-500 font-medium mt-2 max-w-2xl px-4 sm:px-0">Hand-picked YouTube playlists for comprehensive learning across various DU courses.</p>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 sm:p-8 shadow-2xl shadow-rose-900/5 mb-10 sm:mb-16">
          <div className="relative group mb-6 sm:mb-10">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-rose-600 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 sm:pl-16 pr-10 sm:pr-12 py-3.5 sm:py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm sm:text-lg placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium"
              placeholder="Search playlists by topic or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="group">
              <div className="flex items-center gap-2 text-gray-500 mb-2 px-1">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Course</span>
              </div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer font-bold"
              >
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div className="group">
              <div className="flex items-center gap-2 text-gray-500 mb-2 px-1">
                <FileText className="w-3.5 h-3.5 sm:w-4 h-4 group-focus-within:text-rose-600 transition-colors" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Semester</span>
              </div>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer font-bold"
              >
                {semesters.map(sem => (
                  <option key={sem} value={sem}>
                    {sem === 'All Semesters' ? sem : `Semester ${sem}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCourse('All Courses');
                  setSelectedSemester('All Semesters');
                  setSortBy('Date');
                }}
                className="w-full px-4 py-3.5 sm:py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 h-4" />
                Reset Filters
              </motion.button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-6">
          <div className="flex-1">
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-baseline gap-2">
              Featured Playlists
              <span className="text-xs sm:text-sm font-medium text-gray-400">({filteredPlaylists.length} found)</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:flex-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Date">Newest First</option>
              <option value="Title">Title (A-Z)</option>
              <option value="Course">Course (A-Z)</option>
              <option value="Rating">Highest Rated</option>
            </select>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="flex-1 sm:flex-none bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add Playlist
            </motion.button>
          </div>
        </div>

        {/* Grid of Playlists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredPlaylists.slice(0, visibleCount).map((playlist) => (
              <motion.div
                layout
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden transition-all group cursor-pointer shadow-sm hover:shadow-2xl"
                onClick={() => setSelectedResource(playlist)}
              >
                <div className="aspect-video bg-gray-50 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-purple-500/5 group-hover:opacity-100 transition-opacity" />
                  <Youtube className="w-12 h-12 sm:w-16 sm:h-16 text-rose-600/20 group-hover:text-rose-600 transition-all group-hover:scale-110" />
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[9px] sm:text-xs font-black text-white flex items-center gap-1.5 sm:gap-2 uppercase tracking-widest">
                    <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    PLAYLIST
                  </div>
                </div>
                
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap justify-between items-start mb-3 sm:mb-4 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSave(playlist.id); }}
                        className={`p-1.5 hover:bg-gray-50 rounded-lg transition-colors ${savedResourceIds.includes(playlist.id) ? 'text-rose-600' : 'text-gray-400'}`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${savedResourceIds.includes(playlist.id) ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-[10px] sm:text-xs font-black px-2 py-1 rounded-lg bg-rose-50 text-rose-600 uppercase tracking-widest">Sem {playlist.semester}</span>
                      <div className="flex items-center gap-1 py-1" title={`${getAverageRating(playlist.ratings).toFixed(1)} out of 5`}>
                        {(() => {
                          const rating = getAverageRating(playlist.ratings);
                          return (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= Math.round(rating)
                                      ? 'text-orange-500 fill-current'
                                      : 'text-orange-200'
                                  }`}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShare(playlist); }}
                      className="p-1.5 sm:p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-rose-600 transition-colors mb-2 line-clamp-1 tracking-tight">{playlist.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed font-medium">{playlist.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {playlist.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 font-black text-[10px] sm:text-xs uppercase tracking-widest">
                      Watch Now <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredPlaylists.length > visibleCount && (
          <div className="mt-16 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            >
              Load More Playlists
            </motion.button>
          </div>
        )}

        {filteredPlaylists.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Youtube className="w-12 h-12 text-rose-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">No playlists found</h3>
            <p className="text-gray-500 max-w-md mx-auto text-lg">
              We couldn't find any playlists matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
