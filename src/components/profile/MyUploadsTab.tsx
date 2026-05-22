import React, { useState, useEffect } from 'react';
// FIX Perf #5: Replaced 'framer-motion' with 'motion' — same library, avoids duplicate bundle code.
import { motion, AnimatePresence } from 'motion/react';
import { FileText, PlayCircle, Activity, Folder, ExternalLink, Loader2, Calendar } from 'lucide-react';
import { fetchUserResources } from '../../services/resourceService';
import type { Resource } from '../../types';
import { toast } from 'sonner';

export const MyUploadsTab: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUserResources();
      setResources(data);
    } catch (err) {
      toast.error('Failed to load your uploads');
    } finally {
      setIsLoading(false);
    }
  };

  const notesCount = resources.filter(r => r.type === 'notes' || r.type === 'pyqs').length;
  const playlistsCount = resources.filter(r => r.type === 'books').length; // or another logic for playlists

  return (
    <motion.div 
      key="uploads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Total Uploads</h4>
          <span className="text-4xl font-black text-[#5636A7]">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-gray-300" /> : resources.length}
          </span>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h4 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><CheckBadge className="w-3.5 h-3.5" isApproved /> Approved</h4>
          <span className="text-4xl font-black text-emerald-500">
            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-gray-300" /> : resources.filter(r => r.isApproved).length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Upload History</h2>
          <a href="/upload" className="text-sm font-bold text-[#5636A7] hover:text-[#4a2e92] transition-colors">
            Upload Resource
          </a>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#5636A7]" />
          </div>
        ) : resources.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Folder className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No uploads yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">You haven't uploaded any new resources recently. Share your notes to help juniors!</p>
            <a href="/upload" className="px-6 py-3 bg-[#5636A7] text-white rounded-xl font-bold text-sm hover:bg-[#4a2e92] transition-colors shadow-md">
              Upload Resource
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {resources.map(resource => (
                <motion.div 
                  key={resource.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-[#5636A7]/20 hover:bg-[#F4EFFF]/50 transition-all gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md shrink-0 ${resource.isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {resource.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        <h3 className="font-bold text-gray-900 truncate" title={resource.title}>
                          {resource.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <span className="text-[#5636A7] font-black uppercase">
                          {resource.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(resource.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <a href={`/resources/${resource.id}`} className="p-2 text-gray-400 hover:text-[#5636A7] hover:bg-[#F4EFFF] rounded-lg transition-colors" title="View Resource">
                      <ExternalLink className="w-4 h-4" />
                    </a>
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

const CheckBadge = ({ className, isApproved }: { className: string, isApproved: boolean }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
