import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Newspaper, ExternalLink, Clock, AlertCircle, ArrowRight, X, Send, Info, TrendingUp, GraduationCap } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { NewsItem } from '../types';
import { toast } from 'sonner';

interface OfficialNewsPageProps {
  newsItems: NewsItem[];
  isLoading: boolean;
}

export const OfficialNewsPage: React.FC<OfficialNewsPageProps> = ({ newsItems: propItems, isLoading: propLoading }) => {
  // Self-fetch news data via direct public API call (no auth layer)
  const [localItems, setLocalItems] = useState<NewsItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://api.mycollegegenie.in';
    fetch(`${API_URL}/api/news?limit=200`)
      .then(r => r.json())
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
        }));
        setLocalItems(mapped);
      })
      .catch(err => {
        console.error('[OfficialNewsPage] fetch error:', err);
        setLocalItems([]);
      })
      .finally(() => setLocalLoading(false));
  }, []);

  // Use local data if available; fall back to prop data from App.tsx
  const sourceItems = localItems.length > 0 ? localItems : propItems;

  // Filter to include only items from the last 2 months
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Include 'News', 'Notice' (from College SOL scraper), and all non-Event categories
  // Only include items newer than 2 months ago
  const news = sourceItems.filter(item => {
    if (item.category === 'Event') return false;
    const itemDate = new Date(item.createdAt);
    if (!isNaN(itemDate.getTime())) {
      return itemDate >= twoMonthsAgo;
    }
    return true; // Keep items with invalid dates just in case
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [search, setSearch] = useState('');

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

  const filtered = news.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.summary.toLowerCase().includes(search.toLowerCase()) ||
    n.college?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent">
      <Helmet>
        <title>{selectedNews ? `${selectedNews.title} | MyCollegeGenie` : 'Latest College News & Announcements | MyCollegeGenie'}</title>
        <meta name="description" content={selectedNews ? selectedNews.summary : 'Stay updated with the latest official news, exam updates, and announcements from colleges and universities across India.'} />
        <meta property="og:title" content={selectedNews ? selectedNews.title : 'Latest College News | MyCollegeGenie'} />
        <meta property="og:description" content={selectedNews ? selectedNews.summary : 'Official news and updates.'} />
        <meta property="og:image" content={selectedNews ? `https://picsum.photos/seed/${selectedNews.title}/1200/630` : 'https://picsum.photos/seed/news/1200/630'} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* ── Header ── */}
      <div className="bg-purple-900/80 backdrop-blur-md py-4 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
              <p className="text-purple-200 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Stay informed, stay ahead.</p>
            </div>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-purple-200 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all group bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-white/10 w-fit">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-32">

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-lg">
            <Newspaper className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search news, college, keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Results count - only show when not loading */}
        {!localLoading && (
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">
            {filtered.length} {filtered.length === 1 ? 'Article' : 'Articles'} found
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
                key={item.title + idx}
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
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Official Update</span>
                    </div>
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
            {search && (
              <button onClick={() => setSearch('')} className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-purple-700 transition-all">
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── News Detail Modal ── */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseNews}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
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
                  className="absolute top-4 right-4 p-2.5 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/20">
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
              <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-5">
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
                    href={selectedNews.url}
                    target="_blank"
                    rel="noopener noreferrer"
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
