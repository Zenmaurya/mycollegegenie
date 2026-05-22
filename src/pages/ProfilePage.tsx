import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// FIX Perf #5: Replaced 'framer-motion' with 'motion' — same library, avoids duplicate bundle code.
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, GraduationCap, BookOpen, Save, Loader2, LogOut, 
  ShieldCheck, Check, Package, HelpCircle, 
  ChevronRight, ExternalLink, Folder
} from 'lucide-react';
import { supabase } from '../supabase';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { toast } from 'sonner';
import { User as AppUser } from '../types';
import { AVATARS, resolveAvatar, avatarToDbValue, getInitials, type Avatar } from '../constants/avatars';
import { ExchangeTab } from '../components/profile/ExchangeTab';
import { MyUploadsTab } from '../components/profile/MyUploadsTab';
import { VerifiedBadge } from '../components/VerifiedBadge';

// Avatar category tabs for the picker
const AVATAR_CATEGORIES = [
  { label: '🐾 Animals',  ids: ['owl','fox','panda','lion','penguin','koala','tiger','bear','cat','dog','frog','bunny'] },
  { label: '🎓 Academic', ids: ['student','bookworm','nerd','artist','coder','scientist','musician','chef'] },
  { label: '✨ Fantasy',  ids: ['astronaut','robot','wizard','ninja','alien','genie'] },
  { label: '🦸 Fun',      ids: ['superhero','detective','pirate','viking'] },
];

const MENU_ITEMS = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'exchange', label: 'Campus Exchange', icon: Package },
  { id: 'uploads', label: 'My Uploads', icon: Folder },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(''); // stores 'avatar:id' or Cloudinary URL
  const [avatarTab, setAvatarTab] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setCollege(data.college || '');
        setCourse(data.course || '');
        // Default to 'avatar:student' if no photo set
        setSelectedAvatar(data.photo_url || 'avatar:student');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateUserProfile({
        displayName,
        college,
        course,
        photoUrl: selectedAvatar
      });
      toast.success('Profile updated successfully! ✨');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
        <Loader2 className="w-8 h-8 text-[#5636A7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 bg-[#F8F9FD]">
      <Helmet>
        <title>Dashboard | MyCollegeGenie</title>
      </Helmet>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            
            {/* User Mini Card */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              {/* Avatar Display — emoji or real photo */}
              {(() => {
                const av = resolveAvatar(selectedAvatar);
                return av ? (
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${av.bg}`}>
                    {av.emoji}
                  </div>
                ) : selectedAvatar ? (
                  <img src={selectedAvatar} alt="Profile" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-purple-700">{getInitials(displayName || 'S')}</span>
                  </div>
                );
              })()}
              <div className="overflow-hidden">
                <h2 className="font-black text-gray-900 text-lg truncate flex items-center gap-1.5">
                  {displayName || 'Student'}
                  {profile?.is_verified && <VerifiedBadge size="sm" showLabel={false} />}
                </h2>
                <p className="text-sm font-medium text-gray-500 truncate">{college || 'University'}</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
              {MENU_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-[#F4EFFF] text-[#5636A7] font-bold' 
                      : 'text-gray-600 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-[#5636A7]' : 'text-gray-400'}`} />
                    {item.label}
                  </div>
                  {activeTab === item.id && <ChevronRight className="w-4 h-4 text-[#5636A7]" />}
                </button>
              ))}
            </div>

            {/* Sign Out */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 bg-white text-rose-600 rounded-[2rem] font-bold hover:bg-rose-50 transition-all border border-gray-100 hover:border-rose-100 shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>

          {/* Right Main Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              
              {/* PROFILE SETTINGS TAB */}
              {activeTab === 'profile' && (
                <motion.div 
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
                      <p className="text-gray-500 font-medium text-sm mt-1">Manage your academic and personal details</p>
                    </div>
                    {profile?.role === 'admin' && (
                      <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Admin
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-8">
                    {/* ── Avatar Picker ── */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Choose Avatar</label>
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Zero storage · Free</span>
                      </div>

                      {/* Current selection preview */}
                      <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-2xl">
                        {(() => {
                          const av = resolveAvatar(selectedAvatar);
                          return av ? (
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 ${av.bg} ring-2 ring-[#5636A7]/20`}>
                              {av.emoji}
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                              <span className="text-xl font-black text-purple-700">{getInitials(displayName || 'S')}</span>
                            </div>
                          );
                        })()}
                        <div>
                          <p className="font-black text-gray-900 text-sm">
                            {resolveAvatar(selectedAvatar)?.label ?? 'Custom Photo'}
                          </p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">Currently selected avatar</p>
                        </div>
                      </div>

                      {/* Category Tabs */}
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                        {AVATAR_CATEGORIES.map((cat, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarTab(i)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${
                              avatarTab === i
                                ? 'bg-[#5636A7] text-white shadow-md'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Avatar Grid */}
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {AVATAR_CATEGORIES[avatarTab].ids.map(id => {
                          const av = AVATARS.find(a => a.id === id)!;
                          const dbVal = avatarToDbValue(id);
                          const isSelected = selectedAvatar === dbVal;
                          return (
                            <button
                              key={id}
                              type="button"
                              title={av.label}
                              onClick={() => setSelectedAvatar(dbVal)}
                              className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all duration-200 ${
                                isSelected
                                  ? `${av.bg} ring-2 ring-[#5636A7] ring-offset-1 scale-95`
                                  : `${av.bg} hover:scale-110 hover:shadow-md`
                              }`}
                            >
                              {av.emoji}
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#5636A7] rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" /> Email Address
                        </label>
                        <input 
                          type="text"
                          disabled
                          value={profile?.email}
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-gray-400 cursor-not-allowed opacity-70"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <User className="w-3.5 h-3.5" /> Full Name
                        </label>
                        <input 
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your name"
                          className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#5636A7]/10 focus:border-[#5636A7] outline-none transition-all font-bold text-gray-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5" /> College
                          </label>
                          <input 
                            type="text"
                            value={college}
                            onChange={(e) => setCollege(e.target.value)}
                            placeholder="Hansraj College"
                            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#5636A7]/10 focus:border-[#5636A7] outline-none transition-all font-bold text-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" /> Course
                          </label>
                          <input 
                            type="text"
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            placeholder="B.Com (Hons)"
                            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#5636A7]/10 focus:border-[#5636A7] outline-none transition-all font-bold text-gray-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex items-center justify-end">
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="w-full sm:w-auto px-10 py-4 bg-[#5636A7] hover:bg-[#4a2e92] text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* CAMPUS EXCHANGE TAB */}
              {activeTab === 'exchange' && (
                <ExchangeTab />
              )}

              {/* MY UPLOADS TAB */}
              {activeTab === 'uploads' && (
                <MyUploadsTab />
              )}

              {/* HELP & SUPPORT TAB */}
              {activeTab === 'help' && (
                <motion.div 
                  key="help"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900">Help & Support</h2>
                      <p className="text-gray-500 font-medium text-sm">Find answers or contact our team</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { q: 'How do I upload notes?', a: 'You can upload notes by going to the Browse section and clicking on the Upload Resource button at the top right.' },
                      { q: 'Is Campus Exchange safe?', a: 'Yes, but always meet in public spaces on campus and verify the item before making any payment. We verify student emails.' },
                      { q: 'How can I change my college?', a: 'You can update your college and course in the Profile Settings tab. Changes reflect immediately.' }
                    ].map((faq, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <h4 className="font-bold text-gray-900 mb-1">{faq.q}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-100 text-center bg-gray-50 rounded-3xl p-8">
                    <p className="text-sm text-gray-500 font-medium mb-4">Still need help? Our team is always here for you.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <a href="mailto:support@mycollegegenie.in" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors shadow-md w-full sm:w-auto">
                        Contact Support <ExternalLink className="w-4 h-4" />
                      </a>
                      <a href="https://www.reddit.com/r/AskMyCollegeGenie" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FF4500] text-white rounded-xl font-bold text-sm hover:bg-[#E03D00] transition-colors shadow-md w-full sm:w-auto">
                        Ask on Reddit <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
