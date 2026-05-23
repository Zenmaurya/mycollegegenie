import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Newspaper, ExternalLink, Clock, AlertCircle, ArrowRight,
  X, Send, Info, TrendingUp, GraduationCap, Plus, CheckCircle2,
  User, Link as LinkIcon, Calendar, Search, Filter, ChevronDown,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { NewsItem } from '../types';
import type { SupabaseAuthUser } from '../types';
import { toast } from 'sonner';
import { supabase } from '../supabase';
import { getNews, submitNews } from '../services/newsService';

// ── DU Colleges list for dropdown ──────────────────────────────────────────
const DU_COLLEGES = [
  'Delhi University',
  'St. Stephen\'s College',
  'Hindu College',
  'SRCC',
  'Miranda House',
  'Hansraj College',
  'Lady Shri Ram College',
  'Kirori Mal College',
  'Ramjas College',
  'Daulat Ram College',
  'Jesus & Mary College',
  'Indraprastha College for Women',
  'Gargi College',
  'Maitreyi College',
  'Aryabhatta College',
  'Deen Dayal Upadhyaya College',
  'Motilal Nehru College',
  'Shivaji College',
  'Zakir Husain College',
  'Shaheed Bhagat Singh College',
  'PGDAV College',
  'Atma Ram Sanatan Dharm College',
  'Kamala Nehru College',
  'Rajdhani College',
  'Satyawati College',
  'Deshbandhu College',
  'Other College / University',
];

interface OfficialNewsPageProps {
  newsItems: NewsItem[];
  isLoading: boolean;
  user?: any;
}

export const OfficialNewsPage: React.FC<OfficialNewsPageProps> = ({ newsItems: propItems, isLoading: propLoading, user: propUser }) => {
  // Self-fetch news data
  const [localItems, setLocalItems] = useState<NewsItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  const loadNews = () => {
    import('../lib/apiClient').then(({ fetchWithAuth }) => {
      fetchWithAuth('/api/news?limit=60')
        .then((data: any[]) => {
          const mapped: NewsItem[] = (Array.isArray(data) ? data : []).map(item => ({
            id: item.id,
            title: item.title,
            summary: item.summary || item.content || '',
            category: item.category || 'News',
            date: item.date || new Date(item.created_at).toLocaleDateString('en-IN'),
            college: item.college || '',
            url: item.url || '',
            imageUrl: item.image_url || item.imageUrl || '',
            venue: item.venue || '',
            eligibility: item.eligibility || 'All',
            description: item.description || item.summary || '',
            createdAt: item.created_at || new Date().toISOString(),
            submitted_by_name: item.submitted_by_name || null,
            submitted_by_id:   item.submitted_by_id   || null,
          }));
          setLocalItems(mapped);
        })
        .catch(err => {
          console.error('[OfficialNewsPage] fetch error:', err);
          setLocalItems([]);
        })
        .finally(() => setLocalLoading(false));
    });
  };

  useEffect(() => { loadNews(); }, []);

  const sourceItems = localItems.length > 0 ? localItems : propItems;

  // Show news from last 2 months only — keeps page fast and relevant
  const news = React.useMemo(() => {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return sourceItems.filter(item => {
      if (item.category === 'Event') return false;
      const itemDate = new Date(item.createdAt || Date.now());
      if (!isNaN(itemDate.getTime())) return itemDate >= twoMonthsAgo;
      return true; // keep items with no date
    });
  }, [sourceItems]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // ── Submit News Modal State ───────────────────────────────────────────────
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const currentUser = propUser ?? null;
  const [submitForm, setSubmitForm] = useState({
    title: '',
    college: '',
    customCollege: '',
    date: new Date().toISOString().split('T')[0],
    category: 'News' as 'News' | 'Notice' | 'Announcement',
    summary: '',
    url: '',
  });

  // Auth state

  // URL param → open news detail
  useEffect(() => {
    const newsTitle = searchParams.get('news');
    if (newsTitle && !selectedNews && news.length > 0) {
      const item = news.find(n => n.title === newsTitle);
      if (item) setSelectedNews(item);
    } else if (!newsTitle && selectedNews) {
      setSelectedNews(null);
    }
  }, [searchParams, news, selectedNews]);

  const handleOpenNews = (item: NewsItem) => {
    setSelectedNews(item);
    setSearchParams({ news: item.title });
  };

  const handleCloseNews = () => {
    setSelectedNews(null);
    setSearchParams({});
  };

  // Unique colleges for filter
  const colleges = Array.from(new Set(news.map(n => n.college).filter(Boolean))) as string[];

  const filtered = news.filter(n => {
    const matchesSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.college?.toLowerCase().includes(search.toLowerCase());
    const matchesCollege = collegeFilter === 'all' || n.college === collegeFilter;
    return matchesSearch && matchesCollege;
  });

  // ── Handle News Submission ────────────────────────────────────────────────
  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = propUser;
    if (!user) { toast.error('Please sign in to submit news.'); return; }
    if (!submitForm.title.trim() || !submitForm.summary.trim()) {
      toast.error('Title and summary are required.'); return;
    }

    setSubmitStatus('submitting');
    try {
      const finalCollege = submitForm.college === 'Other College / University'
        ? submitForm.customCollege
        : submitForm.college;

      await submitNews({
        title: submitForm.title.trim(),
        college: finalCollege || '',
        date: submitForm.date,
        summary: submitForm.summary.trim(),
        url: submitForm.url.trim(),
        category: submitForm.category,
      });

      setSubmitStatus('success');
      toast.success('News submitted! Our team will review it shortly.');
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitStatus('idle');
        setSubmitForm({ title: '', college: '', customCollege: '', date: new Date().toISOString().split('T')[0], category: 'News', summary: '', url: '' });
        loadNews(); // Refresh
      }, 2200);
    } catch (error) {
      console.error('[OfficialNewsPage] submitNews error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit news. Please try again.');
      setSubmitStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>{selectedNews ? `${selectedNews.title} | MyCollegeGenie` : 'Latest College News & Announcements | MyCollegeGenie'}</title>
        <meta name="description" content={selectedNews ? selectedNews.summary : 'Stay updated with the latest official news, exam updates, and announcements from Delhi University and colleges across India.'} />
        <meta property="og:title" content={selectedNews ? selectedNews.title : 'Latest College News | MyCollegeGenie'} />
        <meta property="og:description" content={selectedNews ? selectedNews.summary : 'Official news and updates.'} />
        <meta property="og:image" content={selectedNews ? `https://picsum.photos/seed/${selectedNews.title}/1200/630` : 'https://picsum.photos/seed/news/1200/630'} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* ── Header ── */}
      <div className="bg-purple-900/80 backdrop-blur-md py-4 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter">College News</h1>
              <p className="text-purple-200 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">DU & All Colleges — Stay Informed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all group bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-white/10 w-fit">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Back
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-white text-purple-700 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-2 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Post News
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-4">
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-purple-900/5 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-lg w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search news, college, keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-300"
              />
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-all shrink-0"
            >
              <Filter className="w-4 h-4" />
              Filter by College
              <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {isFiltersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Filter by College</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCollegeFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${collegeFilter === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'}`}
                    >All Colleges</button>
                    {colleges.map(c => (
                      <button
                        key={c}
                        onClick={() => setCollegeFilter(c)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${collegeFilter === c ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'}`}
                      >{c}</button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {!localLoading && (
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
            {filtered.length} {filtered.length === 1 ? 'Article' : 'Articles'} found
            {collegeFilter !== 'all' && <span className="text-purple-500 ml-2">· {collegeFilter}</span>}
          </p>
        )}

        {localLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 animate-pulse shadow-sm flex overflow-hidden h-40">
                <div className="w-40 bg-gray-100 shrink-0" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((item, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                key={(item.id || item.title) + idx}
                onClick={() => handleOpenNews(item)}
                className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-purple-500/8 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex"
              >
                {/* Thumbnail */}
                <div className="relative w-36 sm:w-44 shrink-0 bg-gradient-to-br from-purple-50 to-indigo-100 overflow-hidden">
                  <img
                    src={item.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.title)}/300/400`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                  {/* College + date */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 truncate max-w-[130px]">
                      {item.college || 'University'}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />{item.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors leading-snug line-clamp-2 mb-2">
                    {item.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 flex-1">
                    {item.summary}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    {/* Submitter info */}
                    {item.submitted_by_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-purple-500" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 truncate max-w-[100px]">
                          {item.submitted_by_name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Official</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs font-bold text-purple-500 group-hover:text-purple-700 transition-colors">
                      Read <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-16 text-center border border-gray-100 shadow-xl">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">No News Found</h3>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-6">Check back later for official updates.</p>
            {(search || collegeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCollegeFilter('all'); }}
                className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-purple-700 transition-all"
              >Clear Filters</button>
            )}
          </div>
        )}
      </div>

      {/* ── News Detail Modal ── */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div
            key="news-modal"
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseNews}
              className="absolute inset-0 bg-black/80 backdrop-blur-md z-0"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg sm:max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
            >
              {/* Hero image */}
              <div className="relative h-52 sm:h-64 bg-gradient-to-br from-purple-900 to-indigo-800 shrink-0 overflow-hidden">
                <img
                  src={selectedNews.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(selectedNews.title)}/1200/600`}
                  className="w-full h-full object-cover opacity-60"
                  alt={selectedNews.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <button onClick={handleCloseNews}
                  className="absolute top-4 right-4 p-2.5 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/20 z-20">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedNews.date}</span>
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20">
                      {selectedNews.college || 'University'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight line-clamp-2">{selectedNews.title}</h2>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5 bg-white">
                {/* Info tiles */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3.5 bg-purple-50 rounded-2xl border border-purple-100">
                    <GraduationCap className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Source</p>
                      <p className="text-xs font-extrabold text-purple-700 leading-tight truncate">{selectedNews.college || 'Official Updates'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Published</p>
                      <p className="text-xs font-extrabold text-indigo-700 leading-tight">{selectedNews.date}</p>
                    </div>
                  </div>
                </div>

                {/* Submitter info — shown when submitted by a student */}
                {selectedNews.submitted_by_name && (
                  <div className="flex items-center gap-3 p-3.5 bg-green-50 rounded-2xl border border-green-100">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Submitted By</p>
                      <p className="text-sm font-extrabold text-green-700 truncate">{selectedNews.submitted_by_name}</p>
                    </div>
                    <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-green-200 shrink-0">
                      Student Contribution
                    </span>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-purple-500" />Details
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{selectedNews.summary}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <a
                    href={selectedNews.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => { if (!selectedNews.url) e.preventDefault(); }}
                    className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read Full Notice
                  </a>
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/news?news=${encodeURIComponent(selectedNews.title)}`;
                      if (navigator.share) {
                        navigator.share({ title: selectedNews.title, text: selectedNews.summary, url: shareUrl }).catch(() => {});
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit News Modal ── */}
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
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-6 sm:p-7 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 shrink-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <Newspaper className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">Post News</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share college updates with everyone</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="p-2 hover:bg-gray-200 rounded-xl transition-colors shrink-0"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto">
                  <form id="submit-news-form" onSubmit={handleSubmitNews} className="p-6 sm:p-8 space-y-5">
                    {submitStatus === 'success' ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">News Submitted!</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Our team will review it before publishing.</p>
                      </motion.div>
                    ) : !currentUser ? (
                      /* Not logged in */
                      <div className="flex flex-col items-center justify-center py-10 text-center space-y-5">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                          <p className="text-gray-500 font-medium text-sm">Sign in to submit news and share updates with fellow students.</p>
                        </div>
                        <Link
                          to="/login"
                          className="px-8 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-xl shadow-purple-600/20 block text-center"
                        >Sign In to Continue</Link>
                      </div>
                    ) : (
                      /* The form */
                      <>
                        {/* Submitter info banner */}
                        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                          <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-purple-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Posting as</p>
                            <p className="text-sm font-extrabold text-purple-800 truncate">
                              {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Student'}
                            </p>
                            <p className="text-[10px] text-purple-400 truncate">{currentUser.email}</p>
                          </div>
                          <span className="bg-purple-100 text-purple-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-purple-200 shrink-0">
                            Your name will show
                          </span>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            News Title <span className="text-red-400">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="e.g. DU Admission 2026 Schedule Released"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm"
                            value={submitForm.title}
                            onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })}
                            maxLength={255}
                          />
                        </div>

                        {/* College + Category row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              College / University <span className="text-red-400">*</span>
                            </label>
                            <select
                              required
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                              value={submitForm.college}
                              onChange={e => setSubmitForm({ ...submitForm, college: e.target.value })}
                            >
                              <option value="">Select College...</option>
                              {DU_COLLEGES.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                            <select
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm appearance-none cursor-pointer"
                              value={submitForm.category}
                              onChange={e => setSubmitForm({ ...submitForm, category: e.target.value as any })}
                            >
                              <option value="News">📰 News</option>
                              <option value="Notice">📋 Notice</option>
                              <option value="Announcement">📢 Announcement</option>
                            </select>
                          </div>
                        </div>

                        {/* Custom college if Other */}
                        {submitForm.college === 'Other College / University' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Enter College Name <span className="text-red-400">*</span></label>
                            <input
                              required
                              type="text"
                              placeholder="Type your college name..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm"
                              value={submitForm.customCollege}
                              onChange={e => setSubmitForm({ ...submitForm, customCollege: e.target.value })}
                            />
                          </div>
                        )}

                        {/* Date + URL row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />News Date <span className="text-red-400">*</span>
                            </label>
                            <input
                              required
                              type="date"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm cursor-pointer"
                              value={submitForm.date}
                              onChange={e => setSubmitForm({ ...submitForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                              <LinkIcon className="w-3 h-3" />Source URL (optional)
                            </label>
                            <input
                              type="url"
                              placeholder="https://..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm"
                              value={submitForm.url}
                              onChange={e => setSubmitForm({ ...submitForm, url: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Summary / Content */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            News Summary / Content <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            required
                            rows={5}
                            placeholder="Write the news details here... What happened? What should students know?"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-bold text-sm resize-none"
                            value={submitForm.summary}
                            onChange={e => setSubmitForm({ ...submitForm, summary: e.target.value })}
                            maxLength={3000}
                          />
                          <p className="text-right text-[10px] text-gray-300 font-bold">{submitForm.summary.length}/3000</p>
                        </div>

                        {/* Review note */}
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Your submission will be reviewed by our team before publishing. Your name will be shown as the contributor on the news card. Please ensure the news is accurate and relevant to college students.
                          </p>
                        </div>
                      </>
                    )}
                  </form>
                </div>

                {/* Modal Footer — submit button */}
                {submitStatus !== 'success' && currentUser && (
                  <div className="p-5 sm:p-6 border-t border-gray-100 bg-white shrink-0">
                    <button
                      type="submit"
                      form="submit-news-form"
                      disabled={submitStatus === 'submitting'}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-purple-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:scale-100"
                    >
                      {submitStatus === 'submitting' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit News for Review
                        </>
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
