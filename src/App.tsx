/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — Application shell (refactored)
 * ─────────────────────────────────────────────────────────────────
 * Reduced from ~2502 lines → ~450 lines.
 *
 * What moved OUT of this file:
 *   Auth state        → src/context/AuthContext.tsx
 *   Resources state   → src/context/ResourceContext.tsx
 *   NavBar + mobile   → src/components/NavBar.tsx
 *   Footer            → src/components/AppFooter.tsx
 *   Upload modal      → src/components/ResourceUploadModal.tsx
 *   Detail modal      → src/components/ResourceDetailModal.tsx
 *   Report modal      → src/components/ReportModal.tsx
 *   Event modal       → src/components/EventRequestModal.tsx
 *   Announcement bar  → src/components/AnnouncementBanner.tsx
 *
 * What stays here:
 *   - Route definitions
 *   - Filter / search state (shared between HomePage & BrowsePage)
 *   - News + site-settings fetching
 *   - handleRate, handleShare (need both resources + selectedResource)
 *   - openUploadModal / selectedResource coordination
 */

import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import { useDebounce } from './hooks/useDebounce';
import {
  BrowserRouter, Routes, Route, Link, useLocation, useNavigate,
  useSearchParams, Navigate,
} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// ── Contexts ──────────────────────────────────────────────────────
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResourceProvider, useResources } from './context/ResourceContext';

// ── Lazy pages ────────────────────────────────────────────────────
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

// ── Components ────────────────────────────────────────────────────
import { PageTransition } from './components/PageTransition';
import { NavBar } from './components/NavBar';
import { AppFooter } from './components/AppFooter';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { ResourceUploadModal } from './components/ResourceUploadModal';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ReportModal } from './components/ReportModal';
import { EventRequestModal } from './components/EventRequestModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Constants & Types ─────────────────────────────────────────────
import { College_COURSES, SUB_CATEGORIES, COURSE_METADATA } from './constants';
import type { Resource, NewsItem } from './types';

// ── Services ──────────────────────────────────────────────────────
import { getNews } from './services/newsService';
import { rateResource } from './services/resourceService';
import { fetchWithAuth } from './lib/apiClient';
import { config } from './lib/config';

// ─────────────────────────────────────────────────────────────────
// AppContent — uses AuthProvider + ResourceProvider from parent App
// ─────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, appUser, isAuthLoading } = useAuth();
  const { resources, setResources } = useResources();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter / search state ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Note' | 'PYQ' | 'Book'>('All');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'Title' | 'Date' | 'Rating' | 'Course'>('Date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Modal state ────────────────────────────────────────────────
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);

  // ── News + Settings ────────────────────────────────────────────
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [announcementDismissed, setAnnouncementDismissed] = useState(() =>
    sessionStorage.getItem('announcementDismissed') === 'true',
  );

  const resultsRef = useRef<HTMLElement>(null);
  const isPlaylistContext = location.pathname === '/playlists';

  // ── Open upload modal (also clears selected resource to avoid overlap) ──
  const openUploadModal = useCallback(() => {
    setSelectedResource(null);
    setIsUploadModalOpen(true);
  }, []);

  // ── Fetch news + site settings once ───────────────────────────
  const hasFetchedNews = useRef(false);
  useEffect(() => {
    if (hasFetchedNews.current) return;
    hasFetchedNews.current = true;

    const fetchNews = async () => {
      setIsNewsLoading(true);
      try {
        const data = await getNews();
        if (data && data.length > 0) {
          setNewsItems(data);
        } else {
          // Fallback: AI-generated updates (public endpoint — no auth needed)
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10_000);
          try {
            const res = await fetch(`${config.apiUrl}/api/news/ai-updates`, { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
              const parsed = await res.json();
              if (parsed && parsed.length > 0) setNewsItems(parsed);
            }
          } catch { clearTimeout(tid); }
        }
      } catch { /* silent — individual pages handle their own news loading */ }
      finally { setIsNewsLoading(false); }
    };

    const fetchSettings = async () => {
      try {
        // Public endpoint — no auth needed
        const res = await fetch(`${config.apiUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setSiteSettings(data || {});
        }
      } catch (err) { console.error('[App] Failed to fetch settings:', err); }
    };

    fetchNews();
    fetchSettings();
  }, []);

  // ── Reset filters on navigation (except flipbook transitions) ──
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    const isFromFlipbook = previousPathRef.current.startsWith('/flipbook');
    const isToFlipbook = location.pathname.startsWith('/flipbook');
    previousPathRef.current = location.pathname;

    if (!isFromFlipbook && !isToFlipbook) {
      setSearchQuery('');
      setActiveFilter('All');
      setSelectedCourse('All Courses');
      setSelectedSemester('All Semesters');
      setSelectedSubCategory('All');
      setSortBy('Date');
      setVisibleCount(12);
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // ── Reset semester/subCategory when course changes ─────────────
  const availableSemesters = useMemo(() => {
    if (selectedCourse === 'All Courses') return ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
    const maxSem = COURSE_METADATA[selectedCourse]?.semesters || 8;
    return ['All Semesters', ...Array.from({ length: maxSem }, (_, i) => String(i + 1))];
  }, [selectedCourse]);

  const availableSubCategories = useMemo(() => {
    if (selectedCourse === 'All Courses') return ['All', ...SUB_CATEGORIES];
    const meta = COURSE_METADATA[selectedCourse];
    return ['All', ...(meta?.subCategories || SUB_CATEGORIES)];
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse !== 'All Courses') {
      if (!availableSemesters.includes(selectedSemester)) setSelectedSemester('All Semesters');
      if (!availableSubCategories.includes(selectedSubCategory)) setSelectedSubCategory('All');
    }
  }, [selectedCourse, availableSemesters, availableSubCategories, selectedSemester, selectedSubCategory]);

  const courses = useMemo(() => {
    const unique = Array.from(new Set([...resources.map(r => r.course), ...College_COURSES]));
    return ['All Courses', ...unique.sort()];
  }, [resources]);

  // ── Debounced filter computation ───────────────────────────────
  const debouncedSearch = useDebounce(searchQuery, 350);

  const getAverageRating = useCallback((ratings?: number[]) => {
    if (!ratings || ratings.length === 0) return 0;
    return parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  }, []);

  const filteredResources = useMemo(() => {
    const filtered = resources.filter(resource => {
      if (resource.type === 'Playlist') return false;
      const isVisible = resource.isApproved || (user && resource.uploaderId === user.id);
      if (!isVisible) return false;
      const q = debouncedSearch.toLowerCase();
      return (
        (!q || resource.title.toLowerCase().includes(q) || resource.course.toLowerCase().includes(q) ||
          ((resource as any).subjectCode || '').toLowerCase().includes(q) ||
          resource.tags.some(tag => tag.toLowerCase().includes(q))) &&
        (activeFilter === 'All' || resource.type === activeFilter) &&
        (selectedSubCategory === 'All' || (resource as any).subCategory === selectedSubCategory) &&
        (selectedCourse === 'All Courses' || resource.course === selectedCourse) &&
        (selectedSemester === 'All Semesters' || resource.semester.toString() === selectedSemester)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      if (sortBy === 'Date') return (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0);
      if (sortBy === 'Rating') return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortBy === 'Course') return a.course.localeCompare(b.course);
      return 0;
    });
  }, [debouncedSearch, activeFilter, selectedSubCategory, selectedCourse, selectedSemester, resources, sortBy, user]);

  // ── Rating handler (needs both resources + selectedResource) ───
  const handleRate = useCallback(async (resourceId: string, rating: number) => {
    if (!user) { toast.error('Please sign in to rate resources.'); return; }
    try {
      await rateResource(resourceId, rating);
      setResources(prev => prev.map(r => {
        if (r.id !== resourceId) return r;
        const current = (r as any).ratings || [];
        return { ...r, ratings: [...current, rating] };
      }));
      setSelectedResource(prev => {
        if (!prev || prev.id !== resourceId) return prev;
        return { ...prev, ratings: [...((prev as any).ratings || []), rating] } as any;
      });
      toast.success('Thank you for your rating!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating.');
    }
  }, [user, setResources]);

  // ── Share handler ───────────────────────────────────────────────
  const handleShare = useCallback(async (resource: Resource) => {
    const shareUrl = `${config.apiUrl}/api/resources/share/${resource.id}`;
    const shareData = {
      title: resource.title,
      text: `Check out this resource: ${resource.title} for ${resource.course} via MyCollegeGenie`,
      url: shareUrl,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); }
      catch (err) { if ((err as Error).name !== 'AbortError') console.error('[Share] error:', err); }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
      } catch { console.error('[Share] clipboard failed'); }
    }
  }, []);

  // ── Layout guards ───────────────────────────────────────────────
  const isFlipbookView = location.pathname.startsWith('/flipbook');
  const isAuthPage = location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isLoginSignupPage = location.pathname === '/login' || location.pathname === '/signup';

  // ── Page suspense fallback ──────────────────────────────────────
  const PageFallback = (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center shadow-inner relative overflow-hidden">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin relative z-10" />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-gray-900 text-lg">Loading Experience…</h3>
        <p className="text-sm text-gray-500 font-medium">Preparing the platform</p>
      </div>
    </div>
  );

  // ── Home page element (reused on /login and /signup routes) ────
  const HomePageElement = (
    <HomePage
      searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      activeFilter={activeFilter} setActiveFilter={setActiveFilter}
      sortBy={sortBy} setSortBy={setSortBy}
      College_COURSES={College_COURSES}
      isNewsLoading={isNewsLoading} newsItems={newsItems}
      resources={resources}
      savedResourceIds={[]} // ResourceContext exposes this — pages that need it use useResources()
      onSave={async () => {}}    // pages use useResources().toggleSave directly
      getAverageRating={getAverageRating}
      setSelectedResource={setSelectedResource}
      handleShare={handleShare}
      siteSettings={siteSettings}
    />
  );

  return (
    <div className="min-h-screen bg-ethereal-mesh text-gray-900 font-sans selection:bg-purple-100 selection:text-purple-900 flex flex-col">
      <Toaster position="top-center" expand={false} richColors />

      {/* Announcement banner */}
      {!isFlipbookView && !isAuthPage && (
        <AnnouncementBanner
          siteSettings={siteSettings}
          dismissed={announcementDismissed}
          onDismiss={() => {
            setAnnouncementDismissed(true);
            sessionStorage.setItem('announcementDismissed', 'true');
          }}
        />
      )}

      {/* Navigation */}
      <NavBar />

      {/* Main routes */}
      <main className="flex-grow flex flex-col">
        <PageTransition>
          <Suspense fallback={PageFallback}>
            <Routes location={location}>
              <Route path="/" element={HomePageElement} />

              <Route path="/browse" element={
                <BrowsePage
                  resources={resources}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  activeFilter={activeFilter} setActiveFilter={setActiveFilter}
                  selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                  selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester}
                  selectedSubCategory={selectedSubCategory} setSelectedSubCategory={setSelectedSubCategory}
                  sortBy={sortBy} setSortBy={setSortBy}
                  courses={courses}
                  availableSemesters={availableSemesters}
                  availableSubCategories={availableSubCategories}
                  viewMode={viewMode} setViewMode={setViewMode}
                  visibleCount={visibleCount} setVisibleCount={setVisibleCount}
                  filteredResources={filteredResources}
                  savedResourceIds={[]}
                  onSave={async () => {}}
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
                  savedResourceIds={[]}
                  onSave={async () => {}}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                  selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester}
                  sortBy={sortBy} setSortBy={setSortBy}
                  visibleCount={visibleCount} setVisibleCount={setVisibleCount}
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
              <Route path="/forum/:postId" element={<PostDetailPage />} />
              <Route path="/find-pg" element={<FindPGPage user={user} />} />
              <Route path="/campus-exchange" element={<CampusExchangePage user={user} />} />

              <Route path="/admin" element={
                (isAuthLoading || (user && !appUser)) ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : (appUser?.role === 'admin' || appUser?.role === 'moderator') ? (
                  <AdminPanel user={user} appUser={appUser} isAuthLoading={isAuthLoading} />
                ) : user ? (
                  <Navigate to="/" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } />

              {/* Login/signup routes */}
              <Route path="/login" element={<LoginPage user={appUser} />} />
              <Route path="/signup" element={<LoginPage user={appUser} />} />
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
      </main>



      {/* Footer */}
      {!isAuthPage && !isLoginSignupPage && !isFlipbookView && (
        <AppFooter onOpenUpload={openUploadModal} />
      )}

      {/* ── Portalled modals ── */}
      <ResourceUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        isPlaylistContext={isPlaylistContext}
      />

      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onRate={handleRate}
          onShare={handleShare}
          onReport={() => setIsReportModalOpen(true)}
          getAverageRating={getAverageRating}
        />
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        resource={selectedResource}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => setSelectedResource(null)}
      />

      <EventRequestModal
        isOpen={isEventRequestModalOpen}
        onClose={() => setIsEventRequestModalOpen(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// App — wraps everything with Router + Context providers
// ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResourceProvider>
          <AppContent />
        </ResourceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
