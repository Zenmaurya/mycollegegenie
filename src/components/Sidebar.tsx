import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Search, 
  MessageSquare, 
  PlaySquare, 
  Building2, 
  Repeat, 
  Newspaper,
  Grid,
  LogIn,
  LogOut,
  X,
  User
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems: { name: string; path: string; icon: React.ElementType; count?: number }[] = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Resources', path: '/browse', icon: Grid },
    { name: 'Forum', path: '/forum', icon: MessageSquare },
    { name: 'Playlists', path: '/playlists', icon: PlaySquare },
  ];

  const campusItems = [
    { name: 'Find a PG', path: '/find-pg', icon: Building2 },
    { name: 'Exchange', path: '/exchange', icon: Repeat },
    { name: 'Events & news', path: '/news', icon: Newspaper },
  ];

  return (
    <aside className="sidebar !flex lg:!flex">
      <div className="sidebar-brand flex justify-between items-center w-full">
        <div className="flex gap-3 items-center">
          <img src="/genie_yellow.webp" alt="Genie Logo" className="w-8 h-8 object-contain drop-shadow-md" />
          <div><b>MyCollegeGenie</b><span>Campus Network</span></div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors" aria-label="Close navigation menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={onClose}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-[17px] h-[17px]" strokeWidth={2} />
              {item.name}
              {item.count && <span className="count">{item.count}</span>}
            </Link>
          );
        })}
      </div>

      <div className="nav-group-label mt-4">Campus life</div>
      <div className="flex flex-col gap-1">
        {campusItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={onClose}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-[17px] h-[17px]" strokeWidth={2} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="sidebar-foot mt-auto pt-4">
        {user ? (
          <div className="flex flex-col gap-2">
            <Link to="/profile" onClick={onClose} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-white/80 transition-colors">
              <div className="w-8 h-8 rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center shrink-0">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="text-sm font-medium truncate">{user.email}</div>
            </Link>
            <button onClick={() => { logout(); onClose?.(); }} className="nav-item text-red-300 hover:text-red-200 hover:bg-red-500/10 w-full justify-start mt-2">
              <LogOut className="w-[17px] h-[17px]" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <Link to="/profile" onClick={onClose} className="nav-item">
              <User className="w-[17px] h-[17px]" strokeWidth={2} />
              Profile
            </Link>
            <div className="border-t border-white/10 my-2"></div>
            <Link to="/login" onClick={onClose} className="signin-btn">
              <LogIn className="w-[14px] h-[14px]" />
              Sign in
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
