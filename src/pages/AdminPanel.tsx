Warning: truncated output (original token count: 42531)
Total output lines: 3125

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { 
  LayoutDashboard, 
  FileText, 
  Youtube, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Upload, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle,
  Clock,
  User as UserIcon,
  Users,
  ShoppingCart,
  ExternalLink,
  Plus,
  GraduationCap,
  Newspaper,
  Calendar,
  Edit3,
  Save,
  X,
  MessageSquare,
  Home,
  RefreshCw,
  ShieldCheck,
  LogIn,
  Eye,
  MonitorPlay,
  PlayCircle,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  MapPin,
  GripVertical,
  Megaphone,
  BarChart3,
  Bell,
  Star,
  Settings,
  Globe
} from 'lucide-react';
import { Resource, User, News, ForumPost, PGListing, Testimonial, User as AppUser, Ad, SiteSettings } from '../types';
import { getResources, approveResource, deleteResource, uploadResource, updateResource, uploadFile } from '../services/resourceService';
import { getNews, addNews, updateNews, deleteNews, approveNews } from '../services/newsService';
import { ForumService } from '../services/forumService';
import { getPGListings, deletePGListing } from '../services/pgService';
import { getTestimonials, addTestimonial, updateTestimonial, deleteTestimonial } from '../services/testimonialService';
import { getUsers, updateUserRole } from '../services/userService';
import { supabase } from '../supabase';
import { Card as TestimonialPreviewCard, VerifyIcon } from '../components/ui/demo';
import { College_COURSES, COURSE_METADATA, SUB_CATEGORIES } from '../constants';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AdminSidebar, AdminTab } from './admin/AdminSidebar';
import { AdminContributors } from './admin/AdminContributors';
import { CollegeMMY_EVENTS } from '../components/UpcomingEventsCarousel';


interface AdminPanelProps {
  user: any | null;
  appUser: AppUser | null;
  isAuthLoading: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, appUser, isAuthLoading }) => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [listings, setListings] = useState<PGListing[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [exchangeItems, setExchangeItems] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab | 'pending' | 'approved' | 'upload'>('overview');
  const [resourceSubTab, setResourceSubTab] = useState<'pending' | 'approved' | 'upload'>('approved');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [emailModal, setEmailModal] = useState<{ id: number; email: string; name: string } | null>(null);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [pgToDelete, setPgToDelete] = useState<string | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [carouselEditingItem, setCarouselEditingItem] = useState<any | null>(null);
  const [carouselImageInput, setCarouselImageInput] = useState('');
  // ── New CMS State ──
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adFormData, setAdFormData] = useState({ title: '', image_url: '', link_url: '', position: 'homepage_top' as Ad['position'], is_active: true });
  const [isUploadingAdImage, setIsUploadingAdImage] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({});
  // PG Edit
  const [editingPG, setEditingPG] = useState<PGListing | null>(null);
  const [pgEditForm, setPgEditForm] = useState({ college: '', location: '', budget: '', gender: 'Any' as string, description: '', socialLink: '' });
  const [isUploadingPGImage, setIsUploadingPGImage] = useState(false);
  const [pgEditImages, setPgEditImages] = useState<string[]>([]);
  // News image
  const [isUploadingNewsImage, setIsUploadingNewsImage] = useState(false);
  // Carousel file upload
  const [isUploadingCarouselImage, setIsUploadingCarouselImage] = useState(false);

  const [testimonialFormData, setTestimonialFormData] = useState({
    name: '',
    handle: '',
    image: '',
    text: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    type: 'Note' as any,
    course: '',
    semester: 1,
    subCategory: 'Lecture Notes',
    description: '',
    link: '',
    directDownloadLink: '',
    tags: '',
    file: null as File | null
  });

  const [isUploading, setIsUploading] = useState(false);

  // ── Playlist Curation State ──
  const [editingPlaylist, setEditingPlaylist] = useState<Resource | null>(null);
  const [isAddingPlaylist, setIsAddingPlaylist] = useState(false);
  
  // ── Carousel Inline Editor State ──
  const [carouselEditForm, setCarouselEditForm] = useState({
    title: '',
    college: '',
    date: '',
    summary: '',
    url: '',
    imageUrl: '',
  });
  const [isUploadingCarouselImageInline, setIsUploadingCarouselImageInline] = useState(false);
  const [playlistFormData, setPlaylistFormData] = useState({
    title: '',
    course: '',
    semester: 1,
    description: '',
    link: '',
    tags: '',
  });

  const getYoutubeThumbnail = (url: string): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const videoId = u.searchParams.get('v');
      if (videoId) {
        return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
      if (u.hostname === 'youtu.be') {
        const vid = u.pathname.replace(/^\//, '');
        if (vid) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      }
      const embedMatch = u.pathname.match(/\/embed\/([^/?#]+)/);
      if (embedMatch) {
        return `https://i.ytimg.com/vi/${embedMatch[1]}/hqdefault.jpg`;
      }
    } catch {
      const regExp = /(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/;
      const match = url.match(regExp);
      if (match && match[1]) {
        return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    return null;
  };

  const handlePlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistFormData.title || !playlistFormData.link || !playlistFormData.course) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!playlistFormData.link.includes('youtube.com') && !playlistFormData.link.includes('youtu.be')) {
      toast.error('Please enter a valid YouTube Video or Playlist URL');
      return;
    }

    setIsUploading(true);
    try {
      const tagsArray = playlistFormData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      if (editingPlaylist) {
        const updatedResource: Partial<Resource> = {
          title: playlistFormData.title,
          course: playlistFormData.course,
          semester: Number(playlistFormData.semester),
          description: playlistFormData.description,
          link: playlistFormData.link,
          tags: tagsArray,
          subCategory: 'Playlist',
          type: 'Playlist',
        };
        await updateResource(editingPlaylist.id, updatedResource);
        toast.success('Playlist updated successfully!');
      } else {
        const newResource = {
          title: playlistFormData.title,
          course: playlistFormData.course,
          semester: Number(playlistFormData.semester),
          description: playlistFormData.description,
          link: playlistFormData.link,
          tags: tagsArray,
          type: 'Playlist' as const,
          subCategory: 'Playlist',
          uploader: appUser?.displayName || 'Admin',
          uploaderId: appUser?.uid || '',
          uploaderRole: 'admin',
          isApproved: true,
        };
        await uploadResource(newResource);
        toast.success('Playlist published successfully!');
      }

      setIsAddingPlaylist(false);
      setEditingPlaylist(null);
      setPlaylistFormData({
        title: '',
        course: '',
        semester: 1,
        description: '',
        link: '',
        tags: '',
      });
      fetchResources();
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Failed to save playlist');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({ ...prev, file: acceptedFiles[0] }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  } as any);

  const [newsFormData, setNewsFormData] = useState({
    title: '',
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    summary: '',
    url: '',
    category: 'News' as 'News' | 'Event',
    college: 'University',
    venue: '',
    time: '',
    eligibility: 'All' as string,
    imageUrl: '',
  });

  // Auth guard is handled at the route level in App.tsx.
  // This effect only fetches data once admin access is confirmed.
  useEffect(() => {
    if (!isAuthLoading && (appUser?.role === 'admin' || appUser?.role === 'moderator')) {
      fetchResources();
      fetchNewsData();
      fetchTestimonials();
      fetchVerifications();
      getUsers(1, 0).then(res => setTotalUsers(res.total)).catch(console.error);
      const unsubscribePG = getPGListings((data) => setListings(data));
      ForumService.getPosts(undefined, undefined, 100).then((data) => setPosts(data));
      fetchAdminExchangeItems();
      fetchAds();
      fetchSettings();
      return () => {
        if (unsubscribePG) unsubscribePG();
      };
    }
  }, [appUser, isAuthLoading]);

  const fetchTestimonials = async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'carousel') {
      // Load all events for carousel management
      fetchNewsData();
      return undefined;
    }
    if (activeTab === 'forum') {

      ForumService.getPosts(undefined, undefined, 100).then((data) => {
        setPosts(data);
      });
      return undefined;
    }
    if (activeTab === 'pg') {
      const unsubscribe = getPGListings((data) => {
        setListings(data);
      });
      return () => unsubscribe();
    }
    if (activeTab === 'verification') {
      fetchVerifications();
      return undefined;
    }
    if (activeTab === 'users') {
      getUsers(500, 0).then(res => {
        setAllUsers(res.users);
      }).catch(console.error);
      return undefined;
    }
    if (activeTab === 'exchange') {
      fetchAdminExchangeItems();
      return undefined;
    }
    if (activeTab === 'ads') {
      fetchAds();
      return undefined;
    }
    if (activeTab === 'homepage-settings') {
      fetchSettings();
      return undefined;
    }
  }, [activeTab]);

  // ── Fetch Ads ──
  const fetchAds = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/ads/all`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) setAds(await res.json());
    } catch (err) { console.error(err); }
  };

  // ── Fetch Site Settings ──
  const fetchSettings = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data);
        setSettingsForm(data);
      }
    } catch (err) { console.error(err); }
  };

  // ── Upload image to any Cloudinary endpoint ──
  const uploadImageToEndpoint = async (file: File, endpoint: string): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('image', file);
    const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;
  };

  // ── Save Site Settings ──
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        setSiteSettings({ ...settingsForm });
        toast.success('Homepage settings saved!');
      } else toast.error('Failed to save settings');
    } catch (err) { toast.error('Network error'); }
    finally { setIsSavingSettings(false); }
  };

  const saveCarouselConfig = async (newConfig: any) => {
    try {
      const updatedSettings = {
        ...siteSettings,
        carousel_config: JSON.stringify(newConfig)
      };
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok) {
        setSiteSettings(updatedSettings);
        setSettingsForm(updatedSettings);
        return true;
      } else {
        toast.error('Failed to save carousel configuration');
        return false;
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving carousel configuration');
      return false;
    }
  };

  // ── Ad Submit ──
  const h…34531 tokens truncated… p-1 hover:bg-black">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {editingAd && (
                    <button type="button" onClick={() => { setEditingAd(null); setAdFormData({ title: '', image_url: '', link_url: '', position: 'homepage_top', is_active: true }); }}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={isUploadingAdImage || !adFormData.image_url}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {editingAd ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingAd ? 'Update Ad' : 'Create Ad'}
                  </button>
                </div>
              </form>
            </div>

            {/* Ads List */}
            <div className="space-y-4">
              <h3 className="text-base font-black text-gray-800">All Ads ({ads.length})</h3>
              {ads.length > 0 ? ads.map(ad => (
                <div key={ad.id} className={`bg-white rounded-[2rem] border p-4 flex items-center gap-4 shadow-sm transition-all ${ad.is_active ? 'border-green-100' : 'border-gray-100 opacity-60'}`}>
                  <img src={ad.image_url} alt={ad.title} className="w-24 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{ad.title}</h4>
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${ad.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {ad.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{ad.position.replace(/_/g, ' ')}</p>
                    {ad.link_url && <p className="text-xs text-purple-500 truncate mt-0.5">{ad.link_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setEditingAd(ad); setAdFormData({ title: ad.title, image_url: ad.image_url, link_url: ad.link_url, position: ad.position, is_active: Boolean(ad.is_active) }); }}
                      className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAdDelete(ad.id)} className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No ads yet. Create your first banner above.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'homepage-settings' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Settings className="w-7 h-7 text-purple-600" />
                  Homepage Settings
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Control the hero section, stats, and announcement banner without touching code.</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
              >
                {isSavingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSavingSettings ? 'Saving...' : 'Save All'}
              </button>
            </div>

            {/* Hero Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-base font-black text-gray-800 mb-5 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Hero Section
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Headline</label>
                  <input type="text" value={settingsForm.hero_headline || ''} onChange={e => setSettingsForm(p => ({...p, hero_headline: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" placeholder="Your Ultimate College Companion" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtext</label>
                  <textarea rows={2} value={settingsForm.hero_subtext || ''} onChange={e => setSettingsForm(p => ({...p, hero_subtext: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CTA Button Text</label>
                    <input type="text" value={settingsForm.hero_cta_text || ''} onChange={e => setSettingsForm(p => ({...p, hero_cta_text: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CTA Link</label>
                    <input type="text" value={settingsForm.hero_cta_link || ''} onChange={e => setSettingsForm(p => ({...p, hero_cta_link: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-base font-black text-gray-800 mb-5 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" /> Platform Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes Count</label>
                  <input type="text" value={settingsForm.stats_notes || ''} onChange={e => setSettingsForm(p => ({...p, stats_notes: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black" placeholder="5000+" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Colleges</label>
                  <input type="text" value={settingsForm.stats_colleges || ''} onChange={e => setSettingsForm(p => ({...p, stats_colleges: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black" placeholder="50+" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Students</label>
                  <input type="text" value={settingsForm.stats_students || ''} onChange={e => setSettingsForm(p => ({...p, stats_students: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black" placeholder="10,000+" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PYQs Count</label>
                  <input type="text" value={settingsForm.stats_pyqs || ''} onChange={e => setSettingsForm(p => ({...p, stats_pyqs: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black" placeholder="5,000+" />
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-base font-black text-gray-800 mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" /> Announcement Banner
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">(Shows at top of homepage)</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setSettingsForm(p => ({...p, announcement_active: p.announcement_active === 'true' ? 'false' : 'true'}))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${settingsForm.announcement_active === 'true' ? 'bg-rose-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${settingsForm.announcement_active === 'true' ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-gray-600">{settingsForm.announcement_active === 'true' ? 'Banner is visible' : 'Banner is hidden'}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner Text</label>
                  <input type="text" value={settingsForm.announcement_text || ''} onChange={e => setSettingsForm(p => ({...p, announcement_text: e.target.value}))} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" placeholder="e.g. 🎉 Semester exams are coming — check out PYQs!" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner Color (hex)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settingsForm.announcement_color || '#7c3aed'} onChange={e => setSettingsForm(p => ({...p, announcement_color: e.target.value}))} className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200" />
                    <input type="text" value={settingsForm.announcement_color || '#7c3aed'} onChange={e => setSettingsForm(p => ({...p, announcement_color: e.target.value}))} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-mono" />
                  </div>
                </div>
                {/* Live Preview */}
                {settingsForm.announcement_active === 'true' && settingsForm.announcement_text && (
                  <div className="rounded-xl px-4 py-3 text-sm font-bold text-white text-center" style={{ backgroundColor: settingsForm.announcement_color || '#7c3aed' }}>
                    {settingsForm.announcement_text}
                  </div>
                )}
              </div>
            </div>

            {/* Save button at bottom too */}
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSavingSettings ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSavingSettings ? 'Saving Settings...' : 'Save All Homepage Settings'}
            </button>
          </motion.div>
        ) : activeTab === 'contributors' ? (
          <AdminContributors />
        ) : null}

      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setResourceToDelete(null);
          setNewsToDelete(null);
          setPostToDelete(null);
          setPgToDelete(null);
          setTestimonialToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={
          resourceToDelete ? "Delete Resource" : 
          newsToDelete ? "Delete Update" : 
          postToDelete ? "Delete Forum Post" : 
          testimonialToDelete ? "Delete Testimonial" :
          "Delete PG Listing"
        }
        message={`Are you sure you want to delete this ${
          resourceToDelete ? 'resource' : 
          newsToDelete ? 'update' : 
          postToDelete ? 'forum post' : 
          testimonialToDelete ? 'testimonial' :
          'PG listing'
        }? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEmailModal(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">Send Email to {emailModal.name}</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Subject" 
                value={emailForm.subject}
                onChange={e => setEmailForm(f => ({...f, subject: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              <textarea 
                rows={4} 
                placeholder="Message (HTML allowed)"
                value={emailForm.message}
                onChange={e => setEmailForm(f => ({...f, message: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setEmailModal(null)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
                <button onClick={handleSendEmail} className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold">Send Email</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
