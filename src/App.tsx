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
 *   Event modal       → src/components/EventRequestModal.tsx
 *   Announcement bar  → src/components/AnnouncementBanner.tsx
 *
 * What stays here:
 *   - Route definitions
 *   - Filter / search state (used by /playlists)
 *   - News + site-settings fetching
 *   - handleShare
 */

import React, { useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import {
  BrowserRouter, Routes, Route, Link, useLocation, useNavigate,
  Navigate, useParams,
} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// ── Contexts ──────────────────────────────────────────────────────
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResourceProvider, useResources } from './context/ResourceContext';

// ── Lazy pages ────────────────────────────────────────────────────
const NotesBrowsePage = lazy(() => import('./pages/notes/NotesBrowsePage').then(m => ({ default: m.NotesBrowsePage })));
const NoteDetailPage = lazy(() => import('./pages/notes/NoteDetailPage').then(m => ({ default: m.NoteDetailPage })));
const NotesUploadPage = lazy(() => import('./pages/notes/NotesUploadPage').then(m => ({ default: m.NotesUploadPage })));
const PlaylistPage = lazy(() => import('./pages/PlaylistPage').then(m => ({ default: m.PlaylistPage })));
const PostPage = lazy(() => import('./pages/PostPage').then(m => ({ default: m.PostPage })));
const AdminPanel = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const StaysBrowsePage = lazy(() => import('./pages/stays/StaysBrowsePage').then(m => ({ default: m.StaysBrowsePage })));
const StayDetailPage = lazy(() => import('./pages/stays/StayDetailPage').then(m => ({ default: m.StayDetailPage })));
const StayNewPage = lazy(() => import('./pages/stays/StayNewPage').then(m => ({ default: m.StayNewPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const FlipbookPage = lazy(() => import('./pages/FlipbookPage').then(m => ({ default: m.FlipbookPage })));
const OfficialNewsPage = lazy(() => import('./pages/OfficialNewsPage').then(m => ({ default: m.OfficialNewsPage })));
const CollegeEventsPage = lazy(() => import('./pages/CollegeEventsPage').then(m => ({ default: m.CollegeEventsPage })));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const SettingsPage = lazy(() => import('./pages/profile/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage').then(m => ({ default: m.AdminUserPage })));
const ExchangeBrowsePage = lazy(() => import('./pages/exchange/ExchangeBrowsePage').then(m => ({ default: m.ExchangeBrowsePage })));
const ExchangeItemPage = lazy(() => import('./pages/exchange/ExchangeItemPage').then(m => ({ default: m.ExchangeItemPage })));
const ExchangeSellPage = lazy(() => import('./pages/exchange/ExchangeSellPage').then(m => ({ default: m.ExchangeSellPage })));
const OTPVerificationPage = lazy(() => import('./pages/OTPVerificationPage').then(m => ({ default: m.OTPVerificationPage })));
const ContributorsPage = lazy(() => import('./pages/ContributorsPage').then(m => ({ default: m.ContributorsPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const DevUiPage = import.meta.env.DEV ? lazy(() => import('./pages/DevUiPage').then(m => ({ default: m.DevUiPage }))) : null;
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })));
const FindPeoplePage = lazy(() => import('./pages/people/FindPeoplePage').then(m => ({ default: m.FindPeoplePage })));
const InboxPage = lazy(() => import('./pages/InboxPage').then(m => ({ default: m.InboxPage })));
const ConversationPage = lazy(() => import('./pages/inbox/ConversationPage').then(m => ({ default: m.ConversationPage })));
const YouPage = lazy(() => import('./pages/YouPage').then(m => ({ default: m.YouPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage').then(m => ({ default: m.CompetitionsPage })));
const CommunitiesPage = lazy(() => import('./pages/communities/CommunitiesPage').then(m => ({ default: m.CommunitiesPage })));
const CreateCommunityPage = lazy(() => import('./pages/communities/CreateCommunityPage').then(m => ({ default: m.CreateCommunityPage })));
const CommunityPage = lazy(() => import('./pages/communities/CommunityPage').then(m => ({ default: m.CommunityPage })));
const ManageCommunityPage = lazy(() => import('./pages/communities/ManageCommunityPage').then(m => ({ default: m.ManageCommunityPage })));
const NewEventPage = lazy(() => import('./pages/communities/NewEventPage').then(m => ({ default: m.NewEventPage })));
const FeedPage = lazy(() => import('./pages/FeedPage').then(m => ({ default: m.FeedPage })));

// ── Components ────────────────────────────────────────────────────
import { PageTransition } from './components/PageTransition';
import { AppShell } from './components/shell/AppShell';
import { RightRail } from './components/shell/RightRail';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { EventRequestModal } from './components/EventRequestModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// ── Constants & Types ─────────────────────────────────────────────
import { College_COURSES, COURSE_METADATA } from './constants';
import type { Resource, NewsItem } from './types';

// ── Services ──────────────────────────────────────────────────────
import { getNews } from './services/newsService';
import { fetchWithAuth } from './lib/apiClient';
import { config } from './lib/config';
import { legacyBrowseToNotes } from './lib/notes';

function ForumPostRedirect() {
  const { postId } = useParams();
  return <Navigate to={`/post/${postId}`} replace />;
}

const PageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
  </div>
);

/** Admin and moderator only: spinner while auth loads, home for other users, login for guests. */
function StaffOnly({ children }: { children: React.ReactNode }) {
  const { user, appUser, isAuthLoading } = useAuth();
  if (isAuthLoading || (user && !appUser)) return <PageSpinner />;
  if (appUser?.role === 'admin' || appUser?.role === 'moderator') return <>{children}</>;
  return <Navigate to={user ? '/' : '/login'} replace />;
}

/** Logged-in users only: spinner while auth loads, login (remembering where to return) for guests. */
function LoginOnly({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  if (isAuthLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: { pathname: location.pathname + location.search } }} />;
  return <>{children}</>;
}

/** Old /campus-exchange links keep their query string (?type=...). */
function CampusExchangeRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/exchange${search}`} replace />;
}

/** Old /profile bookmarks: own profile when a username is set, else settings. */
function ProfileRedirect() {
  const { user, appUser, isAuthLoading } = useAuth();
  const { search } = useLocation(); // keeps /profile?tab=saved working
  if (isAuthLoading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={appUser?.username ? `/u/${appUser.username}${search}` : '/settings'} replace />;
}

// ─────────────────────────────────────────────────────────────────
// AppContent — uses AuthProvider + ResourceProvider from parent App
// ─────────────────────────────────────────────────────────────────
function AppContent() {
  const { user, appUser, isAuthLoading } = useAuth();
  const { resources, savedResourceIds, toggleSave } = useResources();

  const location = useLocation();
  const navigate = useNavigate();

  // ── Filter / search state ──────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [sortBy, setSortBy] = useState<'Title' | 'Date' | 'Rating' | 'Course'>('Date');
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Modal state ────────────────────────────────────────────────
  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);

  // ── News + Settings ────────────────────────────────────────────
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [announcementDismissed, setAnnouncementDismissed] = useState(() =>
    sessionStorage.getItem('announcementDismissed') === 'true',
  );

  const resultsRef = useRef<HTMLElement>(null);

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
      setSelectedCourse('All Courses');
      setSelectedSemester('All Semesters');
      setSortBy('Date');
      setVisibleCount(12);
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const availableSemesters = useMemo(() => {
    if (selectedCourse === 'All Courses') return ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
    const maxSem = COURSE_METADATA[selectedCourse]?.semesters || 8;
    return ['All Semesters', ...Array.from({ length: maxSem }, (_, i) => String(i + 1))];
  }, [selectedCourse]);

  // ── Reset semester when course changes ─────────────────────────
  useEffect(() => {
    if (selectedCourse !== 'All Courses' && !availableSemesters.includes(selectedSemester)) setSelectedSemester('All Semesters');
  }, [selectedCourse, availableSemesters, selectedSemester]);

  const courses = useMemo(() => {
    const unique = Array.from(new Set([...resources.map(r => r.course), ...College_COURSES]));
    return ['All Courses', ...unique.sort()];
  }, [resources]);

  const getAverageRating = useCallback((ratings?: number[]) => {
    if (!ratings || ratings.length === 0) return 0;
    return parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1));
  }, []);

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
    <div className="min-h-[60vh] w-full max-w-7xl mx-auto px-4 sm:px-6 py-10" role="status" aria-label="Loading page">
      <div className="h-8 w-48 rounded-lg bg-slate-200 animate-pulse mb-8" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-44 rounded-2xl border border-slate-200 bg-white animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
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
      {/* App shell: top bar, left nav, right rail (home only), mobile tab bar, composer */}
      <AppShell rightRail={location.pathname === '/' ? <RightRail news={newsItems} /> : undefined}>
        <PageTransition>
          <Suspense fallback={PageFallback}>
            <Routes location={location}>
              <Route path="/" element={<FeedPage news={newsItems} />} />

              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/explore/competitions" element={<CompetitionsPage />} />
              <Route path="/c" element={<CommunitiesPage />} />
              <Route path="/c/new" element={<CreateCommunityPage />} />
              <Route path="/c/:slug/manage" element={<ManageCommunityPage />} />
              <Route path="/c/:slug/events/new" element={<NewEventPage />} />
              <Route path="/c/:slug/:tab?" element={<CommunityPage />} />
              <Route path="/people" element={<LoginOnly><FindPeoplePage /></LoginOnly>} />
              <Route path="/inbox" element={<LoginOnly><InboxPage /></LoginOnly>} />
              <Route path="/inbox/:id" element={<LoginOnly><ConversationPage /></LoginOnly>} />
              <Route path="/you" element={<YouPage />} />

              <Route path="/upload" element={<Navigate to="/notes/upload" replace />} />
              <Route path="/browse" element={<Navigate to={legacyBrowseToNotes(location.search)} replace />} />
              <Route path="/notes" element={<NotesBrowsePage />} />
              <Route path="/notes/upload" element={<NotesUploadPage />} />
              <Route path="/notes/:id" element={<NoteDetailPage />} />

              <Route path="/playlists" element={
                <PlaylistPage
                  resources={resources}
                  savedResourceIds={savedResourceIds}
                  onSave={toggleSave}
                  searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                  selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                  selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester}
                  sortBy={sortBy} setSortBy={setSortBy}
                  visibleCount={visibleCount} setVisibleCount={setVisibleCount}
                  handleShare={handleShare}
                  courses={courses}
                  semesters={availableSemesters}
                  getAverageRating={getAverageRating}
                  resultsRef={resultsRef}
                />
              } />

              {DevUiPage && <Route path="/dev/ui" element={<DevUiPage />} />}
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/forum" element={<Navigate to={'/' + location.search} replace />} />
              <Route path="/forum/:postId" element={<ForumPostRedirect />} />
              <Route path="/find-pg" element={<Navigate to="/stays" replace />} />
              <Route path="/stays" element={<StaysBrowsePage />} />
              <Route path="/stays/new" element={<StayNewPage />} />
              <Route path="/stays/:id" element={<StayDetailPage />} />
              <Route path="/stays/:id/edit" element={<StayNewPage />} />
              <Route path="/campus-exchange" element={<CampusExchangeRedirect />} />
              <Route path="/exchange" element={<ExchangeBrowsePage />} />
              <Route path="/exchange/sell" element={<LoginOnly><ExchangeSellPage /></LoginOnly>} />
              <Route path="/exchange/:id" element={<ExchangeItemPage />} />
              <Route path="/exchange/:id/edit" element={<LoginOnly><ExchangeSellPage /></LoginOnly>} />

              <Route path="/admin" element={<StaffOnly><AdminPanel user={user} appUser={appUser} isAuthLoading={isAuthLoading} /></StaffOnly>} />
              <Route path="/admin/users/:id" element={<StaffOnly><AdminUserPage /></StaffOnly>} />

              {/* Login/signup routes */}
              <Route path="/login" element={<LoginPage user={user} />} />
              <Route path="/signup" element={<LoginPage user={user} />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ForgotPasswordPage />} />
              <Route path="/profile" element={<ProfileRedirect />} />
              <Route path="/u/:username" element={<UserProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/flipbook/:id" element={<FlipbookPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/news" element={<OfficialNewsPage newsItems={newsItems} isLoading={isNewsLoading} user={user} />} />
              <Route path="/events" element={<CollegeEventsPage newsItems={newsItems} isLoading={isNewsLoading} user={user} />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/otp-verify" element={<OTPVerificationPage />} />
              <Route path="/contributors" element={<ContributorsPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPage />} />

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
      </AppShell>

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
