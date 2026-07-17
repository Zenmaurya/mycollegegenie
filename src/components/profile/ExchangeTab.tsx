import React, { useState, useEffect } from 'react';
// FIX Perf #5: Replaced 'framer-motion' with 'motion' — both are the same library.
// framer-motion v12+ is just a re-export of motion. Using one avoids duplicate bundle code.
import { motion, AnimatePresence } from 'motion/react';
import { Package, Edit3, Trash2, Loader2, Link as LinkIcon, ExternalLink, Calendar } from 'lucide-react';
import { fetchUserListings, deleteExchangeItem, type ExchangeItem } from '../../services/exchangeService';
import { toast } from 'sonner';

export const ExchangeTab: React.FC = () => {
  const [listings, setListings] = useState<ExchangeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserListings();
      setListings(data);
    } catch (err) {
      toast.error('Failed to load your listings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      setDeletingId(id);
      await deleteExchangeItem(id);
      setListings(prev => prev.filter(item => item.id !== id));
      toast.success('Listing deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const activeAds = listings.filter(l => l.is_active).length;
  const soldAds = listings.filter(l => !l.is_active).length;

  return (
    <motion.div 
      key="exchange"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Active Ads</h4>
          <span className="text-4xl font-black text-[#5636A7]">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-gray-300" /> : activeAds}
          </span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Completed / Sold</h4>
          <span className="text-4xl font-black text-emerald-500">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-gray-300" /> : soldAds}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Your Listings</h2>
          <a href="/campus-exchange/new" className="text-sm font-bold text-[#5636A7] hover:text-[#4a2e92] transition-colors">
            Post New Ad
          </a>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5636A7]" />
          </div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No listings yet</h3>
            <p className="text-sm text-gray-500 mb-6">You haven't posted any items on Campus Exchange.</p>
            <a href="/campus-exchange/new" className="inline-flex items-center justify-center px-6 py-3 bg-[#5636A7] text-white rounded-xl font-bold text-sm hover:bg-[#4a2e92] transition-colors shadow-md">
              Create First Listing
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {listings.map(ad => (
                <motion.div 
                  key={ad.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-[#5636A7]/20 hover:bg-[#F4EFFF]/50 transition-all gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md shrink-0 ${ad.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <h3 className="font-bold text-gray-900 truncate" title={ad.title}>
                          {ad.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <span className="text-[#5636A7] font-black">
                          {ad.type === 'Exchange' || ad.type === 'Donate' ? ad.type : `₹${ad.price?.toLocaleString('en-IN')}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ad.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a href={`/campus-exchange/${ad.id}`} className="p-2 text-gray-400 hover:text-[#5636A7] hover:bg-[#F4EFFF] rounded-lg transition-colors" title="View Ad">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {/* <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Ad">
                      <Edit3 className="w-4 h-4" />
                    </button> */}
                    <button 
                      onClick={() => handleDelete(ad.id)}
                      disabled={deletingId === ad.id}
                      className="p-2 text-gray-400 hover:text-mark-ink hover:bg-mark-soft rounded-lg transition-colors disabled:opacity-50" 
                      title="Delete Ad"
                    >
                      {deletingId === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
