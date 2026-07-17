import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronUp, ChevronDown, MessageSquare, Clock, ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NewsItem } from '../types';
import { College_COURSES } from '../constants';
import { FeedService, FeedItem } from '../services/feedService';
import { ForumPostSkeleton } from '../components/ui/Skeletons';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  newsItems: NewsItem[];
  isNewsLoading: boolean;
  resources: any[];
}

export const HomePage: React.FC<HomePageProps> = ({ newsItems, resources = [] }) => {
  const [activeTab, setActiveTab] = useState<'foryou' | 'trending' | 'recent'>('foryou');
  const [activeChip, setActiveChip] = useState('All');

  // Filter events for the "Upcoming" rail card
  const upcomingEvents = newsItems
    .filter(item => item.category === 'Event' || item.category === 'Deadline')
    .slice(0, 3);

  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { appUser } = useAuth();

  // Dynamic Course Counts mapping
  const courseCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    feedItems.forEach(item => {
      if (item.course) {
        counts[item.course] = (counts[item.course] || 0) + 1;
      }
    });
    return counts;
  }, [feedItems]);

  const activeCourses = React.useMemo(() => {
    const list = new Set(['B.A. Economics', 'B.A. English', 'B.A. Hindi', 'B.A. Geography']);
    if (appUser?.course) {
      list.add(appUser.course);
    }
    return Array.from(list);
  }, [appUser]);

  // Statistics for "This Week"
  const problemsPostedCount = React.useMemo(() => {
    return feedItems.filter(item => item.feedType === 'forum_post').length;
  }, [feedItems]);

  const markedSolvedCount = React.useMemo(() => {
    return feedItems.filter(item => item.feedType === 'forum_post' && (item.comment_count || 0) > 0).length;
  }, [feedItems]);

  const notesUploadedCount = React.useMemo(() => {
    return resources.length;
  }, [resources]);

  useEffect(() => {
    setIsLoading(true);
    let searches: string[] = [];
    try {
      const stored = localStorage.getItem('mcg_recent_searches');
      if (stored) {
        searches = JSON.parse(stored);
      }
    } catch (e) {
      console.error('[HomePage] failed to load search history:', e);
    }

    FeedService.getForYouFeed(activeTab, searches).then(items => {
      setFeedItems(items);
      setIsLoading(false);
    });
  }, [activeTab]);

  const handleInteract = (item: FeedItem, type: 'view' | 'click') => {
    FeedService.interact(item.feedType, item.id, type);
    if (type === 'click') {
      if (item.feedType === 'forum_post') navigate(`/forum/${item.id}`);
      else if (item.feedType === 'event') navigate(`/events?event=${encodeURIComponent(item.title)}`);
      else navigate(`/news?news=${encodeURIComponent(item.title)}`);
    }
  };

  const filteredFeed = feedItems.filter(item => {
    if (activeChip === 'All') return true;
    return item.course === activeChip;
  });

  return (
    <>
      <Helmet>
        <title>My College Genie — Home</title>
      </Helmet>
 
      <div className="layout-2col">
        {/* FEED */}
        <div>
 
          <div className="tabs">
            {[
              { id: 'foryou', label: 'For You' },
              { id: 'trending', label: 'Trending' },
              { id: 'recent', label: 'Recent' }
            ].map(tab => (
              <div 
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          <div className="chiprow">
            {['All', 'B.A. Economics', 'B.A. English', 'B.A. Hindi', 'B.A. Geography'].map(chip => (
              <div 
                key={chip}
                className={`chip ${activeChip === chip ? 'active' : ''}`}
                onClick={() => setActiveChip(chip)}
              >
                {chip}
              </div>
            ))}
          </div>

          {/* unified feed */}
          <div className="mt-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="mb-4"><ForumPostSkeleton /></div>)
            ) : filteredFeed.length === 0 ? (
              <div className="text-center text-ink-soft py-8">No posts found.</div>
            ) : (
              filteredFeed.map(item => {
                const timeString = new Date(item.created_at || item.date || Date.now()).toLocaleDateString();

                if (item.feedType === 'forum_post') {
                  const score = (item.upvotes?.length || 0) - (item.downvotes?.length || 0);
                  const authorInitials = item.author_name?.substring(0, 2).toUpperCase() || 'AN';
                  return (
                    <div key={item.id} className="qcard cursor-pointer hover:border-brand" onClick={() => handleInteract(item, 'click')} onMouseEnter={() => handleInteract(item, 'view')}>
                      <div className="vote">
                        <button><ChevronUp strokeWidth={2.5} /></button>
                        <span className="n">{score}</span>
                        <button><ChevronDown strokeWidth={2.5} /></button>
                      </div>
                      <div className="qcard-body">
                        <div className="qcard-top">
                          <span className="subj-tag">{item.course || item.topic}</span>
                          <span className={`stamp ${(item.comment_count || 0) > 0 ? 'solved' : 'open'}`}>
                            {(item.comment_count || 0) > 0 ? 'Answered' : 'Open'}
                          </span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="snippet line-clamp-2">{item.content}</p>
                        <div className="qcard-meta">
                          <span className="item">
                            <span className="avatar">{authorInitials}</span> 
                            {item.author_name || 'Anonymous'}
                          </span>
                          <span className="item">
                            <MessageSquare className="w-[13px] h-[13px]" /> 
                            {item.comment_count || 0} answers
                          </span>
                          <span className="item">
                            <Clock className="w-[13px] h-[13px]" /> 
                            {timeString}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // News or Event
                  return (
                    <div key={item.id} className="qcard cursor-pointer hover:border-mark-ink" style={{ paddingLeft: '1rem' }} onClick={() => handleInteract(item, 'click')} onMouseEnter={() => handleInteract(item, 'view')}>
                      <div className="qcard-body">
                        <div className="qcard-top">
                          <span className="subj-tag bg-mark-soft text-mark-ink border border-mark-soft">{item.feedType === 'event' ? 'Event' : 'News'}</span>
                          {item.college && <span className="stamp open">{item.college}</span>}
                        </div>
                        <h3>{item.title}</h3>
                        <p className="snippet line-clamp-2">{item.summary}</p>
                        <div className="qcard-meta">
                          <span className="item">
                            <Clock className="w-[13px] h-[13px]" /> 
                            {item.date || timeString}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* RIGHT RAIL */}
        <div className="hidden lg:block">
          <div className="rail-card">
            <h4>Your courses</h4>
            <ul className="rail-list font-sans">
              {activeCourses.map(course => {
                const count = courseCounts[course] || 0;
                return (
                  <li key={course} className="flex justify-between items-center text-sm">
                    <span className="truncate flex-1 pr-2">{course}</span>
                    <b className={count > 0 ? 'text-[var(--brand)]' : 'text-gray-400'}>
                      {count > 0 ? `${count} new` : '—'}
                    </b>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="rail-card">
            <h4>This week</h4>
            <ul className="rail-list font-sans">
              <li className="flex justify-between items-center text-sm">
                <span>Problems posted</span>
                <b>{problemsPostedCount}</b>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span>Marked solved</span>
                <b>{markedSolvedCount}</b>
              </li>
              <li className="flex justify-between items-center text-sm">
                <span>Notes uploaded</span>
                <b>{notesUploadedCount}</b>
              </li>
            </ul>
          </div>
          
          <div className="rail-card">
            <h4 className="flex justify-between items-center">
              Upcoming
              <Link to="/news" className="text-brand hover:text-brand-ink" aria-label="View all news and events"><ArrowUpRight className="w-4 h-4" /></Link>
            </h4>
            <ul className="rail-list font-sans">
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                const eventDate = event.date ? new Date(event.date) : new Date(event.createdAt);
                const formattedDate = isNaN(eventDate.getTime()) ? 'Soon' : eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <li key={event.id} className="flex-col !items-start !gap-1 text-sm">
                    <span className="line-clamp-2">{event.title}</span>
                    <b className="text-[10px] uppercase text-[var(--brand)]">{formattedDate}</b>
                  </li>
                );
              }) : (
                <li>Annual Cultural Fest <b>Jul 4</b></li>
              )}
              {upcomingEvents.length === 0 && (
                <li>Eco Society Workshop <b>Jul 9</b></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
