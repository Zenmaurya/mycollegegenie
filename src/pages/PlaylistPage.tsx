import React, { useState } from 'react';
import { useFilters } from '../context/FilterContext';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Play, X } from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { PlaylistCardSkeleton } from '../components/ui/Skeletons';
import { AutoScrollText } from '../components/ui/AutoScrollText';

// Helper to extract YouTube video ID and playlist ID
const parseYouTubeLink = (url: string) => {
  let videoId = null;
  let playlistId = null;

  // Extract video ID
  const videoMatch = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*)/);
  if (videoMatch && videoMatch[1].length === 11) {
    videoId = videoMatch[1];
  }

  // Extract playlist ID
  const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
  if (listMatch && listMatch[1]) {
    playlistId = listMatch[1];
  }

  return { videoId, playlistId };
};

const getThumbnail = (url: string) => {
  const { videoId } = parseYouTubeLink(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
};

const getEmbedUrl = (url: string) => {
  const { videoId, playlistId } = parseYouTubeLink(url);
  if (playlistId && !videoId) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`;
  }
  if (videoId && playlistId) {
    return `https://www.youtube.com/embed/${videoId}?list=${playlistId}&autoplay=1`;
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }
  return null;
};

const getVideoCountText = (resource: any) => {
  let tagsLen = 0;
  try {
    if (resource.tags) {
      tagsLen = typeof resource.tags === 'string' ? JSON.parse(resource.tags).length : resource.tags.length;
    }
  } catch (e) {}

  if (tagsLen > 0) return `${tagsLen} video${tagsLen > 1 ? 's' : ''}`;
  
  const { playlistId } = parseYouTubeLink(resource.link);
  if (playlistId) return 'Playlist';
  return '1 video';
};

export const PlaylistPage: React.FC = () => {
  const { resources, isResourcesLoading } = useResources();
  const [activeChip, setActiveChip] = useState('All courses');
  const { debouncedSearch } = useFilters();

  const playlists = resources.filter(r => r.type === 'Playlist' && (activeChip === 'All courses' || r.course === activeChip));

  const filteredPlaylists = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return playlists;
    return playlists.filter(pl => 
      (pl.title || '').toLowerCase().includes(q) ||
      (pl.description || '').toLowerCase().includes(q) ||
      (pl.course || '').toLowerCase().includes(q) ||
      (pl.uploader || '').toLowerCase().includes(q)
    );
  }, [playlists, debouncedSearch]);

  const [playingVideo, setPlayingVideo] = useState<{ url: string; title: string } | null>(null);

  // Extract unique courses for chips
  const courses = Array.from(new Set(resources.filter(r => r.type === 'Playlist').map(r => r.course))).filter(Boolean);
  const chips = ['All courses', ...courses];

  return (
    <>
      <Helmet>
        <title>My College Genie — Playlists</title>
      </Helmet>

      <div className="w-full">
        <div className="chiprow">
          {chips.map(chip => (
            <div 
              key={chip}
              className={`chip ${activeChip === chip ? 'active' : ''}`}
              onClick={() => setActiveChip(chip)}
            >
              {chip}
            </div>
          ))}
        </div>

        <div className="grid mt-4">
          {isResourcesLoading ? (
            Array(6).fill(0).map((_, i) => <PlaylistCardSkeleton key={i} />)
          ) : filteredPlaylists.length > 0 ? (
            filteredPlaylists.map(pl => {
              const customThumb = (pl as any).imageUrl;
              const ytThumb = getThumbnail(pl.link);
              const thumbUrl = customThumb || ytThumb;
              const embedUrl = getEmbedUrl(pl.link);

              return (
                <div 
                  className="pl-card group cursor-pointer block no-underline text-inherit" 
                  key={pl.id}
                  onClick={() => {
                    if (embedUrl) {
                      setPlayingVideo({ url: embedUrl, title: pl.title });
                    } else {
                      window.open(pl.link, '_blank');
                    }
                  }}
                >
                  <div className="pl-thumb relative overflow-hidden" style={thumbUrl ? { backgroundImage: `url(${thumbUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <Play fill="currentColor" className="w-[30px] h-[30px] text-white/85 group-hover:scale-110 transition-transform relative z-10" />
                    <span className="count-badge relative z-10 bg-black/80 px-2 py-1 rounded text-white text-xs">{getVideoCountText(pl)}</span>
                  </div>
                  <div className="pl-body">
                    <AutoScrollText className="sub text-[11px] uppercase tracking-widest text-ink-faint font-mono mb-[5px]">{pl.course}</AutoScrollText>
                    <AutoScrollText className="group-hover:text-brand transition-colors text-[14px] font-semibold leading-[1.35] mb-[8px]">{pl.title}</AutoScrollText>
                    <div className="row">
                      <span>{pl.uploader || 'Curated'}</span>
                      <span>↻ {new Date(pl.uploadTimestamp || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-ink-soft">
              No playlists found for this filter.
            </div>
          )}
        </div>
      </div>

      {playingVideo && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col relative" style={{ height: '80vh', maxHeight: '800px', backgroundColor: '#000000' }}>
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 opacity-0 hover:opacity-100 transition-opacity">
              <h3 className="text-white font-medium truncate drop-shadow-md pr-12">{playingVideo.title}</h3>
            </div>
            
            {/* Dedicated close button outside the hover zone for mobile/accessibility */}
            <button 
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 p-2 rounded-full backdrop-blur-md bg-black/40 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <iframe 
              src={playingVideo.url} 
              className="w-full h-full flex-1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
              frameBorder="0"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
