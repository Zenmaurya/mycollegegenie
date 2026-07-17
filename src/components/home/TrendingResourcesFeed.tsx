import React from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResourceCard } from '../ResourceCard';
import { Resource } from '../../types';

interface TrendingResourcesFeedProps {
  resources: Resource[];
  savedResourceIds: string[];
  onSave: (id: string) => void;
  getAverageRating: (ratings?: number[]) => number;
  setSelectedResource: (resource: Resource) => void;
  handleShare: (resource: Resource) => void;
  resultsRef?: React.RefObject<HTMLElement>;
}

export function TrendingResourcesFeed({
  resources,
  savedResourceIds,
  onSave,
  getAverageRating,
  setSelectedResource,
  handleShare,
  resultsRef
}: TrendingResourcesFeedProps) {
  return (
    <section ref={resultsRef} id="resources" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-[3rem] mb-8 sm:mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-10 px-2 sm:px-6 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] sm:rounded-[1.5rem] bg-orange-100 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">Trending Resources</h2>
            <p className="text-[10px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest">Most helpful study materials</p>
          </div>
        </div>
        <Link 
          to="/browse"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] sm:text-xs font-bold text-brand-primary hover:bg-brand-surface transition-all uppercase tracking-widest shadow-sm w-full sm:w-auto"
        >
          Explore All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-2 sm:px-6">
        {resources.filter(r => r.isApproved !== false).slice(0, 4).map((resource) => (
          <ResourceCard 
            key={resource.id}
            resource={resource}
            onClick={setSelectedResource}
            onShare={handleShare}
            onSave={onSave}
            isSaved={savedResourceIds.includes(resource.id)}
            getAverageRating={getAverageRating}
          />
        ))}
      </div>
    </section>
  );
}
