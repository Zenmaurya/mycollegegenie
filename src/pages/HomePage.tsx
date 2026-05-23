import React, { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useAnimation } from 'motion/react';
import { GraduationCap, FileText, PlayCircle, Search, Newspaper, ChevronRight, Users, Globe, Award, MessageSquare, ArrowRight, Sparkles, Building, Calendar, Zap } from 'lucide-react';
import { Resource, NewsItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { ResourceCard } from '../components/ResourceCard';
import { WavePath } from '../components/WavePath';
import { UpcomingEventsCarousel } from '../components/UpcomingEventsCarousel';

// ── Animated count-up hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref, suffix };
}

interface StatProps { end: number; suffix: string; label: string; sublabel: string; color: string; }
function CountUpStat({ end, suffix, label, sublabel, color }: StatProps) {
  const { count, ref } = useCountUp(end, 2200);
  const gradient = color === 'text-purple-400' ? 'from-purple-500 to-indigo-500'
    : color === 'text-blue-400' ? 'from-blue-500 to-cyan-500'
    : color === 'text-emerald-400' ? 'from-emerald-500 to-teal-500'
    : 'from-pink-500 to-rose-500';
  return (
    <div ref={ref} className="text-center relative z-10 flex flex-col items-center">
      {/* Number */}
      <div className="text-3xl sm:text-5xl font-black text-white tracking-tighter tabular-nums leading-none mb-1.5 sm:mb-2.5">
        {count.toLocaleString()}{suffix}
      </div>
      {/* Label */}
      <div className={`text-[9px] sm:text-xs uppercase tracking-[0.12em] font-black mb-1.5 sm:mb-2.5 ${color}`}>{label}</div>
      {/* Divider */}
      <div className={`w-6 sm:w-10 h-0.5 rounded-full bg-gradient-to-r ${gradient} mb-2 sm:mb-3`} />
      {/* Sublabel */}
      <div className="text-[10px] sm:text-sm text-gray-400 font-medium leading-snug max-w-[110px] sm:max-w-[150px]">{sublabel}</div>
    </div>
  );
}

// ── Elastic Draggable wrapper with float resume ───────────────────────────
interface DraggableCardProps {
  children: React.ReactNode;
  className?: string;
  floatY?: number;        // how many px to float up/down
  floatDuration?: number; // seconds for one float cycle
  floatDelay?: number;    // start delay
}
function DraggableCard({ children, className, floatY = 10, floatDuration = 4, floatDelay = 0 }: DraggableCardProps) {
  const controls = useAnimation();
  const [dragging, setDragging] = useState(false);

  const startFloat = () => {
    controls.start({
      y: [0, floatY, 0],
      transition: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }
    });
  };

  useEffect(() => { startFloat(); }, []);

  return (
    <div className={`absolute ${className ?? ''}`} style={{ width: 'fit-content' }}>
      <motion.div
        drag
        dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
        dragElastic={0.15}
        dragMomentum={false}
        animate={controls}
        whileDrag={{ scale: 1.07 }}
        onDragStart={() => { controls.stop(); setDragging(true); }}
        onDragEnd={() => {
          setDragging(false);
          controls.start({
            x: 0, y: 0,
            transition: { type: 'spring', stiffness: 280, damping: 18 }
          }).then(() => startFloat());
        }}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        className="will-change-transform select-none"
      >
        {children}
      </motion.div>
    </div>
  );
}

interface HomePageProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: any) => void;
  sortBy: 'Title' | 'Date' | 'Rating' | 'Course';
  setSortBy: (sort: 'Title' | 'Date' | 'Rating' | 'Course') => void;
  College_COURSES: string[];
  isNewsLoading: boolean;
  newsItems: NewsItem[];
  resources: Resource[];
  savedResourceIds: string[];
  onSave: (id: string) => void;
  getAverageRating: (ratings?: number[]) => number;
  setSelectedResource: (resource: Resource) => void;
  handleShare: (resource: Resource) => void;
  resultsRef?: React.RefObject<HTMLElement>;
  siteSettings: Record<string, string>;
}

export const HomePage: React.FC<HomePageProps> = ({
  isNewsLoading,
  newsItems,
  resources,
  savedResourceIds,
  onSave,
  getAverageRating,
  setSelectedResource,
  handleShare,
  resultsRef,
  siteSettings
}) => {
  const navigate = useNavigate();
  
  const getFeatureColors = (color: string) => {
    switch (color) {
      case 'purple': return { bg: 'bg-purple-50', text: 'text-purple-600' };
      case 'pink': return { bg: 'bg-pink-50', text: 'text-pink-600' };
      case 'orange': return { bg: 'bg-orange-50', text: 'text-orange-600' };
      default: return { bg: 'bg-purple-50', text: 'text-purple-600' };
    }
  };

  const transformedNewsItems = React.useMemo(() => {
    if (!siteSettings?.carousel_config) return newsItems;
    try {
      const config = JSON.parse(siteSettings.carousel_config);
      return newsItems.map(item => {
        const itemConfig = config[item.id];
        if (itemConfig) {
          return {
            ...item,
            imageUrl: itemConfig.imageUrl || item.imageUrl
          };
        }
        return item;
      }).filter(item => {
        if (item.category === 'Event') {
          const itemConfig = config[item.id];
          if (itemConfig && itemConfig.show === false) {
            return false;
          }
        }
        return true;
      });
    } catch (e) {
      console.error('Error parsing carousel_config:', e);
      return newsItems;
    }
  }, [newsItems, siteSettings?.carousel_config]);

    const renderHeadline = () => {
      const headline = siteSettings?.hero_headline || "Every College Student Deserves a Genie.";
      const words = headline.trim().split(/\s+/);
      if (words.length <= 1) {
        return (
          <h1 className="text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] block leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600">
            {headline}
          </h1>
        );
      }
      const lastWord = words.pop();
      const remainingText = words.join(' ');
      
      return (
        <div className="mb-4 sm:mb-5 font-black leading-[1] tracking-tighter text-gray-900">
          <h1 className="text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] block leading-[1.1] mb-2">
            {remainingText}
          </h1>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 mt-0.5">
            <span className="text-[2.4rem] sm:text-5xl md:text-6xl lg:text-[4rem] xl:text-[4.5rem] text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 leading-[1]">
              {lastWord}
            </span>
            <motion.span 
              className="text-[#D8B4FE] font-normal text-4xl sm:text-5xl inline-block -rotate-12"
              animate={{ rotate: [-12, 12, -12], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              ♡
            </motion.span>
          </div>
        </div>
      );
    };

    const isExternalLink = (url: string) => {
      return url.startsWith('http://') || url.startsWith('https://');
    };

    const ctaText = siteSettings?.hero_cta_text || "Explore Resources";
    const ctaLink = siteSettings?.hero_cta_link || "/browse";

    return (
      <div className="overflow-x-hidden">
        <Helmet>
          <title>MyCollegeGenie — India's Biggest Student Platform & Ecosystem</title>
          <meta name="description" content="Every College Student Deserves a Genie. From PYQs and notes to PGs, communities, campus exchange, and career opportunities. Join India's biggest student ecosystem." />
          <meta name="keywords" content="my college genie, college student ecosystem, DU notes, previous year question papers, find PG near college, campus events, university portal, notes se naukri takk" />
          <link rel="canonical" href="https://mycollegegenie.in/" />
          
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://mycollegegenie.in/" />
          <meta property="og:title" content="MyCollegeGenie — India's Biggest Student Platform & Ecosystem" />
          <meta property="og:description" content="Every College Student Deserves a Genie. From PYQs and notes to PGs, communities, campus exchange, and career opportunities." />
          <meta property="og:image" content="https://mycollegegenie.in/og-image.png" />
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="MyCollegeGenie — India's Biggest Student Platform & Ecosystem" />
          <meta name="twitter:description" content="Every College Student Deserves a Genie. From PYQs and notes to PGs, communities, campus exchange, and career opportunities." />
          <meta name="twitter:image" content="https://mycollegegenie.in/og-image.png" />
        </Helmet>
        {/* Hero Section */}
        <main className="relative min-h-[80vh] lg:min-h-[92vh] flex items-center pt-8 sm:pt-16 pb-10 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-transparent overflow-hidden">
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
  
          <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-12 gap-8 xl:gap-4 items-center">
            <div className="max-w-xl lg:max-w-none lg:col-span-5 text-center lg:text-left mx-auto lg:mx-0">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-[#EFEFFD] px-4 py-2 rounded-2xl mb-6 sm:mb-8 mx-auto lg:mx-0"
              >
                <GraduationCap className="w-4 h-4 text-[#4400FF]" />
                <span className="text-xs font-bold text-[#4400FF]">A platform students are building together</span>
              </motion.div>
  
              {renderHeadline()}
  
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-base sm:text-lg lg:text-lg text-gray-600 w-full mb-5 leading-relaxed font-medium px-2 sm:px-0 text-center lg:text-left lg:pr-8 xl:pr-16"
              >
                {siteSettings?.hero_subtext || "From PYQs and notes to PGs, communities, campus exchange, and career opportunities. My College Genie is your all-in-one companion for every chapter of college life. We started with DU. Now we're building India's biggest student ecosystem — connecting every student, every college, every city under one platform."}
                <span className="block whitespace-nowrap mt-1.5 font-semibold tracking-tight text-gray-900">
                  One platform. Million students. Endless possibilities.
                </span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="mb-5 sm:mb-6"
              >
                <span className="font-['Caveat',cursive] italic text-2xl sm:text-3xl text-gray-800 border-b-2 border-pink-500 pb-1 px-1">Notes Se Naukri Takk.</span>
              </motion.div>
  
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                {isExternalLink(ctaLink) ? (
                  <a 
                    href={ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-[240px] bg-[#4400FF] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-[#3300CC] hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Search className="w-5 h-5" />
                    {ctaText}
                  </a>
                ) : (
                  <Link 
                    to={ctaLink}
                    className="w-full sm:w-[240px] bg-[#4400FF] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-[#3300CC] hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Search className="w-5 h-5" />
                    {ctaText}
                  </Link>
                )}
                <a href="https://www.linkedin.com/company/my-college-genie/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-[240px] bg-white text-[#4400FF] border border-gray-200 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                  <Users className="w-5 h-5" />
                  Join Our Team
                </a>
              </motion.div>
            </div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:flex items-center justify-center h-[500px] xl:h-[650px] w-full mt-0 lg:col-span-7"
          >
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] xl:w-[600px] h-[450px] xl:h-[600px] bg-purple-100 rounded-full blur-[80px] -z-10" />
            
            {/* Central Image */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <img 
                src="/hero-students.webp" 
                alt="Students using My College Genie" 
                className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm scale-[1.05] xl:scale-[1.1] origin-center"
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
            </div>

            {/* Floating Cards */}
            {/* Notes & Study Material — floats up -10px, 4s */}
            <DraggableCard className="top-[10%] left-[0%] hidden lg:block z-20" floatY={-10} floatDuration={4} floatDelay={0}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">Notes &<br/>Study Material</span>
              </div>
            </DraggableCard>

            {/* PYQs — floats down 15px, 5s */}
            <DraggableCard className="top-[5%] right-[20%] hidden lg:block z-20" floatY={15} floatDuration={5} floatDelay={1}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">PYQs</span>
              </div>
            </DraggableCard>

            {/* Curated Playlists — floats up -12px, 4.5s */}
            <DraggableCard className="top-[20%] -right-[5%] hidden lg:block z-20" floatY={-12} floatDuration={4.5} floatDelay={2}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">Curated<br/>Playlists</span>
              </div>
            </DraggableCard>

            {/* Communities & Forums — floats down 10px, 4.2s */}
            <DraggableCard className="top-[45%] -right-[15%] hidden lg:block z-20" floatY={10} floatDuration={4.2} floatDelay={1.5}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">Communities<br/>& Forums</span>
              </div>
            </DraggableCard>

            {/* Find PGs — floats up -8px, 3.8s */}
            <DraggableCard className="top-[40%] -left-[10%] hidden lg:block z-20" floatY={-8} floatDuration={3.8} floatDelay={0.5}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Building className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">Find PGs</span>
              </div>
            </DraggableCard>

            {/* Campus Exchange — floats down 12px, 5.5s */}
            <DraggableCard className="bottom-[10%] -left-[15%] z-20 hidden lg:block" floatY={12} floatDuration={5.5} floatDelay={2.5}>
              <div className="bg-white px-5 py-4 rounded-2xl shadow-lg border border-gray-100 max-w-[220px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <div className="w-4 h-4 text-green-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-800">Campus Exchange</span>
                  <span className="bg-[#FF0080] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full ml-auto">NEW</span>
                </div>
                <p className="text-xs text-gray-500 leading-tight">Buy, sell, exchange or donate anything related to college life.</p>
              </div>
            </DraggableCard>

            {/* Jobs & Internships — floats up -15px, 4.8s */}
            <DraggableCard className="bottom-[15%] -right-[15%] hidden lg:block z-20" floatY={-15} floatDuration={4.8} floatDelay={1.2}>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Award className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-bold text-gray-800">Jobs & Internships<br/>Coming Soon</span>
              </div>
            </DraggableCard>

          </motion.div>
        </div>
      </main>

      {/* ── Upcoming Events Section ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-10 gap-3">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#4400FF] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4"
            >
              <Zap className="w-3 h-3" />
              Upcoming Events
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight"
            >
              Don&apos;t Miss What&apos;s{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 italic">
                Happening
              </span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/events"
              className="flex items-center gap-2 text-[11px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-800 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              View All Events
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Carousel */}
        <UpcomingEventsCarousel newsItems={transformedNewsItems} isLoading={isNewsLoading} />

      </section>

      {/* Latest Updates Section */}
      <div className="mb-2 sm:mb-4 w-full relative z-50 hidden sm:block">
        <WavePath className="text-black" />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pt-8 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-10 gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Latest Updates</h2>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* News Column */}
          <div className="space-y-4">
            {isNewsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 animate-pulse h-20" />
              ))
            ) : newsItems.filter(n => {
                if (n.category === 'Event') return false;
                const itemDate = new Date(n.createdAt);
                if (!isNaN(itemDate.getTime())) {
                  const twoMonthsAgo = new Date();
                  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                  return itemDate >= twoMonthsAgo;
                }
                return true;
              }).length > 0 ? (
              newsItems.filter(n => {
                if (n.category === 'Event') return false;
                const itemDate = new Date(n.createdAt);
                if (!isNaN(itemDate.getTime())) {
                  const twoMonthsAgo = new Date();
                  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                  return itemDate >= twoMonthsAgo;
                }
                return true;
              }).slice(0, 3).map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 10 }}
                  className="bg-white border border-gray-100 rounded-2xl p-4 transition-all cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-xl hover:shadow-purple-600/5 group"
                  onClick={() => navigate(`/news?news=${encodeURIComponent(item.title)}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">News</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 font-medium">
                      {item.summary}
                    </p>
                    {item.college && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-purple-600">
                        <GraduationCap className="w-3 h-3" />
                        {item.college}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
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
                  className="bg-white border border-gray-100 rounded-2xl p-4 transition-all cursor-pointer flex items-start gap-4 shadow-sm hover:shadow-xl hover:shadow-pink-600/5 group"
                  onClick={() => navigate(`/events?event=${encodeURIComponent(item.title)}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">Event</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.date}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 font-medium">
                      {item.summary}
                    </p>
                    {item.college && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-pink-600">
                        <GraduationCap className="w-3 h-3" />
                        {item.college}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-pink-600 group-hover:text-white transition-all">
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
      <section ref={resultsRef} id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-[3rem] mb-8 sm:mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-10 px-2 sm:px-6 gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] sm:rounded-[1.5rem] bg-orange-100 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Top Resources</h2>
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
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-2 sm:px-6">
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
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center bg-purple-900 rounded-2xl sm:rounded-[3rem] p-5 sm:p-10 lg:p-20 relative overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center lg:text-left">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/30 flex items-center justify-center mb-4 sm:mb-6 backdrop-blur-xl border border-purple-400/30 mx-auto lg:mx-0">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-5 tracking-tight leading-tight">
              Join the <br className="hidden sm:block" />
              <span className="text-purple-300">Student Community</span>
            </h2>
            <p className="text-sm sm:text-base text-purple-100/80 mb-5 sm:mb-8 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 px-1 sm:px-0">
              Connect with fellow students, ask questions about courses, discuss exam strategies, and share your academic journey.
            </p>
            <Link 
              to="/forum"
              className="inline-flex items-center justify-center gap-3 px-6 sm:px-10 py-3 sm:py-5 bg-white text-purple-900 rounded-2xl font-black text-sm sm:text-lg hover:bg-purple-50 transition-all shadow-2xl shadow-black/20 group w-full sm:w-auto"
            >
              Go to Forum
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative z-10 grid gap-3 sm:gap-5">
            {[
              { title: 'How to prepare for Microeconomics?', author: 'Rahul S.', replies: 12, time: '2h ago' },
              { title: 'Best books for Corporate Accounting?', author: 'Priya M.', replies: 8, time: '5h ago' },
              { title: 'Internal Assessment dates for Hansraj?', author: 'Amit K.', replies: 15, time: '1d ago' }
            ].map((post, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 10 }}
                className="bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:p-5 rounded-2xl hover:bg-white/20 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-200 transition-colors line-clamp-1">{post.title}</h3>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 mb-8 sm:mb-16">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2 sm:mb-4 tracking-tight">Why Students Love Us</h2>
          <p className="text-sm sm:text-base text-gray-500 font-medium px-2 sm:px-0">We're building the most comprehensive resource platform for college students.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {[
            { icon: Users, title: 'Community Driven', desc: 'Resources uploaded and verified by students from top colleges.', color: 'purple' },
            { icon: Globe, title: 'Always Accessible', desc: 'Access your notes and PYQs anytime, anywhere, on any device.', color: 'pink' },
            { icon: Award, title: 'Quality Content', desc: 'Only the best, high-quality resources make it to our platform.', color: 'orange' },
          ].map((feature, i) => {
            const colors = getFeatureColors(feature.color);
            return (
              <div key={i} className="bg-white border border-gray-100 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-md shadow-gray-900/5 hover:shadow-xl transition-all group">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${colors.bg} flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-5 h-5 sm:w-7 sm:h-7 ${colors.text}`} />
                </div>
                <h3 className="text-base sm:text-xl font-black text-gray-900 mb-2 sm:mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-12">
        <div className="bg-gray-900 rounded-2xl sm:rounded-3xl px-5 py-7 sm:px-12 sm:py-10 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-10 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
          </div>
          
          {(() => {
            const parseStatValue = (val: string | undefined, defaultEnd: number, defaultSuffix: string) => {
              if (!val) return { end: defaultEnd, suffix: defaultSuffix };
              const cleanVal = val.replace(/,/g, '');
              const numMatch = cleanVal.match(/^(\d+(?:\.\d+)?)/);
              if (!numMatch) return { end: defaultEnd, suffix: defaultSuffix };
              const end = parseFloat(numMatch[1]);
              const suffix = cleanVal.substring(numMatch[1].length);
              return { end, suffix };
            };

            const notesStat = parseStatValue(siteSettings?.stats_notes, 10, 'k+');
            const studentsStat = parseStatValue(siteSettings?.stats_students, 25, 'k+');
            const collegesStat = parseStatValue(siteSettings?.stats_colleges, 70, '+');
            const pyqsStat = parseStatValue(siteSettings?.stats_pyqs, 5, 'k+');

            return [
              { end: notesStat.end, suffix: notesStat.suffix, label: 'Resources', sublabel: 'Someone uploaded exactly what you need. Just now.', color: 'text-purple-400' },
              { end: studentsStat.end, suffix: studentsStat.suffix, label: 'Active Users', sublabel: "You're not studying alone anymore.", color: 'text-blue-400' },
              { end: collegesStat.end, suffix: collegesStat.suffix, label: 'Colleges', sublabel: 'Your college is already here. Are you?', color: 'text-emerald-400' },
              { end: pyqsStat.end, suffix: pyqsStat.suffix, label: 'PYQs', sublabel: 'Stop searching. Start solving.', color: 'text-pink-400' },
            ].map((stat, i) => (
              <div key={i}>
                <CountUpStat end={stat.end} suffix={stat.suffix} label={stat.label} sublabel={stat.sublabel} color={stat.color} />
              </div>
            ));
          })()}
        </div>
      </section>
    </div>
  );
};
