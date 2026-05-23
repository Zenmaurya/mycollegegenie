/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { BookOpen, Search, Upload, Youtube, Newspaper, Home, Share2, ChevronRight, ChevronLeft, ChevronDown, GraduationCap, FileText, PlayCircle, X, ExternalLink, Filter, Plus, CheckCircle2, AlertCircle, User, Calendar, Globe, Star, Flag, AlertTriangle, ArrowUpDown, File, Trash2, RefreshCw, Clock, MapPin, Menu, LayoutGrid, List, MessageSquare, MessageCircle, Lightbulb, ArrowUp, Download, Building, Instagram, Linkedin, LogIn, LogOut, Sparkles, Loader2, Mail, Lock, Eye, EyeOff, Store, LibraryBig, BedDouble, ShoppingBag, MessagesSquare, Rss, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import DOMPurify from 'dompurify';
import { getNews } from './services/newsService';
// GenAI logic moved to backend

import { Toaster, toast } from 'sonner';

// Pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const BrowsePage = lazy(() => import('./pages/BrowsePage').then(m => ({ default: m.BrowsePage })));
const PlaylistPage = lazy(() => import('./pages/PlaylistPage').then(m => ({ default: m.PlaylistPage })));
const ForumPage = lazy(() => import('./pages/ForumPage').then(m => ({ default: m.ForumPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then(m => ({ default: m.PostDetailPage })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const FindPGPage = lazy(() => import('./pages/FindPGPage').then(m => ({ default: m.FindPGPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const FlipbookPage = lazy(() => import('./pages/FlipbookPage').then(m => ({ default: m.FlipbookPage })));
const OfficialNewsPage = lazy(() => import('./pages/OfficialNewsPage').then(m => ({ default: m.OfficialNewsPage })));
const CollegeEventsPage = lazy(() => import('./pages/CollegeEventsPage').then(m => ({ default: m.CollegeEventsPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CampusExchangePage = lazy(() => import('./pages/CampusExchangePage').then(m => ({ default: m.CampusExchangePage })));
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage').then(m => ({ default: m.OTPVerificationPage })));
const ContributorsPage = lazy(() => import('./pages/ContributorsPage').then(m => ({ default: m.ContributorsPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));

// Components
import { UploaderProfilePopover } from './components/UploaderProfilePopover';
import { PageTransition, ScrollProgressBar } from './components/PageTransition';

// Constants & Types
import { College_COURSES, SUB_CATEGORIES, EVENT_POSTERS, COURSE_METADATA } from './constants';
import { Resource, NewsItem, User as AppUser } from './types';

// Supabase
import { supabase, logout } from './supabase';
import { createUserProfile } from './services/userService';
import { getResources, uploadResource, uploadFile, rateResource, reportResource } from './services/resourceService';
import { submitEvent } from './services/newsService';

import { AuthForm } from './components/AuthForm';

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|list=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2] ? match[2] : null;
};

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Note' | 'PYQ' | 'Book'>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  const [selectedSemester, setSelectedSemester] = useState<string>('All Semesters');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [duplicateWarningResource, setDuplicateWarningResource] = useState<Resource | null>(null);
  const [duplicateWarningAcknowledged, setDuplicateWarningAcknowledged] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  // Helper: open upload modal & close resource detail to prevent overlap/form conflict
  const openUploadModal = () => { setSelectedResource(null); setIsUploadModalOpen(true); };
  const [modalView, setModalView] = useState<'main' | 'comments' | 'tips'>('main');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sortBy, setSortBy] = useState<'Title' | 'Date' | 'Rating' | 'Course'>('Date');
  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowNewBadge(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);
  
  // Fetch saved items on login
  useEffect(() => {
    if (!user) {
      setSavedResourceIds([]);
      return;
    }
    const fetchSaved = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) return;
        const res = await fetch(`${API}/api/users/me/saved`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedResourceIds(data);
        }
      } catch (err) {
        console.error('Failed to fetch saved items:', err);
      }
    };
    fetchSaved();
  }, [user]);

  const toggleSave = async (id: string) => {
    if (!user) {
      toast.error('Please sign in to save resources');
      return;
    }
    const isCurrentlySaved = savedResourceIds.includes(id);
    
    // Optimistic UI update
    setSavedResourceIds(prev => 
      isCurrentlySaved ? prev.filter(rid => rid !== id) : [...prev, id]
    );

    try {
      const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const res = await fetch(`${API}/api/users/me/saved${isCurrentlySaved ? `/${id}` : ''}`, {
        method: isCurrentlySaved ? 'DELETE' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: isCurrentlySaved ? undefined : JSON.stringify({ itemId: id })
      });
      
      if (res.ok) {
        toast[isCurrentlySaved ? 'info' : 'success'](
          isCurrentlySaved ? 'Resource removed from collection.' : 'Resource saved to your collection!'
        );
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      // Revert optimistic update
      setSavedResourceIds(prev => 
        isCurrentlySaved ? [...prev, id] : prev.filter(rid => rid !== id)
      );
      toast.error('Failed to update saved item.');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    // passive:true — improves scroll performance (never calls preventDefault)
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ESC key closes mobile menu (keyboard accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [eventRequestData, setEventRequestData] = useState({
    college: '',
    title: '',
    date: '',
    description: '',
    contact: ''
  });
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    return sessionStorage.getItem('announcementDismissed') === 'true';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Resource Comments & Exam Tips (real DB data) ──
  const [resourceComments, setResourceComments] = useState<any[]>([]);
  const [resourceTips, setResourceTips] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTip, setNewTip] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isPostingTip, setIsPostingTip] = useState(false);

  const handleCloseResourceModal = () => {
    setSelectedResource(null);
    setModalView('main');
    setResourceComments([]);
    setResourceTips([]);
    setNewComment('');
    setNewTip('');
    if (searchParams.has('resourceId')) {
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('resourceId');
        setSearchParams(newParams, { replace: true });
      }, 10);
    }
  };

  // Fetch comments & tips when a resource modal opens
  useEffect(() => {
    if (!selectedResource) return;
    const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
    fetch(`${API}/api/resources/${selectedResource.id}/comments`)
      .then(r => r.json()).then(setResourceComments).catch(() => {});
    fetch(`${API}/api/resources/${selectedResource.id}/exam-tips`)
      .then(r => r.json()).then(setResourceTips).catch(() => {});
  }, [selectedResource?.id]);

  const handlePostComment = async () => {
    if (!user || !selectedResource || !newComment.trim()) return;
    setIsPostingComment(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${API}/api/resources/${selectedResource.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResourceComments(prev => [data, ...prev]);
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch { toast.error('Failed to post comment'); }
    finally { setIsPostingComment(false); }
  };

  const handlePostTip = async () => {
    if (!user || !selectedResource || !newTip.trim()) return;
    setIsPostingTip(true);
    try {
      const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${API}/api/resources/${selectedResource.id}/exam-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tip: newTip.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResourceTips(prev => [data, ...prev]);
        setNewTip('');
        toast.success('Exam tip added!');
      } else {
        toast.error(data.error || 'Failed to post tip');
      }
    } catch { toast.error('Failed to post tip'); }
    finally { setIsPostingTip(false); }
  };

  useEffect(() => {
    if (selectedResource) {
      setModalView('main');
    }
  }, [selectedResource?.id]);

  useEffect(() => {
    const handleOpenTab = (e: any) => {
      if (e.detail && (e.detail === 'comments' || e.detail === 'tips')) {
        setModalView(e.detail);
      }
    };
    window.addEventListener('openResourceTab', handleOpenTab);
    return () => window.removeEventListener('openResourceTab', handleOpenTab);
  }, []);

  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 20);
    });
    return () => unsubscribe();
  }, [scrollY]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const resultsRef = React.useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isPlaylistContext = location.pathname === '/playlists';

  // Auth State
  useEffect(() => {
    // Safety timeout — ensures loading spinner never hangs forever
    const safetyTimer = setTimeout(() => setIsAuthLoading(false), 8000);

    // Helper: fetch profile with retry for Supabase lock contention (AbortError)
    const fetchProfileWithRetry = async (retries = 3, delayMs = 800): Promise<AppUser | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          const profile = await createUserProfile(null);
          if (profile) return profile as AppUser;
        } catch (err: any) {
          const isLockError = err?.message?.includes('AbortError') || err?.name === 'AbortError' || String(err).includes('Lock broken');
          if (isLockError && i < retries - 1) {
            console.warn(`[Auth] Lock contention on profile fetch, retry ${i + 1}/${retries}...`);
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
            continue;
          }
          console.error('[Auth] Failed to load user profile:', err);
        }
      }
      return null;
    };

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sbUser = session?.user || null;
      setUser(sbUser);
      if (sbUser) {
        const profile = await fetchProfileWithRetry();
        if (profile) setAppUser(profile);
      }
      clearTimeout(safetyTimer);
      setIsAuthLoading(false);
    }).catch(() => {
      clearTimeout(safetyTimer);
      setIsAuthLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sbUser = session?.user || null;
      setUser(sbUser);
      if (sbUser) {
        // Short delay to let lock settle after auth state change
        await new Promise(r => setTimeout(r, 300));
        const profile = await fetchProfileWithRetry();
        if (profile) setAppUser(profile);
      } else {
        setAppUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Resources from DB (MySQL via Express API)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const includeUnapproved = appUser?.role === 'admin';
        const dbResources = await getResources(includeUnapproved);
        if (dbResources) {
          setResources(dbResources);
        }
      } catch (error) {
        console.error('[App] Error fetching resources from DB:', error);
      }
    };
    fetchResources();
  }, [appUser?.role]);

  // Reset filters when changing pages
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const isFromFlipbook = previousPathRef.current.startsWith('/flipbook');
    const isToFlipbook = location.pathname.startsWith('/flipbook');
    const isFlipbookNavigation = isFromFlipbook || isToFlipbook;

    previousPathRef.current = location.pathname;

    if (!isFlipbookNavigation) {
      setSearchQuery('');
      setActiveFilter('All');
      setSelectedCourse('All Courses');
      setSelectedSemester('All Semesters');
      setSelectedSubCategory('All');
      setSortBy('Date');
      setVisibleCount(12);
      window.scrollTo(0, 0);
    }
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    subjectCode: '',
    semester: '1',
    type: '' as any,
    subCategory: '',
    tags: '',
    description: '',
    link: '',
    file: null as File | null
  });
  const [uploadCourseOpen, setUploadCourseOpen] = useState(false);
  const [uploadCourseSearch, setUploadCourseSearch] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const MAX_SIZE = 15 * 1024 * 1024; // 15MB
      if (file.size > MAX_SIZE) {
        toast.error('📦 File too large! Please compress your file before uploading. Maximum allowed size is 15 MB.', {
          duration: 6000,
          description: 'Try tools like ilovepdf.com or smallpdf.com to compress your PDF.'
        });
        return;
      }
      setFormData(prev => ({ ...prev, file }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    multiple: false,
    maxSize: 15 * 1024 * 1024, // 15MB
    onDropRejected: (fileRejections) => {
      const err = fileRejections[0]?.errors[0];
      if (err?.code === 'file-too-large') {
        toast.error('📦 File too large! Maximum allowed size is 15 MB.', {
          duration: 6000,
          description: 'Please compress your file first. Try ilovepdf.com or smallpdf.com.'
        });
      } else {
        // FIX Bug #2: Updated error message — backend only accepts PDF and images
        toast.error('Invalid file type. Please upload a PDF or image file (PNG, JPG, WebP, GIF).');
      }
    },
    // FIX Bug #2: Removed DOC/DOCX — backend multer fileFilter rejects them, causing
    // a silent failure. Only accept types the backend actually supports.
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg':  ['.jpg', '.jpeg'],
      'image/png':   ['.png'],
      'image/webp':  ['.webp'],
      'image/gif':   ['.gif'],
    }
  } as any);

  const courses = useMemo(() => {
    const uniqueCourses = Array.from(new Set([...resources.map(r => r.course), ...College_COURSES]));
    return ['All Courses', ...uniqueCourses.sort()];
  }, [resources]);

  const availableSemesters = useMemo(() => {
    if (selectedCourse === 'All Courses') {
      return ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
    }
    const metadata = COURSE_METADATA[selectedCourse];
    const maxSem = metadata?.semesters || 8;
    const sems = ['All Semesters'];
    for (let i = 1; i <= maxSem; i++) {
      sems.push(i.toString());
    }
    return sems;
  }, [selectedCourse]);

  const availableSubCategories = useMemo(() => {
    if (selectedCourse === 'All Courses') {
      return ['All', ...SUB_CATEGORIES];
    }
    const metadata = COURSE_METADATA[selectedCourse];
    if (metadata?.subCategories) {
      return ['All', ...metadata.subCategories];
    }
    return ['All', ...SUB_CATEGORIES];
  }, [selectedCourse]);

  // Reset semester/subCategory if not available in new course
  useEffect(() => {
    if (selectedCourse !== 'All Courses') {
      if (!availableSemesters.includes(selectedSemester)) {
        setSelectedSemester('All Semesters');
      }
      if (!availableSubCategories.includes(selectedSubCategory)) {
        setSelectedSubCategory('All');
      }
    }
  }, [selectedCourse, availableSemesters, availableSubCategories, selectedSemester, selectedSubCategory]);

  const getAverageRating = (ratings?: number[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return parseFloat((sum / ratings.length).toFixed(1));
  };

  const filteredResources = useMemo(() => {
    let baseResources = resources;

    const filtered = baseResources.filter(resource => {
      // Playlists are ONLY shown on the Playlist page, never on Browse
      if (resource.type === 'Playlist') return false;

      // Regular users only see approved resources, unless they are the uploader
      const isVisible = resource.isApproved || (user && resource.uploaderId === user.id);
      if (!isVisible) return false;

      const q = searchQuery.toLowerCase();
      const matchesQuery = !q ||
        resource.title.toLowerCase().includes(q) ||
        resource.course.toLowerCase().includes(q) ||
        ((resource as any).subjectCode || '').toLowerCase().includes(q) ||
        resource.tags.some(tag => tag.toLowerCase().includes(q));
      const matchesType = activeFilter === 'All' || resource.type === activeFilter;
      const matchesSubCategory = selectedSubCategory === 'All' || (resource as any).subCategory === selectedSubCategory;
      const matchesCourse = selectedCourse === 'All Courses' || resource.course === selectedCourse;
      const matchesSemester = selectedSemester === 'All Semesters' || resource.semester.toString() === selectedSemester;
      
      return matchesQuery && matchesType && matchesSubCategory && matchesCourse && matchesSemester;
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'Title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'Date') {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      } else if (sortBy === 'Rating') {
        return getAverageRating((b as any).ratings) - getAverageRating((a as any).ratings);
      } else if (sortBy === 'Course') {
        return a.course.localeCompare(b.course);
      }
      return 0;
    });
  }, [searchQuery, activeFilter, selectedSubCategory, selectedCourse, selectedSemester, resources, sortBy]);

  const handleRate = async (resourceId: string, rating: number) => {
    if (!user) {
      toast.error('Please sign in to rate resources.');
      return;
    }
    try {
      await rateResource(resourceId, rating);
      
      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          const currentRatings = (r as any).ratings || [];
          return { ...r, ratings: [...currentRatings, rating] };
        }
        return r;
      }));
      
      // Update selected resource if it's the one being rated
      if (selectedResource && selectedResource.id === resourceId) {
        const currentRatings = (selectedResource as any).ratings || [];
        setSelectedResource({
          ...selectedResource,
          ratings: [...currentRatings, rating]
        } as any);
      }
      
      toast.success('Thank you for your rating!');
    } catch (error) {
      console.error('Error rating resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating. Please try again.');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to report resources.');
      return;
    }
    if (!selectedResource || !reportReason.trim()) return;

    try {
      await reportResource(selectedResource.id, reportReason);

      setResources(prev => prev.map(r => {
        if (r.id === selectedResource.id) {
          const currentReports = (r as any).reports || [];
          return { 
            ...r, 
            reports: [...currentReports, { reason: reportReason, date: new Date().toISOString() }] 
          };
        }
        return r;
      }));

      toast.success('Resource reported. Thank you for keeping the hub safe.');
      setIsReportModalOpen(false);
      setReportReason('');
      setSelectedResource(null);
    } catch (error) {
      console.error('Error reporting resource:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to upload resources.');
      return;
    }

    let currentType = formData.type;
    
    if (isPlaylistContext) {
      currentType = 'Playlist';
      
      if (!duplicateWarningAcknowledged) {
        const ytId = extractYouTubeId(formData.link);
        if (ytId) {
          const existing = resources.find(r => r.type === 'Playlist' && r.link && extractYouTubeId(r.link) === ytId);
          if (existing) {
            setDuplicateWarningResource(existing);
            return; // Stop upload and wait for user acknowledgment
          }
        }
      }
    }

    // FIX Bug #13: Validate ALL required fields BEFORE starting the file upload.
    // Without this, the file could be uploaded to R2/Cloudinary and the storage
    // cost incurred, even if the metadata POST subsequently fails validation.
    if (!isPlaylistContext) {
      if (!formData.title.trim()) {
        toast.error('Please enter a resource title.');
        return;
      }
      if (!formData.type) {
        toast.error('Please select a resource type (Note, PYQ, or Book).');
        return;
      }
      if (!formData.course.trim()) {
        toast.error('Please select a course.');
        return;
      }
      if (!formData.file && !formData.link.trim()) {
        toast.error('Please upload a file or provide a direct link.');
        return;
      }
    } else {
      // Playlist context: only link is required
      if (!formData.link.trim()) {
        toast.error('Please provide a YouTube playlist link.');
        return;
      }
    }

    setUploadStatus('uploading');

    try {
      let finalLink = formData.link;
      
      // If a file is provided, upload it first
      if (formData.file) {
        let folder: 'pyqs' | 'books' | 'notes' | 'resources' = 'resources';
        if (currentType === 'PYQ')  folder = 'pyqs';
        if (currentType === 'Book') folder = 'books';
        if (currentType === 'Note') folder = 'notes';
        // Pass course + subject + code so R2 key is descriptive:
        // e.g. notes/20260512_a1b2_bcom-hons_microeconomics_11017502_my-notes.pdf
        const toastId = toast.loading('Uploading file (0%)... Please wait.');
        finalLink = await uploadFile(formData.file, folder, {
          course:      formData.course,
          subject:     formData.title,        // use resource title as subject hint
          subjectCode: formData.subjectCode,
        }, (percent) => {
          toast.loading(`Uploading file (${percent}%)... Please wait.`, { id: toastId });
        });
        toast.dismiss(toastId);
      }

      let autoSubCategory = 'Lecture Notes';
      if (currentType === 'PYQ') autoSubCategory = 'PYQs';
      if (currentType === 'Book') autoSubCategory = 'Reference Books';

      const resourceData: any = {
        title: formData.title,
        course: formData.course,
        subjectCode: formData.subjectCode,
        subCategory: autoSubCategory,
        semester: parseInt(formData.semester),
        type: currentType,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        description: formData.description,
        // FIX Bug #14: Removed the 'https://example.com' ghost-record fallback.
        // Validation above guarantees finalLink is non-empty at this point.
        link: finalLink || '',
        uploader: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
        uploaderId: user.id,
        isApproved: false // User uploads are pending by default
      };

      if (isPlaylistContext && duplicateWarningAcknowledged) {
        resourceData.tags.push('Duplicate Flagged');
        resourceData.description = `⚠️ System Flag: A playlist with this URL already exists in the database.\n\n${resourceData.description}`;
      }

      // Set directDownloadLink if file is uploaded or if link is a direct link
      const directExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
      const isDirectLink = formData.link && directExtensions.some(ext => formData.link.toLowerCase().endsWith(ext));

      if (formData.file) {
        resourceData.directDownloadLink = finalLink;
      } else if (isDirectLink) {
        resourceData.directDownloadLink = formData.link;
      }

      const newResourceId = await uploadResource(resourceData);
      
      // Add to local state for immediate feedback (though it won't show in Browse until approved)
      const newResource = {
        id: newResourceId,
        ...resourceData,
        uploadDate: new Date().toISOString().split('T')[0],
        ratings: []
      };

      setResources(prev => [newResource as any, ...prev]);
      setUploadStatus('success');
      toast.success('Resource uploaded successfully! It will be visible after admin approval.');
      
      // Reset form after success
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus('idle');
        setDuplicateWarningResource(null);
        setDuplicateWarningAcknowledged(false);
        // BUGFIX: Reset ALL form fields including subjectCode and subCategory
        setFormData({ 
          title: '', 
          course: '', 
          subjectCode: '',
          semester: '1', 
          type: '' as any, 
          subCategory: '',
          tags: '', 
          description: '', 
          link: '',
          file: null 
        });
      }, 2000);
    } catch (error) {
      console.error('Error uploading resource:', error);
      setUploadStatus('idle');
      toast.error(error instanceof Error ? error.message : 'Failed to upload resource. Please try again.');
    }
  };

  const fetchNews = async () => {
    setIsNewsLoading(true);
    try {
      const data = await getNews();
      if (data && data.length > 0) {
        setNewsItems(data);
      } else {
        // Fallback: Fetch AI-generated updates from the secure backend endpoint
        const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 10_000);
        try {
          const aiResponse = await fetch(`${API}/api/news/ai-updates`, { signal: ctrl.signal });
          clearTimeout(tid);
          if (aiResponse.ok) {
            const parsedNews = await aiResponse.json();
            if (parsedNews && parsedNews.length > 0) setNewsItems(parsedNews);
          }
        } catch {
          clearTimeout(tid);
          // Silently fall through — no news is fine
        }
      }
    } catch (err) {
      // Silent fail — individual pages (OfficialNewsPage) handle their own loading
    } finally {
      setIsNewsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const API = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';
      const res = await fetch(`${API}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSiteSettings(data || {});
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  // Track whether we've fetched news at least once
  const hasFetchedNews = useRef(false);

  useEffect(() => {
    if (!hasFetchedNews.current) {
      hasFetchedNews.current = true;
      fetchNews();
      fetchSettings();
    }
  }, []);

  const handleShare = async (resource: Resource) => {
    const shareUrl = `${import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in'}/api/resources/share/${resource.id}`;
    const shareData = {
      title: resource.title,
      text: `Check out this resource: ${resource.title} for ${resource.course} via MyCollegeGenie`,
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const isFlipbookView = location.pathname.startsWith('/flipbook');
  // Only forgot-password/reset-password use full-screen auth layout (hide nav)
  // Login/signup use right-side overlay panel → navbar stays visible
  const isAuthPage = location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isLoginSignupPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className={`min-h-screen bg-ethereal-mesh text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 flex flex-col`}>
      <Toaster position="top-center" expand={false} richColors />
      
      {/* Announcement Banner */}
      {!isFlipbookView && !isAuthPage && siteSettings.announcement_active === 'true' && siteSettings.announcement_text && !announcementDismissed && (
        <div 
          className="w-full text-white text-center py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 relative z-[101] transition-all duration-300"
          style={{ backgroundColor: siteSettings.announcement_color || '#7c3aed' }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 pr-8">
            <span>{siteSettings.announcement_text}</span>
          </div>
          <button 
            onClick={() => {
              setAnnouncementDismissed(true);
              sessionStorage.setItem('announcementDismissed', 'true');
            }}
            className="absolute right-4 hover:scale-110 active:scale-95 transition-all text-white/85 hover:text-white"
            title="Dismiss announcement"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      {!isFlipbookView && !isAuthPage && (
      <nav className={`sticky top-0 z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-2xl border-b border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] py-2' 
          : 'bg-transparent py-2.5'
      }`}>
        {/* Scroll Progress Bar */}
        <ScrollProgressBar />

        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0 group z-10">
            <div className="relative flex items-center">
              <img src="/logo.webp" alt="My College Genie Logo" className="h-10 sm:h-12 w-auto object-contain scale-[1.3] transform-gpu transition-transform duration-300 lg:group-hover:scale-[1.4]" />
            </div>
          </Link>

          {/* Center: Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center gap-0.5 absolute left-1/2 -translate-x-1/2 z-10 bg-white/40 hover:bg-white/60 backdrop-blur-md px-1.5 py-1.5 rounded-full border border-gray-100/50 shadow-sm transition-colors duration-500">
            {[
              { to: '/', icon: Home, label: 'Home', active: location.pathname === '/' },
              { to: '/browse', icon: LibraryBig, label: 'Browse', active: location.pathname === '/browse' },
              { to: '/playlists', icon: Youtube, label: 'Playlists', active: location.pathname === '/playlists' },
              { to: '/find-pg', icon: BedDouble, label: 'Find PG', active: location.pathname === '/find-pg' },
              { to: '/campus-exchange', icon: ShoppingBag, label: 'Exchange', active: location.pathname === '/campus-exchange', badge: showNewBadge ? 'NEW' : undefined },
              { to: '/forum', icon: MessagesSquare, label: 'Forum', active: location.pathname.startsWith('/forum') },
            ].map(({ to, icon: Icon, label, active, badge }) => (
              <Link key={to} to={to}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 group relative whitespace-nowrap ${
                  active 
                    ? 'text-purple-700' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
                }`}
              >
                {active && (
                  <motion.div layoutId="desktopNavActiveIndicator" className="absolute inset-0 bg-white rounded-full shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60 z-0" />
                )}
                <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                  active 
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_2px_8px_rgba(147,51,234,0.35)] scale-110' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 group-hover:scale-105'
                }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="leading-none relative z-10">{label}</span>
                {badge && (
                  <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-20 shadow-sm shadow-pink-500/20">
                    {badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Divider */}
            <span className="w-px h-5 bg-gray-200/80 mx-1 shrink-0" />

            {/* Campus Updates Dropdown */}
            <div className="relative group">
              <button className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 whitespace-nowrap ${
                location.pathname === '/news' || location.pathname === '/events'
                  ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
              }`}>
                <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                  location.pathname === '/news' || location.pathname === '/events'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                }`}>
                  <Rss className="w-3.5 h-3.5" />
                </span>
                <span className="leading-none">Updates</span>
              </button>
              <div className="absolute top-full left-0 pt-3 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50 before:absolute before:-top-4 before:left-0 before:w-full before:h-8 before:-z-10">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100/80 p-2 flex flex-col gap-1 relative z-10">
                  <Link 
                    to="/news"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      location.pathname === '/news' ? 'text-purple-700 bg-purple-50' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${ location.pathname === '/news' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600' }`}>
                      <Newspaper className="w-3.5 h-3.5" />
                    </span>
                    News
                  </Link>
                  <Link 
                    to="/events"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                      location.pathname === '/events' ? 'text-purple-700 bg-purple-50' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${ location.pathname === '/events' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600' }`}>
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    Events
                  </Link>
                </div>
              </div>
            </div>

            {appUser?.role === 'admin' && (
              <Link 
                to="/admin"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-300 group whitespace-nowrap ${
                  location.pathname === '/admin' 
                    ? 'bg-white text-purple-700 shadow-[0_2px_12px_-2px_rgba(147,51,234,0.18)] border border-purple-100/60' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/70 border border-transparent'
                }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-all duration-300 ${
                  location.pathname === '/admin'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 scale-105'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                }`}>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </span>
                <span className="leading-none">Admin</span>
              </Link>
            )}
          </div>

          {/* Right: Auth & Mobile Menu */}
          <div className="flex items-center gap-3 sm:gap-4 z-10">
            {user ? (
              <div className="hidden lg:block">
                <Link to="/profile" className="flex items-center gap-3 group p-1.5 pl-4 bg-white/60 hover:bg-white border border-gray-100/80 hover:border-purple-200 rounded-full transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_-6px_rgba(147,51,234,0.2)] cursor-pointer">
                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-bold text-gray-900 leading-none group-hover:text-purple-700 transition-colors max-w-[120px] truncate">
                      {user.user_metadata?.full_name || user.displayName || 'Student'}
                    </span>
                    <span className="text-[9px] font-black text-gray-400 mt-1.5 group-hover:text-purple-500 transition-colors uppercase tracking-widest">
                      {appUser?.role === 'admin' ? 'Admin Profile' : 'View Profile'}
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-100 bg-purple-50 shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                    {user.user_metadata?.avatar_url || appUser?.photo_url ? (
                      <img src={user.user_metadata?.avatar_url || appUser?.photo_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-600">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ) : (
              <div className="hidden lg:block">
                <Link
                  to="/login"
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 group"
                >
                  <User className="w-4 h-4 group-hover:scale-110 transition-transform fill-white" />
                  SIGN IN
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                className={`p-2.5 rounded-2xl transition-all duration-500 relative overflow-hidden group ${
                  isMobileMenuOpen
                    ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/40'
                    : 'bg-white/80 text-purple-600 hover:bg-purple-50 shadow-sm border border-gray-100'
                }`}
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0, scale: isMobileMenuOpen ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </motion.button>
            </div>
          </div>

        </div>
      </nav>
      )}

      {/* Mobile Menu Overlay */}
      {!isFlipbookView && !isAuthPage && (
      <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] lg:hidden"
              />
              <motion.div
                id="mobile-menu"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-[300px] bg-white z-[260] lg:hidden flex flex-col overflow-hidden shadow-[-24px_0_60px_rgba(0,0,0,0.14)]"
              >
                {/* Gradient Header */}
                <div className="relative shrink-0 bg-gradient-to-br from-[#5636A7] via-[#6d42c7] to-[#8b5cf6] px-5 pt-12 pb-6 overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {user.user_metadata?.avatar_url || appUser?.photo_url ? (
                          <img src={user.user_metadata?.avatar_url || appUser?.photo_url} alt="Profile" className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover shadow-lg" loading="lazy" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                            <User className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-black text-[15px] leading-tight truncate">{user.user_metadata?.full_name || appUser?.display_name || 'Student'}</p>
                        <p className="text-white/60 text-[11px] font-medium mt-0.5 truncate">{user.email}</p>
                        {appUser?.role === 'admin' && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-400/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-full border border-amber-300/20">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <img src="/logo.webp" alt="My College Genie" className="h-9 w-auto object-contain" />
                      <p className="text-white/70 text-xs font-medium mt-2">India's Student Platform</p>
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-3 py-4 space-y-1">
                    {[
                      { to: '/', icon: Home, label: 'Home' },
                      { to: '/browse', icon: LibraryBig, label: 'Browse Resources' },
                      { to: '/playlists', icon: Youtube, label: 'Playlists' },
                      { to: '/find-pg', icon: BedDouble, label: 'Find PG' },
                      { to: '/campus-exchange', icon: ShoppingBag, label: 'Campus Exchange', badge: showNewBadge ? 'NEW' : undefined },
                      { to: '/forum', icon: MessagesSquare, label: 'Forum' },
                      { to: '/news', icon: Newspaper, label: 'News & Updates' },
                      { to: '/events', icon: Calendar, label: 'College Events' },
                    ].map(({ to, icon: Icon, label, badge }) => {
                      const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                            isActive
                              ? 'bg-purple-50 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isActive ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 leading-none">{label}</span>
                          {badge && <span className="text-[8px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>}
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                        </Link>
                      );
                    })}

                    {appUser?.role === 'admin' && (
                      <>
                        <div className="my-3 border-t border-gray-100" />
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-[13px] ${
                            location.pathname === '/admin' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            location.pathname === '/admin' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-gray-800 text-white'
                          }`}>
                            <LayoutDashboard className="w-4 h-4" />
                          </span>
                          <span className="flex-1">Admin Panel</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Auth Actions */}
                  <div className="px-3 pb-6 space-y-2">
                    <div className="border-t border-gray-100 mb-3" />
                    {user ? (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition-all"
                        >
                          <span className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </span>
                          View Profile
                        </Link>
                        <button
                          onClick={async () => {
                            setIsMobileMenuOpen(false);
                            if (isSigningOut) return;
                            setIsSigningOut(true);
                            try { await logout(); } catch (e) { console.error(e); } finally { window.location.href = '/login'; }
                          }}
                          disabled={isSigningOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-semibold text-[13px] transition-all disabled:opacity-60"
                        >
                          <span className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                            {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          </span>
                          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#5636A7] to-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 hover:opacity-90 transition-all"
                      >
                        <User className="w-4 h-4" />
                        Sign In / Sign Up
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
      
      <AnimatePresence>
        {showBackToTop && !isFlipbookView && !isAuthPage && !isLoginSignupPage && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 sm:bottom-8 md:bottom-8 right-4 sm:right-8 z-[150] p-3.5 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 transition-shadow"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      {!isFlipbookView && !isAuthPage && !isLoginSignupPage && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/95 backdrop-blur-2xl border-t border-gray-100 pb-[env(safe-area-inset-bottom,8px)] shadow-[0_-12px_40px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-1 pt-2 pb-1.5 relative">
        {[{ to: '/', icon: Home, label: 'Home', active: location.pathname === '/' },
          { to: '/browse', icon: LibraryBig, label: 'Browse', active: location.pathname === '/browse' },
          { to: '/playlists', icon: Youtube, label: 'Playlists', active: location.pathname === '/playlists' },
          { to: '/find-pg', icon: BedDouble, label: 'Find PG', active: location.pathname === '/find-pg' },
          { to: '/campus-exchange', icon: ShoppingBag, label: 'Exchange', active: location.pathname === '/campus-exchange', badge: showNewBadge ? 'NEW' : undefined },
          { to: '/forum', icon: MessagesSquare, label: 'Forum', active: location.pathname.startsWith('/forum') },
        ].map(({ to, icon: Icon, label, active, badge }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 flex-1 min-w-0 px-0.5 py-1 group relative">
            {active && (
               <motion.div layoutId="mobileNavActiveIndicator" className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-b-full shadow-[0_2px_8px_rgba(147,51,234,0.4)]" />
            )}
            <motion.div 
              whileTap={{ scale: 0.85 }}
              className={`relative flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-300 ${
              active
                ? 'bg-gradient-to-br from-purple-100 to-indigo-50 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_2px_6px_rgba(147,51,234,0.12)] border border-purple-200/50'
                : 'group-active:bg-gray-50'
            }`}>
              <Icon 
                 strokeWidth={active ? 2.5 : 2}
                 className={`w-[20px] h-[20px] transition-all duration-300 ${
                active ? 'text-purple-700 drop-shadow-[0_2px_4px_rgba(147,51,234,0.2)] scale-110' : 'text-slate-400 group-hover:text-slate-600'
              }`} />
              {badge && (
                <span className="absolute -top-1 -right-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full z-20 shadow-sm shadow-pink-500/20 scale-90">
                  {badge}
                </span>
              )}
            </motion.div>
            <span className={`text-[9px] font-bold tracking-tight transition-all duration-300 truncate w-full text-center ${
              active ? 'text-purple-700 drop-shadow-sm scale-105' : 'text-slate-400 group-hover:text-slate-600'
            }`}>{label}</span>
          </Link>
        ))}
        </div>
      </div>
      )}

      <main className="flex-grow flex flex-col">
        {(() => {
          const HomePageElement = (
            <HomePage 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              College_COURSES={College_COURSES}
              isNewsLoading={isNewsLoading}
              newsItems={newsItems}
              resources={resources}
              savedResourceIds={savedResourceIds}
              onSave={toggleSave}
              getAverageRating={getAverageRating}
              setSelectedResource={setSelectedResource}
              handleShare={handleShare}
              siteSettings={siteSettings}
            />
          );
          return (
            <PageTransition>
              <Suspense fallback={
                <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900 text-lg">Loading Experience...</h3>
                    <p className="text-sm text-gray-500 font-medium">Preparing the platform</p>
                  </div>
                </div>
              }>
                <Routes location={location}>
                  <Route path="/" element={HomePageElement} />
                <Route path="/browse" element={
                  <BrowsePage 
                    resources={resources}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    selectedCourse={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                    selectedSemester={selectedSemester}
                    setSelectedSemester={setSelectedSemester}
                    selectedSubCategory={selectedSubCategory}
                    setSelectedSubCategory={setSelectedSubCategory}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    courses={courses}
                    availableSemesters={availableSemesters}
                    availableSubCategories={availableSubCategories}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    visibleCount={visibleCount}
                    setVisibleCount={setVisibleCount}
                    filteredResources={filteredResources}
                    savedResourceIds={savedResourceIds}
                    onSave={toggleSave}
                    getAverageRating={getAverageRating}
                    selectedResource={selectedResource}
                    setSelectedResource={setSelectedResource}
                    handleShare={handleShare}
                    setIsUploadModalOpen={openUploadModal}
                    user={user}
                  />
                } />
                <Route path="/playlists" element={
                  <PlaylistPage 
                    resources={resources}
                    savedResourceIds={savedResourceIds}
                    onSave={toggleSave}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCourse={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                    selectedSemester={selectedSemester}
                    setSelectedSemester={setSelectedSemester}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    visibleCount={visibleCount}
                    setVisibleCount={setVisibleCount}
                    setSelectedResource={setSelectedResource}
                    setIsUploadModalOpen={openUploadModal}
                    handleShare={handleShare}
                    courses={courses}
                    semesters={availableSemesters}
                    getAverageRating={getAverageRating}
                    resultsRef={resultsRef}
                  />
                } />
                <Route path="/forum" element={<ForumPage user={user} />} />
                <Route path="/find-pg" element={<FindPGPage user={user} />} />
                <Route path="/campus-exchange" element={<CampusExchangePage user={user} />} />
                <Route path="/forum/:postId" element={<PostDetailPage />} />
                <Route path="/admin" element={
                  isAuthLoading ? (
                    <div className="min-h-screen flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : appUser?.role === 'admin' ? (
                    <AdminPanel user={user} appUser={appUser} isAuthLoading={isAuthLoading} />
                  ) : user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } />
                <Route path="/login" element={HomePageElement} />
                <Route path="/signup" element={HomePageElement} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ForgotPasswordPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/flipbook/:id" element={<FlipbookPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/news" element={<OfficialNewsPage newsItems={newsItems} isLoading={isNewsLoading} user={user} />} />
                <Route path="/events" element={<CollegeEventsPage newsItems={newsItems} isLoading={isNewsLoading} user={user} />} />
                <Route path="/otp-verify" element={<OTPVerificationPage />} />
                <Route path="/contributors" element={<ContributorsPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="*" element={
                  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
                    <div className="text-8xl font-black bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">404</div>
                    <div>
                      <h1 className="text-2xl font-black text-gray-900 mb-2">Page Not Found</h1>
                      <p className="text-gray-500 font-medium">The page you're looking for doesn't exist or has been moved.</p>
                    </div>
                    <Link to="/" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20">
                      Go Home
                    </Link>
                  </div>
                } />
                </Routes>
              </Suspense>
            </PageTransition>
          );
        })()}
      </main>

      {/* ── Auth overlay panel (login / signup) ── */}
      {isLoginSignupPage && <LoginPage user={appUser} />}

      {/* Footer */}
      {!isAuthPage && !isLoginSignupPage && !isFlipbookView && (
        <footer className="pt-8 lg:pt-16 pb-24 md:pb-8 lg:pb-8 px-4 bg-[#0B0914] border-t border-white/5 shrink-0 relative text-gray-400">
          {/* Subtle background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full" />
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-8 lg:gap-12 mb-8 lg:mb-12">
              <div className="col-span-2 md:col-span-5 lg:col-span-4 pr-0 lg:pr-8 flex flex-col items-start text-left">
                <Link to="/" onClick={() => window.scrollTo(0,0)} className="inline-block mb-4 lg:mb-6 relative h-10 md:h-12 w-full flex items-end">
                  <img src="/logo.webp" alt="My College Genie" className="absolute left-0 -bottom-6 md:-bottom-10 h-28 md:h-36 lg:h-40 w-auto object-contain object-left filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:scale-110 origin-bottom-left transition-all" />
                </Link>
                <p className="text-[12px] lg:text-[13px] text-gray-400 leading-relaxed mb-4 lg:mb-6 w-full">
                  Ek student ki asli zaroorat kya hoti hai? Sahi resources, sahi log, aur sahi direction. <strong className="text-gray-200 font-semibold">My College Genie</strong> ye teeno deta hai — <motion.span initial={{ clipPath: 'inset(0 100% 0 0)' }} whileInView={{ clipPath: 'inset(0 0 0 0)' }} transition={{ duration: 2, ease: 'linear' }} viewport={{ once: true }} className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold inline-block">Notes se Naukri Tak.</motion.span>
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="https://www.linkedin.com/company/my-college-genie/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group hover:-translate-y-1" title="LinkedIn">
                    <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </a>
                  <a href="https://www.instagram.com/mycollegegenie.in" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-pink-500/50 hover:bg-pink-500/10 transition-all group hover:-translate-y-1" title="Instagram">
                    <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
                  </a>
                  <a href="https://www.reddit.com/r/AskMyCollegeGenie" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 hover:bg-orange-500/10 transition-all group hover:-translate-y-1" title="Reddit">
                    <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.057 1.597.047.253.075.512.075.77 0 2.461-2.851 4.46-6.358 4.46-3.506 0-6.358-1.999-6.358-4.46 0-.258.028-.517.075-.77a1.756 1.756 0 0 1-1.057-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.174-.87 2.81-1.44 4.617-1.523l.71-3.326 2.456.519c-.098.192-.16.409-.16.639 0 .688.562 1.25 1.25 1.25zM9.03 13.003c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm5.94 0c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm-5.956 3.387c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128zm3.96 0c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128z"/></svg>
                  </a>
                  <a href="https://discord.gg/JAjYHHUVg3" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group hover:-translate-y-1" title="Discord">
                    <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/></svg>
                  </a>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Academic Hub</h4>
                <ul className="space-y-4 font-medium text-[13px]">
                  <li><Link to="/" onClick={() => window.scrollTo(0,0)} className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Home</Link></li>
                  <li><button onClick={() => {navigate('/'); setTimeout(() => resultsRef.current?.scrollIntoView({behavior:'smooth'}), 100);}} className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Browse</button></li>
                  <li><Link to="/playlists" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Playlists</Link></li>
                  <li><button onClick={() => openUploadModal()} className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Upload</button></li>
                </ul>
              </div>

              <div className="col-span-1 md:col-span-3 lg:col-span-3">
                <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Campus Life</h4>
                <ul className="space-y-4 font-medium text-[13px]">
                  <li><Link to="/find-pg" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Find PG</Link></li>
                  <li><Link to="/campus-exchange" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Campus Exchange {showNewBadge && <span className="bg-[#FF0080] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">NEW</span>}</Link></li>
                  <li><Link to="/forum" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Student Forums</Link></li>
                  <li><Link to="/news" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Official News</Link></li>
                  <li><Link to="/events" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> College Events</Link></li>
                </ul>
              </div>

              <div className="col-span-2 md:col-span-3 lg:col-span-3">
                <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Support & Legal</h4>
                <ul className="space-y-4 font-medium text-[13px]">
                  <li><Link to="/contact" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Contact Us</Link></li>
                  <li><Link to="/blog" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Blog</Link></li>
                  <li><Link to="/contributors" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Our Team & Contributors</Link></li>
                  <li><Link to="/privacy" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Terms of Service</Link></li>
                  {appUser?.role === 'admin' && (
                    <li className="pt-2">
                      <Link to="/admin" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-bold bg-purple-500/10 px-3 py-2 rounded-lg inline-flex border border-purple-500/20">
                        <LayoutGrid className="w-4 h-4" /> Admin Panel
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium">
                © {new Date().getFullYear()} My College Genie. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5">
                Built with <span className="text-purple-400 animate-pulse">💜</span> for college students
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* News & Events Modal */}
      {createPortal(
        <AnimatePresence>
          {isUploadModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }} onClick={(e) => { if (e.target === e.currentTarget) setIsUploadModalOpen(false); }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl mx-4 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upload Material</h2>
                    <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Share your knowledge</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar">
                {uploadStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
                    <p className="text-gray-600">Your resource has been added to the community library.</p>
                  </motion.div>
                ) : !user ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to upload a resource. Join the community to contribute.
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
                    {/* ── Row 1: Title + Custom Course Dropdown ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title <span className="text-red-400">*</span></label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Microeconomics Unit 1 Notes"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setUploadCourseOpen(p => !p); setUploadCourseSearch(''); }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium transition-all text-left ${uploadCourseOpen ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white' : 'border-gray-200'} ${!formData.course ? 'text-gray-300' : 'text-gray-800'}`}
                          >
                            <span className="truncate">{formData.course || 'Select Course'}</span>
                            <ChevronDown className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${uploadCourseOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <input type="text" required readOnly value={formData.course} tabIndex={-1} className="absolute inset-0 opacity-0 pointer-events-none" />
                          <AnimatePresence>
                            {uploadCourseOpen && (
                              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="p-2 border-b border-gray-100">
                                  <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                    <input autoFocus type="text" placeholder="Search course..." value={uploadCourseSearch} onChange={e => setUploadCourseSearch(e.target.value)} className="w-full pl-7 pr-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-purple-400 text-gray-800 placeholder:text-gray-300" />
                                  </div>
                                </div>
                                <div className="overflow-y-auto max-h-40">
                                  {College_COURSES.filter(c => c.toLowerCase().includes(uploadCourseSearch.toLowerCase())).map(course => (
                                    <button key={course} type="button" onClick={() => { setFormData(d => ({...d, course})); setUploadCourseOpen(false); setUploadCourseSearch(''); }} className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between gap-2 transition-colors ${formData.course === course ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                                      <span className="truncate">{course}</span>
                                      {formData.course === course && <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />}
                                    </button>
                                  ))}
                                  {College_COURSES.filter(c => c.toLowerCase().includes(uploadCourseSearch.toLowerCase())).length === 0 && <div className="px-3 py-4 text-center text-xs text-gray-400">No courses found</div>}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* ── Row 2: Type pills + Subject Code ── */}
                    {!isPlaylistContext && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type <span className="text-red-400">*</span></label>
                          <div className="flex flex-wrap gap-2">
                            {(['Note','PYQ','Book','Playlist'] as const).map(t => (
                              <button key={t} type="button" onClick={() => setFormData(d => ({...d, type: t}))} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === t ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'}`}>
                                {t}
                              </button>
                            ))}
                          </div>
                          <input type="text" required readOnly value={formData.type} tabIndex={-1} className="sr-only" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Code <span className="text-gray-300">(optional)</span></label>
                          <input
                            type="text"
                            placeholder="e.g. 11017502"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                            value={formData.subjectCode}
                            onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    {/* ── Semester pills ── */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester <span className="text-red-400">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: COURSE_METADATA[formData.course]?.semesters || 8 }, (_, i) => i + 1).map(sem => (
                          <button key={sem} type="button" onClick={() => setFormData(d => ({...d, semester: String(sem)}))} className={`w-10 h-9 rounded-xl text-xs font-black border transition-all ${formData.semester === String(sem) ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'}`}>
                            {sem}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Link OR File ── */}
                    {isPlaylistContext ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">YouTube Playlist Link <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            required
                            type="url"
                            placeholder="https://youtube.com/playlist?list=..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                            value={formData.link}
                            onChange={(e) => setFormData({...formData, link: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Link</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                              required={!formData.file}
                              type="url"
                              placeholder="https://drive.google.com/..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                              value={formData.link}
                              onChange={(e) => setFormData({...formData, link: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload File</label>
                          <div {...getRootProps()} className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2 ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'}`}>
                            <input {...getInputProps()} />
                            {formData.file ? (
                              <div className="flex items-center gap-2 w-full">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                <span className="text-xs font-bold text-gray-700 truncate flex-1">{formData.file.name}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(p => ({...p, file: null})); }} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-wider shrink-0">✕</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400">
                                <Upload className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-medium">PDF, DOC, JPG · Max 15MB</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Tags + Description ── */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags <span className="text-gray-300">(comma separated)</span></label>
                      <input
                        type="text"
                        placeholder="e.g. economics, micro, unit1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description <span className="text-gray-300">(optional)</span></label>
                      <textarea
                        rows={3}
                        placeholder="Tell students what this resource covers..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    {/* ── Duplicate Warning Banner ── */}
                    {duplicateWarningResource && !duplicateWarningAcknowledged && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-orange-800">Possible Duplicate Playlist</h4>
                            <p className="text-xs text-orange-700 mt-1 font-medium leading-relaxed">
                              We found an existing playlist that matches this YouTube link: <br/>
                              <span className="font-bold text-orange-900 mt-1 inline-block">"{duplicateWarningResource.title}"</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => setDuplicateWarningResource(null)}
                            className="px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            Cancel Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDuplicateWarningAcknowledged(true);
                              // User can click submit again to proceed
                            }}
                            className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md transition-colors"
                          >
                            Upload Anyway
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Submit ── */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={uploadStatus === 'uploading'}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {uploadStatus === 'uploading' ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4" /> Publish Resource</>
                      )}
                    </motion.button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Resource Detail Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedResource && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseResourceModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="py-3 px-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalView('main'); }}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${
                      selectedResource.type === 'Note' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' :
                      selectedResource.type === 'PYQ' ? 'bg-violet-100 text-violet-600 hover:bg-violet-200' :
                      'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    }`}
                  >
                    {selectedResource.type}
                  </button>
                  <span className="text-xs text-gray-500 font-bold shrink-0 bg-gray-100 px-2 py-1 rounded-md">Sem {selectedResource.semester}</span>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalView('comments'); }}
                    className={`hidden sm:flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-colors ml-2 ${modalView === 'comments' ? 'text-purple-600' : 'text-gray-400 hover:text-purple-600'}`}
                    title="View Comments"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Comments</span>
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalView('tips'); }}
                    className={`hidden sm:flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-colors ${modalView === 'tips' ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                    title="Exam Tips"
                  >
                    <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>Exam Tips</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalView('comments'); }}
                    className={`sm:hidden p-1.5 rounded-md transition-colors ${modalView === 'comments' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-purple-600 hover:bg-gray-50'}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalView('tips'); }}
                    className={`sm:hidden p-1.5 rounded-md transition-colors ${modalView === 'tips' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-yellow-600 hover:bg-gray-50'}`}
                  >
                    <Lightbulb className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] sm:text-xs font-bold transition-colors"
                  >
                    <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                  <button 
                    onClick={handleCloseResourceModal}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 sm:p-6 custom-scrollbar text-left">
                {/* ── Playlist YouTube thumbnail in modal ── */}
                {selectedResource.type === 'Playlist' && selectedResource.link && (() => {
                  try {
                    const u = new URL(selectedResource.link);
                    const videoId = u.searchParams.get('v') || (u.hostname === 'youtu.be' ? u.pathname.replace(/^\//, '') : null);
                    if (videoId) {
                      return (
                        <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 sm:mb-5 bg-gray-100 relative">
                          <img
                            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                            alt={selectedResource.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/10" />
                          <a
                            href={selectedResource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                              <PlayCircle className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600" />
                            </div>
                          </a>
                        </div>
                      );
                    }
                  } catch { /* invalid URL */ }
                  return null;
                })()}

                <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 text-gray-900 leading-tight break-words">{selectedResource.title}</h2>
                <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2.5 sm:mb-5 break-words">
                  {selectedResource.course}
                  {selectedResource.subjectCode && <span className="ml-1 sm:ml-2 text-gray-400">({selectedResource.subjectCode})</span>}
                </p>
                
                {modalView === 'main' && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-5">
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">Uploaded By</p>
                        <UploaderProfilePopover 
                          uploaderName={(selectedResource as any).uploader || 'Anonymous'} 
                          uploaderId={(selectedResource as any).uploaderId}
                          resources={resources}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded-xl border border-gray-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-[9px] uppercase tracking-wider text-gray-500 font-bold truncate">Upload Date</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-900 truncate">
                          {(selectedResource as any).uploadDate ? new Date((selectedResource as any).uploadDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-5">
                  {modalView === 'main' ? (
                    <>
                      <div>
                        <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</h4>
                        <div 
                          className="text-slate-600/70 leading-relaxed prose prose-sm max-w-none text-sm sm:text-base font-medium"
                          // SECURITY FIX: Sanitize HTML to prevent XSS attacks from malicious uploaders
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedResource.description || 'No description provided for this resource.') }}
                        />
                      </div>

                      <div>
                        <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tags</h4>
                        <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-5">
                          {selectedResource.tags.map(tag => (
                            <span key={tag} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 rounded-md text-[10px] sm:text-xs text-gray-600 border border-gray-200">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rate this resource</h4>
                          <div className="flex items-center gap-1 text-pink-600">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-bold">{getAverageRating((selectedResource as any).ratings)}</span>
                            <span className="text-[10px] text-gray-500 font-medium ml-1">({(selectedResource as any).ratings?.length || 0} ratings)</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRate(selectedResource.id, star)}
                              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all group"
                            >
                              <Star className={`w-5 h-5 transition-colors ${star <= Math.round(getAverageRating((selectedResource as any).ratings)) ? 'text-pink-600 fill-current' : 'text-gray-300 group-hover:text-pink-600'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : modalView === 'comments' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalView('main')} className="p-1 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h4 className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Student Comments ({resourceComments.length})</h4>
                      </div>

                      {/* Post Comment */}
                      {user ? (
                        <div className="flex gap-2">
                          <input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                            placeholder="Write a comment..."
                            maxLength={1000}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                          <button
                            onClick={handlePostComment}
                            disabled={isPostingComment || !newComment.trim()}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                          >
                            {isPostingComment ? '...' : 'Post'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-medium">Sign in to leave a comment</p>
                      )}

                      <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
                        {resourceComments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[150px] text-gray-400">
                            <MessageCircle className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-sm font-medium">No comments yet — be the first!</p>
                          </div>
                        ) : resourceComments.map(c => (
                          <div key={c.id} className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0 mb-1.5 sm:mb-2">
                              <span className="font-black text-gray-900 text-xs sm:text-sm">{c.user_name}</span>
                              <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">
                                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <span className="text-gray-600 text-xs sm:text-sm font-medium">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalView('main')} className="p-1 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h4 className="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Exam Tips ({resourceTips.length})</h4>
                      </div>

                      {/* Post Tip */}
                      {user ? (
                        <div className="flex gap-2">
                          <input
                            value={newTip}
                            onChange={e => setNewTip(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handlePostTip()}
                            placeholder="Share an exam tip..."
                            maxLength={500}
                            className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                          <button
                            onClick={handlePostTip}
                            disabled={isPostingTip || !newTip.trim()}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                          >
                            {isPostingTip ? '...' : 'Add'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 font-medium">Sign in to share exam tips</p>
                      )}

                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 sm:p-5 shadow-sm min-h-[150px] max-h-[280px] overflow-y-auto">
                        {resourceTips.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[120px] text-yellow-600/50">
                            <Lightbulb className="w-8 h-8 mb-2" />
                            <p className="text-sm font-medium">No exam tips yet — share yours!</p>
                          </div>
                        ) : (
                          <ul className="list-disc pl-5 text-yellow-800 space-y-2 text-xs sm:text-sm font-medium">
                            {resourceTips.map(t => (
                              <li key={t.id}>
                                {t.tip}
                                <span className="ml-2 text-[10px] text-yellow-600/60">— {t.user_name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row flex-wrap gap-3 border-t border-gray-100">
                    {(selectedResource.type === 'Note' || selectedResource.type === 'PYQ') && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedResource(null);
                          navigate(`/flipbook/${selectedResource.id}`);
                        }}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                      >
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>Read Flipbook</span>
                      </motion.button>
                    )}
                    <motion.a 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={selectedResource.link || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-600/20"
                    >
                      {selectedResource.type === 'Playlist' ? <Youtube className="w-4 h-4 shrink-0" /> : <Globe className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{selectedResource.type === 'Playlist' ? 'Watch Playlist' : 'View Source'}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </motion.a>
                    {selectedResource.directDownloadLink && (
                      <motion.a 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={`${import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in'}/api/resources/download/${selectedResource.id}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>Download</span>
                      </motion.a>
                    )}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleShare(selectedResource)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 h-11 rounded-xl text-sm font-bold transition-all"
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span className="sm:hidden md:inline">Share</span>
                    </motion.button>
                  </div>

                  {appUser?.role === 'admin' && (selectedResource as any).reports && (selectedResource as any).reports.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-rose-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Active Reports ({(selectedResource as any).reports.length})
                      </h4>
                      <div className="space-y-3">
                        {(selectedResource as any).reports.map((report: any, idx: number) => (
                          <div key={idx} className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                            <p className="text-sm text-gray-700 mb-2">{report.reason}</p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {new Date(report.date).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Report Modal */}
      {createPortal(
        <AnimatePresence>
          {isReportModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2 text-rose-600">
                  <Flag className="w-5 h-5" />
                  Report Resource
                </h2>
                <button 
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleReport} className="p-6 space-y-4">
                {!user ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to report a resource. Join the community to help us keep it safe.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto px-8 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-rose-600/20 block text-center"
                    >
                      Sign In to Continue
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4">
                      <p className="text-xs text-rose-600 leading-relaxed">
                        Please provide a reason for reporting this resource. Our team will review it for inappropriate content or inaccuracies.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Report</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="e.g. This document contains incorrect formulas in Chapter 3..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-gray-900 resize-none"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setIsReportModalOpen(false)}
                        className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
                      >
                        Submit Report
                      </motion.button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Event Request Modal */}
      {createPortal(
        <AnimatePresence>
          {isEventRequestModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventRequestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publish Your Event</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reach the entire Student Community</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEventRequestModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <form
                  id="event-request-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    try {
                      await submitEvent({
                        title: eventRequestData.title,
                        college: eventRequestData.college,
                        date: eventRequestData.date,
                        venue: '',
                        eligibility: 'All',
                        description: `${eventRequestData.description}\n\nContact: ${eventRequestData.contact}`,
                      });
                      toast.success('Event request submitted! Our team will review it shortly.');
                    } catch (err) {
                      console.error('[event request] submit error:', err);
                      toast.error('Failed to submit event. Please try again.');
                      return;
                    }
                    setIsEventRequestModalOpen(false);
                    setEventRequestData({ college: '', title: '', date: '', description: '', contact: '' });
                  }}
                  className="p-6 space-y-4"
                >
                  {!user ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                        <p className="text-gray-500 font-medium">
                          You need to be signed in to publish an event. Join the community to get started.
                        </p>
                      </div>
                      <Link
                        to="/login"
                        className="w-full sm:w-auto px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-fuchsia-600/20 block text-center"
                      >
                        Sign In to Continue
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">College Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Hansraj College"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all"
                          value={eventRequestData.college}
                          onChange={(e) => setEventRequestData({...eventRequestData, college: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Annual Cultural Fest 2026"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all"
                          value={eventRequestData.title}
                          onChange={(e) => setEventRequestData({...eventRequestData, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Date</label>
                        <input
                          required
                          type="date"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all"
                          value={eventRequestData.date}
                          onChange={(e) => setEventRequestData({...eventRequestData, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Briefly describe your event..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all resize-none"
                          value={eventRequestData.description}
                          onChange={(e) => setEventRequestData({...eventRequestData, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email/Phone</label>
                        <input
                          required
                          type="text"
                          placeholder="Where can we reach you?"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all"
                          value={eventRequestData.contact}
                          onChange={(e) => setEventRequestData({...eventRequestData, contact: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* ── Sticky Submit Footer ── */}
              {user && (
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    form="event-request-form"
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-2"
                  >
                    Submit Request
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
