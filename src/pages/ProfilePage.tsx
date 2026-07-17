import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, PencilLine, Check, Mail, User, ShieldCheck, Calendar, Package, FileText, X } from 'lucide-react';
import { logout } from '../supabase';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { fetchUserResources } from '../services/resourceService';
import { fetchUserListings, type ExchangeItem } from '../services/exchangeService';
import { toast } from 'sonner';
import { User as AppUser, Resource } from '../types';
import { AVATARS, resolveAvatar, getInitials } from '../constants/avatars';

const AVATAR_CATEGORIES = [
  { label: 'Animals',  ids: ['owl','fox','panda','lion','penguin','koala','tiger','bear','cat','dog','frog','bunny'] },
  { label: 'Academic', ids: ['student','bookworm','nerd','artist','coder','scientist','musician','chef'] },
  { label: 'Fantasy',  ids: ['astronaut','robot','wizard','ninja','alien','genie'] },
  { label: 'Fun',      ids: ['superhero','detective','pirate','viking'] },
];

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(''); 
  const [avatarTab, setAvatarTab] = useState(0);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [listings, setListings] = useState<ExchangeItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setCollege(data.college || '');
        setCourse(data.course || '');
        setSelectedAvatar(data.photo_url || 'avatar:student');
      }

      const [resData, listData] = await Promise.all([
        fetchUserResources().catch(() => []),
        fetchUserListings().catch(() => [])
      ]);
      setResources(resData);
      setListings(listData);

    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsUpdating(true);
    try {
      await updateUserProfile({
        displayName,
        college,
        course,
        photoUrl: selectedAvatar
      });
      toast.success('Profile updated successfully! ✨');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--brand)] animate-spin" />
      </div>
    );
  }

  const av = resolveAvatar(selectedAvatar);

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      <Helmet>
        <title>Campus Notes — Profile</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
        
      {/* HEADER CARD */}
      <div className="bg-brand text-[#EFEFE8] rounded-[1.25rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 relative overflow-hidden shadow-sm w-full">
          {/* Background decoration */}
          <svg className="absolute -right-8 -top-8 w-44 h-44 opacity-10 pointer-events-none" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="100" r="90" stroke="#fff" strokeWidth="10"/></svg>
          
          <div className="relative shrink-0 z-10">
            <div className="w-[84px] h-[84px] rounded-2xl bg-mark-soft flex items-center justify-center text-4xl border-4 border-white/20 shadow-md relative">
              {av?.emoji || getInitials(displayName || 'S')}
            </div>
            <div 
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-mark border-2 border-brand flex items-center justify-center text-mark-ink cursor-pointer hover:bg-amber-400 transition-colors"
            >
              <PencilLine className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left z-10 w-full min-w-0">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl sm:text-[26px] font-bold text-white leading-tight tracking-tight font-fraunces">{displayName || 'Student'}</h1>
              <div className="flex items-center gap-2">
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 bg-mark text-mark-ink text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                    <Check className="w-3 h-3" strokeWidth={3}/> Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 uppercase tracking-widest">
                  {profile?.role || 'Student'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-2 mt-1 text-[13px] text-brand-soft font-medium">
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg> {college || 'University'}</span>
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> {course || 'Course'}</span>
              <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="z-10 sm:self-start btn btn-sm bg-white/10 hover:bg-white/20 border border-white/20 text-white mt-4 sm:mt-0 shrink-0">
            Log out
          </button>
        </div>

        {/* Using FLEX instead of GRID to strictly prevent overlapping on all screen sizes */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0">
          
          {/* LEFT: editable + readonly */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
            
            {/* EDIT PROFILE CARD */}
            <div className="bg-surface border border-line rounded-[1.25rem] p-5 sm:p-6 shadow-sm w-full">
              <h4 className="text-[14px] font-bold text-ink mb-5 font-inter">Edit profile</h4>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <div className="w-full min-w-0">
                  <label className="block text-[12px] font-semibold text-ink-soft mb-1.5">Display name</label>
                  <div className="relative flex items-center w-full min-w-0">
                    <User className="absolute left-3.5 w-4 h-4 text-ink-faint shrink-0" />
                    <input type="text" value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full min-w-0 bg-surface-sunk border-none rounded-xl py-2.5 pl-10 pr-3 text-[13px] font-semibold text-ink focus:ring-2 focus:ring-brand/20 transition-all outline-none block" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                <div className="w-full min-w-0 flex-1">
                  <label className="block text-[12px] font-semibold text-ink-soft mb-1.5">College name</label>
                  <div className="relative flex items-center w-full min-w-0">
                    <svg className="absolute left-3.5 w-4 h-4 text-ink-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>
                    <input type="text" value={college} onChange={e=>setCollege(e.target.value)} className="w-full min-w-0 bg-surface-sunk border-none rounded-xl py-2.5 pl-10 pr-3 text-[13px] font-semibold text-ink focus:ring-2 focus:ring-brand/20 transition-all outline-none block" />
                  </div>
                </div>
                <div className="w-full min-w-0 flex-1">
                  <label className="block text-[12px] font-semibold text-ink-soft mb-1.5">Course name</label>
                  <div className="relative flex items-center w-full min-w-0">
                    <svg className="absolute left-3.5 w-4 h-4 text-ink-faint shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    <input type="text" value={course} onChange={e=>setCourse(e.target.value)} className="w-full min-w-0 bg-surface-sunk border-none rounded-xl py-2.5 pl-10 pr-3 text-[13px] font-semibold text-ink focus:ring-2 focus:ring-brand/20 transition-all outline-none block" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => fetchData()} className="btn btn-sm">Cancel</button>
                <button type="button" onClick={handleUpdate} className="btn btn-mark btn-sm">
                  {isUpdating ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* ACCOUNT DETAILS CARD */}
            <div className="bg-surface border border-line rounded-[1.25rem] p-5 sm:p-6 shadow-sm w-full">
              <h4 className="text-[14px] font-bold text-ink mb-3 font-inter">Account details</h4>
              
              <div className="flex justify-between items-center py-3 border-b border-line w-full">
                <span className="flex items-center gap-2 text-[13px] text-ink-soft font-medium shrink-0"><Mail className="w-[15px] h-[15px] text-ink-faint"/> Email address</span>
                <span className="text-[13px] font-semibold text-ink font-mono truncate pl-4">{profile?.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-line w-full">
                <span className="flex items-center gap-2 text-[13px] text-ink-soft font-medium shrink-0"><User className="w-[15px] h-[15px] text-ink-faint"/> Account role</span>
                <span className={`px-3 py-1 rounded-full text-[11.5px] font-inter bg-surface-sunk ${profile?.role === 'admin' ? 'bg-brand-soft text-brand-ink font-bold' : 'font-medium'}`}>
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-line w-full">
                <span className="flex items-center gap-2 text-[13px] text-ink-soft font-medium shrink-0"><ShieldCheck className="w-[15px] h-[15px] text-ink-faint"/> Verification status</span>
                {profile?.is_verified ? (
                   <span className="flex items-center gap-1.5 text-[13px] font-semibold text-solved font-inter bg-solved-soft px-3 py-1 rounded-full">
                     <Check className="w-3.5 h-3.5" strokeWidth={3}/> Verified student
                   </span>
                ) : (
                   <span className="text-[13px] font-medium text-ink-faint font-inter bg-surface-sunk px-3 py-1 rounded-full">Unverified</span>
                )}
              </div>
              
              <div className="flex justify-between items-center py-3 w-full">
                <span className="flex items-center gap-2 text-[13px] text-ink-soft font-medium shrink-0"><Calendar className="w-[15px] h-[15px] text-ink-faint"/> Joined</span>
                <span className="text-[13px] font-semibold text-ink font-mono pl-4">
                  {new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: stats + nav */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
            
            <div className="flex gap-3 w-full">
              <div className="flex-1 bg-surface border border-line rounded-[1.25rem] p-4 text-center shadow-sm">
                <b className="block font-mono text-[22px] font-bold text-brand">{resources.length}</b>
                <span className="text-[10px] text-ink-faint uppercase tracking-wider font-bold mt-1 block">Uploads</span>
              </div>
              <div className="flex-1 bg-surface border border-line rounded-[1.25rem] p-4 text-center shadow-sm">
                <b className="block font-mono text-[22px] font-bold text-brand">0</b>
                <span className="text-[10px] text-ink-faint uppercase tracking-wider font-bold mt-1 block">Answers</span>
              </div>
              <div className="flex-1 bg-surface border border-line rounded-[1.25rem] p-4 text-center shadow-sm">
                <b className="block font-mono text-[22px] font-bold text-brand">{listings.length}</b>
                <span className="text-[10px] text-ink-faint uppercase tracking-wider font-bold mt-1 block">Listings</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-[1.25rem] p-5 shadow-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[13px] font-bold font-inter flex items-center gap-2 text-ink">
                  <FileText className="w-[15px] h-[15px] text-brand"/> My uploads
                </h4>
                <span className="text-[11.5px] font-bold text-ink-faint cursor-pointer hover:text-ink transition-colors">See all &rarr;</span>
              </div>
              {resources.slice(0,3).map(r => (
                 <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 w-full min-w-0">
                   <div className="w-8 h-8 rounded-lg bg-surface-sunk flex items-center justify-center text-ink-soft shrink-0">
                     <FileText className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0 pr-2">
                     <span className="text-[12.5px] font-bold text-ink leading-tight truncate block">{r.title}</span>
                     <span className="text-[11px] text-ink-faint block truncate mt-0.5">{r.course} &middot; {r.type}</span>
                   </div>
                   <span className="text-[11px] font-mono text-ink-faint shrink-0">&darr; {Math.floor(Math.random() * 500)}</span>
                 </div>
              ))}
              {resources.length === 0 && <p className="text-[12.5px] text-ink-faint py-4 text-center font-medium">No uploads yet.</p>}
            </div>

            <div className="bg-surface border border-line rounded-[1.25rem] p-5 shadow-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[13px] font-bold font-inter flex items-center gap-2 text-ink">
                  <Package className="w-[15px] h-[15px] text-brand"/> Campus exchange
                </h4>
                <span className="text-[11.5px] font-bold text-ink-faint cursor-pointer hover:text-ink transition-colors">See all &rarr;</span>
              </div>
              {listings.slice(0,3).map(l => (
                 <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 w-full min-w-0">
                   <div className="w-8 h-8 rounded-lg bg-surface-sunk flex items-center justify-center text-ink-soft shrink-0">
                     <Package className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0 pr-2">
                     <span className="text-[12.5px] font-bold text-ink leading-tight truncate block">{l.title}</span>
                     <span className="text-[11px] text-ink-faint block truncate mt-0.5">Listed &middot; &#8377;{l.price}</span>
                   </div>
                   <span className="text-[11px] font-mono text-ink-faint shrink-0">{l.is_active ? 'Active' : 'Sold'}</span>
                 </div>
              ))}
              {listings.length === 0 && <p className="text-[12.5px] text-ink-faint py-4 text-center font-medium">No listings yet.</p>}
            </div>
          </div>

        </div>

      {/* PREMIUM AVATAR SELECTION MODAL */}
      {isAvatarModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-ink/60 backdrop-blur-md">
          <div className="bg-surface rounded-3xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-surface/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
              <div>
                <h3 className="font-bold text-ink text-[17px] font-fraunces tracking-tight">Update your avatar</h3>
                <p className="text-[12.5px] text-ink-soft mt-0.5">Pick a character that represents your campus vibe.</p>
              </div>
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunk text-ink-faint hover:text-ink transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
                {AVATAR_CATEGORIES.map((cat, i) => (
                  <button 
                    key={i} 
                    onClick={() => setAvatarTab(i)} 
                    className={`shrink-0 text-[13px] font-bold px-4 py-2.5 rounded-full cursor-pointer transition-all duration-200 ${avatarTab === i ? 'bg-brand text-white shadow-md scale-[1.02]' : 'bg-surface-sunk text-ink-soft hover:bg-line hover:text-ink'}`}
                  >
                    {cat.label.replace(/^[^\w\s]+/, '').trim()}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full">
                {AVATAR_CATEGORIES[avatarTab].ids.slice(0, 8).map(id => {
                   const curAv = resolveAvatar('avatar:'+id);
                   const isSelected = selectedAvatar === 'avatar:'+id;
                   return (
                     <div 
                       key={id} 
                       onClick={() => setSelectedAvatar('avatar:'+id)}
                       className={`aspect-square rounded-2xl flex items-center justify-center text-3xl cursor-pointer border-[3px] transition-all duration-200 hover:scale-105 hover:-translate-y-1 ${isSelected ? 'bg-mark-soft border-mark shadow-sm' : 'bg-surface-sunk border-transparent hover:border-line-strong'}`}
                     >
                       {curAv?.emoji}
                     </div>
                   )
                })}
              </div>
            </div>

            <div className="px-6 py-5 border-t border-line bg-surface-sunk/30 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsAvatarModalOpen(false)} 
                className="btn btn-sm bg-transparent border-transparent text-ink-soft hover:bg-surface-sunk hover:text-ink font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsAvatarModalOpen(false)} 
                className="btn btn-mark btn-sm shadow-sm px-6"
              >
                Confirm Avatar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
