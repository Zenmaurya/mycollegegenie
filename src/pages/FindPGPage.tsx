import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, IndianRupee, User, Search, Plus, X, MessageCircle, Filter, GraduationCap, Info, Trash2, Building, Share2, ChevronDown, AlertCircle } from 'lucide-react';
import { PGListing } from '../types';
import { createPGListing, getPGListings, deletePGListing } from '../services/pgService';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const FindPGPage: React.FC = () => {
  const [listings, setListings] = useState<PGListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [newListing, setNewListing] = useState({
    college: '',
    location: '',
    budget: '',
    gender: 'Male' as 'Male' | 'Female' | 'Any',
    description: '',
    socialLink: ''
  });

  useEffect(() => {
    const unsubscribe = getPGListings((data) => {
      setListings(data);
      setIsLoading(false);
    });
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
    if (!auth.currentUser) {
      toast.error('Please sign in to post a listing.');
      return;
    }

    try {
      await createPGListing({
        college: newListing.college,
        location: newListing.location,
        budget: newListing.budget,
        gender: newListing.gender,
        description: newListing.description,
        socialLink: newListing.socialLink
      });
      toast.success('Listing posted successfully!');
      setIsPostModalOpen(false);
      setNewListing({ 
        college: '', 
        location: '', 
        budget: '', 
        gender: 'Male', 
        description: '', 
        socialLink: '' 
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

  return (
    <div className="min-h-screen bg-transparent pt-8 sm:pt-12 pb-24">
      <Helmet>
        <title>Find PG & Roommates Near DU Colleges | MyCollegeGenie</title>
        <meta name="description" content="Find paying guest accommodations and roommates near Delhi University colleges. Browse PG listings by area and rent near North Campus, South Campus and more." />
        <meta name="keywords" content="PG near Delhi University, DU hostel, roommate Delhi University, PG near North Campus, paying guest DU" />
        <link rel="canonical" href="https://mycollegegenie.in/find-pg" />
      </Helmet>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl shadow-purple-900/5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4 sm:mb-6"
          >
            <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Find Your Perfect Roommate
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-7xl font-black text-gray-900 mb-4 sm:mb-6 tracking-tight"
          >
            Find <span className="text-purple-600">PG Partner</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-gray-500 font-medium max-w-2xl mx-auto mb-8 sm:mb-10 px-4 sm:px-0"
          >
            Connect with fellow students from Delhi University looking for accommodation. Filter by college, location, and budget.
          </motion.p>

          {/* Search & Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4 p-2 bg-white rounded-3xl shadow-xl shadow-purple-600/5 border border-gray-100"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by college or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none text-xs sm:text-base font-medium"
              />
            </div>
            <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl overflow-x-auto no-scrollbar">
              {(['All', 'Male', 'Female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenderFilter(g)}
                  className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                    genderFilter === g 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsPostModalOpen(true)}
              className="w-full lg:w-auto bg-purple-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Post Listing
            </button>
          </motion.div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 hover:shadow-2xl hover:shadow-purple-600/10 transition-all hover:-translate-y-1"
              >
                <div className="flex flex-wrap items-start justify-between mb-5 sm:mb-6 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={listing.authorPhoto || `https://ui-avatars.com/api/?name=${listing.authorName}&background=f3e8ff&color=9333ea`} 
                        alt="DU Student Profile Photo"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-purple-50"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white flex items-center justify-center ${listing.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                        <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{listing.authorName}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">Posted {new Date(listing.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                      listing.gender === 'Male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                    }`}>
                      {listing.gender}
                    </div>
                    {auth.currentUser?.uid === listing.authorId && (
                      <button 
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 text-gray-600 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate flex-1 min-w-0">{listing.college}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate flex-1 min-w-0">{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate flex-1 min-w-0">{listing.budget}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate flex-1 min-w-0">{listing.socialLink}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 mb-5 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic line-clamp-3">
                    "{listing.description}"
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => window.open(listing.socialLink, '_blank')}
                    className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Connect Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
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
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                {!auth.currentUser ? (
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
                          type="text"
                          placeholder="e.g. ₹8,000 - ₹12,000"
                          value={newListing.budget}
                          onChange={(e) => setNewListing({ ...newListing, budget: e.target.value })}
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Gender Preference</label>
                        <div className="relative">
                          <select 
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

                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Contact Through</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g. Instagram, Snapchat, or Facebook link"
                        value={newListing.socialLink}
                        onChange={(e) => setNewListing({ ...newListing, socialLink: e.target.value })}
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                      <textarea 
                        required
                        rows={3}
                        placeholder="Tell potential partners about yourself and what you're looking for..."
                        value={newListing.description}
                        onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none font-bold text-xs sm:text-sm resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
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
      </AnimatePresence>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};
