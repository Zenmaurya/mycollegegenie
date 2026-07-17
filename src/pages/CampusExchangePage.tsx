import React, { useState, useEffect } from 'react';
import { useFilters } from '../context/FilterContext';
import { Helmet } from 'react-helmet-async';

import { fetchExchangeItems } from '../services/exchangeService';
import type { ExchangeItem } from '../services/exchangeService';
import { BookOpen, Laptop, Armchair, Bike, Package } from 'lucide-react';
import { ExchangeCardSkeleton } from '../components/ui/Skeletons';

export function CampusExchangePage({ user, onOpenChat }: { user: any, onOpenChat?: (id: string, sellerId: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('All categories');
  const [items, setItems] = useState<ExchangeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { debouncedSearch } = useFilters();

  const filteredItems = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item => 
      (item.title || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.type || '').toLowerCase().includes(q) ||
      (item.price ? String(item.price) : '').includes(q)
    );
  }, [items, debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    fetchExchangeItems({ type: activeCategory })
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activeCategory]);

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'books': return <BookOpen strokeWidth={1.5} className="w-6 h-6 text-ink-faint" />;
      case 'electronics': return <Laptop strokeWidth={1.5} className="w-6 h-6 text-ink-faint" />;
      case 'furniture': return <Armchair strokeWidth={1.5} className="w-6 h-6 text-ink-faint" />;
      case 'cycles': return <Bike strokeWidth={1.5} className="w-6 h-6 text-ink-faint" />;
      default: return <Package strokeWidth={1.5} className="w-6 h-6 text-ink-faint" />;
    }
  };

  return (
    <div className="content" style={{ maxWidth: '100%' }}>
      <Helmet>
        <title>Campus Exchange | MyCollegeGenie</title>
      </Helmet>

      <div className="chiprow">
        <span className="dot-tag"><span className="d" style={{ background: 'var(--brand)' }}></span>Trusted students</span>
        <span className="dot-tag"><span className="d" style={{ background: 'var(--solved)' }}></span>Secure & safe</span>
        <span className="dot-tag"><span className="d" style={{ background: 'var(--mark)' }}></span>On-campus deals</span>
        <span className="dot-tag"><span className="d" style={{ background: 'var(--open)' }}></span>Easy & quick</span>
      </div>

      <div className="chiprow" style={{ marginTop: 10 }}>
        {['All categories', 'Books', 'Electronics', 'Furniture', 'Cycles'].map(cat => (
          <div 
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* DYNAMIC DATA */}
      {isLoading ? (
        <div className="grid" style={{ marginTop: 18, gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>
          <div className="post-ad">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div>
              <h4>Got something to sell?</h4>
              <p>Post your ad and reach students on your campus directly — no fees.</p>
            </div>
          </div>
          {Array(6).fill(0).map((_, i) => <ExchangeCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 18, gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>

          <div className="post-ad">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div>
              <h4>Got something to sell?</h4>
              <p>Post your ad and reach students on your campus directly — no fees.</p>
            </div>
          </div>

          {filteredItems.map(item => (
            <div className="x-card" key={item.id}>
              <div className="x-img" style={{ backgroundImage: item.image_url ? `url(${item.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <span className="x-kind">{item.type || item.category || 'Item'}</span>
                {!item.image_url && getCategoryIcon(item.type || item.category)}
              </div>
              <div className="x-body">
                <div className={`x-price ${item.price === 0 ? 'free' : ''}`}>
                  {item.price === 0 ? 'Free' : `₹${item.price}`}
                </div>
                <h4>{item.title}</h4>
                <div className="x-row">
                  <span className="truncate">{item.seller_name || 'Anonymous'}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {user?.id !== item.user_id && (
                  <button 
                    onClick={() => onOpenChat && onOpenChat(item.id.toString(), item.user_id)}
                    className="w-full mt-3 bg-[var(--brand)] text-white py-1.5 rounded-full font-semibold text-[13px] hover:bg-[var(--brand-ink)] transition-colors"
                  >
                    Chat with Seller
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
