import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFilters } from '../context/FilterContext';
import { Search, PenSquare, Menu, Plus, MessageSquare } from 'lucide-react';
import { EventRequestModal } from './EventRequestModal';

interface TopbarProps {
  onMenuClick: () => void;
  onInboxClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onInboxClick }) => {
  const { searchQuery, setSearchQuery } = useFilters();
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const location = useLocation();

  let buttonLabel = 'Ask';
  let searchPlaceholder = 'Search problems, notes, subject code…';
  let ButtonIcon = PenSquare;
  let showButton = true;
  let showSearch = true;

  let modalTitle = 'Publish Your Event';
  let modalSubTitle = 'Reach the entire Student Community';
  let modalSignInText = 'You must be signed in to submit an event request.';

  const staticPages = ['/terms', '/privacy', '/contact', '/about', '/contributors', '/profile', '/admin'];
  const isStaticPage = staticPages.some(p => location.pathname.startsWith(p));

  if (location.pathname === '/' || isStaticPage) {
    showButton = false;
  }
  
  if (isStaticPage) {
    showSearch = false;
  } else if (location.pathname.startsWith('/playlists')) {
    buttonLabel = 'Add playlist';
    searchPlaceholder = 'Search playlists, topics, courses…';
    ButtonIcon = Plus;
    modalTitle = 'Add a Playlist';
    modalSubTitle = 'Share curated learning resources';
    modalSignInText = 'Sign in to add a playlist.';
  } else if (location.pathname.startsWith('/find-pg')) {
    buttonLabel = 'Post listing';
    searchPlaceholder = 'Search by college or location…';
    ButtonIcon = Plus;
    modalTitle = 'Post a Listing';
    modalSubTitle = 'Find a roommate or PG';
    modalSignInText = 'Sign in to post a PG listing.';
  } else if (location.pathname.startsWith('/campus-exchange') || location.pathname.startsWith('/exchange')) {
    buttonLabel = 'Post your ad';
    searchPlaceholder = 'Search for books, gadgets, furniture…';
    ButtonIcon = Plus;
    modalTitle = 'Post an Ad';
    modalSubTitle = 'Sell, exchange, or donate';
    modalSignInText = 'Sign in to post an ad on the exchange.';
  } else if (location.pathname.startsWith('/browse') || location.pathname === '/browse') {
    buttonLabel = 'Contribute';
    searchPlaceholder = 'Search resources, notes…';
    ButtonIcon = Plus;
    modalTitle = 'Contribute Resource';
    modalSubTitle = 'Share notes and papers';
    modalSignInText = 'Sign in to contribute resources.';
  } else if (location.pathname.startsWith('/news')) {
    buttonLabel = 'Post news';
    searchPlaceholder = 'Search news, college, keywords…';
    ButtonIcon = Plus;
    modalTitle = 'Post News';
    modalSubTitle = 'Share updates with the college';
    modalSignInText = 'Sign in to post news updates.';
  } else if (location.pathname.startsWith('/events')) {
    buttonLabel = 'Post event';
    searchPlaceholder = 'Search events, college, dates…';
    ButtonIcon = Plus;
  } else if (location.pathname.startsWith('/forum')) {
    buttonLabel = 'Ask';
    modalTitle = 'Ask a Question';
    modalSubTitle = 'Get help from fellow students';
    modalSignInText = 'Sign in to ask a question.';
  }

  // Save search query to history in localStorage
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    
    const handler = setTimeout(() => {
      try {
        const query = searchQuery.trim().toLowerCase();
        const stored = localStorage.getItem('mcg_recent_searches');
        let searches: string[] = stored ? JSON.parse(stored) : [];
        
        // Remove if exists to push to front
        searches = searches.filter(s => s !== query);
        // Add to front
        searches.unshift(query);
        // Limit to 5
        searches = searches.slice(0, 5);
        
        localStorage.setItem('mcg_recent_searches', JSON.stringify(searches));
      } catch (e) {
        console.error(e);
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <>
      <div className="topbar">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-ink hover:text-ink-soft transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {showSearch && (
          <div className="search">
            <Search className="w-[15px] h-[15px] text-ink-faint" />
            <input 
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search problems, notes, and resources"
            />
            <span className="kbd hidden sm:inline-block">⌘K</span>
          </div>
        )}
        
        <div className="topbar-right flex items-center gap-3">
          {onInboxClick && (
            <button onClick={onInboxClick} className="text-ink-faint hover:text-ink transition-colors p-2" aria-label="Open inbox messages">
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
          {showButton && (
            <button onClick={() => setIsAskModalOpen(true)} className="btn btn-primary hidden sm:flex">
              <ButtonIcon className="w-[14px] h-[14px]" />
              {buttonLabel}
            </button>
          )}
        </div>
      </div>

      <EventRequestModal 
        isOpen={isAskModalOpen} 
        onClose={() => setIsAskModalOpen(false)} 
        title={modalTitle}
        subTitle={modalSubTitle}
        signInText={modalSignInText}
      />
    </>
  );
};
