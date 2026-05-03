import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpDown, LayoutGrid, List, ChevronRight, BookOpen, FileText, PlayCircle, Star, Share2, Download, Clock, MapPin, RefreshCw, ChevronDown, ChevronUp, Plus, X, AlertCircle } from 'lucide-react';
import { Resource } from '../types';
import { ResourceCard } from '../components/ResourceCard';
import AnimatedGlowingSearchBar from '../components/ui/animated-glowing-search-bar';
import { Link, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';

interface BrowsePageProps {
  resources: Resource[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: 'All' | 'Note' | 'PYQ' | 'Playlist' | 'Book';
  setActiveFilter: (filter: 'All' | 'Note' | 'PYQ' | 'Playlist' | 'Book') => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedSemester: string;
  setSelectedSemester: (semester: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (category: string) => void;
  sortBy: 'Title' | 'Date' | 'Rating' | 'Course';
  setSortBy: (sort: 'Title' | 'Date' | 'Rating' | 'Course') => void;
  courses: string[];
  availableSemesters: string[];
  availableSubCategories: string[];
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  visibleCount: number;
  setVisibleCount: (count: number) => void;
  filteredResources: Resource[];
  savedResourceIds: string[];
  onSave: (id: string) => void;
  getAverageRating: (ratings?: number[]) => number;
  selectedResource?: Resource | null;
  setSelectedResource: (resource: Resource | null) => void;
  handleShare: (resource: Resource) => void;
  setIsUploadModalOpen: (open: boolean) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  resources,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
  selectedSubCategory,
  setSelectedSubCategory,
  sortBy,
  setSortBy,
  courses,
  availableSemesters,
  availableSubCategories,
  viewMode,
  setViewMode,
  visibleCount,
  setVisibleCount,
  filteredResources,
  savedResourceIds,
  onSave,
  getAverageRating,
  selectedResource,
  setSelectedResource,
  handleShare,
  setIsUploadModalOpen
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    course: '',
    semester: '',
    materialType: 'Notes',
    details: ''
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const resourceId = searchParams.get('resourceId');
    if (resourceId && !selectedResource && resources.length > 0) {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        setSelectedResource(resource);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, resources, setSelectedResource]);

  const handleOpenResource = (resource: Resource) => {
    setSelectedResource(resource);
    setTimeout(() => {
      setSearchParams({ resourceId: resource.id }, { replace: true });
    }, 10);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = searchQuery || activeFilter !== 'All' || selectedCourse !== 'All Courses' || selectedSemester !== 'All Semesters' || selectedSubCategory !== 'All';

  return (
    <div className="min-h-screen bg-transparent pt-8 sm:pt-12 pb-24">
      <Helmet>
        <title>{selectedResource ? `${selectedResource.title} | MyCollegeGenie` : 'Browse DU Study Resources - Notes, PYQs, Books | MyCollegeGenie'}</title>
        <meta name="description" content={selectedResource ? (selectedResource.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) || `Download ${selectedResource.title} for ${selectedResource.course}`) : "Browse and download free study material for Delhi University. Filter by course, semester and resource type. Notes, PYQs, books and more."} />
        <meta name="keywords" content="DU study material download, Delhi University notes, DU PYQ download, Delhi University books" />
        <link rel="canonical" href="https://mycollegegenie.in/browse" />
        
        {/* Open Graph / Social Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MyCollegeGenie" />
        <meta property="og:title" content={selectedResource ? selectedResource.title : 'Browse DU Study Resources - Notes, PYQs, Books | MyCollegeGenie'} />
        <meta property="og:description" content={selectedResource ? (selectedResource.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) || `Download ${selectedResource.title} for ${selectedResource.course}`) : "Browse and download free study material for Delhi University. Filter by course, semester and resource type. Notes, PYQs, books and more."} />
        <meta property="og:image" content={selectedResource ? `https://picsum.photos/seed/${selectedResource.title}/1200/630` : 'https://picsum.photos/seed/browse/1200/630'} />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={selectedResource ? selectedResource.title : 'Browse DU Study Resources - Notes, PYQs, Books | MyCollegeGenie'} />
        <meta name="twitter:description" content={selectedResource ? (selectedResource.description?.replace(/<[^>]*>?/gm, '').substring(0, 150) || `Download ${selectedResource.title} for ${selectedResource.course}`) : "Browse and download free study material for Delhi University. Filter by course, semester and resource type. Notes, PYQs, books and more."} />
        <meta name="twitter:image" content={selectedResource ? `https://picsum.photos/seed/${selectedResource.title}/1200/630` : 'https://picsum.photos/seed/browse/1200/630'} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2 sm:mb-4 tracking-tight">Browse Resources</h1>
            <p className="text-gray-500 font-bold text-[10px] sm:text-sm uppercase tracking-widest px-4 sm:px-0">Explore thousands of study materials curated for DU students.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:w-auto mt-4 md:mt-0">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-purple-600 border-2 border-purple-100 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:border-purple-600 hover:bg-purple-50 transition-all w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Request Material
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Resource
            </motion.button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-3 sm:p-6 shadow-xl shadow-purple-900/5 mb-8 sm:mb-12">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Search Input Group */}
            <div className="flex-1">
              <AnimatedGlowingSearchBar 
                ref={searchInputRef}
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                showClear={searchQuery.length > 0}
                onClear={() => setSearchQuery('')}
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between lg:justify-start gap-3">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex-1 lg:flex-none px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-wider border ${
                  showAdvancedFilters 
                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 shadow-inner w-full sm:w-auto justify-center sm:justify-start">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-purple-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-purple-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters (Collapsible) */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 mt-4 sm:mt-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 px-1">
                      <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Course</span>
                    </div>
                    <select 
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 transition-all cursor-pointer"
                    >
                      {courses.map(course => <option key={course} value={course}>{course}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 px-1">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Semester</span>
                    </div>
                    <select 
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 transition-all cursor-pointer"
                    >
                      {availableSemesters.map(sem => <option key={sem} value={sem}>{sem === 'All Semesters' ? sem : `Semester ${sem}`}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 px-1">
                      <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Category</span>
                    </div>
                    <select 
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 transition-all cursor-pointer"
                    >
                      {availableSubCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 px-1">
                      <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Sort By</span>
                    </div>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-600 transition-all cursor-pointer"
                    >
                      <option value="Date">Newest First</option>
                      <option value="Rating">Top Rated</option>
                      <option value="Title">Alphabetical</option>
                      <option value="Course">Course Name</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 px-2 sm:px-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-600 animate-pulse" />
            <p className="text-[10px] sm:text-sm font-black text-gray-900 uppercase tracking-widest">
              Showing <span className="text-purple-600">{Math.min(visibleCount, filteredResources.length)}</span> of {filteredResources.length} Resources
            </p>
          </div>
          {hasActiveFilters && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
                setSelectedCourse('All Courses');
                setSelectedSemester('All Semesters');
                setSelectedSubCategory('All');
              }}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Reset All Filters
            </motion.button>
          )}
        </div>

        {/* Resources Grid/List */}
        {filteredResources.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
            : "space-y-4 sm:space-y-6"
          }>
            {filteredResources.slice(0, visibleCount).map((resource) => (
              <ResourceCard 
                key={resource.id}
                resource={resource}
                onClick={handleOpenResource}
                onShare={handleShare}
                onSave={onSave}
                isSaved={savedResourceIds.includes(resource.id)}
                getAverageRating={getAverageRating}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[4rem] p-12 sm:p-24 text-center border border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mx-auto mb-8 text-gray-300 shadow-inner">
              <Search className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4 tracking-tight">No resources found</h3>
            <p className="text-gray-500 font-bold text-xs sm:text-sm uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Try adjusting your filters or search query to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('All');
                setSelectedCourse('All Courses');
                setSelectedSemester('All Semesters');
                setSelectedSubCategory('All');
              }}
              className="mt-8 px-8 py-3 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-600/20 hover:scale-105 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Load More */}
        {visibleCount < filteredResources.length && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setVisibleCount(visibleCount + 12)}
              className="px-12 py-5 bg-white border border-gray-100 rounded-3xl font-black text-gray-900 hover:bg-gray-50 hover:scale-105 transition-all shadow-xl shadow-gray-900/5 uppercase tracking-widest text-xs"
            >
              Load More Resources
            </button>
          </div>
        )}
      </div>

      {/* Request Material Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Request Material</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Can't find what you need?</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Request submitted successfully! We will try to add it soon.');
                  setIsRequestModalOpen(false);
                  setRequestData({ course: '', semester: '', materialType: 'Notes', details: '' });
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
              >
                {!auth.currentUser ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to request study materials. Join the community to get what you need.
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
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 ml-1">Course</label>
                      <div className="relative">
                        <select 
                          required
                          value={requestData.course}
                          onChange={(e) => setRequestData({...requestData, course: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select Course</option>
                          {courses.map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 ml-1">Semester</label>
                      <div className="relative">
                        <select 
                          required
                          value={requestData.semester}
                          onChange={(e) => setRequestData({...requestData, semester: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select Semester</option>
                          {availableSemesters.filter(s => s !== 'All Semesters').map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 ml-1">Material Type</label>
                      <div className="relative">
                        <select 
                          required
                          value={requestData.materialType}
                          onChange={(e) => setRequestData({...requestData, materialType: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                        >
                          <option value="Notes">Notes</option>
                          <option value="PYQ">PYQ</option>
                          <option value="Book">Book</option>
                          <option value="Syllabus">Syllabus</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 ml-1">Details (Optional)</label>
                      <textarea 
                        rows={3}
                        placeholder="Any specific subject, author, or topic you're looking for?"
                        value={requestData.details}
                        onChange={(e) => setRequestData({...requestData, details: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all font-medium text-sm resize-none"
                      />
                    </div>
                  </>
                )}
              </form>
              
              <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button 
                  type="button"
                  disabled={!auth.currentUser}
                  onClick={(e) => {
                    const form = e.currentTarget.parentElement?.previousElementSibling as HTMLFormElement;
                    if (form.checkValidity()) {
                      form.requestSubmit();
                    } else {
                      form.reportValidity();
                    }
                  }}
                  className="w-full bg-purple-600 text-white py-3.5 sm:py-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
