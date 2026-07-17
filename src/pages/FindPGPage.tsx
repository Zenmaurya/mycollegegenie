import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { Helmet } from 'react-helmet-async';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import { getPGListings } from '../services/pgService';
import type { PGListing } from '../types';
import { PGCardSkeleton } from '../components/ui/Skeletons';

interface Props {
  user: any;
  onOpenChat?: (id: string, sellerId: string) => void;
}

export const FindPGPage: React.FC<Props> = ({ user, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [pgs, setPgs] = useState<PGListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { debouncedSearch } = useFilters();

  const filteredPgs = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return pgs;
    return pgs.filter(pg => 
      (pg.title || '').toLowerCase().includes(q) ||
      (pg.description || '').toLowerCase().includes(q) ||
      (pg.location || '').toLowerCase().includes(q) ||
      (pg.college || '').toLowerCase().includes(q) ||
      (pg.gender || '').toLowerCase().includes(q)
    );
  }, [pgs, debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    // getPGListings mimics onSnapshot and takes a callback
    const unsubscribe = getPGListings(
      (data) => {
        setPgs(data);
        setIsLoading(false);
      },
      undefined, // no specific college filter right now
      activeTab // passing activeTab (All, Male, Female) as gender filter
    );

    return () => unsubscribe();
  }, [activeTab]);

  return (
    <>
      <Helmet>
        <title>My College Genie — Find a PG</title>
      </Helmet>

      <div className="w-full">
        <div className="flex justify-end">
          <div className="seg">
            {['All', 'Male', 'Female'].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="chiprow mt-6">
          <span className="dot-tag"><span className="d" style={{background: 'var(--brand)'}}></span>Verified PGs</span>
          <span className="dot-tag"><span className="d" style={{background: 'var(--mark)'}}></span>Verified students</span>
          <span className="dot-tag"><span className="d" style={{background: 'var(--solved)'}}></span>Near college</span>
          <span className="dot-tag"><span className="d" style={{background: 'var(--open)'}}></span>Zero brokerage</span>
        </div>

        {isLoading ? (
          <div className="grid mt-5" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))'}}>
            {Array(6).fill(0).map((_, i) => <PGCardSkeleton key={i} />)}
          </div>
        ) : filteredPgs.length === 0 ? (
          <div className="mt-8 text-center text-ink-soft">No PG listings found.</div>
        ) : (
          <div className="grid mt-5" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))'}}>
            {filteredPgs.map(pg => (
              <div className="pg-card" key={pg.id}>
                <div className="pg-img" style={{ backgroundImage: pg.images?.[0] ? `url(${pg.images[0]})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!pg.images?.[0] && <ImageIcon strokeWidth={1.5} className="w-8 h-8 text-ink-faint" />}
                </div>
                <div className="pg-body">
                  <div className="price">{pg.budget ? `₹${pg.budget}` : 'Price negotiable'} <span>/ month</span></div>
                  <h4>{pg.location}</h4>
                  <div className="loc">
                    <MapPin className="w-3 h-3 text-ink-soft" /> {pg.college}
                  </div>
                  <div className="pg-tags">
                    <span className="pg-tag">{pg.gender}</span>
                    {pg.description && <span className="pg-tag line-clamp-1">{pg.description}</span>}
                  </div>
                  {user?.id !== pg.user_id && (
                    <button 
                      onClick={() => onOpenChat && onOpenChat(pg.id.toString(), pg.user_id)}
                      className="w-full mt-4 bg-[var(--brand)] text-white py-2 rounded-xl font-semibold text-[14px] hover:bg-[var(--brand-ink)] transition-colors"
                    >
                      Chat with Owner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
