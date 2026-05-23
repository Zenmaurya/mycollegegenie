import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import {
  Youtube, Search, GraduationCap, RefreshCw, Plus, ChevronRight,
  Share2, Star, PlayCircle, Bookmark, SlidersHorizontal, X,
  ChevronDown, ArrowUpDown, Clock, BookOpen
} from 'lucide-react';
import { Resource } from '../types';

/** Extract a YouTube thumbnail URL from any YouTube link.
 *  YouTube thumbnail CDN only works with video IDs, so we prefer ?v= over list= */
function getYoutubeThumbnail(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Prefer video ID (?v=...) — works reliably with YouTube's image CDN
    const videoId = u.searchParams.get('v');
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    // youtu.be short links: youtu.be/<videoId>
    if (u.hostname === 'youtu.be') {
      const vid = u.pathname.replace(/^\//, '');
      if (vid) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    }
    // embed URLs: /embed/<videoId>
    const embedMatch = u.pathname.match(/\/embed\/([^/?#]+)/);
    if (embedMatch) {
      return `https://i.ytimg.com/vi/${embedMatch[1]}/hqdefault.jpg`;
    }
  } catch {
    // malformed URL — try regex fallback
    const regExp = /(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(regExp);
    if (match && match[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
    }
  }
  return null;
}

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
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = searchQuery ||
    selectedCourse !== 'All Courses' ||
    selectedSemester !== 'All Semesters' ||
    sortBy !== 'Date';

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCourse('All Courses');
    setSelectedSemester('All Semesters');
    setSortBy('Date');
  };

  const filteredPlaylists = useMemo(() => {
    const filtered = resources.filter(resource => {
      if (resource.type !== 'Playlist') return false;
      const matchesQuery =
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const sortLabels: Record<string, string> = {
    Date: 'Newest First',
    Title: 'Title (A–Z)',
    Course: 'Course (A–Z)',
    Rating: 'Top Rated',
  };

  return (
    <div className="min-h-screen bg-transparent pt-2 sm:pt-6 pb-24 md:pb-8">
      <Helmet>
        <title>College Course YouTube Playlists &amp; Video Lectures | MyCollegeGenie</title>
        <meta name="description" content="Curated YouTube playlists for college courses. Study smarter with hand-picked video lectures for all your university programmes." />
        <meta name="keywords" content="College YouTube lectures, University video lectures, course playlist, University online study" />
        <link rel="canonical" href="https://mycollegegenie.in/playlists" />
      </Helmet>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 shadow-sm">
              <Youtube className="w-5 h-5 sm:w-7 sm:h-7 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                Curated <span className="text-rose-600">Playlists</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 hidden sm:block">
                Hand-picked YouTube playlists for comprehensive learning
              </p>
            </div>
          </div>

          {/* Add Playlist — always visible */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="shrink-0 flex items-center justify-center gap-2 bg-rose-600 text-white px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Add Playlist
          </motion.button>
        </div>

        {/* ── Search + Filter Bar ── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 sm:mb-6 overflow-hidden">

          {/* Top Row: Search + Filter Toggle + Sort */}
          <div className="flex items-center gap-2 p-2 sm:p-3">

            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search playlists, topics, courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] sm:text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl border text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                showFilters || (selectedCourse !== 'All Courses' || selectedSemester !== 'All Semesters')
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedCourse !== 'All Courses' || selectedSemester !== 'All Semesters') && (
                <span className="w-4 h-4 rounded-full bg-white text-rose-600 text-[9px] font-black flex items-center justify-center leading-none">
                  {(selectedCourse !== 'All Courses' ? 1 : 0) + (selectedSemester !== 'All Semesters' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sort Selector */}
            <div className="relative hidden sm:block">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="pl-8 pr-8 py-2.5 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none cursor-pointer transition-all"
              >
                <option value="Date">Newest First</option>
                <option value="Title">Title (A–Z)</option>
                <option value="Course">Course (A–Z)</option>
                <option value="Rating">Top Rated</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Reset — only when active */}
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="p-2.5 sm:p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-gray-500 transition-all"
                title="Reset all filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expandable Filter Row */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 border-t border-gray-100">

                  {/* Course Filter */}
                  <div className="relative">
                    <GraduationCap className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      className="w-full pl-7 pr-7 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    >
                      {courses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Semester Filter */}
                  <div className="relative">
                    <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedSemester}
                      onChange={e => setSelectedSemester(e.target.value)}
                      className="w-full pl-7 pr-7 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    >
                      {semesters.map(s => (
                        <option key={s} value={s}>{s === 'All Semesters' ? s : `Semester ${s}`}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Mobile Sort */}
                  <div className="relative sm:hidden">
                    <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="w-full pl-7 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    >
                      <option value="Date">Newest First</option>
                      <option value="Title">Title (A–Z)</option>
                      <option value="Course">Course (A–Z)</option>
                      <option value="Rating">Top Rated</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Active Filter Chips ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {selectedCourse !== 'All Courses' && (
              <button
                onClick={() => setSelectedCourse('All Courses')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] sm:text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                {selectedCourse}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedSemester !== 'All Semesters' && (
              <button
                onClick={() => setSelectedSemester('All Semesters')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] sm:text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                Sem {selectedSemester}
                <X className="w-3 h-3" />
              </button>
            )}
            {sortBy !== 'Date' && (
              <button
                onClick={() => setSortBy('Date')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-[10px] sm:text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Sort: {sortLabels[sortBy]}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* ── Results Header ── */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 className="text-base sm:text-xl font-black text-gray-900 flex items-baseline gap-2">
            {searchQuery ? 'Search Results' : 'Featured Playlists'}
            <span className="text-xs font-medium text-gray-400">({filteredPlaylists.length})</span>
          </h2>
        </div>

        {/* ── Grid of Playlists ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          <AnimatePresence mode="popLayout">
            {filteredPlaylists.slice(0, visibleCount).map(playlist => (
              <motion.div
                layout
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:shadow-rose-900/5 transition-all group flex flex-col h-full"
                onClick={() => setSelectedResource(playlist)}
              >
                {/* ── Zone 1: Thumbnail (fixed aspect-ratio) ── */}
                {(() => {
                  const thumb = getYoutubeThumbnail(playlist.link);
                  return (
                    <div className="aspect-video bg-gradient-to-br from-rose-50 to-purple-50 relative flex items-center justify-center overflow-hidden shrink-0">
                      {thumb ? (
                        <>
                          <img
                            src={thumb}
                            alt={playlist.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                              <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-purple-500/5" />
                          <Youtube className="w-10 h-10 sm:w-14 sm:h-14 text-rose-400 group-hover:text-rose-600 transition-all group-hover:scale-110" />
                        </>
                      )}
                      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 bg-black/60 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black text-white flex items-center gap-1 sm:gap-1.5 uppercase tracking-wider">
                        <PlayCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Playlist
                      </div>
                      {(playlist.ratings?.length ?? 0) > 0 && (
                        <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-3 h-3 text-orange-500 fill-current" />
                          <span className="text-[10px] font-black text-gray-800">{getAverageRating(playlist.ratings).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Zone 2: Meta row (Sem + Course + Save + Share) ── */}
                <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-0 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-lg bg-rose-50 text-rose-600 uppercase tracking-widest shrink-0">
                      Sem {playlist.semester}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 truncate min-w-0">
                      {playlist.course}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); onSave(playlist.id); }}
                      className={`p-1.5 hover:bg-gray-50 rounded-lg transition-colors ${savedResourceIds.includes(playlist.id) ? 'text-rose-600' : 'text-gray-400'}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedResourceIds.includes(playlist.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleShare(playlist); }}
                      className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Zone 3: Title (2-line clamp, fixed min-height) ── */}
                <div className="px-4 sm:px-5 pt-2.5 pb-0 shrink-0">
                  <h3
                    className="text-sm sm:text-base font-black text-gray-900 group-hover:text-rose-600 transition-colors tracking-tight leading-snug"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6rem' }}
                  >
                    {playlist.title}
                  </h3>
                </div>

                {/* ── Zone 4: Description (2-line clamp, fixed min-height) ── */}
                <div className="px-4 sm:px-5 pt-2 pb-0 shrink-0">
                  <p
                    className="text-[10px] sm:text-xs text-gray-500 leading-relaxed font-medium"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4rem' }}
                  >
                    {playlist.description || 'No description provided.'}
                  </p>
                </div>

                {/* ── Spacer: pushes footer to bottom ── */}
                <div className="flex-grow" />

                {/* ── Zone 5: Footer (Tags + CTA) — always at bottom ── */}
                <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-4 mt-3 border-t border-gray-50 shrink-0">
                  <div className="flex gap-1.5 flex-wrap min-w-0">
                    {playlist.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-rose-600 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shrink-0">
                    Watch Now <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Load More ── */}
        {filteredPlaylists.length > visibleCount && (
          <div className="mt-10 sm:mt-16 text-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setVisibleCount(prev => prev + 6)}
              className="px-8 sm:px-12 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl font-bold text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            >
              Load More Playlists ({filteredPlaylists.length - visibleCount} remaining)
            </motion.button>
          </div>
        )}

        {/* ── Empty State ── */}
        {filteredPlaylists.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 sm:py-28"
          >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-rose-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-8 rotate-3">
              <Youtube className="w-8 h-8 sm:w-12 sm:h-12 text-rose-400" />
            </div>
            <h3 className="text-xl sm:text-3xl font-black text-gray-900 mb-3">No playlists found</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto font-medium mb-6">
              No playlists match your current filters. Try adjusting or resetting them.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </motion.div>
        )}

      </section>
    </div>
  );
};
