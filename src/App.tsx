/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, Upload, Youtube, Newspaper, Home, Share2, ChevronRight, ChevronLeft, GraduationCap, FileText, PlayCircle, X, ExternalLink, Filter, Plus, CheckCircle2, AlertCircle, User, Calendar, Globe, Star, Flag, AlertTriangle, ArrowUpDown, File, Trash2, RefreshCw, Clock, MapPin, Menu, LayoutGrid, List, MessageSquare, MessageCircle, Lightbulb, ArrowUp, Download, Building, Instagram, Linkedin, LogIn, LogOut, Sparkles, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import { getNews } from './services/newsService';
import { GoogleGenAI } from "@google/genai";

import { Toaster, toast } from 'sonner';

// Pages
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { PlaylistPage } from './pages/PlaylistPage';
import { ForumPage } from './pages/ForumPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { AdminPanel } from './pages/AdminPanel';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ContactPage } from './pages/ContactPage';
import { FindPGPage } from './pages/FindPGPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { FlipbookPage } from './pages/FlipbookPage';
import { OfficialNewsPage } from './pages/OfficialNewsPage';
import { CollegeEventsPage } from './pages/CollegeEventsPage';

// Components
import { UploaderProfilePopover } from './components/UploaderProfilePopover';

// Constants & Types
import { INITIAL_RESOURCES, DU_COURSES, SUB_CATEGORIES, EVENT_POSTERS, COURSE_METADATA } from './constants';
import { Resource, NewsItem, User as AppUser } from './types';

// Firebase
import { auth, logout } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { createUserProfile } from './services/userService';
import { getResources, uploadResource, uploadFile, rateResource, reportResource } from './services/resourceService';

import { AuthForm } from './components/AuthForm';

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Note' | 'PYQ' | 'Playlist' | 'Book'>('All');
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  const [selectedSemester, setSelectedSemester] = useState<string>('All Semesters');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [modalView, setModalView] = useState<'main' | 'comments' | 'tips'>('main');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [sortBy, setSortBy] = useState<'Title' | 'Date' | 'Rating' | 'Course'>('Date');
  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedResources');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('savedResources', JSON.stringify(savedResourceIds));
  }, [savedResourceIds]);

  const toggleSave = (id: string) => {
    setSavedResourceIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
    const isSaving = !savedResourceIds.includes(id);
    if (isSaving) {
      toast.success('Resource saved to your collection!');
    } else {
      toast.info('Resource removed from collection.');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const [newsError, setNewsError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  const handleCloseResourceModal = () => {
    setSelectedResource(null);
    setModalView('main');
    if (searchParams.has('resourceId')) {
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('resourceId');
        setSearchParams(newParams, { replace: true });
      }, 10);
    }
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

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await createUserProfile(firebaseUser);
        setAppUser(profile as AppUser);
      } else {
        setAppUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Resources from Firestore
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const includeUnapproved = appUser?.role === 'admin';
        const dbResources = await getResources(includeUnapproved);
        if (dbResources) {
          setResources(prev => {
            const existingIds = new Set(dbResources.map(r => r.id));
            // Keep initial resources that are NOT in DB, and add all DB resources
            const initialOnly = prev.filter(r => !existingIds.has(r.id));
            return [...dbResources, ...initialOnly];
          });
        }
      } catch (error) {
        console.error('Error fetching resources from DB:', error);
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

  const courses = useMemo(() => {
    const uniqueCourses = Array.from(new Set([...resources.map(r => r.course), ...DU_COURSES]));
    return ['All Courses', ...uniqueCourses.sort()];
  }, [resources]);

  const availableSemesters = useMemo(() => {
    if (selectedCourse === 'All Courses') {
      return ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
    }
    const metadata = COURSE_METADATA[selectedCourse];
    const maxSem = metadata?.semesters || 6;
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
      // Regular users only see approved resources, unless they are the uploader
      const isVisible = resource.isApproved || (auth.currentUser && resource.uploaderId === auth.currentUser.uid);
      if (!isVisible) return false;

      const matchesQuery = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
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
    setUploadStatus('uploading');

    try {
      let finalLink = formData.link;
      
      // If a file is provided, upload it first
      if (formData.file) {
        finalLink = await uploadFile(formData.file);
      }

      let autoSubCategory = 'Lecture Notes';
      if (formData.type === 'PYQ') autoSubCategory = 'PYQs';
      if (formData.type === 'Book') autoSubCategory = 'Reference Books';

      const resourceData: any = {
        title: formData.title,
        course: formData.course,
        subjectCode: formData.subjectCode,
        subCategory: autoSubCategory,
        semester: parseInt(formData.semester),
        type: formData.type,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        description: formData.description,
        link: finalLink || 'https://example.com',
        uploader: user.displayName || 'Anonymous',
        uploaderId: user.uid,
        isApproved: false // User uploads are pending by default
      };

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
        setFormData({ 
          title: '', 
          course: '', 
          semester: '1', 
          type: 'Note', 
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
    setNewsError(null);
    try {
      const data = await getNews();
      if (data && data.length > 0) {
        setNewsItems(data);
      } else {
        const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '' });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "List the latest 10 updates (5 news and 5 events) from Delhi University (DU) and its major colleges (like St. Stephens, SRCC, Hindu, Miranda House, LSR, Hansraj, etc.) for March 2026. Include titles, dates, a brief summary, the college name (if specific to a college, otherwise 'Delhi University'), and the source URL for each. Ensure a good mix of official news updates and upcoming college events.",
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  date: { type: "STRING" },
                  summary: { type: "STRING" },
                  url: { type: "STRING" },
                  category: { type: "STRING", enum: ["News", "Event"] },
                  college: { type: "STRING" }
                },
                required: ["title", "date", "summary", "url", "category", "college"]
              }
            }
          },
        });

        if (response.text) {
          const parsedNews = JSON.parse(response.text);
          setNewsItems(parsedNews);
        } else {
          throw new Error("No news found");
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setNewsError("Failed to fetch latest news: " + (err instanceof Error ? err.message : "Please check your network and try again."));
      // Fallback mock data if API fails or for demo
      setNewsItems([
        {
          title: "DU Centenary Celebration Finale",
          date: "March 25, 2026",
          summary: "The grand finale of Delhi University's centenary celebrations featuring cultural events and alumni meets.",
          url: "https://du.ac.in",
          category: "Event",
          college: "Delhi University"
        },
        {
          title: "Admission Policy for 2026-27 Session",
          date: "March 18, 2026",
          summary: "Delhi University releases updated CUET-based admission guidelines for undergraduate courses.",
          url: "https://admission.uod.ac.in",
          category: "News",
          college: "Delhi University"
        },
        {
          title: "SRCC Business Conclave 2026",
          date: "April 5, 2026",
          summary: "Asia's largest undergraduate management festival featuring top corporate leaders and case competitions.",
          url: "https://srcc.edu",
          category: "Event",
          college: "SRCC"
        },
        {
          title: "Hindu College Research Grant Announced",
          date: "March 22, 2026",
          summary: "Hindu College announces a new undergraduate research grant program for science and humanities students.",
          url: "https://hinducollege.ac.in",
          category: "News",
          college: "Hindu College"
        },
        {
          title: "Miranda House Annual Fest: Tempest 2026",
          date: "April 12, 2026",
          summary: "Join the vibrant cultural extravaganza with multiple competitions and celebrity performances.",
          url: "https://mirandahouse.ac.in",
          category: "Event",
          college: "Miranda House"
        },
        {
          title: "Revised Examination Schedule Semester II",
          date: "March 28, 2026",
          summary: "The university examination branch has released the revised schedule for all second-semester UG programs.",
          url: "https://exam.du.ac.in",
          category: "News",
          college: "Delhi University"
        },
        {
          title: "LSR Model United Nations",
          date: "April 18, 2026",
          summary: "A premier platform for students to discuss global issues and develop diplomatic skills.",
          url: "https://lsr.edu.in",
          category: "Event",
          college: "LSR"
        },
        {
          title: "New Digital Library Access for DU Students",
          date: "March 30, 2026",
          summary: "Delhi University Central Library provides free access to premium academic journals for all enrolled students.",
          url: "https://crl.du.ac.in",
          category: "News",
          college: "Delhi University"
        }
      ]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    if (newsItems.length === 0) {
      fetchNews();
    }
  }, [newsItems.length]);

  const handleShare = async (resource: typeof INITIAL_RESOURCES[0]) => {
    const shareUrl = `${window.location.origin}/browse?resourceId=${resource.id}`;
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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className={`min-h-screen bg-ethereal-mesh text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 flex flex-col`}>
      <Toaster position="top-center" expand={false} richColors />
      {/* Navigation Bar */}
      {!isFlipbookView && (
      <nav className={`sticky top-0 z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-2xl border-b border-gray-200 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] py-2' 
          : 'bg-white/60 backdrop-blur-xl border-b border-transparent py-4'
      }`}>
        {/* Scroll Progress Bar */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800 origin-left z-[110]"
          style={{ scaleX }}
        />

        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-2 cursor-pointer shrink-0 group"
          >
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-purple-500/30 lg:group-hover:rotate-6 transition-transform duration-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div className="flex flex-col leading-[1.1] sm:leading-none">
            <span className="text-[13px] sm:text-lg font-black text-gray-900 tracking-tighter uppercase lg:group-hover:text-indigo-600 transition-colors">My College</span>
            <span className="text-[13px] sm:text-lg font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tighter uppercase transition-all">Genie</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden xl:flex items-center gap-1">
          {[
            { to: '/', icon: Home, label: 'Home', active: location.pathname === '/' },
            { to: '/browse', icon: Search, label: 'Browse', active: location.pathname === '/browse' },
            { to: '/playlists', icon: Youtube, label: 'Playlists', active: location.pathname === '/playlists' },
            { to: '/find-pg', icon: Building, label: 'Find PG', active: location.pathname === '/find-pg' },
            { to: '/forum', icon: MessageSquare, label: 'Forums', active: location.pathname.startsWith('/forum') },
          ].map(({ to, icon: Icon, label, active }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all duration-300 group ${
                active ? 'bg-purple-100/60 text-purple-700' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/60'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-purple-600' : ''}`} />
              {label}
            </Link>
          ))}

          {/* Campus Updates Dropdown */}
          <div className="relative group">
            <button className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all duration-300 group ${
              location.pathname === '/news' || location.pathname === '/events'
                ? 'bg-purple-100/60 text-purple-700'
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/60'
            }`}>
              <Newspaper className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${location.pathname === '/news' || location.pathname === '/events' ? 'text-purple-600' : ''}`} />
              Campus Updates
            </button>
            <div className="absolute top-full left-0 pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50 before:absolute before:-top-4 before:left-0 before:w-full before:h-8 before:-z-10">
              <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-2 flex flex-col gap-1 relative z-10">
                <Link 
                  to="/news"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    location.pathname === '/news' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ location.pathname === '/news' ? 'bg-purple-100' : 'bg-gray-50 group-hover:bg-purple-50' }`}>
                    <Newspaper className="w-3.5 h-3.5" />
                  </div>
                  News
                </Link>
                <Link 
                  to="/events"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    location.pathname === '/events' ? 'text-purple-600 bg-purple-50' : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ location.pathname === '/events' ? 'bg-purple-100' : 'bg-gray-50 group-hover:bg-purple-50' }`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  Events
                </Link>
              </div>
            </div>
          </div>

          {appUser?.role === 'admin' && (
            <Link 
              to="/admin"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all duration-300 group ${
                location.pathname === '/admin' 
                  ? 'bg-purple-100/60 text-purple-700' 
                  : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/60'
              }`}
            >
              <LayoutGrid className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              Admin
            </Link>
          )}
          
          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-gray-900 tracking-tight truncate max-w-[120px]">{user.displayName}</span>
                <button onClick={() => logout()} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">Sign Out</button>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-10 h-10 rounded-xl overflow-hidden border-2 border-purple-100 shadow-lg"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="DU Student Profile Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 group"
            >
              <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="xl:hidden flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2.5 rounded-2xl transition-all duration-500 relative overflow-hidden group ${
              isMobileMenuOpen 
                ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/40' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] xl:hidden"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-[320px] bg-white z-[260] xl:hidden flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6b21a8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* Menu Header */}
                <div className="relative p-5 border-b border-gray-100 bg-white shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1.5 rounded-xl shadow-lg shadow-purple-500/20">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] font-black text-gray-900 tracking-tighter uppercase">My College</span>
                        <span className="text-[13px] font-black bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent tracking-tighter uppercase">Genie</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Auth Form Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-white pb-[max(24px,env(safe-area-inset-bottom))]">
                  {user ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 pb-12">
                      <div className="relative">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-purple-100 shadow-lg object-cover" loading="lazy" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border-4 border-white shadow-lg">
                            <User className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
                      </div>
                      
                      <div className="text-center w-full px-4">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight truncate w-full">{user.displayName}</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate w-full">{user.email}</p>
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-purple-50 rounded-full">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                          <span className="text-[10px] text-purple-600 font-black uppercase tracking-widest">
                            {appUser?.role === 'admin' ? 'Administrator' : 'Active Member'}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full mt-8 flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl font-black shadow-sm hover:bg-red-100 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <AuthForm onSuccess={() => setIsMobileMenuOpen(false)} />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
      
      <AnimatePresence>
        {showBackToTop && !isFlipbookView && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[150] p-3.5 sm:p-4 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl shadow-2xl shadow-purple-600/40 hover:shadow-purple-600/60 transition-shadow"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      {!isFlipbookView && (
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white/98 backdrop-blur-2xl border-t border-gray-100/80 px-2 sm:px-6 py-2 pb-[env(safe-area-inset-bottom,10px)] flex items-center justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
        {[{ to: '/', icon: Home, label: 'Home', active: location.pathname === '/' },
          { to: '/browse', icon: Search, label: 'Browse', active: location.pathname === '/browse' },
          { to: '/playlists', icon: Youtube, label: 'Videos', active: location.pathname === '/playlists' },
          { to: '/find-pg', icon: Building, label: 'Find PG', active: location.pathname === '/find-pg' },
          { to: '/forum', icon: MessageSquare, label: 'Forum', active: location.pathname.startsWith('/forum') },
        ].map(({ to, icon: Icon, label, active }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-0.5 flex-1 py-1 group">
            <div className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300 ${
              active ? 'bg-purple-100 shadow-sm shadow-purple-200' : 'group-hover:bg-gray-50'
            }`}>
              <Icon className={`w-5 h-5 transition-all duration-300 ${
                active ? 'text-purple-600 scale-110' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
              {active && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-purple-500 rounded-full" />}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tight transition-colors ${
              active ? 'text-purple-600' : 'text-gray-400'
            }`}>{label}</span>
          </Link>
        ))}
      </div>
      )}

      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={
          <HomePage 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            DU_COURSES={DU_COURSES}
            isNewsLoading={isNewsLoading}
            newsItems={newsItems}
            resources={resources}
            savedResourceIds={savedResourceIds}
            onSave={toggleSave}
            getAverageRating={getAverageRating}
            setSelectedResource={setSelectedResource}
            handleShare={handleShare}
          />
        } />
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
            setIsUploadModalOpen={setIsUploadModalOpen}
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
            setIsUploadModalOpen={setIsUploadModalOpen}
            handleShare={handleShare}
            courses={courses}
            semesters={availableSemesters}
            getAverageRating={getAverageRating}
          />
        } />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/find-pg" element={<FindPGPage />} />
        <Route path="/forum/:postId" element={<PostDetailPage />} />
        <Route path="/admin" element={<AdminPanel user={appUser} />} />
        <Route path="/login" element={<LoginPage user={appUser} />} />
        <Route path="/signup" element={<LoginPage user={appUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/flipbook/:id" element={<FlipbookPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/news" element={<OfficialNewsPage newsItems={newsItems} isLoading={isNewsLoading} />} />
        <Route path="/events" element={<CollegeEventsPage newsItems={newsItems} isLoading={isNewsLoading} />} />
      </Routes>
      </main>

      {/* Footer */}
      {location.pathname !== '/login' && !isFlipbookView && (
        <footer className="pt-20 pb-32 xl:pb-16 px-4 bg-[#0A071B] border-t border-purple-900/30 shrink-0 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter text-white">My College <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Genie</span></span>
              </div>
              <p className="text-gray-400 text-[15px] max-w-sm leading-relaxed">
                Your ultimate academic companion for Delhi University. Access notes, PYQs, and curated playlists to absolutely crush your semester.
              </p>
            </div>
            
            <div className="col-span-1">
              <h4 className="text-white font-black mb-6 uppercase tracking-[0.2em] text-xs">Explore</h4>
              <ul className="space-y-4 text-[15px] text-gray-400 font-medium">
                <li>
                  <Link 
                    to="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="hover:text-purple-400 transition-colors block"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (location.pathname !== '/') {
                        navigate('/');
                        setTimeout(() => {
                          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-purple-400 transition-colors text-left w-full"
                  >
                    Browse Resources
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="hover:text-purple-400 transition-colors text-left w-full"
                  >
                    Upload Resource
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (location.pathname !== '/') {
                        navigate('/');
                        setTimeout(() => {
                          setActiveFilter('Playlist');
                          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        setActiveFilter('Playlist');
                        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="hover:text-purple-400 transition-colors text-left w-full"
                  >
                    YouTube Playlists
                  </button>
                </li>
                <li>
                  <Link to="/news" className="hover:text-purple-400 transition-colors">
                    Official News
                  </Link>
                </li>
                <li>
                  <Link to="/events" className="hover:text-purple-400 transition-colors">
                    College Events
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white font-black mb-6 uppercase tracking-[0.2em] text-xs">Legal & Support</h4>
              <ul className="space-y-4 text-[15px] text-gray-400 font-medium">
                <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
                {appUser?.role === 'admin' && (
                  <li>
                    <Link 
                      to="/admin"
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-bold"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white font-black mb-6 uppercase tracking-[0.2em] text-xs">Join Community</h4>
              <p className="text-[15px] text-gray-400 mb-6 font-medium">Connect with fellow students and stay updated.</p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="https://www.linkedin.com/company/my-college-genie/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                  title="LinkedIn"
                  aria-label="Follow us on LinkedIn"
                >
                  <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </a>
                <a 
                  href="https://www.instagram.com/mycollegegenie.in?igsh=eDIzcnY5b2N6aGI5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-pink-500/50 hover:bg-pink-500/10 transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/10"
                  title="Instagram"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
                </a>
                <a 
                  href="https://www.reddit.com/r/AskMyCollegeGenie/s/CjjNrZWmAz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 hover:bg-orange-500/10 transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10"
                  title="Reddit"
                  aria-label="Join our Reddit community"
                >
                  <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.057 1.597.047.253.075.512.075.77 0 2.461-2.851 4.46-6.358 4.46-3.506 0-6.358-1.999-6.358-4.46 0-.258.028-.517.075-.77a1.756 1.756 0 0 1-1.057-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.174-.87 2.81-1.44 4.617-1.523l.71-3.326 2.456.519c-.098.192-.16.409-.16.639 0 .688.562 1.25 1.25 1.25zM9.03 13.003c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm5.94 0c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm-5.956 3.387c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128zm3.96 0c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128z"/>
                  </svg>
                </a>
                <a 
                  href="https://discord.gg/JAjYHHUVg3" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
                  title="Discord"
                  aria-label="Join our Discord server"
                >
                  <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-500">
              © {new Date().getFullYear()} My College Genie. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              Built with <span className="text-purple-400">💜</span> for DU Students
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* News & Events Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                        <input 
                          required
                          type="text" 
                          placeholder="e.g. Microeconomics Unit 1 Notes"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Course</label>
                        <select 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.course}
                          onChange={(e) => setFormData({...formData, course: e.target.value})}
                        >
                          <option value="">Select Course</option>
                          {DU_COURSES.map(course => (
                            <option key={course} value={course}>{course}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subject Code (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 11017502"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                          value={formData.subjectCode}
                          onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                        <select 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                        >
                          <option value="">Select Type</option>
                          <option value="Note">Note</option>
                          <option value="PYQ">PYQ</option>
                          <option value="Book">Book</option>
                          <option value="Playlist">Playlist</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Semester</label>
                        <select 
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.semester}
                          onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        >
                          {(() => {
                            const maxSem = COURSE_METADATA[formData.course]?.semesters || 6;
                            const sems = [];
                            for (let i = 1; i <= maxSem; i++) {
                              sems.push(i);
                            }
                            return sems.map(sem => (
                              <option key={sem} value={sem}>Semester {sem}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resource Link</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          required={!formData.file}
                          type="url" 
                          placeholder="https://drive.google.com/..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                          value={formData.link}
                          onChange={(e) => setFormData({...formData, link: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload File (PDF, etc.)</label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                          isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'
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

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags (Comma separated)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. economics, micro, unit1"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={formData.tags}
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                        <ReactQuill 
                          theme="snow"
                          value={formData.description}
                          onChange={(content) => setFormData({...formData, description: content})}
                          placeholder="Tell us more about this resource..."
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={uploadStatus === 'uploading'}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploadStatus === 'uploading' ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Publish Resource
                          </>
                        )}
                      </motion.button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resource Detail Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 text-gray-900 leading-tight">{selectedResource.title}</h2>
                <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2.5 sm:mb-5">
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
                          dangerouslySetInnerHTML={{ __html: selectedResource.description || "No description provided for this resource." }}
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
                        <h4 className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Student Comments</h4>
                      </div>
                      <div className="flex flex-col gap-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
                        <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0 mb-1.5 sm:mb-2">
                            <span className="font-black text-gray-900 text-xs sm:text-sm">Rahul Kumar</span> 
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">Hindu College • B.Com (Hons)</span>
                          </div>
                          <span className="text-gray-600 text-xs sm:text-sm font-medium">Very helpful notes! The diagrams make it much easier to understand.</span>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0 mb-1.5 sm:mb-2">
                            <span className="font-black text-gray-900 text-xs sm:text-sm">Sneha Desai</span> 
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">SRCC • BA (Prog)</span>
                          </div>
                          <span className="text-gray-600 text-xs sm:text-sm font-medium">Saved me before exams! Exactly what I was looking for.</span>
                        </div>
                        <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-0 mb-1.5 sm:mb-2">
                            <span className="font-black text-gray-900 text-xs sm:text-sm">Amit Sharma</span> 
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm whitespace-nowrap">Hansraj College • B.Tech</span>
                          </div>
                          <span className="text-gray-600 text-xs sm:text-sm font-medium">Clear and concise. Highly recommend scanning the last two pages.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModalView('main')} className="p-1 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h4 className="text-[10px] sm:text-xs font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Exam Tips</h4>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 sm:p-5 shadow-sm min-h-[150px]">
                        <ul className="list-disc pl-5 text-yellow-800 space-y-2 text-xs sm:text-sm font-medium">
                          <li>Focus heavily on the topics covered in chapter 3 and 4.</li>
                          <li>Practice the numericals at least twice before the final.</li>
                          <li>Drawing neat diagrams will easily fetch you full marks.</li>
                        </ul>
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
                      <span className="truncate">{selectedResource.type === 'Playlist' ? 'Watch Playlist' : 'View Website'}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </motion.a>
                    {selectedResource.directDownloadLink && (
                      <motion.a 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={selectedResource.directDownloadLink} 
                        download
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
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
      </AnimatePresence>

      {/* Event Request Modal */}
      <AnimatePresence>
        {isEventRequestModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
              className="relative w-full max-w-xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-fuchsia-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Publish Your Event</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reach the entire DU community</p>
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

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Event request submitted successfully! Our team will review it shortly.');
                  setIsEventRequestModalOpen(false);
                  setEventRequestData({ college: '', title: '', date: '', description: '', contact: '' });
                }}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
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
                        rows={4}
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

                    <div className="pt-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-2"
                      >
                        Submit Request
                      </motion.button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
