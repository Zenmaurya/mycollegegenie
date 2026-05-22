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
    if (!isAuthLoading && appUser?.role === 'admin') {
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
  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adFormData.image_url) { toast.error('Please upload or enter an image URL'); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const url = editingAd ? `${API_URL}/api/ads/${editingAd.id}` : `${API_URL}/api/ads`;
      const method = editingAd ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(adFormData),
      });
      if (res.ok) {
        toast.success(editingAd ? 'Ad updated!' : 'Ad created!');
        setEditingAd(null);
        setAdFormData({ title: '', image_url: '', link_url: '', position: 'homepage_top', is_active: true });
        fetchAds();
      } else toast.error('Failed to save ad');
    } catch (err) { toast.error('Network error'); }
  };

  // ── Delete Ad ──
  const handleAdDelete = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) { toast.success('Ad deleted'); fetchAds(); }
      else toast.error('Failed to delete ad');
    } catch (err) { toast.error('Network error'); }
  };

  // ── PG Edit Submit ──
  const handlePGEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPG) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/pg/${editingPG.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...pgEditForm, images: pgEditImages }),
      });
      if (res.ok) {
        toast.success('PG listing updated!');
        setEditingPG(null);
        const unsub = getPGListings((data) => setListings(data));
        setTimeout(() => unsub && unsub(), 2000);
      } else toast.error('Failed to update listing');
    } catch (err) { toast.error('Network error'); }
  };

  const fetchVerifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/verification/requests`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setVerifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminExchangeItems = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/admin/exchange`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setExchangeItems(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerificationAction = async (id: number, action: 'approve' | 'reject', note: string = '') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/verification/${id}/${action}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ admin_note: note })
      });
      if (res.ok) {
        toast.success(`Request ${action}d successfully`);
        fetchVerifications();
      } else {
        toast.error(`Failed to ${action} request`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    }
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API_URL}/api/verification/${emailModal.id}/email`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(emailForm)
      });
      if (res.ok) {
        toast.success('Email sent successfully!');
        setEmailModal(null);
        setEmailForm({ subject: '', message: '' });
      } else {
        toast.error('Failed to send email');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const data = await getResources(true); // includeUnapproved = true
      if (data) setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewsData = async () => {
    try {
      // includeUnapproved=true so admin sees pending events
      const data = await getNews(undefined, undefined, true);
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news');
    }
  };

  const handleApproveNews = async (id: string) => {
    try {
      await approveNews(id);
      setNews(prev => prev.map(n => n.id === id ? { ...n, isApproved: true } : n));
      toast.success('News/Event approved successfully!');
    } catch (error) {
      console.error('Failed to approve news:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve news.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveResource(id);
      setResources(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
      toast.success('Resource approved successfully!');
    } catch (error) {
      console.error('Failed to approve resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve resource.');
    }
  };

  const handleDelete = (id: string) => {
    setResourceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleNewsDelete = (id: string) => {
    setNewsToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handlePostDelete = (id: string) => {
    setPostToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handlePGDelete = (id: string) => {
    setPgToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleTestimonialDelete = (id: string) => {
    setTestimonialToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (resourceToDelete) {
      try {
        await deleteResource(resourceToDelete);
        setResources(prev => prev.filter(r => r.id !== resourceToDelete));
        toast.success('Resource deleted successfully!');
      } catch (error) {
        console.error('Failed to delete resource:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete resource.');
      } finally {
        setResourceToDelete(null);
      }
    } else if (newsToDelete) {
      try {
        await deleteNews(newsToDelete);
        setNews(prev => prev.filter(n => n.id !== newsToDelete));
        toast.success('News item deleted successfully!');
      } catch (error) {
        console.error('Failed to delete news:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete news.');
      } finally {
        setNewsToDelete(null);
      }
    } else if (postToDelete) {
      try {
        await ForumService.deletePost(postToDelete);
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        toast.success('Forum post deleted successfully!');
      } catch (error) {
        console.error('Failed to delete post:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete post.');
      } finally {
        setPostToDelete(null);
      }
    } else if (pgToDelete) {
      try {
        await deletePGListing(pgToDelete);
        setListings(prev => prev.filter(p => p.id !== pgToDelete));
        toast.success('PG listing deleted successfully!');
      } catch (error) {
        console.error('Failed to delete PG listing:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete PG listing.');
      } finally {
        setPgToDelete(null);
      }
    } else if (testimonialToDelete) {
      try {
        await deleteTestimonial(testimonialToDelete);
        setTestimonials(prev => prev.filter(t => t.id !== testimonialToDelete));
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
      } finally {
        setTestimonialToDelete(null);
      }
    }
    setIsDeleteModalOpen(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course) {
      toast.error('Please select a course');
      return;
    }
    setIsUploading(true);
    try {
      let finalLink = formData.link;
      let finalDirectDownloadLink = formData.directDownloadLink;

      if (formData.file) {
        toast.loading('Uploading file...', { id: 'upload-toast' });
        let folder: 'pyqs' | 'books' | 'notes' | 'resources' = 'resources';
        if (formData.type === 'PYQ') folder = 'pyqs';
        if (formData.type === 'Book') folder = 'books';
        if (formData.type === 'Note') folder = 'notes';
        const fileUrl = await uploadFile(formData.file, folder, {
          course:  formData.course,
          subject: formData.title,
        });
        finalLink = fileUrl;
        finalDirectDownloadLink = fileUrl;
        toast.dismiss('upload-toast');
      } else if (!finalDirectDownloadLink && finalLink) {
        const directExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
        if (directExtensions.some(ext => finalLink.toLowerCase().endsWith(ext))) {
          finalDirectDownloadLink = finalLink;
        }
      }

      if (editingResource) {
        const updatedData: any = {
          ...formData,
          link: finalLink,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        };
        
        if (finalDirectDownloadLink) {
          updatedData.directDownloadLink = finalDirectDownloadLink;
        } else {
          updatedData.directDownloadLink = null;
        }

        const { file, ...dataToUpload } = updatedData;
        await updateResource(editingResource.id, dataToUpload);
        toast.success('Resource updated successfully!');
        setEditingResource(null);
      } else {
        const resourceData: any = {
          ...formData,
          link: finalLink || 'https://example.com',
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
          uploader: user?.displayName || 'Admin',
          isApproved: true // Admin uploads are auto-approved
        };

        if (finalDirectDownloadLink) {
          resourceData.directDownloadLink = finalDirectDownloadLink;
        } else {
          resourceData.directDownloadLink = null;
        }

        const { file, ...dataToUpload } = resourceData;
        await uploadResource(dataToUpload);
        toast.success('Resource published successfully!');
      }
      
      fetchResources();
      setFormData({
        title: '',
        type: 'Note',
        course: '',
        semester: 1,
        subCategory: 'Lecture Notes',
        description: '',
        link: '',
        directDownloadLink: '',
        tags: '',
        file: null
      });
      setActiveTab('approved');
    } catch (error) {
      console.error('Failed to process resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process resource. Please check if there are missing fields.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await updateNews(editingNews.id, { ...newsFormData, image_url: newsFormData.imageUrl } as any);
        toast.success('News item updated successfully!');
        setEditingNews(null);
      } else {
        await addNews({ ...newsFormData, image_url: newsFormData.imageUrl } as any);
        toast.success('News item added successfully!');
      }
      fetchNewsData();
      setNewsFormData({
        title: '',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        summary: '',
        url: '',
        category: 'News',
        college: 'University',
        venue: '',
        time: '',
        eligibility: 'All',
        imageUrl: '',
      });
    } catch (error) {
      console.error('Failed to process news:', error);
      toast.error('Failed to save news/event');
    }
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        await updateTestimonial(editingTestimonial.id, testimonialFormData);
        setEditingTestimonial(null);
        toast.success("Testimonial updated successfully!");
      } else {
        await addTestimonial(testimonialFormData);
        toast.success("Testimonial added successfully!");
      }
      fetchTestimonials();
      setTestimonialFormData({ name: '', handle: '', image: '', text: '' });
    } catch (error) {
      console.error('Failed to process testimonial', error);
      toast.error('Failed to process testimonial.');
    }
  };

  const startEditingResource = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      course: resource.course,
      semester: resource.semester,
      subCategory: resource.subCategory,
      description: resource.description,
      link: resource.link,
      directDownloadLink: resource.directDownloadLink || '',
      tags: resource.tags.join(', '),
      file: null
    });
    setActiveTab('upload');
  };

  const startEditingNews = (n: News) => {
    setEditingNews(n);
    setNewsFormData({
      title: n.title,
      date: n.date,
      summary: n.summary,
      url: n.url,
      category: n.category,
      college: n.college,
      venue: n.venue || '',
      time: (n as any).time || '',
      eligibility: n.eligibility || 'All',
      imageUrl: n.imageUrl || '',
    });
  };

  const startEditingTestimonial = (t: Testimonial) => {
    setEditingTestimonial(t);
    setTestimonialFormData({
      name: t.name,
      handle: t.handle,
      image: t.image,
      text: t.text
    });
  };

  const filteredResources = resources.filter(r => {
    const matchesTab = activeTab === 'pending' ? !r.isApproved : r.isApproved;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         r.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === 'All Courses' || r.course === selectedCourse;
    return matchesTab && matchesSearch && matchesCourse;
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white/40 backdrop-blur-md p-12 rounded-[3rem] shadow-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <UserIcon className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Admin Access</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">Please sign in with an administrator account to access the management dashboard.</p>
          <Link 
            to="/login" 
            state={{ from: { pathname: '/admin' } }}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Admin
          </Link>
        </motion.div>
      </div>
    );
  }

  if (appUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md bg-white/40 backdrop-blur-md p-12 rounded-[3rem] shadow-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-12 h-12 text-rose-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Access Denied</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">You do not have the required permissions to view the administrator panel. If you believe this is an error, please contact support.</p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-tighter hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 to-purple-50/30 flex flex-col md:flex-row">
      <Helmet>
        <title>Admin Panel | MyCollegeGenie</title>
        <meta name="description" content="Manage MyCollegeGenie resources, users, and settings." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminSidebar 
        activeTab={activeTab as AdminTab} 
        setActiveTab={setActiveTab} 
        pendingCounts={{ 
          resources: resources.filter(r => !r.isApproved).length, 
          verifications: verifications.filter(v => v.status === 'pending').length 
        }} 
      />

      <div className="flex-1 p-4 sm:p-8 md:h-[calc(100vh-5rem)] overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
        
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-purple-600" />
              Platform Overview
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { label: 'Pending Resources', value: resources.filter(r => !r.isApproved).length, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                { label: 'Active PG Listings', value: listings.length, icon: Home, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                { label: 'Pending Verifications', value: verifications.filter(v => v.status === 'pending').length, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                { label: 'Active Playlists', value: resources.filter(r => r.type === 'Playlist').length, icon: Youtube, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
                { label: 'Active Ads', value: ads.filter(a => a.is_active).length, icon: Megaphone, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={`bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border ${stat.border} shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-5 transition-all cursor-default`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color} shadow-inner`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900 leading-none">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-purple-500" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setActiveTab('resources')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all">Moderate Resources</button>
                <button onClick={() => setActiveTab('verification')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all">Verify Users</button>
              </div>
            </div>
          </motion.div>
        )}



        {activeTab === 'playlists' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Youtube className="w-8 h-8 text-purple-600 animate-pulse" />
                  Playlists Curation
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Curate and manage YouTube course playlists and video lectures for students.</p>
              </div>
              
              {!isAddingPlaylist && !editingPlaylist && (
                <button
                  onClick={() => {
                    setIsAddingPlaylist(true);
                    setEditingPlaylist(null);
                    setPlaylistFormData({
                      title: '',
                      course: College_COURSES[0] || '',
                      semester: 1,
                      description: '',
                      link: '',
                      tags: '',
                    });
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Add Playlist
                </button>
              )}
            </div>

            {/* Stats Overview */}
            {!isAddingPlaylist && !editingPlaylist && (
              <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-6 flex items-center justify-between gap-6 max-w-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                    <Youtube className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total Playlists</p>
                    <p className="text-2xl font-black text-purple-900 leading-none mt-1">
                      {resources.filter(r => r.type === 'Playlist').length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Playlist Form (Add / Edit) */}
            {(isAddingPlaylist || editingPlaylist) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl max-w-3xl mx-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    {editingPlaylist ? <Edit3 className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
                    {editingPlaylist ? 'Edit Playlist' : 'Add New Playlist'}
                  </h3>
                  <button 
                    onClick={() => {
                      setIsAddingPlaylist(false);
                      setEditingPlaylist(null);
                    }}
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handlePlaylistSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Playlist Title *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Data Structures & Algorithms Lectures"
                        value={playlistFormData.title}
                        onChange={e => setPlaylistFormData({...playlistFormData, title: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">YouTube URL (Video or Playlist) *</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://www.youtube.com/playlist?list=..."
                        value={playlistFormData.link}
                        onChange={e => setPlaylistFormData({...playlistFormData, link: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course *</label>
                      <select 
                        value={playlistFormData.course}
                        onChange={e => setPlaylistFormData({...playlistFormData, course: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                      >
                        <option value="">Select Course</option>
                        {College_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester *</label>
                      <select 
                        value={playlistFormData.semester}
                        onChange={e => setPlaylistFormData({...playlistFormData, semester: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                      >
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="dsa, algorithms, computer science, programming"
                      value={playlistFormData.tags}
                      onChange={e => setPlaylistFormData({...playlistFormData, tags: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description *</label>
                    <textarea 
                      required 
                      rows={3} 
                      placeholder="Provide a description detailing what this playlist covers..."
                      value={playlistFormData.description}
                      onChange={e => setPlaylistFormData({...playlistFormData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>

                  {/* YouTube Live Preview in form */}
                  {playlistFormData.link && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Live Video Thumbnail Preview</span>
                      {(() => {
                        const thumb = getYoutubeThumbnail(playlistFormData.link);
                        return thumb ? (
                          <div className="relative aspect-video w-64 rounded-xl overflow-hidden shadow-md">
                            <img src={thumb} className="w-full h-full object-cover" alt="Playlist Preview" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <PlayCircle className="w-10 h-10 text-white/90" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No video ID detected. (Standard YouTube playlists will fallback to a default icon)</span>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading && <RefreshCw className="w-4 h-4 animate-spin" />}
                      {editingPlaylist ? 'Update Playlist' : 'Publish Playlist'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingPlaylist(false);
                        setEditingPlaylist(null);
                      }}
                      className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Playlist Grid Display */}
            {!isAddingPlaylist && !editingPlaylist && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.filter(r => r.type === 'Playlist').map(playlist => {
                    const thumb = getYoutubeThumbnail(playlist.link);
                    return (
                      <motion.div
                        layout
                        key={playlist.id}
                        whileHover={{ y: -6 }}
                        className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full group"
                      >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-gray-50 relative flex items-center justify-center overflow-hidden shrink-0">
                          {thumb ? (
                            <>
                              <img src={thumb} alt={playlist.title} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 flex items-center justify-center">
                              <Youtube className="w-12 h-12 text-purple-400" />
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-wider">
                            <PlayCircle className="w-3.5 h-3.5" />
                            Playlist
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 px-5 pt-4 shrink-0">
                          <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 uppercase tracking-widest">
                            Sem {playlist.semester}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 truncate">
                            {playlist.course}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="px-5 pt-3 shrink-0">
                          <h4 className="text-base font-black text-gray-900 group-hover:text-purple-600 transition-colors tracking-tight line-clamp-1">
                            {playlist.title}
                          </h4>
                        </div>

                        {/* Description */}
                        <div className="px-5 pt-2 shrink-0">
                          <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-2">
                            {playlist.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="flex-grow" />

                        {/* Actions Footer */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-5 mt-4 border-t border-gray-50 shrink-0">
                          <div className="flex gap-1.5 flex-wrap min-w-0">
                            {playlist.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[8px] font-black text-gray-400 uppercase tracking-widest truncate">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPlaylist(playlist);
                                setPlaylistFormData({
                                  title: playlist.title,
                                  course: playlist.course,
                                  semester: playlist.semester,
                                  description: playlist.description,
                                  link: playlist.link,
                                  tags: playlist.tags.join(', '),
                                });
                              }}
                              className="p-2 bg-gray-50 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                              title="Edit Playlist"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setResourceToDelete(playlist.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                              title="Delete Playlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {resources.filter(r => r.type === 'Playlist').length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Youtube className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">No playlists curated yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto font-medium mb-6">
                      Get started by curating the first YouTube lecture series for your courses.
                    </p>
                    <button
                      onClick={() => {
                        setIsAddingPlaylist(true);
                        setEditingPlaylist(null);
                        setPlaylistFormData({
                          title: '',
                          course: College_COURSES[0] || '',
                          semester: 1,
                          description: '',
                          link: '',
                          tags: '',
                        });
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Curate First Playlist
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'resources' && (
          <div className="mb-8 flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm w-fit">
            <button onClick={() => setActiveTab('pending')} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">View Pending</button>
            <button onClick={() => setActiveTab('approved')} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">View Approved</button>
            <button onClick={() => setActiveTab('upload')} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50">Upload New</button>
          </div>
        )}

        {activeTab === 'pending' || activeTab === 'approved' ? (
          <div className="space-y-6">
            {/* Back to Resources Nav */}
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setActiveTab('resources')} className="text-purple-600 font-bold hover:underline">← Back to Resources</button>
              <h2 className="text-2xl font-black text-gray-900 capitalize">{activeTab} Resources</h2>
            </div>
            {/* Filters */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input 
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm sm:text-base font-medium"
                />
              </div>
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full text-ellipsis overflow-hidden px-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/20 text-sm sm:text-base font-black uppercase tracking-widest"
              >
                <option>All Courses</option>
                {College_COURSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Resource List */}
            <div className="grid gap-4 sm:gap-6">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] animate-pulse" />)
              ) : filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                    <div key={resource.id} className="bg-white p-5 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 sm:gap-6">
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${resource.type === 'Playlist' ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'}`}>
                          {resource.type === 'Playlist' ? <Youtube className="w-5 h-5 sm:w-7 sm:h-7" /> : <FileText className="w-5 h-5 sm:w-7 sm:h-7" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-xl font-black text-gray-900 truncate tracking-tight">{resource.title}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-1.5 mt-1.5 text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {resource.course}</span>
                            <span className="bg-gray-50 px-2 py-0.5 rounded-lg">Sem {resource.semester}</span>
                            <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {resource.uploader}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        {resource.type !== 'Playlist' && (
                          <button 
                            onClick={() => navigate(`/flipbook/${resource.id}`)}
                            className="p-2.5 sm:p-3.5 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-2xl transition-all shadow-sm"
                            title="View on Website (Flipbook)"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => window.open(resource.link, '_blank')}
                          className="p-2.5 sm:p-3.5 bg-gray-50 text-gray-400 hover:text-purple-600 rounded-2xl transition-colors"
                          title="View Resource"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => startEditingResource(resource)}
                          className="p-2.5 sm:p-3.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-colors"
                          title="Edit Resource"
                        >
                          <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {activeTab === 'pending' && (
                          <button 
                            onClick={() => handleApprove(resource.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(resource.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          Delete
                        </button>
                      </div>
                    </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">No resources found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'upload' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] border border-gray-100 shadow-2xl shadow-purple-900/5 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                {editingResource ? <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" /> : <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />}
                {editingResource ? 'Edit Resource' : 'Upload New Content'}
              </h2>
              {editingResource && (
                <button 
                  onClick={() => {
                    setEditingResource(null);
                    setFormData({
                      title: '',
                      type: 'Note',
                      course: '',
                      semester: 1,
                      subCategory: 'Lecture Notes',
                      description: '',
                      link: '',
                      directDownloadLink: '',
                      tags: ''
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              )}
            </div>
            
            <form onSubmit={handleUpload} className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Resource Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Microeconomics Unit 1 Notes"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm sm:text-base font-medium"
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Resource Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm sm:text-base font-black uppercase tracking-widest"
                  >
                    <option value="Note">Note</option>
                    <option value="PYQ">PYQ</option>
                    <option value="Playlist">Playlist</option>
                    <option value="Book">Book</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Course</label>
                  <select 
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm sm:text-base font-black uppercase tracking-widest"
                  >
                    <option value="" disabled>Select Course</option>
                    {College_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Semester</label>
                  <select 
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                    className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm sm:text-base font-black uppercase tracking-widest"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Sub-Category</label>
                  <select 
                    value={formData.subCategory}
                    onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                    className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm sm:text-base font-black uppercase tracking-widest"
                  >
                    {(COURSE_METADATA[formData.course]?.subCategories || SUB_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Resource Link (Google Drive/YouTube)</label>
                <input 
                  required={!formData.file}
                  type="url"
                  placeholder="https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                  className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm sm:text-base font-medium"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Or Upload PDF/File</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all cursor-pointer ${
                    isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    {formData.file ? (
                      <>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">{formData.file.name}</p>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, file: null }));
                          }}
                          className="text-xs text-red-500 hover:text-red-600 font-bold uppercase tracking-wider"
                        >
                          Remove File
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Drag & drop a file here, or click to select</p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Direct Download Link (Optional)</label>
                <input 
                  type="url"
                  placeholder="Direct PDF link"
                  value={formData.directDownloadLink}
                  onChange={(e) => setFormData({...formData, directDownloadLink: e.target.value})}
                  className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm sm:text-base font-medium"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Briefly describe the resource..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/20 outline-none resize-none text-sm sm:text-base font-medium"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tags (Comma separated)</label>
                <input 
                  type="text"
                  placeholder="economics, notes, sem1"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm sm:text-base font-medium"
                />
              </div>

              <button 
                type="submit"
                disabled={isUploading}
                className="w-full py-4 sm:py-5 bg-purple-600 text-white rounded-2xl font-black text-sm sm:text-lg uppercase tracking-widest shadow-2xl shadow-purple-600/20 hover:bg-purple-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : editingResource ? (
                  <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {isUploading ? 'Processing...' : editingResource ? 'Update Resource' : 'Publish Resource'}
              </button>
            </form>
          </motion.div>
        ) : activeTab === 'news' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* News Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm h-fit"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  {editingNews ? <Edit3 className="w-6 h-6 text-purple-600" /> : <Plus className="w-6 h-6 text-purple-600" />}
                  {editingNews ? 'Edit News/Event' : 'Add News/Event'}
                </h2>
                {editingNews && (
                  <button 
                    onClick={() => {
                      setEditingNews(null);
                      setNewsFormData({
                        title: '',
                        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                        summary: '',
                        url: '',
                        category: 'News',
                        college: 'University',
                        venue: '',
                        time: '',
                        eligibility: 'All',
                        imageUrl: '',
                      });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              <form onSubmit={handleNewsSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                  <input 
                    required
                    type="text"
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({...newsFormData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={newsFormData.category}
                      onChange={(e) => setNewsFormData({...newsFormData, category: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest"
                    >
                      <option value="News">News</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      required
                      type="text"
                      value={newsFormData.date}
                      onChange={(e) => setNewsFormData({...newsFormData, date: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">College/Source</label>
                  <input 
                    required
                    type="text"
                    value={newsFormData.college}
                    onChange={(e) => setNewsFormData({...newsFormData, college: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Summary</label>
                  <textarea 
                    required
                    rows={3}
                    value={newsFormData.summary}
                    onChange={(e) => setNewsFormData({...newsFormData, summary: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none resize-none text-sm font-medium"
                  />
                </div>

                {/* Event-only fields */}
                {newsFormData.category === 'Event' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Venue</label>
                      <input 
                        type="text"
                        placeholder="e.g. Auditorium, Block-A"
                        value={newsFormData.venue}
                        onChange={(e) => setNewsFormData({...newsFormData, venue: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time</label>
                      <input 
                        type="text"
                        placeholder="e.g. 10:00 AM – 4:00 PM"
                        value={newsFormData.time}
                        onChange={(e) => setNewsFormData({...newsFormData, time: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Eligibility</label>
                      <select
                        value={newsFormData.eligibility}
                        onChange={(e) => setNewsFormData({...newsFormData, eligibility: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest"
                      >
                        <option value="All">All</option>
                        <option value="DU Only">DU Only</option>
                        <option value="College Specific">College Specific</option>
                        <option value="Girls Only">Girls Only</option>
                        <option value="DU + SOL">DU + SOL</option>
                        <option value="DU + SOL + NCWEB">DU + SOL + NCWEB</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Poster / Banner Image */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poster / Banner Image</label>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      placeholder="Paste image URL or upload..."
                      value={newsFormData.imageUrl}
                      onChange={(e) => setNewsFormData({...newsFormData, imageUrl: e.target.value})}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                    />
                    <label className={`cursor-pointer flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all shrink-0 ${isUploadingNewsImage ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'}`}>
                      {isUploadingNewsImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isUploadingNewsImage ? '...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingNewsImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingNewsImage(true);
                          try {
                            const url = await uploadImageToEndpoint(file, '/api/news/upload-image');
                            setNewsFormData(prev => ({...prev, imageUrl: url}));
                            toast.success('Image uploaded!');
                          } catch { toast.error('Upload failed'); }
                          finally { setIsUploadingNewsImage(false); }
                        }}
                      />
                    </label>
                  </div>
                  {newsFormData.imageUrl && (
                    <div className="relative mt-2 rounded-xl overflow-hidden h-32 bg-gray-100">
                      <img src={newsFormData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewsFormData(prev => ({...prev, imageUrl: ''}))}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Source URL (Optional)</label>
                  <input 
                    type="url"
                    value={newsFormData.url}
                    onChange={(e) => setNewsFormData({...newsFormData, url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUploadingNewsImage}
                  className="w-full py-4 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {editingNews ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingNews ? 'Update' : 'Publish'}
                </button>
              </form>
            </motion.div>

            {/* News List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3 tracking-tight">
                <Clock className="w-6 h-6 text-purple-600" />
                Recent Updates
              </h2>
              
              {news.length > 0 ? (
                news.map(n => (
                  <div key={n.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      {n.imageUrl ? (
                        <img src={n.imageUrl} alt={n.title} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-6 h-6 text-purple-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${n.category === 'Event' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            {n.category}
                          </span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{n.date}</span>
                          {(n as any).isApproved === false || (n as any).isApproved === undefined
                            ? <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-600">Pending</span>
                            : <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600">Approved</span>
                          }
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1 leading-tight">{n.title}</h3>
                        <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{n.summary}</p>
                        <div className="flex items-center gap-4">
                          {!(n as any).isApproved && (
                            <button 
                              onClick={() => handleApproveNews(n.id)}
                              className="text-[10px] font-black text-green-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Approve
                            </button>
                          )}
                          <button 
                            onClick={() => startEditingNews(n)}
                            className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleNewsDelete(n.id)}
                            className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm font-medium">No updates found.</p>
                </div>
              )}
            </motion.div>
          </div>
        ) : activeTab === 'forum' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                Manage Forum Posts
              </h2>
            </div>
            
            <div className="grid gap-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between gap-4 group hover:shadow-md transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[8px] font-black uppercase tracking-widest">
                          {post.course}
                        </span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <UserIcon className="w-3 h-3" /> {post.authorName}
                      </p>
                    </div>
                    <button 
                      onClick={() => handlePostDelete(post.id)}
                      className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">No forum posts found.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'pg' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                <Home className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                Manage PG Listings
              </h2>
            </div>

            {/* PG Edit Modal */}
            {editingPG && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingPG(null)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-3"><Edit3 className="w-5 h-5 text-purple-600" /> Edit PG Listing</h3>
                    <button onClick={() => setEditingPG(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <form onSubmit={handlePGEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">College</label>
                        <input type="text" required value={pgEditForm.college} onChange={e => setPgEditForm({...pgEditForm, college: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</label>
                        <input type="text" required value={pgEditForm.location} onChange={e => setPgEditForm({...pgEditForm, location: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget / Rent</label>
                        <input type="text" value={pgEditForm.budget} onChange={e => setPgEditForm({...pgEditForm, budget: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" placeholder="e.g. ₹5,000/month" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                        <select value={pgEditForm.gender} onChange={e => setPgEditForm({...pgEditForm, gender: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-black uppercase">
                          <option value="Any">Any</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea rows={3} value={pgEditForm.description} onChange={e => setPgEditForm({...pgEditForm, description: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm resize-none" />
                    </div>
                    {/* Image upload */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photos</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {pgEditImages.map((img, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setPgEditImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <label className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${isUploadingPGImage ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-purple-200 hover:bg-purple-50'}`}>
                          {isUploadingPGImage ? <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /> : <Plus className="w-5 h-5 text-purple-400" />}
                          <span className="text-[9px] font-bold text-gray-400 mt-1">{isUploadingPGImage ? 'Uploading' : 'Add'}</span>
                          <input type="file" accept="image/*" className="hidden" disabled={isUploadingPGImage} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingPGImage(true);
                            try {
                              const url = await uploadImageToEndpoint(file, '/api/pg/upload-image');
                              setPgEditImages(prev => [...prev, url]);
                              toast.success('Photo added!');
                            } catch { toast.error('Upload failed'); }
                            finally { setIsUploadingPGImage(false); }
                          }} />
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setEditingPG(null)} className="flex-1 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            <div className="grid gap-4">
              {listings.length > 0 ? (
                listings.map(listing => (
                  <div key={listing.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between gap-4 group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Thumbnail */}
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                          <Home className="w-7 h-7 text-purple-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{listing.budget}</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{listing.gender}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 truncate">{listing.college}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {listing.location} · <UserIcon className="w-3 h-3" /> {listing.authorName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          setEditingPG(listing);
                          setPgEditForm({ college: listing.college, location: listing.location, budget: listing.budget, gender: listing.gender, description: listing.description, socialLink: listing.socialLink || '' });
                          setPgEditImages(listing.images || []);
                        }}
                        className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm"
                        title="Edit listing"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handlePGDelete(listing.id)}
                        className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">No PG listings found.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'testimonials' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                Manage Testimonials
              </h2>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-4">{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
                  <form onSubmit={handleTestimonialSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Name (e.g. Aarav Saini)"
                        value={testimonialFormData.name}
                        onChange={e => setTestimonialFormData({...testimonialFormData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Handle (e.g. @aarav_du)"
                        value={testimonialFormData.handle}
                        onChange={e => setTestimonialFormData({...testimonialFormData, handle: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Image URL (Unsplash or direct image link)"
                      value={testimonialFormData.image}
                      onChange={e => setTestimonialFormData({...testimonialFormData, image: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Testimonial text..."
                      value={testimonialFormData.text}
                      onChange={e => setTestimonialFormData({...testimonialFormData, text: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium resize-none"
                    />
                    <div className="flex gap-4">
                      <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors">
                        {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
                      </button>
                      {editingTestimonial && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingTestimonial(null);
                            setTestimonialFormData({ name: '', handle: '', image: '', text: '' });
                          }}
                          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center lg:w-[350px] shrink-0">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Live Preview</h4>
                  <div className="pointer-events-none transform scale-90 sm:scale-100 origin-top">
                    <TestimonialPreviewCard card={{...testimonialFormData, id: 'preview', createdAt: ''}} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.length > 0 ? testimonials.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col justify-between transition-all group relative">
                  <div>
                    <div className="flex gap-3">
                      <img className="w-12 h-12 rounded-full object-cover" src={t.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"} alt={t.name} />
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-sm leading-snug">{t.name}</p>
                          <VerifyIcon />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{t.handle}</span>
                      </div>
                    </div>
                    <p className="text-sm pt-4 text-gray-600 leading-relaxed font-medium italic">
                      "{t.text}"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => startEditingTestimonial(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleTestimonialDelete(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No testimonials found.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'verification' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {verifications.map((req, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={req.id} 
                  className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group transition-all"
                >
                  <div className="absolute top-0 right-0 bg-white/60 backdrop-blur-sm border-b border-l border-white/50 px-3 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
                    {new Date(req.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center shadow-inner border border-amber-100/50">
                      <ShieldCheck className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{req.listing_title || req.listing_id}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{req.listing_type}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-gray-600"><span className="font-bold">User:</span> {req.user_name} ({req.user_email})</p>
                    <p className="text-xs text-gray-600"><span className="font-bold">Phone:</span> {req.user_phone}</p>
                    <p className="text-xs text-gray-600"><span className="font-bold">UTR/Ref:</span> <span className="font-mono text-purple-600">{req.payment_ref}</span></p>
                    {req.notes && <p className="text-xs text-gray-600"><span className="font-bold">Notes:</span> {req.notes}</p>}
                    <p className="text-xs text-gray-600">
                      <span className="font-bold">Status:</span> 
                      <span className={`ml-1 px-2 py-0.5 rounded-md uppercase font-bold text-[10px] ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{req.status}</span>
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleVerificationAction(req.id, 'approve')} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-all">
                        Approve
                      </button>
                      <button onClick={() => handleVerificationAction(req.id, 'reject')} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                        Reject
                      </button>
                    </div>
                  )}

                  <div className="mt-3">
                    <button 
                      onClick={() => setEmailModal({ id: req.id, email: req.user_email, name: req.user_name })}
                      className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                    >
                      ✉️ Send Email
                    </button>
                  </div>
                </motion.div>
              ))}
              {verifications.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No verification requests found.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'users' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/50 p-6 overflow-x-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2 px-2">
                <Users className="w-5 h-5 text-purple-500" />
                User Directory
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-gray-400 border-b border-gray-100/50">
                    <th className="pb-4 font-black px-4">User</th>
                    <th className="pb-4 font-black px-4">Email</th>
                    <th className="pb-4 font-black px-4">College</th>
                    <th className="pb-4 font-black px-4">Role</th>
                    <th className="pb-4 font-black text-right px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-white/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-gray-900 flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-700 font-bold text-xs shadow-sm">
                            {u.displayName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        {u.displayName || 'Unknown'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{u.email}</td>
                      <td className="py-4 px-4 text-gray-500 text-xs">{u.college || '-'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 
                          u.role === 'moderator' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <select
                          className="bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all cursor-pointer shadow-sm"
                          value={u.role || 'user'}
                          onChange={(e) => {
                            const newRole = e.target.value as 'user' | 'moderator' | 'admin';
                            updateUserRole(u.id, newRole)
                              .then(() => {
                                toast.success('Role updated successfully');
                                setAllUsers(prev => prev.map(user => user.id === u.id ? { ...user, role: newRole } : user));
                              })
                              .catch(err => toast.error(err.message || 'Failed to update role'));
                          }}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : activeTab === 'exchange' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 overflow-x-auto shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="pb-4 font-bold">Item</th>
                    <th className="pb-4 font-bold">Seller</th>
                    <th className="pb-4 font-bold">Type</th>
                    <th className="pb-4 font-bold">Status</th>
                    <th className="pb-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {exchangeItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-4 font-bold text-gray-900">
                        {item.title}
                        <div className="text-[10px] text-gray-400 font-normal truncate max-w-[200px]">{item.description}</div>
                      </td>
                      <td className="py-4 text-gray-600">
                        {item.seller_name}
                        <div className="text-[10px] text-gray-400">{item.seller_email}</div>
                      </td>
                      <td className="py-4 text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold uppercase">{item.type}</span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {item.is_active ? (
                          <button
                            onClick={() => {
                              const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
                              supabase.auth.getSession().then(({ data: { session } }) => {
                                fetch(`${API_URL}/api/exchange/${item.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${session?.access_token}` }
                                }).then(res => {
                                  if (res.ok) {
                                    toast.success('Listing deactivated');
                                    fetchAdminExchangeItems();
                                  } else toast.error('Failed to deactivate');
                                });
                              });
                            }}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                           <span className="text-xs text-gray-400 italic">Deleted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {exchangeItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">No exchange listings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : activeTab === 'carousel' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <MonitorPlay className="w-7 h-7 text-purple-600" />
                  Homepage Carousel
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Control which events appear in the auto-scrolling carousel on the homepage.</p>
              </div>
            </div>

            {/* Info banner */}
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3">
              <MonitorPlay className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-purple-700">Auto-scrolling Carousel</p>
                <p className="text-xs text-purple-500 mt-0.5">The carousel loops infinitely and pauses on hover. When no real events exist, sample events are shown automatically. Toggle visibility and update poster images below.</p>
              </div>
            </div>

            {/* Real Events from DB */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-gray-800 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                Real Events (from News &amp; Events)
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-5">Toggle which events show in the carousel. Edit their poster image URL.</p>
              {news.filter(n => n.category === 'Event').length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Calendar className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No events in the database yet.</p>
                  <p className="text-gray-300 text-xs mt-1">Add events from the News &amp; Events tab.</p>
                  <button
                    onClick={() => setActiveTab('news')}
                    className="mt-4 text-xs bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                  >Go to News &amp; Events →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {news.filter(n => n.category === 'Event').map((ev, idx) => {
                    const stored = JSON.parse(siteSettings?.carousel_config || '{}');
                    const isEnabled = stored[ev.id]?.show ?? true;
                    const customImg = stored[ev.id]?.imageUrl ?? ev.imageUrl;
                    const isEditing = carouselEditingItem?.id === ev.id && carouselEditingItem?.type === 'real';
                    return (
                      <div key={ev.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isEnabled ? 'border-purple-100 bg-purple-50/40' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                        {/* Poster thumb */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                          {customImg ? (
                            <img src={customImg} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-white/60" />
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-800 line-clamp-1">{ev.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{ev.college} · {ev.date}</p>
                          {isEditing ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={carouselImageInput}
                                onChange={e => setCarouselImageInput(e.target.value)}
                                placeholder="Paste poster image URL..."
                                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg"
                              />
                              <button
                                onClick={async () => {
                                  const config = JSON.parse(siteSettings?.carousel_config || '{}');
                                  config[ev.id] = { ...config[ev.id], imageUrl: carouselImageInput };
                                  await saveCarouselConfig(config);
                                  await updateNews(String(ev.id), { imageUrl: carouselImageInput } as any);
                                  setCarouselEditingItem(null);
                                  toast.success('Poster image saved!');
                                }}
                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold"
                              >Save</button>
                              <button onClick={() => setCarouselEditingItem(null)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg font-bold">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setCarouselEditingItem({ id: ev.id, type: 'real' }); setCarouselImageInput(customImg || ''); }}
                              className="mt-1 text-[10px] text-purple-500 hover:text-purple-700 font-bold flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Edit poster image
                            </button>
                          )}
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={async () => {
                            const config = JSON.parse(siteSettings?.carousel_config || '{}');
                            config[ev.id] = { ...config[ev.id], show: !isEnabled };
                            await saveCarouselConfig(config);
                            toast.success(isEnabled ? 'Hidden from carousel' : 'Shown in carousel');
                            setCarouselEditingItem(null);
                          }}
                          className={`flex-shrink-0 transition-all ${isEnabled ? 'text-purple-600' : 'text-gray-300'}`}
                          title={isEnabled ? 'Hide from carousel' : 'Show in carousel'}
                        >
                          {isEnabled
                            ? <ToggleRight className="w-8 h-8" />
                            : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'ads' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
                  <Megaphone className="w-7 h-7 text-purple-600" />
                  Ads & Banners
                </h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Manage promotional banners shown across the platform.</p>
              </div>
            </div>

            {/* Ad Form */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-3">
                {editingAd ? <Edit3 className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
                {editingAd ? 'Edit Ad' : 'Create New Ad'}
              </h3>
              <form onSubmit={handleAdSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Title</label>
                    <input type="text" required placeholder="e.g. Summer Sale Banner" value={adFormData.title} onChange={e => setAdFormData({...adFormData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</label>
                    <select value={adFormData.position} onChange={e => setAdFormData({...adFormData, position: e.target.value as Ad['position']})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-black uppercase tracking-widest">
                      <option value="homepage_top">Homepage Top</option>
                      <option value="browse_sidebar">Browse Sidebar</option>
                      <option value="forum_top">Forum Top</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click URL (Optional)</label>
                    <input type="url" placeholder="https://..." value={adFormData.link_url} onChange={e => setAdFormData({...adFormData, link_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</label>
                    <div className="flex items-center gap-3 py-3">
                      <button type="button" onClick={() => setAdFormData(p => ({...p, is_active: !p.is_active}))} className={`relative w-12 h-6 rounded-full transition-colors ${adFormData.is_active ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${adFormData.is_active ? 'left-7' : 'left-1'}`} />
                      </button>
                      <span className="text-sm font-medium text-gray-600">{adFormData.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Banner Image</label>
                  <div className="flex gap-2">
                    <input type="url" placeholder="Paste image URL or upload..." value={adFormData.image_url} onChange={e => setAdFormData({...adFormData, image_url: e.target.value})} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-medium" />
                    <label className={`cursor-pointer shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${isUploadingAdImage ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'}`}>
                      {isUploadingAdImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {isUploadingAdImage ? '...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploadingAdImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingAdImage(true);
                          try {
                            const url = await uploadImageToEndpoint(file, '/api/ads/upload-image');
                            setAdFormData(prev => ({...prev, image_url: url}));
                            toast.success('Banner image uploaded!');
                          } catch { toast.error('Upload failed'); }
                          finally { setIsUploadingAdImage(false); }
                        }}
                      />
                    </label>
                  </div>
                  {adFormData.image_url && (
                    <div className="relative mt-2 rounded-xl overflow-hidden h-28 bg-gray-100 border border-gray-200">
                      <img src={adFormData.image_url} alt="Banner preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setAdFormData(p => ({...p, image_url: ''}))} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black">
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
