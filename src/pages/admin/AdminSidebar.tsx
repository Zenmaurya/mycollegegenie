import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Newspaper, 
  MessageSquare, 
  Home, 
  ShieldCheck, 
  Users, 
  ShoppingCart, 
  Youtube,
  Settings,
  MonitorPlay,
  Megaphone,
  Globe
} from 'lucide-react';


export type AdminTab = 'overview' | 'resources' | 'news' | 'forum' | 'pg' | 'exchange' | 'playlists' | 'verification' | 'testimonials' | 'users' | 'carousel' | 'ads' | 'homepage-settings' | 'contributors';

interface SidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  pendingCounts?: {
    resources?: number;
    verifications?: number;
    reports?: number;
  };
}

export const AdminSidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingCounts }) => {
  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Academic Hub',
      items: [
        { id: 'resources', label: 'Resources', icon: FileText, badge: pendingCounts?.resources },
        { id: 'playlists', label: 'Playlists', icon: Youtube }
      ]
    },
    {
      title: 'Campus Life',
      items: [
        { id: 'news', label: 'News & Events', icon: Newspaper },
        { id: 'carousel', label: 'Homepage Carousel', icon: MonitorPlay },
        { id: 'forum', label: 'Student Forums', icon: MessageSquare },
        { id: 'pg', label: 'PG Listings', icon: Home },
        { id: 'exchange', label: 'Campus Exchange', icon: ShoppingCart }
      ]
    },
    {
      title: 'CMS & Marketing',
      items: [
        { id: 'ads', label: 'Ads & Banners', icon: Megaphone },
        { id: 'homepage-settings', label: 'Homepage Settings', icon: Globe }
      ]
    },
    {
      title: 'Moderation & Users',
      items: [
        { id: 'verification', label: 'Verifications', icon: ShieldCheck, badge: pendingCounts?.verifications },
        { id: 'users', label: 'User Directory', icon: Users },
        { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
        { id: 'contributors', label: 'Contributors', icon: Users }
      ]
    }
  ];

  return (
    <div className="w-full md:w-64 bg-white/80 backdrop-blur-xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-shrink-0 h-auto md:h-[calc(100vh-5rem)] md:sticky top-20 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 mb-1">
          <Settings className="w-6 h-6 text-brand-primary" />
          Admin
        </h2>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Command Center</p>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-brand-surface to-indigo-50/50 text-brand-primary font-bold shadow-[inset_0_1px_4px_rgba(147,51,234,0.1)]' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-primary font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                      activeTab === item.id ? 'bg-brand-primary/20/50 text-brand-primary' : 'text-gray-400 group-hover:text-brand-primary group-hover:bg-brand-surface/50'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-mark text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
