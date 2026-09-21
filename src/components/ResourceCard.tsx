import React from 'react';
import { motion } from 'motion/react';
import { FileText, Clock, BookOpen, Youtube, Star, Share2, ChevronRight, Download, Bookmark, User, Eye, MessageCircle, Lightbulb, GraduationCap, BadgeCheck } from 'lucide-react';
import { Resource } from '../types';
import { useNavigate } from 'react-router-dom';

interface ResourceCardProps {
  resource: Resource;
  viewMode?: 'grid' | 'list';
  onClick: (resource: Resource) => void;
  onShare: (resource: Resource) => void;
  onSave: (id: string) => void;
  isSaved: boolean;
  getAverageRating: (ratings?: number[]) => number;
}

const getYouTubeThumbnail = (url?: string) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const videoId = u.searchParams.get('v');
    if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (u.hostname === 'youtu.be') {
      const vid = u.pathname.replace(/^\//, '');
      if (vid) return `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    }
    const embedMatch = u.pathname.match(/\/embed\/([^/?#]+)/);
    if (embedMatch) return `https://i.ytimg.com/vi/${embedMatch[1]}/hqdefault.jpg`;
  } catch {
    const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
    if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return null;
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  viewMode = 'grid',
  onClick,
  onShare,
  onSave,
  isSaved,
  getAverageRating
}) => {
  const navigate = useNavigate();

  const typeConfig: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    Note:     { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100', iconBg: 'bg-violet-100' },
    PYQ:      { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-100',   iconBg: 'bg-pink-100' },
    Book:     { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',  iconBg: 'bg-amber-100' },
    Playlist: { bg: 'bg-red-50',     text: 'text-red-500',     border: 'border-red-100',    iconBg: 'bg-red-100' },
  };

  const cfg = typeConfig[resource.type] ?? typeConfig.Note;

  const TypeIcon = {
    Note: FileText,
    PYQ: Clock,
    Book: BookOpen,
    Playlist: Youtube,
  }[resource.type] ?? FileText;

  const isSyllabus = resource.subCategory === 'Syllabus';
  const rating = getAverageRating(resource.ratings);
  const canDownload = !(resource.type === 'Note' || resource.type === 'PYQ') && (isSyllabus || resource.directDownloadLink);


  const handleTabClick = (e: React.MouseEvent, tab: 'comments' | 'tips') => {
    e.stopPropagation();
    onClick(resource);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openResourceTab', { detail: tab }));
    }, 20);
  };

  const youtubeThumbnail = resource.type === 'Playlist' ? getYouTubeThumbnail(resource.link) : null;

  /* ─────────────── LIST VIEW ─────────────── */
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4, boxShadow: '0 8px 30px -8px rgba(139,92,246,0.12)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center gap-4 cursor-pointer group hover:border-purple-100 transition-all"
        onClick={() => onClick(resource)}
      >
        {/* Icon or Thumbnail */}
        {youtubeThumbnail ? (
          <div className="w-16 h-11 rounded-xl overflow-hidden shrink-0 relative border border-gray-100 group-hover:border-purple-200 transition-colors shadow-sm">
            <img src={youtubeThumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
              <Youtube className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.border} border group-hover:scale-105 transition-transform`}>
            <TypeIcon className={`w-5 h-5 ${cfg.text}`} />
          </div>
        )}

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Title */}
          <h3 className="font-bold text-sm text-gray-900 truncate group-hover:text-purple-600 transition-colors mb-1">
            {resource.title}
          </h3>
          {/* Row 2: Sem · Course · Uploader */}
          <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
            <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
              Sem {resource.semester}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
            <span className="text-[11px] font-medium text-gray-500 truncate min-w-0">
              {resource.course}{resource.subjectCode && ` (${resource.subjectCode})`}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0 hidden sm:block" />
            <span className="text-[11px] font-medium text-gray-400 truncate min-w-0 hidden sm:block">
              {resource.uploader}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button onClick={(e) => handleTabClick(e, 'comments')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-[11px] font-bold border border-gray-100 transition-colors"><MessageCircle className="w-3.5 h-3.5" />Comments
          </button>
          <button onClick={(e) => handleTabClick(e, 'tips')}
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600 rounded-lg text-[11px] font-bold border border-gray-100 transition-colors"><Lightbulb className="w-3.5 h-3.5" />Tips
          </button>
        </div>

        {/* Rating */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100 shrink-0">
          <Star className="w-3 h-3 text-amber-500 fill-current" />
          <span className="text-[11px] font-bold text-amber-600">{rating.toFixed(1)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 border-l border-gray-100 pl-3">
          {canDownload && (
            <button onClick={(e) => { e.stopPropagation(); window.open(resource.directDownloadLink || resource.link, '_blank'); }}
              className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all hover:scale-105" title="Download" aria-label={`Download ${resource.title}`}>
              <Download className="w-4 h-4" />
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); onSave(resource.id); }}
            className={`p-2 rounded-xl transition-all hover:scale-105 ${isSaved ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:bg-gray-50'}`}
            aria-label={isSaved ? 'Remove from saved' : 'Save resource'}>
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <div className="p-2 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all group-hover:-rotate-45 hidden sm:flex">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    );
  }

  /* ─────────────── GRID VIEW ─────────────── */
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 24px 48px -12px rgba(139,92,246,0.18)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="bg-white border border-gray-100 hover:border-purple-200/80 rounded-3xl flex flex-col cursor-pointer group transition-all duration-300 overflow-hidden h-full shadow-sm hover:shadow-[0_16px_36px_-10px_rgba(139,92,246,0.14)]"
      onClick={() => onClick(resource)}
    >
      {/* ── Thumbnail (only for Playlist with valid YouTube link) ── */}
      {youtubeThumbnail && (
        <div className="w-full aspect-video bg-gray-100 overflow-hidden relative shrink-0">
          <img
            src={youtubeThumbnail}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 shadow-xl">
            <Youtube className="w-3.5 h-3.5 text-red-500" /> Playlist
          </div>
        </div>
      )}

      {/* ── Zone 1: Header (type badge + rating + save) ── */}
      <div className={`flex items-center justify-between px-4 sm:px-5 ${youtubeThumbnail ? 'pt-3.5 sm:pt-4' : 'pt-4 sm:pt-5'} pb-0 shrink-0`}>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <TypeIcon className="w-3 h-3" />
          {resource.type}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="text-[10px] font-bold text-amber-600">{rating.toFixed(1)}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onSave(resource.id); }}
            className={`p-1.5 rounded-full border transition-all hover:scale-110 ${isSaved ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
            aria-label={isSaved ? 'Remove from saved' : 'Save resource'}>
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Zone 2: Title — clamps to 2 lines, min-height ensures uniform card height ── */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-0 shrink-0">
        <h3
          className="font-extrabold text-base text-gray-900 group-hover:text-purple-700 transition-colors duration-300 leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.75rem' }}
        >
          {resource.title}
        </h3>
      </div>

      {/* ── Zone 3: Metadata — Sem pill + Course truncated — always one line ── */}
      <div className="px-4 sm:px-5 pt-2.5 sm:pt-3 pb-0 flex items-center gap-2 min-w-0 shrink-0">
        <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
          Sem {resource.semester}
        </span>
        <span className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
        <span className="text-[11px] font-semibold text-gray-500 truncate min-w-0">
          {resource.course}{resource.subjectCode && ` (${resource.subjectCode})`}
        </span>
        {canDownload && (
          <button onClick={(e) => { e.stopPropagation(); window.open(resource.directDownloadLink || resource.link, '_blank'); }}
            className="ml-auto shrink-0 p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-100 transition-all hover:scale-105"
            title="Download" aria-label={`Download ${resource.title}`}>
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Spacer: fills remaining space so footer always lands at bottom ── */}
      <div className="flex-grow" />

      {/* ── Zone 4: Action buttons ── */}
      <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 sm:pt-4 pb-0 flex-wrap shrink-0">
        <button onClick={(e) => handleTabClick(e, 'comments')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-bold border border-gray-100 hover:border-blue-200 transition-colors shrink-0">
          <MessageCircle className="w-3.5 h-3.5" />
          Comments
        </button>
        <button onClick={(e) => handleTabClick(e, 'tips')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-600 rounded-xl text-xs font-bold border border-gray-100 hover:border-amber-200 transition-colors shrink-0">
          <Lightbulb className="w-3.5 h-3.5" />
          Tips
        </button>

      </div>

      {/* ── Zone 5: Footer — uploader + share + arrow — always at bottom ── */}
      <div className="flex items-center justify-between mx-4 sm:mx-5 mt-3.5 sm:mt-4 pb-3.5 sm:pb-4 pt-3.5 sm:pt-4 border-t border-gray-100 shrink-0">
        {/* Uploader */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${resource.uploaderRole === 'faculty' ? 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-200' : 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-100'}`}>
            {resource.uploaderRole === 'faculty' ? <GraduationCap className="w-3.5 h-3.5 text-amber-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">{resource.uploaderRole === 'faculty' ? 'Faculty Member' : 'Shared by'}</p>
            <p className={`text-xs font-bold truncate max-w-[110px] leading-none flex items-center gap-1 ${resource.uploaderRole === 'faculty' ? 'text-amber-600' : 'text-gray-800'}`}>
              {resource.uploader} {resource.uploaderRole === 'faculty' && <BadgeCheck className="w-3 h-3 text-amber-500 shrink-0" />}
            </p>
          </div>
        </div>

        {/* Share + Arrow */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onShare(resource); }}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
            aria-label={`Share ${resource.title}`}>
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-600 group-hover:text-white border border-gray-100 group-hover:border-purple-600 transition-all group-hover:-rotate-45 shadow-sm">
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
