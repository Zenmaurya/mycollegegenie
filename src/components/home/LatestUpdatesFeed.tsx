import React from 'react';
import { Newspaper, ChevronRight, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { NewsItem } from '../../types';

interface LatestUpdatesFeedProps {
  newsItems: NewsItem[];
  isNewsLoading: boolean;
}

export function LatestUpdatesFeed({ newsItems, isNewsLoading }: LatestUpdatesFeedProps) {
  const navigate = useNavigate();

  const filteredNews = newsItems.filter(n => {
    if (n.category === 'Event') return false;
    const itemDate = new Date(n.createdAt);
    if (!isNaN(itemDate.getTime())) {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      return itemDate >= twoMonthsAgo;
    }
    return true;
  });

  const filteredEvents = newsItems.filter(n => n.category === 'Event');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-8 sm:pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-10 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center shrink-0">
            <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Latest Updates</h2>
            <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest">Stay updated with campus life</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link 
            to="/news"
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] sm:text-xs font-bold text-brand-primary hover:bg-brand-surface transition-all uppercase tracking-widest text-center shadow-sm"
          >
            News
          </Link>
          <Link 
            to="/events"
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] sm:text-xs font-bold text-mark-ink hover:bg-mark-soft transition-all uppercase tracking-widest text-center shadow-sm"
          >
            Events
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* News Column */}
        <div className="space-y-4">
          {isNewsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 animate-pulse h-24" />
            ))
          ) : filteredNews.length > 0 ? (
            filteredNews.slice(0, 3).map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 6 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 transition-all cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-xl hover:shadow-brand-primary/5 group"
                onClick={() => navigate(`/news?news=${encodeURIComponent(item.title)}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-brand-surface text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded-md">News</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-brand-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 font-medium">
                    {item.summary}
                  </p>
                  {item.college && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-brand-primary">
                      <GraduationCap className="w-3 h-3" />
                      {item.college}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">No news available at the moment.</p>
            </div>
          )}
        </div>

        {/* Events Column */}
        <div className="space-y-4">
          {isNewsLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 animate-pulse h-24" />
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.slice(0, 3).map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 6 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 transition-all cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-xl hover:shadow-mark-ink/5 group"
                onClick={() => navigate(`/events?event=${encodeURIComponent(item.title)}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-mark-soft text-mark-ink text-[10px] font-bold uppercase tracking-wider rounded-md">Event</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-mark-ink transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 font-medium">
                    {item.summary}
                  </p>
                  {item.college && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-mark-ink">
                      <GraduationCap className="w-3 h-3" />
                      {item.college}
                    </div>
                  )}
                </div>
                <div className="w-8 h-8 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-mark group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold text-sm">No events scheduled currently.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
