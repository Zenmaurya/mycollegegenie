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
import { FilterProvider } from './context/FilterContext';

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
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { ResourceUploadModal } from './components/ResourceUploadModal';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ReportModal } from './components/ReportModal';
import { EventRequestModal } from './components/EventRequestModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { ChatInbox } from './components/ChatInbox';
import { ChatWindow } from './components/ChatWindow';
import { ChatService } from './services/chatService';

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
  const { user, appUser, isAuthLoading, isAuthModalOpen, closeAuthModal, openAuthModal, authModalMessage } = useAuth();
  const { resources, setResources } = useResources();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Modal state ────────────────────────────────────────────────
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Chat State ──────────────────────────────────────────────────
  const [isChatInboxOpen, setIsChatInboxOpen] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<{ id: string; name: string } | null>(null);

  const openChatForListing = async (type: 'pg' | 'exchange', id: string, sellerId: string) => {
    if (!user) {
      openAuthModal('Please sign in to chat with the seller.');
      return;
    }
    try {
      const { sessionId } = await ChatService.createSession(type, id, sellerId);
      setActiveChatSession({ id: sessionId, name: 'Connecting...' });
    } catch (err) {
      toast.error('Could not start chat. Please try again.');
    }
  };

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
    previousPathRef.current = location.pathname;
  }, [location.pathname]);

  const getAverageRating = useCallback((ratings?: number[]) => {
    if (!ratings || ratings.length === 0) return 0;
    return parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  }, []);

  // ── Rating handler (needs both resources + selectedResource) ───
  const handleRate = useCallback(async (resourceId: string, rating: number) => {
    if (!user) { openAuthModal('Please sign in to rate resources.'); return; }
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

  // ── Modals & Drawers ───────────────────────────────────────────
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (requireAdmin && appUser?.role !== 'admin' && appUser?.role !== 'moderator') return <Navigate to="/" replace />;
    return <>{children}</>;
  };

  const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>;
    if (user) return <Navigate to="/" replace />;
    return <>{children}</>;
  };

  // ── Share handler ───────────────────────────────────────────────
  const handleShare = useCallback(async (resource: Resource) => {
    const shareUrl = `${window.location.origin}/resource/${resource.id}`;
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
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/20 flex items-center justify-center shadow-inner relative overflow-hidden">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin relative z-10" />
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
      isNewsLoading={isNewsLoading} newsItems={newsItems}
      resources={resources}
      getAverageRating={getAverageRating}
      setSelectedResource={setSelectedResource}
      handleShare={handleShare}
      siteSettings={siteSettings}
    />
  );

  const isPlainLayout = isFlipbookView || isAuthPage || isLoginSignupPage;

  const renderRoutes = () => (
    <main className={isPlainLayout ? 'h-full w-full' : 'content'}>
      <PageTransition className={isPlainLayout ? 'h-full w-full' : undefined}>
        <Suspense fallback={PageFallback}>
          <Routes location={location}>
            <Route path="/" element={HomePageElement} />
            <Route path="/browse" element={
              <BrowsePage
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
                setSelectedResource={setSelectedResource}
                setIsUploadModalOpen={openUploadModal}
                handleShare={handleShare}
                getAverageRating={getAverageRating}
                resultsRef={resultsRef}
              />
            } />
            <Route path="/forum" element={<ForumPage user={user} />} />
            <Route path="/forum/:postId" element={<PostDetailPage />} />
            <Route path="/find-pg" element={<FindPGPage user={appUser} onOpenChat={(id, sellerId) => openChatForListing('pg', id, sellerId)} />} />
            <Route path="/campus-exchange" element={<CampusExchangePage user={appUser} onOpenChat={(id, sellerId) => openChatForListing('exchange', id, sellerId)} />} />
            <Route path="/exchange" element={<CampusExchangePage user={appUser} onOpenChat={(id, sellerId) => openChatForListing('exchange', id, sellerId)} />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel user={user} appUser={appUser} isAuthLoading={isAuthLoading} />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<GuestRoute><LoginPage user={appUser} /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><LoginPage user={appUser} /></GuestRoute>} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
                <div className="text-8xl font-black text-brand">404</div>
                <div>
                  <h1 className="text-2xl font-black text-ink mb-2">Page Not Found</h1>
                  <p className="text-ink-soft font-medium">The page you're looking for doesn't exist or has been moved.</p>
                </div>
                <Link to="/" className="btn btn-primary">Go Home</Link>
              </div>
            } />
          </Routes>
        </Suspense>
      </PageTransition>
    </main>
  );

  return (
    <>
      <Toaster position="top-center" expand={false} richColors />
      
      {isPlainLayout ? (
        <div className="main min-w-0 min-h-screen">
          {renderRoutes()}
        </div>
      ) : (
        <div className="app">
          {/* Desktop Sidebar OR Mobile Sidebar Wrapper */}
          <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:!translate-x-0`}>
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>

          {/* Mobile overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className="main min-w-0">
            <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} onInboxClick={() => setIsChatInboxOpen(true)} />
            
            <AnnouncementBanner
              siteSettings={siteSettings}
              dismissed={announcementDismissed}
              onDismiss={() => {
                setAnnouncementDismissed(true);
                sessionStorage.setItem('announcementDismissed', 'true');
              }}
            />
            
            {renderRoutes()}
          </div>
        </div>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        message={authModalMessage}
      />

      {isChatInboxOpen && (
        <ChatInbox 
          onClose={() => setIsChatInboxOpen(false)}
          onOpenSession={(id, name) => {
            setIsChatInboxOpen(false);
            setActiveChatSession({ id, name });
          }}
        />
      )}

      {activeChatSession && (
        <ChatWindow
          sessionId={activeChatSession.id}
          otherUserName={activeChatSession.name}
          onClose={() => setActiveChatSession(null)}
        />
      )}
    </>
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
          <FilterProvider>
            <AppContent />
          </FilterProvider>
        </ResourceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
