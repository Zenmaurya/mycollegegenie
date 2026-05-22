import type { SupabaseAuthUser } from '../types';
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, X, Loader2, GraduationCap, MapPin, Calendar, FileText, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserProfile } from '../services/userService';
import { User, Resource } from '../types';
import { resolveAvatar, getInitials } from '../constants/avatars';
import { VerifiedBadge } from './VerifiedBadge';

interface UploaderProfilePopoverProps {
  uploaderName: string;
  uploaderId?: string;
  resources?: Resource[];
  children?: React.ReactNode;
}

export function UploaderProfilePopover({ uploaderName, uploaderId, resources = [], children }: UploaderProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploaderProfile, setUploaderProfile] = useState<SupabaseAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fallback contributions if resources are passed, otherwise we can assume 0 or fetch
  const totalContributions = resources.length;

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

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const displayName = uploaderProfile?.display_name || uploaderProfile?.displayName || uploaderName || 'Anonymous';
  const avatarValue = uploaderProfile?.photo_url || uploaderProfile?.photoUrl;
  const av = resolveAvatar(avatarValue);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div onClick={handleToggle} className="cursor-pointer">
        {children || (
          <button className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors focus:outline-none flex items-center gap-1">
            {displayName}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden"
          >
            {/* Header / Cover Area */}
            <div className="h-16 bg-gradient-to-r from-purple-500 to-indigo-500 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="absolute top-2 right-2 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 relative">
              {/* Avatar Profile */}
              <div className="flex justify-between items-end -mt-8 mb-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-4 border-white shadow-sm bg-white overflow-hidden relative z-10">
                  {av ? (
                    <div className={`w-full h-full flex items-center justify-center ${av.bg}`}>
                      {av.emoji}
                    </div>
                  ) : avatarValue && !avatarValue.startsWith('avatar:') ? (
                    <img src={avatarValue} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-100 flex items-center justify-center text-xl font-black text-purple-700">
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>
                
                {uploaderProfile?.role === 'admin' && (
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100 mb-1">
                    Admin
                  </span>
                )}
                {uploaderProfile?.role === 'faculty' && (
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-100 mb-1">
                    Faculty
                  </span>
                )}
              </div>

              {/* Name & Details */}
              <div className="mb-4">
                <h4 className={`text-lg font-black leading-tight flex items-center gap-2 ${uploaderProfile?.role === 'faculty' ? 'text-amber-600' : 'text-gray-900'}`}>
                  {displayName}
                  {(uploaderProfile?.role === 'admin' || uploaderProfile?.role === 'faculty') && <BadgeCheck className="w-5 h-5 text-amber-500 shrink-0" />}
                  {uploaderProfile?.is_verified && uploaderProfile?.role === 'user' && <VerifiedBadge size="sm" showLabel={false} />}
                </h4>
                {isLoading ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching details...
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 mt-2">
                    {uploaderProfile?.course && (
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{uploaderProfile.course}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{uploaderProfile?.college || 'University Student'}</span>
                    </p>
                    {uploaderProfile?.created_at && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        Joined {new Date(uploaderProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contributions</span>
                    <span className="text-sm font-black text-gray-900">{uploaderProfile?.uploads_count || totalContributions}</span>
                  </div>
                </div>
                {/* <button className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
                  View
                </button> */}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45 shadow-sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
