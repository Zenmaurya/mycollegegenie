import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, MapPin, X, ExternalLink, Send,
  CheckCircle2, Info, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NewsItem } from '../types';
import { ImageSlider } from './ImageSlider';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────────
   Props
───────────────────────────────────────────────────────────────── */
interface UpcomingEventsCarouselProps {
  newsItems: NewsItem[];
  isLoading?: boolean;
}

/* ─────────────────────────────────────────────────────────────────
   Gradient fallbacks (when no image)
───────────────────────────────────────────────────────────────── */
const GRADIENTS = [
  'from-purple-700 via-indigo-700 to-blue-800',
  'from-slate-800 via-blue-900 to-indigo-900',
  'from-emerald-600 via-teal-700 to-cyan-800',
  'from-rose-600 via-pink-700 to-orange-600',
  'from-amber-600 via-orange-700 to-red-700',
  'from-violet-700 via-purple-800 to-fuchsia-800',
];

const GLOW_COLORS = [
  'rgba(109,40,217,0.25)',
  'rgba(30,64,175,0.25)',
  'rgba(5,150,105,0.25)',
  'rgba(225,29,72,0.25)',
  'rgba(217,119,6,0.25)',
  'rgba(124,58,237,0.25)',
];

/* ─────────────────────────────────────────────────────────────────
   Dummy events (shown when DB is empty)
───────────────────────────────────────────────────────────────── */
export const CollegeMMY_EVENTS: NewsItem[] = [];

/* ─────────────────────────────────────────────────────────────────
   Main Export
───────────────────────────────────────────────────────────────── */
export const UpcomingEventsCarousel: React.FC<UpcomingEventsCarouselProps> = ({
  newsItems,
  isLoading = false,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<NewsItem | null>(null);
  
  // Custom scroll and drag logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Real events from DB, fallback to dummy
  const rawEvents = newsItems.filter(item => item.category === 'Event');
  const events = rawEvents.length > 0 ? rawEvents : (!isLoading ? CollegeMMY_EVENTS : []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed
    setDragDistance(prev => prev + Math.abs(x - startX)); // Accumulate distance
    scrollRef.current.scrollLeft = scrollLeft - walk;
    setStartX(x);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCardClick = (event: NewsItem) => {
    // Only trigger click if the user didn't drag much
    if (dragDistance < 15) {
      setSelectedEvent(event);
    }
  };

  // Attach scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [events.length]);

  return (
    <>
      {/* ── Carousel Track ─────────────────────────────── */}
      <div className="relative group/carousel">
        {isLoading ? (
          <div className="flex gap-4 sm:gap-6 overflow-hidden py-4 px-4 sm:px-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] sm:w-[340px] rounded-[2.5rem] bg-gray-100 animate-pulse border border-gray-200"
                style={{ minHeight: '380px' }}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            {/* Navigation Arrows (Desktop) */}
            <AnimatePresence>
              {showLeftArrow && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => scroll('left')}
                  aria-label="Scroll events left"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-700 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all hidden sm:flex"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showRightArrow && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => scroll('right')}
                  aria-label="Scroll events right"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-700 hover:text-purple-600 hover:scale-110 active:scale-95 transition-all hidden sm:flex"
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Draggable & Scrollable Track */}
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`
                flex gap-4 sm:gap-6 py-6 px-4 sm:px-8 overflow-x-auto 
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}
              `}
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              {events.map((event, idx) => (
                <div key={`${event.title}-${idx}`} className="snap-center sm:snap-start shrink-0">
                  <EventPosterCard
                    event={event}
                    index={idx}
                    onClick={() => handleCardClick(event)}
                    isDragging={isDragging}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── Event Detail Modal ─────────────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {selectedEvent && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6" style={{ position: 'fixed' }}>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedEvent(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col sm:flex-row max-h-[85vh] overflow-hidden"
              >
                {/* Left Side / Top: Poster Viewer */}
                <div className="relative w-full sm:w-[45%] bg-[#0B0F19] shrink-0 flex items-center justify-center overflow-hidden h-[30vh] sm:h-auto">
                  {/* Blurred Background for Premium feel */}
                  <div 
                     className="absolute inset-0 opacity-40 blur-2xl transform scale-110"
                     style={{ 
                       backgroundImage: `url(${selectedEvent.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop&q=80'})`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center' 
                     }}
                  />
                  <img 
                    src={selectedEvent.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop&q=80`} 
                    alt={selectedEvent.title}
                    className="relative z-10 w-full h-full object-contain p-4 sm:p-8 drop-shadow-2xl"
                  />
                  
                  {/* Close Button Mobile (Floating) */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Close event details"
                    className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/20 z-20 sm:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Right Side / Bottom: Content */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                  {/* Close Button Desktop */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    aria-label="Close event details"
                    className="absolute top-5 right-5 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-all z-10 hidden sm:block"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="overflow-y-auto flex-1 p-6 sm:p-10 space-y-8">
                    {/* Header Info */}
                    <div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {selectedEvent.college || 'University'}
                        </span>
                        {selectedEvent.eligibility && selectedEvent.eligibility !== 'All' && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {selectedEvent.eligibility}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black text-gray-900 leading-[1.1] tracking-tight mb-2">
                        {selectedEvent.title}
                      </h2>
                    </div>

                    {/* Info tiles */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {[
                        { icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', label: 'Date', value: selectedEvent.date || 'TBD' },
                        { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Venue', value: selectedEvent.venue || selectedEvent.college || 'Campus' },
                      ].map(({ icon: Icon, color, bg, border, label, value }) => (
                        <div key={label} className={`flex flex-col gap-2 p-4 sm:p-5 ${bg} rounded-2xl border ${border} hover:shadow-md transition-shadow`}>
                          <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${color} shadow-sm`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                            <p className={`text-sm font-extrabold ${color} leading-tight line-clamp-2`}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {selectedEvent.summary && (
                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4 text-purple-500" /> About this Event
                        </h4>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                          {selectedEvent.summary || selectedEvent.description || 'Join us for this amazing event!'}
                        </p>
                      </div>
                    )}
                    
                    {/* Maps Button (Optional extra touch) */}
                    {(selectedEvent.venue || selectedEvent.college) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedEvent.venue || selectedEvent.college || '') + ' Delhi')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <MapPin className="w-4 h-4" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Sticky Bottom Actions */}
                  <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex gap-3 sm:gap-4 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                    <a
                      href={selectedEvent.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => { if (!selectedEvent.url) e.preventDefault(); }}
                      className="flex-[2] bg-gray-900 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 hover:bg-black transition-all hover:-translate-y-0.5"
                    >
                      Register Now <ArrowRight className="w-4 h-4" />
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
                      className="flex-1 bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Share
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

const EventPosterCard: React.FC<{
  event: NewsItem;
  index: number;
  onClick: () => void;
  isDragging: boolean;
}> = ({ event, index, onClick, isDragging }) => {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const glow = GLOW_COLORS[index % GLOW_COLORS.length];
  const [imgError, setImgError] = useState(false);
  const hasImage = !!event.imageUrl && !imgError;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
        else onClick();
      }}
      className={`
        flex-shrink-0 w-[260px] sm:w-[320px] aspect-[4/5]
        rounded-[2rem] overflow-hidden
        relative group cursor-pointer
        border border-black/5 shadow-lg
        ${hasImage ? 'bg-gray-900' : `bg-gradient-to-br ${gradient}`}
      `}
      style={{
        boxShadow: `0 20px 40px -10px ${glow}, 0 10px 20px -5px rgba(0,0,0,0.1)`,
      }}
    >
      {/* Poster image */}
      {hasImage ? (
        <div className="absolute inset-0">
          <img
            src={event.imageUrl}
            alt={event.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ objectPosition: 'center' }}
            draggable={false}
          />
          {/* Very subtle overlay just for contrast on edges if needed, but keeping it mostly clear to show the creative */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br opacity-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.8)_0%,_transparent_70%)] pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight relative z-10 drop-shadow-md">
            {event.title}
          </h3>
          <span className="mt-4 px-4 py-2 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/30 relative z-10">
            {event.college || 'Event'}
          </span>
        </div>
      )}

      {/* Persistent 'Click to View' indicator on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px] z-20">
        <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 scale-95 group-hover:scale-100 transition-all duration-300">
          View Details
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};
