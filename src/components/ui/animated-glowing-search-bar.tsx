import React from 'react';
import { Search } from 'lucide-react';
import { isImeKeyEvent } from '../../lib/security';

interface AnimatedGlowingSearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClear?: boolean;
}

const AnimatedGlowingSearchBar = React.forwardRef<HTMLInputElement, AnimatedGlowingSearchBarProps>(
  ({ className, onClear, showClear, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Astryx IME composition guard: prevent keydown command firing mid-composition
      if (isImeKeyEvent(e.nativeEvent)) return;

      if (e.key === 'Escape' && showClear && onClear) {
        e.preventDefault();
        onClear();
      }

      onKeyDown?.(e);
    };

    return (
      <div className="relative flex items-center justify-center w-full">
        <div id="poda" className="relative flex items-center justify-center group w-full">
          <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-2xl pointer-events-none" />

          <div id="main" className="relative group w-full h-full flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-purple-600 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
            </div>
            <input 
              ref={ref} 
              type="search"
              role="searchbox"
              aria-label={props['aria-label'] || "Search study material, PYQs, and college resources"}
              onKeyDown={handleKeyDown}
              {...props} 
              className={`block w-full pl-10 sm:pl-14 pr-10 sm:pr-12 py-3 sm:py-4 bg-transparent border-none rounded-2xl text-base text-gray-900 placeholder-gray-400 focus:outline-none transition-all font-medium ${className || ''}`} 
            />
            <div id="input-mask" className="pointer-events-none w-[100px] h-[20px] absolute bg-gradient-to-r from-transparent to-gray-50 top-1/2 -translate-y-1/2 right-[70px] group-focus-within:hidden" />
            
            {/* Right side controls: Clear & Keyboard shortcut */}
            <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-3">
              {showClear && onClear && (
                <button 
                  type="button"
                  onClick={onClear}
                  aria-label="Clear search input"
                  title="Clear search"
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
              
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-200/50 rounded-lg border border-gray-200 z-20 pointer-events-none">
                <span className="text-[10px] font-bold text-gray-500 tracking-tighter">⌘K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AnimatedGlowingSearchBar.displayName = 'AnimatedGlowingSearchBar';

export default AnimatedGlowingSearchBar;
