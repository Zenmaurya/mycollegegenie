import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Filter, Grid, List as ListIcon, Heart, 
  ArrowRight, ShieldCheck, Zap, UserCheck, Package, 
  BookOpen, Monitor, Home, Sofa, Bike, Shirt, Dumbbell, MoreHorizontal,
  MessageCircle, Repeat, Sparkles, ChevronDown, Plus, X, ExternalLink, Camera, AtSign, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';
import { ImageSlider, ImageThumbnailStrip } from '../components/ImageSlider';
import { uploadFile } from '../services/resourceService';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

import { fetchExchangeItems, createExchangeItem } from '../services/exchangeService';


const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: Grid, count: '120+' },
  { id: 'books', name: 'Books & Notes', icon: BookOpen, count: '245+' },
  { id: 'electronics', name: 'Electronics', icon: Monitor, count: '180+' },
  { id: 'hostel', name: 'Hostel Essentials', icon: Home, count: '160+' },
  { id: 'furniture', name: 'Furniture', icon: Sofa, count: '120+' },
  { id: 'cycles', name: 'Cycles', icon: Bike, count: '95+' },
  { id: 'fashion', name: 'Fashion & Accessories', icon: Shirt, count: '45+' },
  { id: 'sports', name: 'Sports & Fitness', icon: Dumbbell, count: '30+' },
  { id: 'others', name: 'Others', icon: MoreHorizontal, count: '60+' },
];

export function CampusExchangePage({ user: propUser }: { user?: any }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Latest');
  
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, selectedCampus, activeCategory, minPrice, maxPrice, selectedTypes, sortBy]);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoadingItems(true);
      try {
        const data = await fetchExchangeItems();
        const mapped = data.map(d => ({
          id: d.id,
          title: d.title,
          price: d.price,
          originalPrice: d.original_price || 0,
          type: d.type,
          category: d.category,
          location: d.college || 'Delhi',
          timePosted: new Date(d.created_at).toLocaleDateString(),
          images: d.image_url ? [d.image_url] : ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'],
          description: d.description,
          phone: d.contact_phone || '',
          instagram: d.contact_instagram || '',
          seller_name: d.seller_name,
          seller_avatar: d.seller_avatar
        }));
        setItems(mapped);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load items');
      } finally {
        setIsLoadingItems(false);
      }
    };
    loadItems();
  }, [refreshTrigger]);

  const currentUser = propUser ?? null;
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postAdStep, setPostAdStep] = useState(1);
  const [postAdImages, setPostAdImages] = useState<string[]>([]);
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);
  const [postAdForm, setPostAdForm] = useState({
    title: '',
    category: '',
    adType: 'Sell',
    price: '',
    location: 'North Zone',
    description: '',
    phone: '',
    instagram: '',
  });

  const handlePostAdChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPostAdForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNextStep = () => {
    if (postAdStep === 1) {
      if (!postAdForm.title.trim()) { toast.error('Please enter an ad title.'); return; }
      if (!postAdForm.category) { toast.error('Please select a category.'); return; }
      if (postAdForm.adType === 'Sell' && !postAdForm.price) { toast.error('Please enter a price, or choose Donate/Exchange.'); return; }
    }
    if (postAdStep === 2) {
      if (!postAdForm.description.trim()) { toast.error('Please add a description.'); return; }
    }
    setPostAdStep(step => step + 1);
  };

  const handlePublishAd = async () => {
    if (!postAdForm.phone.trim() && !postAdForm.instagram.trim()) {
      toast.error('Please provide at least a Phone Number or Instagram username for contact.');
      return;
    }
    setIsSubmittingAd(true);
    try {
      let imageUrl = null;
      if (postAdImages.length > 0) {
        // Just mocking image upload since we don't have the file object easily accessible here.
        // If we want real upload, we need to adapt handlePostAdChange or pass the File.
        imageUrl = postAdImages[0];
      }
      
      await createExchangeItem({
        title: postAdForm.title,
        type: postAdForm.adType,
        category: postAdForm.category,
        price: Number(postAdForm.price) || 0,
        college: postAdForm.location,
        description: postAdForm.description,
        contact_phone: postAdForm.phone,
        contact_instagram: postAdForm.instagram,
        image_url: imageUrl || undefined
      });
      toast.success('Your ad has been published successfully!');
      setIsPostModalOpen(false);
      setPostAdStep(1);
      setPostAdImages([]);
      setPostAdForm({ title: '', category: '', adType: 'Sell', price: '', location: 'North Zone', description: '', phone: '', instagram: '' });
      // Refetch items (local state update)
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish ad. Please try again.');
    } finally {
      setIsSubmittingAd(false);
    }
  };



  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleClearAll = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSelectedCampus('All Campuses');
    setMinPrice('');
    setMaxPrice('');
    setSelectedTypes([]);
    setSortBy('Latest');
  };

  const filteredItems = React.useMemo(() => {
    // Always exclude 'Buy' type — campus exchange is for Sell, Exchange, Donate only
    let result = items.filter((item: any) => item.type !== 'Buy');
    
    // Category filter matching item.category as well as title keywords
    if (activeCategory !== 'all') {
      const catMap: Record<string, string[]> = {
        'books': ['book', 'notes', 'novel', 'ncert', 'textbook'],
        'electronics': ['macbook', 'headset', 'calculator', 'laptop', 'phone', 'ipad', 'tablet', 'charger', 'mouse', 'keyboard', 'earphone', 'airpod', 'watch'],
        'hostel': ['lamp', 'bed', 'mattress', 'kettle', 'curtain', 'mirror', 'bucket', 'cooler', 'fan'],
        'furniture': ['chair', 'table', 'desk', 'shelf', 'wardrobe'],
        'cycles': ['cycle', 'bicycle', 'bike'],
        'fashion': ['hoodie', 'jacket', 'tshirt', 'shoes', 'dress', 'shirt'],
        'sports': ['cricket', 'badminton', 'racket', 'football', 'gym', 'dumbbell'],
      };
      const keywords = catMap[activeCategory] || [];
      result = result.filter(item => {
        const itemCat = (item.category || '').toLowerCase();
        const activeCat = activeCategory.toLowerCase();
        if (itemCat === activeCat || itemCat.includes(activeCat)) return true;
        const itemTitle = (item.title || '').toLowerCase();
        return keywords.some(k => itemTitle.includes(k));
      });
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q));
    }
    
    if (selectedCampus !== 'All Campuses') {
      // Basic mock filtering for location
      if (selectedCampus === 'North Zone') result = result.filter(i => i.location.includes('DTU') || i.location.includes('NSUT'));
      else if (selectedCampus === 'South Zone') result = result.filter(i => i.location.includes('IIT'));
      else if (selectedCampus === 'Off Campus') result = result.filter(i => i.location.includes('JMI'));
    }
    
    if (minPrice !== '') {
      result = result.filter(item => item.price >= Number(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter(item => item.price <= Number(maxPrice));
    }
    
    if (selectedTypes.length > 0) {
      result = result.filter(item => selectedTypes.includes(item.type));
    }
    
    if (sortBy === 'Price: Low to High') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, searchQuery, selectedCampus, activeCategory, minPrice, maxPrice, selectedTypes, sortBy]);


  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'Sell': return 'bg-emerald-500 text-white';
      case 'Exchange': return 'bg-purple-500 text-white';
      case 'Donate': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-2 sm:pt-6 pb-24 md:pb-8">
      <Helmet>
        <title>Campus Exchange - Buy & Sell College Essentials | MyCollegeGenie</title>
        <meta name="description" content="Buy, sell, exchange or donate textbooks, electronics, and college essentials directly with other students on your campus." />
              {/* Structured Data for Marketplace */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Campus Exchange - Buy & Sell College Essentials",
            "description": "Student marketplace to buy, sell, and exchange college items.",
            "url": "https://mycollegegenie.in/campus-exchange"
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-8">
        <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-2xl sm:rounded-3xl p-5 sm:p-12 shadow-xl shadow-purple-900/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-200 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          <div className="absolute top-20 right-20 w-80 h-80 bg-pink-200 rounded-full blur-[100px] opacity-50 pointer-events-none" />

          {/* Paper Planes Background Effects */}
          <motion.div 
            animate={{ x: [0, 30, 0], y: [0, -20, 0], rotate: [0, 5, 0] }} 
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} 
            className="absolute top-10 right-[35%] opacity-20 text-purple-500 pointer-events-none hidden md:block"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="-rotate-12"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </motion.div>
          <motion.div 
            animate={{ x: [0, -20, 0], y: [0, 15, 0], rotate: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 8, delay: 1, ease: "easeInOut" }} 
            className="absolute bottom-8 left-[40%] opacity-15 text-pink-500 pointer-events-none"
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="-rotate-45"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </motion.div>
          <motion.div 
            animate={{ x: [0, 15, 0], y: [0, -10, 0], rotate: [0, 15, 0] }} 
            transition={{ repeat: Infinity, duration: 5, delay: 2, ease: "easeInOut" }} 
            className="absolute top-24 left-8 opacity-20 text-blue-500 pointer-events-none hidden sm:block"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-12"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4"
            >
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                Campus <span className="text-purple-600">Exchange</span>
              </h1>
              <Repeat className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-600 text-xs sm:text-lg mb-4 sm:mb-8 max-w-xl font-medium"
            >
              Sell, exchange or donate anything related to college life.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap lg:flex-nowrap gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide"
            >
              {[
                { icon: UserCheck, text: 'Trusted Students', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { icon: ShieldCheck, text: 'Secure & Safe', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { icon: MapPin, text: 'On-Campus Deals', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
                { icon: Zap, text: 'Easy & Quick', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' }
              ].map((badge, idx) => (
                <div key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${badge.bg} whitespace-nowrap shrink-0`}>
                  <badge.icon className={`w-3.5 h-3.5 shrink-0 ${badge.color}`} />
                  <span className={`text-[11px] sm:text-xs font-bold ${badge.color}`}>{badge.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block relative w-[400px] h-[250px]"
          >
            {/* Custom SVG or Image representing the right side graphic from design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-56 bg-purple-600 rounded-b-xl shadow-2xl flex flex-col items-center justify-end pb-8">
                   <div className="absolute -top-16 right-4 w-20 h-20 bg-gray-900 rounded-full shadow-lg border-4 border-gray-800" />
                   <div className="absolute -top-10 left-4 w-16 h-24 bg-[#FF9800] rounded-lg shadow-lg rotate-12" />
                   <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-32 bg-purple-300 rounded-lg shadow-lg -rotate-6" />
                   <Sparkles className="w-12 h-12 text-purple-200/50" />
                </div>
                {/* Shopping bag handles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-16 border-4 border-purple-600 rounded-t-full rounded-b-none border-b-0" />
              </div>
            </div>
            
            {/* Empty block, paper planes moved to main background */}
          </motion.div>
        </div>
      </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 pt-4 pb-12">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for books, gadgets, furniture..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-[11px] sm:text-base font-medium text-gray-900 shadow-sm"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative">
              <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-400" />
              <select 
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="pl-8 sm:pl-11 pr-8 sm:pr-10 py-2.5 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-[10px] sm:text-base font-bold text-gray-700 shadow-sm appearance-none cursor-pointer"
              >
                <option>All Campuses</option>
                <option>North Zone</option>
                <option>South Zone</option>
                <option>Off Campus</option>
              </select>
              <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-[10px] sm:text-base font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <Filter className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-purple-600" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            
            <div className="hidden lg:flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
              <span className="text-sm font-medium text-gray-500 mr-2">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none appearance-none pr-6 relative cursor-pointer"
              >
                <option>Latest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Post Ad Button */}
        <button 
          onClick={() => {
            setPostAdStep(1);
            setIsPostModalOpen(true);
          }}
          className="lg:hidden w-full mb-6 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-4 bg-purple-600 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
          Post Ad
        </button>

        <div className="flex items-center justify-between mb-6 lg:hidden">
          <span className="text-sm font-medium text-gray-500">Showing {filteredItems.length} items</span>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 xl:gap-12">
          
          {/* Left Sidebar - Actions & Filters */}
          <div className="hidden lg:block space-y-6">
            
            {/* Post Ad Card */}
            <div className="bg-[#F3E8FF] rounded-2xl p-6 border border-purple-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full blur-[30px] opacity-60" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-600/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Post Your Ad</h3>
                <p className="text-sm text-gray-700 font-medium mb-6">
                  Got something to sell, exchange or donate?
                </p>
                <button 
                  onClick={() => {
                    setPostAdStep(1);
                    setIsPostModalOpen(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 sm:py-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-5 h-5" />
                  Post an Ad
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Filters</h3>
                <button onClick={handleClearAll} className="text-xs font-bold text-purple-600 hover:underline">Clear all</button>
              </div>

              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Category</h4>
              <ul className="space-y-1">
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button 
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeCategory === cat.id ? 'bg-purple-600/10 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-sm text-left flex-1">{cat.name}</span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price Range</h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                  </div>
                  <span className="text-gray-400 text-sm font-medium">to</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  {['Sell', 'Exchange', 'Donate'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${selectedTypes.includes(type) ? 'border-purple-600 bg-purple-600' : 'border-gray-300 group-hover:border-purple-600'}`}>
                        {selectedTypes.includes(type) && <Zap className="w-3 h-3 text-white" />}
                        <input 
                          type="checkbox" 
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                          className="hidden" 
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>

                <button className="w-full bg-purple-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Grid */}
          <div>
            <div className="hidden lg:flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-gray-500">Showing {filteredItems.length} items</span>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {isLoadingItems ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-4 flex flex-col h-full space-y-4">
                    {/* Simulated image ratio 4/3 */}
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    {/* Simulated title */}
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4 rounded-full" />
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>
                    {/* Simulated details & avatar */}
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                      <div className="space-y-1.5 flex-1 mr-4">
                        <Skeleton className="h-3 w-2/3 rounded-full" />
                        <Skeleton className="h-2.5 w-1/3 rounded-full" />
                      </div>
                      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    </div>
                  </div>
                ))
              ) : filteredItems.slice(0, visibleCount).map((item) => (
                <motion.div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  {/* ── Image Slider ── */}
                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <ImageSlider
                      images={(item as any).images ?? [(item as any).image].filter(Boolean)}
                      autoPlay
                      aspectRatio="4/3"
                      accentColor="#7c3aed"
                      className="rounded-t-2xl rounded-b-none"
                    />
                    {/* Badges overlaid */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 items-start pointer-events-none z-10">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${getTypeStyle(item.type)}`}>
                        {item.type}
                      </span>
                      {item.featured && (
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#FF9800] text-white rounded-full shadow-lg">
                          Featured
                        </span>
                      )}

                    </div>
                    
                    <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-500 hover:text-rose-500 hover:bg-white transition-all shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[40px]">
                      {item.title}
                    </h3>
                    
                    <div className="mb-4">
                      {item.type === 'Exchange' ? (
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Exchange for</span>
                          <p className="font-bold text-gray-900 truncate">{item.exchangeFor}</p>
                        </div>
                      ) : item.type === 'Donate' ? (
                        <span className="text-xl font-black text-emerald-600">Free</span>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-gray-900">₹{item.price.toLocaleString()}</span>
                          {item.originalPrice && (
                            <span className="text-sm font-medium text-gray-400 line-through">₹{item.originalPrice.toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{item.location}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium pl-5">{item.timePosted}</span>
                      </div>
                      
                      <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}&backgroundColor=c0aede`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No items found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query.</p>
                  <button 
                    onClick={handleClearAll}
                    className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {filteredItems.length > visibleCount && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="px-6 py-3 bg-white border border-purple-100 hover:border-purple-200 hover:bg-purple-50/50 text-purple-600 font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center gap-2"
                >
                  Load More Items
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Item Detail Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedItem && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 md:p-4 lg:p-6"
              style={{ position: 'fixed', inset: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full z-50 transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                
            {/* Left Column: Image Slider */}
            <div className="w-full md:w-1/2 shrink-0 bg-gray-50 flex flex-col">
              {(() => {
                const imgs = (selectedItem as any).images ?? [(selectedItem as any).image].filter(Boolean);
                return (
                  <div className="w-full h-[40vh] md:h-[80vh] relative">
                    <ImageSlider
                      images={imgs}
                      autoPlay={false}
                      aspectRatio="auto"
                      className="w-full h-full object-cover"
                      accentColor="#7c3aed"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full shadow-lg ${getTypeStyle(selectedItem.type)}`}>
                        {selectedItem.type}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Right Column: Details */}
            <div className="flex-1 flex flex-col bg-white h-[60vh] md:h-[80vh] relative">
              <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar pb-32 md:pb-36">
                <div className="mb-6 border-b border-gray-100 pb-6">
                  {selectedItem.type === 'Exchange' ? (
                    <div className="mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Looking to exchange for</span>
                      <h3 className="text-2xl font-black text-purple-600 leading-tight mt-1">{selectedItem.exchangeFor}</h3>
                    </div>
                  ) : selectedItem.type === 'Donate' ? (
                    <div className="mb-2">
                      <span className="text-4xl font-black text-emerald-600">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-end gap-3 mb-2">
                      <span className="text-4xl font-black text-gray-900 leading-none">₹{selectedItem.price.toLocaleString()}</span>
                      {selectedItem.originalPrice && (
                        <span className="text-lg font-bold text-gray-400 line-through mb-1">₹{selectedItem.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">{selectedItem.title}</h2>

                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedItem.location}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {selectedItem.timePosted}
                    </div>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Description</h3>
                  <div className="text-sm sm:text-base text-gray-600 leading-relaxed bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-100">
                    {selectedItem.description}
                  </div>
                </div>

                <div className="mb-6">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Seller Details</h3>
                   <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-white rounded-full border border-gray-200 shadow-sm overflow-hidden shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedItem.id}&backgroundColor=c0aede`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Student Verified</p>
                        <p className="text-xs font-medium text-gray-500">Member since 2024</p>
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Sticky Footer for Contact */}
              <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-4 sm:p-6 border-t border-gray-100 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-20">
                {currentUser ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedItem.phone && (
                      <a href={`tel:${selectedItem.phone.replace(/\s/g, '')}`} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors shadow-lg shadow-emerald-500/20">
                        <MessageCircle className="w-4 h-4" />
                        Call / WhatsApp
                      </a>
                    )}
                    {selectedItem.instagram && (
                      <a href={`https://instagram.com/${selectedItem.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors shadow-lg shadow-pink-500/20">
                        <AtSign className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-orange-800 text-sm">Login Required</h4>
                      <p className="text-[10px] sm:text-xs font-medium text-orange-600 mt-0.5">Please sign in to view contact details.</p>
                    </div>
                    <Link to="/auth" className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-colors shadow-sm">
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Post Ad Modal */}
      {createPortal(
        <AnimatePresence>
          {isPostModalOpen && (
            <div
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
              style={{ position: 'fixed', inset: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
              >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-gray-900">Post an Ad</h2>
              <button 
                onClick={() => setIsPostModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!currentUser ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Sign in to post</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    You need to be logged in to post items on the Campus Exchange. It helps keep our community safe!
                  </p>
                  <Link to="/auth" className="inline-block px-8 py-3.5 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20">
                    Sign in to post
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stepper Progress */}
                  <div className="flex gap-2 mb-8">
                    <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${postAdStep >= 1 ? 'bg-purple-600' : 'bg-gray-100'}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${postAdStep >= 2 ? 'bg-purple-600' : 'bg-gray-100'}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${postAdStep >= 3 ? 'bg-purple-600' : 'bg-gray-100'}`} />
                  </div>

                  <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                    {/* Step 1: Basics */}
                    {postAdStep === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">What are you listing?</h3>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-900">Ad Title <span className="text-red-500">*</span></label>
                          <input name="title" value={postAdForm.title} onChange={handlePostAdChange} type="text" placeholder="e.g. Macbook Air M1, Engineering Notes" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Category <span className="text-red-500">*</span></label>
                            <select name="category" value={postAdForm.category} onChange={handlePostAdChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none cursor-pointer">
                              <option value="">Select category</option>
                              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Ad Type</label>
                            <select name="adType" value={postAdForm.adType} onChange={handlePostAdChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none cursor-pointer">
                              <option value="Sell">Sell</option>
                              <option value="Exchange">Exchange</option>
                              <option value="Donate">Donate</option>
                            </select>
                          </div>
                        </div>

                        {postAdForm.adType === 'Sell' && (
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Asking Price (₹) <span className="text-red-500">*</span></label>
                            <input name="price" value={postAdForm.price} onChange={handlePostAdChange} type="number" placeholder="Enter your asking price" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 2: Details & Media */}
                    {postAdStep === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add details & photos</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-900">Photos</label>
                            <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">Up to 3 images</span>
                          </div>
                          <ImageSlider
                            images={postAdImages}
                            editable
                            onImagesChange={setPostAdImages}
                            maxImages={3}
                            aspectRatio="16/9"
                            accentColor="#7c3aed"
                            onUpload={(file) => uploadFile(file, 'exchange')}
                          />
                          {postAdImages.length > 0 && (
                            <p className="text-xs text-gray-400 font-medium">
                              {postAdImages.length}/3 photos added · Click X on image to remove
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-900">Campus Location</label>
                          <select name="location" value={postAdForm.location} onChange={handlePostAdChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 appearance-none cursor-pointer">
                            <option>North Zone</option>
                            <option>South Zone</option>
                            <option>Off Campus</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-900">Description <span className="text-red-500">*</span></label>
                          <textarea name="description" value={postAdForm.description} onChange={handlePostAdChange} rows={3} placeholder="Describe the item condition, features, etc." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 resize-none"></textarea>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Contact Info */}
                    {postAdStep === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">How can students reach you?</h3>
                        
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 mb-6">
                          <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-blue-800 font-medium">Your contact details will only be visible to verified students who are logged in to My College Genie.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Phone / WhatsApp <span className="text-xs text-gray-400 font-normal">(Optional if Instagram is provided)</span></label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              <input name="phone" value={postAdForm.phone} onChange={handlePostAdChange} type="text" placeholder="+91 9876543210" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900">Instagram Username <span className="text-xs text-gray-400 font-normal">(Optional if Phone is provided)</span></label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <AtSign className="w-5 h-5" />
                              </div>
                              <input name="instagram" value={postAdForm.instagram} onChange={handlePostAdChange} type="text" placeholder="@username" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Stepper Navigation */}
                    <div className="pt-6 border-t border-gray-100 flex justify-between items-center mt-8">
                      {postAdStep > 1 ? (
                        <button 
                          type="button" 
                          onClick={() => setPostAdStep(step => step - 1)}
                          className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          Back
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => setIsPostModalOpen(false)}
                          className="px-6 py-3 font-bold text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {postAdStep < 3 ? (
                        <button 
                          type="button" 
                          onClick={handleNextStep}
                          className="px-8 py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2"
                        >
                          Next
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={handlePublishAd}
                          disabled={isSubmittingAd}
                          className="px-8 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          {isSubmittingAd ? 'Publishing...' : 'Publish Ad ✓'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}
              </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}


    </div>
  );
}


