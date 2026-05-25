import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, IndianRupee, Search, Plus, X, MessageCircle, GraduationCap, Info, Trash2, Building, ChevronDown, ChevronRight, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { PGListing } from '../types';
import type { SupabaseAuthUser } from '../types';
import { createPGListing, getPGListings, deletePGListing } from '../services/pgService';
import { uploadFile } from '../services/resourceService';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ImageSlider, getOptimizedCloudinaryUrl } from '../components/ImageSlider';
import { Camera, Loader2, X as XIcon } from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { VerificationApplyModal } from '../components/VerificationApplyModal';
import { Skeleton } from '../components/ui/skeleton';

export const FindPGPage: React.FC<{ user?: any }> = ({ user: propUser }) => {
  const [listings, setListings] = useState<PGListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<PGListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const currentUser = propUser ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [verifyModal, setVerifyModal] = useState<{ id: string; title: string } | null>(null);
  const [newListing, setNewListing] = useState({
    college: '',
    location: '',
    budget: '',
    gender: 'Male' as 'Male' | 'Female' | 'Any',
    description: '',
    contactPhone: '',
    contactSocial: '',
    images: [] as string[]
  });
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchQuery, genderFilter]);


  useEffect(() => {
    setFetchError(null);
    setIsLoading(true);
    const unsubscribe = getPGListings(
      (data) => {
        setListings(data);
        setIsLoading(false);
      },
      undefined,
      undefined,
      (err) => {
        console.error('[FindPGPage] failed to load listings:', err);
        setFetchError('Could not load listings. Please check your connection and try again.');
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.college.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'All' || l.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const handlePostListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please sign in to post a listing.');
      return;
    }

    if (!newListing.contactPhone.trim() && !newListing.contactSocial.trim()) {
      toast.error('Please provide at least a Phone Number or a Social Media Link for contact.');
      return;
    }

    const combinedContact = [newListing.contactPhone.trim(), newListing.contactSocial.trim()].filter(Boolean).join(' || ');

    try {
      await createPGListing({
        college: newListing.college,
        location: newListing.location,
        budget: newListing.budget,
        gender: newListing.gender,
        description: newListing.description,
        socialLink: combinedContact,
        images: newListing.images
      });
      toast.success('Listing posted successfully!');
      setIsPostModalOpen(false);
      setNewListing({ 
        college: '', 
        location: '', 
        budget: '', 
        gender: 'Male', 
        description: '', 
        contactPhone: '',
        contactSocial: '',
        images: []
      });
    } catch (error) {
      console.error('Error posting listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post listing.');
    }
  };

  const handleDelete = async (id: string) => {
    setListingToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    try {
      await deletePGListing(listingToDelete);
      toast.success('Listing deleted successfully!');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete listing.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files) as File[];
    
    // Check total limit (e.g., max 5 images)
    if (newListing.images.length + files.length > 5) {
      toast.error('You can only upload up to 5 images.');
      return;
    }

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 5MB).`);
          continue;
        }
        const url = await uploadFile(file, 'pg');
        uploadedUrls.push(url);
      }
      
      setNewListing(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      if (uploadedUrls.length > 0) {
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload some images.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setNewListing(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  return (
    <div className="min-h-screen bg-transparent pt-2 sm:pt-6 pb-24 md:pb-8">
      <Helmet>
        <title>Find PG, Flats & Roommates Near Your College | MyCollegeGenie</title>
        <meta name="description" content="Find paying guest accommodations, flats, and roommates near your college campus. Browse verified student housing listings by area and budget." />
        <meta name="keywords" content="PG near University, college hostel, roommate University, PG near North Zone, paying guest near college" />
        <link rel="canonical" href="https://mycollegegenie.in/find-pg" />
              {/* Structured Data for RealEstate/Accommodation */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            "name": "MyCollegeGenie PG Finder",
            "description": "Find verified PGs and Hostels near your college.",
            "url": "https://mycollegegenie.in/find-pg"
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mb-3 sm:mb-6">
        <div className="bg-white/40 backdrop-blur-md border border-gray-100/80 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 lg:p-10 shadow-xl shadow-purple-900/5 text-center relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-100 rounded-full blur-[80px] opacity-40 pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-[9px] sm:text-xs font-black uppercase tracking-widest mb-2 sm:mb-3.5 border border-purple-100/60"
          >
            <Building className="w-3.5 h-3.5" />
            Find Your Perfect Roommate
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-1 sm:mb-2 tracking-tight"
          >
            Find <span className="text-purple-600">PG Partner</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] sm:text-sm text-gray-500 font-medium max-w-xl mx-auto mb-4 sm:mb-6 px-2 sm:px-0 leading-relaxed"
          >
            Connect with fellow students looking for accommodation near your college campus. Filter by college, location, and budget.
          </motion.p>

          {/* Guarantee Badges Row like Campus Exchange */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap justify-center gap-1.5 sm:gap-2.5 max-w-3xl mx-auto mb-5 sm:mb-7 overflow-x-auto pb-1 no-scrollbar shrink-0"
          >
            {[
              { icon: ShieldCheck, text: 'Verified PGs', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100/60' },
              { icon: UserCheck, text: 'Verified Students', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100/60' },
              { icon: MapPin, text: 'Near College', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100/60' },
              { icon: IndianRupee, text: 'Zero Brokerage', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-100/60' }
            ].map((badge, idx) => (
              <div key={idx} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border ${badge.bg} whitespace-nowrap`}>
                <badge.icon className={`w-3.5 h-3.5 shrink-0 ${badge.color}`} />
                <span className={`text-[10px] sm:text-xs font-bold ${badge.color}`}>{badge.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Compact Search & Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto flex flex-col md:flex-row gap-2 p-1.5 bg-white rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100"
          >
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by college or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 sm:py-3.5 rounded-lg sm:rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none text-xs sm:text-sm font-medium"
              />
            </div>
            
            {/* Filter pills and CTA button */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <div className="flex gap-0.5 p-0.5 bg-gray-50 rounded-lg sm:rounded-xl overflow-x-auto no-scrollbar shrink-0 w-full md:w-auto">
                {(['All', 'Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`flex-1 md:flex-initial px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                      genderFilter === g 
                        ? 'bg-white text-purple-600 shadow-sm border border-gray-100/50' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              
              {/* Post Listing Button inside search box - Desktop Only */}
              <button 
                onClick={() => setIsPostModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-xs shadow-lg shadow-purple-600/10 hover:bg-purple-700 active:scale-98 transition-all shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Listing
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile-Only Post Listing Button below Search Bar */}
      <div className="max-w-7xl mx-auto px-2 mb-4 md:hidden">
        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-700 active:scale-98 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Post PG Listing
        </button>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1 sm:py-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4 flex flex-col h-full">
                {/* Simulated images/thumbnail */}
                <Skeleton className="h-36 sm:h-48 md:h-52 w-full rounded-xl sm:rounded-2xl" />
                {/* Simulated details */}
                <div className="space-y-2 sm:space-y-3 flex-1">
                  <Skeleton className="h-4 sm:h-5 w-3/4 rounded-full" />
                  <Skeleton className="h-3 sm:h-4 w-1/2 rounded-full" />
                </div>
                {/* Simulated author & button */}
                <div className="pt-2.5 sm:pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 mr-4">
                    <Skeleton className="w-6 sm:w-8 h-6 sm:h-8 rounded-full shrink-0" />
                    <div className="space-y-1 sm:space-y-1.5 flex-1">
                      <Skeleton className="h-2.5 sm:h-3 w-2/3 rounded-full" />
                      <Skeleton className="h-2 sm:h-2.5 w-1/3 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="w-6 sm:w-8 h-6 sm:h-8 rounded-full shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-red-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Listings</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">{fetchError}</p>
            <button
              onClick={() => {
                setFetchError(null);
                setIsLoading(true);
                getPGListings(
                  (data) => { setListings(data); setIsLoading(false); },
                  undefined,
                  undefined,
                  (err) => { setFetchError('Could not load listings. Please try again.'); setIsLoading(false); }
                );
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : filteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredListings.slice(0, visibleCount).map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedListing(listing)}
                  className="group bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-purple-600/10 transition-all hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                >
                  {/* Top: Images */}
                  <div className="relative h-36 sm:h-48 md:h-52 w-full bg-gray-50 shrink-0">
                     {listing.images && listing.images.length > 0 ? (
                        <div className="h-full w-full" onClick={e => e.stopPropagation()}>
                          <ImageSlider images={listing.images} aspectRatio="auto" className="h-full rounded-none" />
                        </div>
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                          <Building className="w-8 h-8 sm:w-10 sm:h-10 mb-1 sm:mb-2" />
                          <span className="text-[10px] sm:text-xs font-medium">No Images</span>
                        </div>
                     )}
                     {/* Badges Overlay */}
                     <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1.5 items-end">
                        <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/20 ${
                          listing.gender === 'Male' ? 'bg-blue-500/90 text-white' : 'bg-pink-500/90 text-white'
                        }`}>
                          {listing.gender} Only
                        </div>
                        {(listing as any).is_verified ? (
                          <VerifiedBadge size="sm" />
                        ) : currentUser?.id === listing.authorId ? (
                          <button
                            onClick={e => { e.stopPropagation(); setVerifyModal({ id: listing.id, title: listing.location }); }}
                            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md text-amber-700 text-[8px] sm:text-[9px] font-black uppercase tracking-wider rounded-lg sm:rounded-xl border border-amber-200 hover:bg-amber-50 transition-all shadow-sm"
                          >
                            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Get Verified
                          </button>
                        ) : null}
                     </div>
                     <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-white/95 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs md:text-sm text-gray-900 shadow-sm flex items-center gap-0.5 sm:gap-1 border border-white">
                        <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                        {listing.budget}
                     </div>
                  </div>

                  {/* Bottom: Info */}
                  <div className="p-3 sm:p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1.5 sm:mb-3 gap-2">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg leading-tight line-clamp-2 flex-1">{listing.location}</h3>
                      {currentUser?.id === listing.authorId && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(listing.id); }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0 -mt-0.5 -mr-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] sm:text-xs md:text-sm mb-2.5 sm:mb-4">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate font-medium">{listing.college}</span>
                    </div>

                    <div className="mt-auto pt-2.5 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
                       <div className="flex items-center gap-2 sm:gap-3">
                          <img 
                            src={getOptimizedCloudinaryUrl(listing.authorPhoto, 80, 80) || `https://ui-avatars.com/api/?name=${listing.authorName}&background=f3e8ff&color=9333ea`} 
                            alt="Profile"
                            className="w-6 sm:w-8 h-6 sm:h-8 rounded-full object-cover border border-purple-100"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-900 truncate">{listing.authorName}</span>
                            <span className="text-[8px] sm:text-[10px] text-gray-400">Posted {new Date(listing.createdAt).toLocaleDateString()}</span>
                          </div>
                       </div>
                       <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredListings.length > visibleCount && (
              <div className="flex justify-center mt-8 mb-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="px-6 py-3 bg-white border border-purple-100 hover:border-purple-200 hover:bg-purple-50/50 text-purple-600 font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center gap-2"
                >
                  Load More Listings
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find more PG partners.</p>
          </div>
        )}
      </div>

      {/* Post Listing Modal */}
      {createPortal(
        <AnimatePresence>
          {isPostModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between bg-purple-600 text-white shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Post Listing</h2>
                  <p className="text-purple-100 text-[10px] sm:text-sm font-medium">Find your perfect PG partner</p>
                </div>
                <button 
                  onClick={() => setIsPostModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handlePostListing} className="p-6 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto no-scrollbar">
                {!currentUser ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to post a PG listing. Join the community to find your perfect roommate.
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Your College</label>
                        <input 
                          required
                          id="pg-college"
                          name="college"
                          type="text"
                          placeholder="e.g. Hansraj College"
                          value={newListing.college}
                          onChange={(e) => setNewListing({ ...newListing, college: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Location</label>
                        <input 
                          required
                          id="pg-location"
                          name="location"
                          type="text"
                          placeholder="e.g. Kamla Nagar"
                          value={newListing.location}
                          onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Budget Range</label>
                        <input 
                          required
                          id="pg-budget"
                          name="budget"
                          type="text"
                          placeholder="e.g. ?8,000 - ?12,000"
                          value={newListing.budget}
                          onChange={(e) => setNewListing({ ...newListing, budget: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Gender Preference</label>
                        <div className="relative">
                          <select 
                            id="pg-gender"
                            name="gender"
                            value={newListing.gender}
                            onChange={(e) => setNewListing({ ...newListing, gender: e.target.value as any })}
                            className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm appearance-none cursor-pointer"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Any">Any</option>
                          </select>
                          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Phone / WhatsApp <span className="text-[9px] font-normal text-gray-400 font-sans lowercase tracking-normal">(optional if social is provided)</span></label>
                        <input 
                          id="pg-phone"
                          name="contactPhone"
                          type="text"
                          placeholder="e.g. +91 9876543210"
                          value={newListing.contactPhone}
                          onChange={(e) => setNewListing({ ...newListing, contactPhone: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Social Media Link <span className="text-[9px] font-normal text-gray-400 font-sans lowercase tracking-normal">(optional if phone is provided)</span></label>
                        <input 
                          id="pg-social-link"
                          name="contactSocial"
                          type="text"
                          placeholder="e.g. Instagram or Facebook link"
                          value={newListing.contactSocial}
                          onChange={(e) => setNewListing({ ...newListing, contactSocial: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                      <textarea 
                        required
                        id="pg-description"
                        name="description"
                        rows={3}
                        placeholder="Tell potential partners about yourself and what you're looking for..."
                        value={newListing.description}
                        onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Photos (Up to 5)</label>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {newListing.images.map((imgUrl, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 group">
                            <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <XIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                        
                        {newListing.images.length < 5 && (
                          <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-purple-500 bg-gray-50 hover:bg-purple-50 transition-all flex flex-col items-center justify-center cursor-pointer group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple 
                              className="hidden" 
                              onChange={handleImageUpload}
                              disabled={isUploadingImages}
                            />
                            {isUploadingImages ? (
                              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 animate-spin" />
                            ) : (
                              <>
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-purple-600 mb-1 sm:mb-2 transition-colors" />
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 group-hover:text-purple-600">Add Photo</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isUploadingImages}
                      className="w-full py-4 sm:py-5 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all"
                    >
                      Post Listing
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      
      {createPortal(
        <AnimatePresence>
          {selectedListing && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" style={{ position: 'fixed', inset: 0 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="w-full h-64 sm:h-80 bg-gray-100 relative">
                 {selectedListing.images && selectedListing.images.length > 0 ? (
                    <ImageSlider images={selectedListing.images} className="h-full rounded-none" />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Building className="w-16 h-16 mb-4" />
                      <span className="font-medium">No Images Available</span>
                    </div>
                 )}
                 <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl font-bold text-gray-900 shadow-lg flex items-center gap-1.5 border border-white">
                    <IndianRupee className="w-5 h-5 text-purple-600" />
                    {selectedListing.budget}
                 </div>
              </div>

              <div className="p-6 sm:p-8">
                 <div className="flex justify-between items-start mb-6 gap-4">
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1 flex-wrap">
                         <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{selectedListing.location}</h2>
                         {(selectedListing as any).is_verified && <VerifiedBadge size="md" />}
                       </div>
                       <div className="flex items-center gap-2 text-gray-500 font-medium">
                         <GraduationCap className="w-5 h-5 text-purple-600 shrink-0" />
                         <span>{selectedListing.college}</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                        selectedListing.gender === 'Male' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'
                      }`}>
                        {selectedListing.gender} Only
                      </div>
                      {!(selectedListing as any).is_verified && currentUser?.id === selectedListing.authorId && (
                        <button
                          onClick={() => setVerifyModal({ id: selectedListing.id, title: selectedListing.location })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-xl border border-amber-200 hover:bg-amber-100 transition-all"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Get Verified ?99
                        </button>
                      )}
                    </div>
                 </div>

                 <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-6">
                    <img 
                      src={selectedListing.authorPhoto || `https://ui-avatars.com/api/?name=${selectedListing.authorName}&background=f3e8ff&color=9333ea`} 
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-50"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">Listed by {selectedListing.authorName}</span>
                      <span className="text-xs text-gray-400">Posted on {new Date(selectedListing.createdAt).toLocaleDateString()}</span>
                    </div>
                 </div>

                 <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                       <Info className="w-5 h-5 text-purple-600" />
                       Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                 </div>

                  {(() => {
                    const rawContact = selectedListing.socialLink || '';
                    const hasBoth = rawContact.includes(' || ');
                    
                    if (hasBoth) {
                      const [phone, social] = rawContact.split(' || ');
                      return (
                        <div className="flex flex-col sm:flex-row gap-3">
                          {phone && (
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-98"
                            >
                              <MessageCircle className="w-5 h-5" />
                              WhatsApp Student
                            </a>
                          )}
                          {social && (
                            <button
                              onClick={() => {
                                try {
                                  const url = social.startsWith('http') ? social : `https://${social}`;
                                  window.open(url, '_blank');
                                } catch {
                                  toast.error('Invalid link format.');
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs sm:text-sm shadow-xl shadow-purple-600/20 transition-all active:scale-98"
                            >
                              <Info className="w-5 h-5" />
                              Connect via Social
                            </button>
                          )}
                        </div>
                      );
                    } else {
                      const isPhone = /^[+\d\s()-]+$/.test(rawContact.trim()) && rawContact.trim().length >= 8;
                      if (isPhone) {
                        return (
                          <a
                            href={`https://wa.me/${rawContact.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 transition-all active:scale-98"
                          >
                            <MessageCircle className="w-5 h-5" />
                            WhatsApp Student
                          </a>
                        );
                      } else {
                        return (
                          <button
                            onClick={() => {
                              try {
                                const url = new URL(rawContact);
                                if (url.protocol === 'http:' || url.protocol === 'https:') {
                                  window.open(url.href, '_blank');
                                } else {
                                  window.open(`https://${rawContact}`, '_blank');
                                }
                              } catch {
                                if (rawContact.includes('.') || rawContact.includes('/') || rawContact.startsWith('@')) {
                                  window.open(rawContact.startsWith('@') ? `https://instagram.com/${rawContact.replace('@', '')}` : `https://${rawContact}`, '_blank');
                                } else {
                                  toast.error('Invalid link format.');
                                }
                              }
                            }}
                            className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="w-5 h-5" />
                            Connect via Social
                          </button>
                        );
                      }
                    }
                  })()}
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Verification Modal */}
      {verifyModal && (
        <VerificationApplyModal
          isOpen={!!verifyModal}
          onClose={() => setVerifyModal(null)}
          listingType="pg"
          listingId={verifyModal.id}
          listingTitle={verifyModal.title}
        />
      )}
    </div>
  );
};
