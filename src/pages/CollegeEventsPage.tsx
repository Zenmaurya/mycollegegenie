import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Calendar, ExternalLink, GraduationCap, Clock, 
  AlertCircle, Sparkles, MapPin, X, Upload, CheckCircle2, 
  Plus, Info, Send, Filter, ChevronDown,
  Search, SlidersHorizontal, ArrowRight
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { submitEvent, getNews } from '../services/newsService';
import { NewsItem } from '../types';
import type { SupabaseAuthUser } from '../types';
import { toast } from 'sonner';
import { ImageSlider } from '../components/ImageSlider';
import { uploadFile } from '../services/resourceService';
import { CollegeMMY_EVENTS } from '../components/UpcomingEventsCarousel';

interface CollegeEventsPageProps {
  newsItems: NewsItem[];
  isLoading: boolean;
}

export const CollegeEventsPage: React.FC<CollegeEventsPageProps> = ({ newsItems: propItems, isLoading: propLoading }) => {
  // Self-fetch events — eliminates race condition with App.tsx timing
  const [localItems, setLocalItems] = React.useState<NewsItem[]>([]);
  const [localLoading, setLocalLoading] = React.useState(true);

  React.useEffect(() => {
    setLocalLoading(true);
    getNews('Event')
      .then(data => setLocalItems(data))
      .catch(() => setLocalItems([]))
      .finally(() => setLocalLoading(false));
  }, []);

  // Merge: prefer local DB events; fall back to prop items (mock data)
  let allItems = localItems.length > 0 ? localItems : propItems;
  const isLoading = localLoading || propLoading;
  
  // Apply fallback if no events found to match HomePage carousel
  if (!isLoading && allItems.filter(item => item.category === 'Event').length === 0) {
    allItems = [...allItems, ...CollegeMMY_EVENTS];
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState<NewsItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [currentUser, setCurrentUser] = useState<SupabaseAuthUser | null>(null);

  // Track Supabase auth state
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const [submitForm, setSubmitForm] = useState({
    title: '',
    college: '',
    date: '',
    venue: '',
    eligibility: 'All' as 'All' | 'College Specific' | 'College Specific' | 'NCWEB' | 'Girls Only' | 'All Students' | 'All Students + NCWEB',
    description: '',
    image: null as File | null
  });
  const [eventImages, setEventImages] = useState<string[]>([]);

  // Sorting and Filtering State
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc'>('date-desc');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('all');

  const rawEvents = allItems.filter(item => item.category === 'Event');

  React.useEffect(() => {
    const eventTitle = searchParams.get('event');
    if (eventTitle && !selectedEvent && rawEvents.length > 0) {
      const event = rawEvents.find(e => e.title === eventTitle);
      if (event) setSelectedEvent(event);
    } else if (!eventTitle && selectedEvent) {
      setSelectedEvent(null);
    }
  }, [searchParams, rawEvents, selectedEvent]);

  const handleOpenEvent = (item: NewsItem) => {
    setSelectedEvent(item);
    setSearchParams({ event: item.title });
  };

  const handleCloseEvent = () => {
    setSelectedEvent(null);
    setSearchParams({});
  };

  // Get unique colleges for the filter
  const colleges = Array.from(new Set(rawEvents.map(e => e.college).filter(Boolean))) as string[];

  // Apply Filtering and Sorting
  const events = rawEvents
    .filter(event => {
      // Search Term Filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesSummary = event.summary.toLowerCase().includes(searchLower);
        const matchesCollege = event.college?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesSummary && !matchesCollege) return false;
      }

      // College Filter
      if (collegeFilter !== 'all' && event.college !== collegeFilter) return false;

      // Eligibility Filter
      if (eligibilityFilter !== 'all' && event.eligibility !== eligibilityFilter) return false;

      // Date Range Filter
      if (startDate || endDate) {
        const eventDate = new Date(event.date);
        if (isNaN(eventDate.getTime())) return true; // Keep if date is unparseable

        if (startDate && eventDate < new Date(startDate)) return false;
        if (endDate && eventDate > new Date(endDate)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (isNaN(dateA) || isNaN(dateB)) return 0;

      return sortBy === 'date-asc' ? dateA - dateB : dateB - dateA;
    });

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to submit an event.');
      return;
    }
    setSubmitStatus('submitting');
    try {
      await submitEvent({
        title: submitForm.title,
        college: submitForm.college,
        date: submitForm.date,
        venue: submitForm.venue,
        eligibility: submitForm.eligibility,
        description: submitForm.description,
        image: submitForm.image,
        imageUrl: eventImages[0]
      });
      setSubmitStatus('success');
      toast.success('Event submitted! It will be reviewed by our team.');
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitStatus('idle');
        setSubmitForm({ title: '', college: '', date: '', venue: '', eligibility: 'All', description: '', image: null });
      }, 2000);
    } catch (error) {
      console.error('[CollegeEventsPage] submitEvent error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit event. Please try again.');
      setSubmitStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>{selectedEvent ? `${selectedEvent.title} | MyCollegeGenie` : 'Upcoming College Events & Fests | MyCollegeGenie'}</title>
        <meta name="description" content={selectedEvent ? selectedEvent.summary : "Discover and participate in the latest college events, fests, hackathons, and workshops happening at universities across India."} />
        
        {/* Open Graph / Social Meta Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="MyCollegeGenie" />
        <meta property="og:title" content={selectedEvent ? selectedEvent.title : 'Upcoming College Events | MyCollegeGenie'} />
        <meta property="og:description" content={selectedEvent ? selectedEvent.summary : "Stay updated with the latest college events, fests, and workshops happening across University."} />
        <meta property="og:image" content={selectedEvent ? `https://picsum.photos/seed/${selectedEvent.title}/1200/630` : 'https://picsum.photos/seed/events/1200/630'} />
        
        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={selectedEvent ? selectedEvent.title : 'Upcoming College Events | MyCollegeGenie'} />
        <meta name="twitter:description" content={selectedEvent ? selectedEvent.summary : "Stay updated with the latest college events, fests, and workshops happening across University."} />
        <meta name="twitter:image" content={selectedEvent ? `https://picsum.photos/seed/${selectedEvent.title}/1200/630` : 'https://picsum.photos/seed/events/1200/630'} />
      </Helmet>

      {/* Header Section */}
      <div className="bg-pink-900/80 backdrop-blur-md py-3 sm:py-7 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-3xl font-black text-white tracking-tighter mb-0.5 sm:mb-1">College Events</h1>
              <p className="text-pink-200 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Fests, Workshops & Cultural Meets</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-pink-200 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all group bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-sm border border-white/10 w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-white text-pink-600 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-2 hover:bg-pink-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit Event
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-32">
        {/* Filters and Sorting UI */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl shadow-pink-900/5 border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Filter Events</h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Refine your search</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 ml-2 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-pink-500 transition-colors" aria-hidden="true" />
              <label htmlFor="event-search" className="sr-only">Search events</label>
              <input 
                id="event-search"
                type="text"
                placeholder="Search by event name, college or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          <AnimatePresence>
            {isFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
                  {/* College Filter */}
                  <div className="space-y-2">
                    <label htmlFor="college-filter" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3" aria-hidden="true" />
                      Select College
                    </label>
                    <div className="relative">
                      <select 
                        id="college-filter"
                        value={collegeFilter}
                        onChange={(e) => setCollegeFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">All Colleges</option>
                        {colleges.map(college => (
                          <option key={college} value={college}>{college}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Eligibility Filter */}
                  <div className="space-y-2">
                    <label htmlFor="eligibility-filter" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      Eligibility
                    </label>
                    <div className="relative">
                      <select 
                        id="eligibility-filter"
                        value={eligibilityFilter}
                        onChange={(e) => setEligibilityFilter(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="all">All Students</option>
                        <option value="All">All Colleges</option>
                        <option value="College Specific">College Specific</option>
                        <option value="All Students">All Students</option>
                        <option value="All Students + NCWEB">All Students + NCWEB</option>
                        <option value="NCWEB">NCWEB Only</option>
                        <option value="Girls Only">Girls Only</option>
                        <option value="College Specific">Our College Only</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <label htmlFor="start-date" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      From Date
                    </label>
                    <input 
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all cursor-pointer"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label htmlFor="end-date" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      To Date
                    </label>
                    <input 
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label htmlFor="sort-order" className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Filter className="w-3 h-3" aria-hidden="true" />
                      Sort Order
                    </label>
                    <div className="relative">
                      <select 
                        id="sort-order"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filter Tags */}
          {(collegeFilter !== 'all' || startDate || endDate || searchTerm || eligibilityFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 shrink-0">Active Filters:</span>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                {searchTerm && (
                  <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-pink-800 transition-colors" aria-label="Remove search filter">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {collegeFilter !== 'all' && (
                  <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100">
                    College: {collegeFilter}
                    <button onClick={() => setCollegeFilter('all')} className="hover:text-pink-800 transition-colors" aria-label="Remove college filter">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {eligibilityFilter !== 'all' && (
                  <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100">
                    Eligibility: {eligibilityFilter}
                    <button onClick={() => setEligibilityFilter('all')} className="hover:text-pink-800 transition-colors" aria-label="Remove eligibility filter">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {startDate && (
                  <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100">
                    From: {startDate}
                    <button onClick={() => setStartDate('')} className="hover:text-pink-800 transition-colors" aria-label="Remove start date filter">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {endDate && (
                  <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-pink-100">
                    To: {endDate}
                    <button onClick={() => setEndDate('')} className="hover:text-pink-800 transition-colors" aria-label="Remove end date filter">
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  setCollegeFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setEligibilityFilter('all');
                  setSortBy('date-desc');
                }}
                className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline whitespace-nowrap"
                aria-label="Clear all active filters"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 animate-pulse shadow-sm overflow-hidden">
                <div className="h-56 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.06, 0.4) }}
                key={item.title + idx}
                onClick={() => handleOpenEvent(item)}
                className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* ── Image Slider (card) ── */}
                <div className="relative w-full bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden" style={{ aspectRatio: '4/3' }}
                  onClick={e => e.stopPropagation()}
                >
                  <ImageSlider
                    images={[
                      item.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.title)}/600/450`
                    ]}
                    autoPlay={false}
                    aspectRatio="4/3"
                    accentColor="#db2777"
                    className="rounded-none"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  {/* Date badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-pink-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                      {item.date || 'TBD'}
                    </div>
                  </div>
                  {/* Eligibility badge */}
                  {item.eligibility && item.eligibility !== 'All' && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-white/90 backdrop-blur-sm text-pink-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-pink-100">
                        {item.eligibility}
                      </div>
                    </div>
                  )}
                  {/* College at bottom */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <p className="text-white font-black text-[11px] uppercase tracking-widest truncate drop-shadow">
                      {item.college || 'University'}
                    </p>
                  </div>
                </div>

                {/* ── Card Body ── */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <h3 className="font-extrabold text-base text-gray-900 group-hover:text-pink-600 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
                    {item.summary || 'Click to view full event details and register.'}
                  </p>
                  {/* Location row */}
                  {item.venue && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">{item.venue}</span>
                    </div>
                  )}
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">View Details</span>
                    <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 group-hover:bg-pink-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-10 sm:p-20 text-center border border-gray-100 shadow-xl">
            <div className="w-20 h-20 sm:w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-10 h-10 sm:w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">No Events Found</h3>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">Check back later for upcoming fests and meets.</p>
            {(collegeFilter !== 'all' || startDate || endDate || searchTerm || eligibilityFilter !== 'all') && (
              <button 
                onClick={() => {
                  setCollegeFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setEligibilityFilter('all');
                  setSortBy('date-desc');
                }}
                className="bg-pink-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-600/20 hover:bg-pink-700 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Event Detail Modal ── */}
      {createPortal(
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseEvent}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden"
            >
              {/* ── Image Slider (modal hero) ── */}
              <div className="relative w-full bg-gradient-to-br from-pink-900 via-rose-800 to-pink-700 shrink-0 h-[35dvh] sm:h-[45vh]">
                <ImageSlider
                  images={[
                    selectedEvent.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(selectedEvent.title)}/800/600`
                  ]}
                  autoPlay={false}
                  aspectRatio="16/9"
                  accentColor="#db2777"
                  className="rounded-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20 pointer-events-none" />
                {/* Close */}
                <button onClick={handleCloseEvent}
                  className="absolute top-4 right-4 p-2.5 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/20 z-10">
                  <X className="w-5 h-5" />
                </button>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-pink-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedEvent.date || 'TBD'}</span>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20">{selectedEvent.college || 'University'}</span>
                    {selectedEvent.eligibility && selectedEvent.eligibility !== 'All' && (
                      <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedEvent.eligibility}</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">{selectedEvent.title}</h2>
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5">
                {/* Info tiles */}
                <div className="grid grid-cols-3 gap-3">
                  {[{
                    icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100',
                    label: 'Date', value: selectedEvent.date || 'TBD'
                  }, {
                    icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100',
                    label: 'Venue', value: selectedEvent.venue || selectedEvent.college || 'Campus'
                  }, {
                    icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
                    label: 'For', value: selectedEvent.eligibility === 'College Specific' ? 'Host College' : selectedEvent.eligibility || 'All'
                  }].map(({ icon: Icon, color, bg, border, label, value }) => (
                    <div key={label} className={`flex flex-col gap-1.5 p-3 ${bg} rounded-2xl border ${border}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                      <p className={`text-xs font-extrabold ${color} leading-tight line-clamp-2`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-pink-500" />About this Event
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedEvent.summary || selectedEvent.description || 'Join us for this amazing event! Click Register Now for full details.'}
                  </p>
                </div>

                {/* Location Map Link */}
                {(selectedEvent.venue || selectedEvent.college) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedEvent.venue || selectedEvent.college || '') + ' Delhi')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-110 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="text-sm font-bold text-blue-700 truncate">{selectedEvent.venue || selectedEvent.college}, Delhi</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
                  </a>
                )}
              </div>

              {/* Sticky Action Buttons */}
              <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <a
                  href={selectedEvent.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => { if (!selectedEvent.url) e.preventDefault(); }}
                  className="flex-[2] bg-gradient-to-r from-pink-600 to-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-pink-600/25 hover:shadow-pink-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Register Now
                </a>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/events?event=${encodeURIComponent(selectedEvent.title)}`;
                    if (navigator.share) {
                      navigator.share({ title: selectedEvent.title, text: selectedEvent.summary, url: shareUrl }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Link copied!');
                    }
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />Share
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Submit Event Modal */}
      {createPortal(
        <AnimatePresence>
          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">  
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Submit Event</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Promote your college fest</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <form id="submit-event-form" onSubmit={handleSubmitEvent} className="p-6 sm:p-8 space-y-6">
                {submitStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tighter">Submission Received!</h3>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Your event will be reviewed by our team before going live.</p>
                  </motion.div>
                ) : !currentUser ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to submit a college event. Join the community to start promoting.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-8 bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-pink-600/20 block text-center"
                    >
                      Sign In to Continue
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
                        <input 
                          required
                          id="event-title"
                          name="title"
                          type="text"
                          placeholder="e.g. Crossroads 2026"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold"
                          value={submitForm.title}
                          onChange={e => setSubmitForm({...submitForm, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">College Name</label>
                        <input 
                          required
                          id="event-college"
                          name="college"
                          type="text"
                          placeholder="e.g. SRCC"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold"
                          value={submitForm.college}
                          onChange={e => setSubmitForm({...submitForm, college: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Date</label>
                        <input 
                          required
                          id="event-date"
                          name="date"
                          type="text"
                          placeholder="e.g. March 25, 2026"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold"
                          value={submitForm.date}
                          onChange={e => setSubmitForm({...submitForm, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue</label>
                        <input 
                          required
                          id="event-venue"
                          name="venue"
                          type="text"
                          placeholder="e.g. College Auditorium"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold"
                          value={submitForm.venue}
                          onChange={e => setSubmitForm({...submitForm, venue: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Student Eligibility</label>
                      <div className="relative">
                        <select 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold appearance-none cursor-pointer"
                          value={submitForm.eligibility}
                          onChange={e => setSubmitForm({...submitForm, eligibility: e.target.value as any})}
                        >
                          <option value="All">All Colleges (College, SOL, Private, etc.)</option>
                          <option value="College Specific">college students Only</option>
                          <option value="All Students">All Students Students</option>
                          <option value="All Students + NCWEB">All Students + NCWEB Students</option>
                          <option value="NCWEB">NCWEB Students Only</option>
                          <option value="Girls Only">Girls Only</option>
                          <option value="College Specific">Only for Our College Students</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Short Description</label>
                      <textarea 
                        required
                        rows={3}
                        placeholder="Tell us what makes this event special..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-bold resize-none"
                        value={submitForm.description}
                        onChange={e => setSubmitForm({...submitForm, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Photos / Poster</label>
                        <span className="text-xs text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full">Up to 3 images</span>
                      </div>
                      <ImageSlider
                        images={eventImages}
                        editable
                        onImagesChange={setEventImages}
                        maxImages={3}
                        aspectRatio="16/9"
                        accentColor="#db2777"
                        onUpload={(file) => uploadFile(file, 'events')}
                      />
                      {eventImages.length > 0 && (
                        <p className="text-[10px] font-bold text-gray-400">
                          {eventImages.length}/3 photos added · First photo will be the poster
                        </p>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                        Note: Submissions will be reviewed before going live. Please ensure all details are accurate and the poster is high-quality.
                      </p>
                    </div>
                  </>
                )}
                </form>
              </div>

              {/* ── Sticky Submit Footer ── */}
              {currentUser && submitStatus !== 'success' && (
                <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                  <button
                    type="submit"
                    form="submit-event-form"
                    disabled={submitStatus === 'submitting'}
                    className="w-full bg-pink-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-pink-600/20 hover:bg-pink-700 transition-all disabled:opacity-50"
                  >
                    {submitStatus === 'submitting' ? (
                      <><Clock className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Submit for Review</>
                    )}
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
