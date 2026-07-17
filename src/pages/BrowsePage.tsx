import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Filter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useResources } from '../context/ResourceContext';
import { useFilters } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { ResourceCardSkeleton } from '../components/ui/Skeletons';
import { AutoScrollText } from '../components/ui/AutoScrollText';
import type { Resource } from '../types';

interface BrowsePageProps {
  getAverageRating: (ratings?: number[]) => number;
  selectedResource?: Resource | null;
  setSelectedResource: (resource: Resource | null) => void;
  handleShare: (resource: Resource) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  user?: any;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  getAverageRating,
  setSelectedResource,
}) => {
  const { user } = useAuth();
  const { resources, isResourcesLoading } = useResources();
  const {
    debouncedSearch,
    activeFilter, setActiveFilter,
  } = useFilters();

  const [searchParams, setSearchParams] = useSearchParams();

  // Handle URL resourceId param
  React.useEffect(() => {
    const resourceId = searchParams.get('resourceId');
    if (resourceId && resources.length > 0) {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        setSelectedResource(resource);
      }
    }
  }, [searchParams, resources, setSelectedResource]);

  const handleOpenResource = (resource: Resource) => {
    setSelectedResource(resource);
    setTimeout(() => {
      setSearchParams({ resourceId: resource.id }, { replace: true });
    }, 10);
  };

  const filteredResources = useMemo(() => {
    const filtered = resources.filter(resource => {
      if (resource.type === 'Playlist') return false;
      const isVisible = resource.isApproved || (user && resource.uploaderId === user.id);
      if (!isVisible) return false;
      
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = !q || 
        resource.title.toLowerCase().includes(q) || 
        resource.course.toLowerCase().includes(q) ||
        ((resource as any).subjectCode || '').toLowerCase().includes(q);

      const typeFilter = activeFilter === 'All' ? 'All' : 
                         activeFilter === 'Notes' ? 'Note' : 
                         activeFilter === 'PYQ papers' ? 'PYQ' : 
                         activeFilter === 'Reference' ? 'Book' : 'All';

      const matchesType = typeFilter === 'All' || resource.type === typeFilter;
      
      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => (b.uploadTimestamp || 0) - (a.uploadTimestamp || 0));
  }, [debouncedSearch, activeFilter, resources, user]);

  return (
    <>
      <Helmet>
        <title>Browse notes & papers | My College Genie</title>
      </Helmet>
      
      {/* We apply a full width since .content natively expands now */}
      <div className="w-full">

        <div className="chiprow">
          {['All', 'Notes', 'PYQ papers', 'Reference'].map(filter => (
            <div 
              key={filter} 
              className={`chip ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'All' ? 'All formats' : filter}
            </div>
          ))}
          <div className="chip cursor-not-allowed opacity-50 ml-auto">
            <Filter className="w-[13px] h-[13px]" />
            Filters
          </div>
        </div>

        <div className="grid mt-4">
          {isResourcesLoading ? (
            Array(6).fill(0).map((_, i) => <ResourceCardSkeleton key={i} />)
          ) : filteredResources.length > 0 ? (
            filteredResources.map(resource => {
              const fileType = resource.fileUrl?.split('.').pop()?.toUpperCase() || 'PDF';
              const rType = resource.type === 'Note' ? 'Notes' : resource.type === 'Book' ? 'Reference' : resource.type;
              
              return (
                <div 
                  key={resource.id} 
                  className="rescard cursor-pointer hover:border-brand transition-colors"
                  onClick={() => handleOpenResource(resource)}
                >
                  <AutoScrollText className="kind text-[10.5px] font-bold text-brand uppercase tracking-wider">{fileType} · {rType}</AutoScrollText>
                  <AutoScrollText className="text-[15px] font-bold leading-[1.3] my-[8px]">{resource.title}</AutoScrollText>
                  <AutoScrollText className="sub text-[12.5px] text-ink-soft mb-[14px]">{(resource as any).subjectCode || 'GEN'} · {resource.course}</AutoScrollText>
                  <div className="row">
                    <span>by {resource.uploaderName}</span>
                    <span className="flex items-center gap-1">↓ {Math.floor(Math.random() * 500) + 10}</span>
                  </div>
                </div>
              );
            })
          ) : (
              <div className="col-span-full py-12 text-center text-ink-soft">
                No resources found. Be the first to upload one!
              </div>
          )}
        </div>
      </div>
    </>
  );
};
