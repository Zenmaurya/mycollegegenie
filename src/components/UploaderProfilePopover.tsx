import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserProfile } from '../services/userService';
import { User, Resource } from '../types';

interface UploaderProfilePopoverProps {
  uploaderName: string;
  uploaderId?: string;
  resources: Resource[];
}

export function UploaderProfilePopover({ uploaderName, uploaderId, resources }: UploaderProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploaderProfile, setUploaderProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate total contributions based on uploaderName or uploaderId
  const totalContributions = resources.filter(r => 
    (uploaderId && r.uploaderId === uploaderId) || 
    (!uploaderId && r.uploader === uploaderName)
  ).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = async () => {
    if (!isOpen && uploaderId && !uploaderProfile) {
      setIsLoading(true);
      try {
        const profile = await getUserProfile(uploaderId);
        if (profile) {
          setUploaderProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching uploader profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={handleToggle}
        className="text-xs font-semibold text-purple-600 hover:text-purple-800 truncate transition-colors cursor-pointer focus:outline-none flex items-center gap-1"
      >
        {uploaderName || 'Anonymous'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                  {uploaderProfile?.photoURL ? (
                    <img src={uploaderProfile.photoURL} alt={uploaderName} className="w-full h-full rounded-full object-cover" loading="lazy" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-purple-600" />
                  )}
                </div>
                <div className="min-w-0 pr-4">
                  <h4 className="text-base font-bold text-gray-900 truncate">
                    {uploaderProfile?.displayName || uploaderName || 'Anonymous'}
                  </h4>
                  {isLoading ? (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 truncate">
                      {uploaderProfile?.college || 'Delhi University Student'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-2.5 flex items-center justify-between border border-purple-100/50">
                <span className="text-xs font-medium text-purple-700">Total Contributions</span>
                <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                  {totalContributions} {totalContributions === 1 ? 'Resource' : 'Resources'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
