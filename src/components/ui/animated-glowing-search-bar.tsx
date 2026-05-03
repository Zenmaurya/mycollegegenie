import React from 'react';
import { Search, Filter } from 'lucide-react';

interface AnimatedGlowingSearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClear?: boolean;
}

const AnimatedGlowingSearchBar = React.forwardRef<HTMLInputElement, AnimatedGlowingSearchBarProps>(
  ({ className, onClear, showClear, ...props }, ref) => {
  return (
    <div className="relative flex items-center justify-center w-full">
      <div id="poda" className="relative flex items-center justify-center group w-full">
        {/* Glow layers - Removed background glows as requested to only keep side effect */}
        <div className="absolute z-[-1] overflow-hidden h-full w-full rounded-2xl pointer-events-none">
        </div>

        <div id="main" className="relative group w-full h-full flex items-center bg-gray-50 rounded-2xl border border-gray-200">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none z-10">
            <Search className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
          </div>
          <input 
            ref={ref} 
            {...props} 
            className={`block w-full pl-10 sm:pl-14 pr-10 sm:pr-12 py-3 sm:py-4 bg-transparent border-none rounded-2xl text-sm sm:text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all font-medium ${className || ''}`} 
          />
          <div id="input-mask" className="pointer-events-none w-[100px] h-[20px] absolute bg-gradient-to-r from-transparent to-gray-50 top-1/2 -translate-y-1/2 right-[70px] group-focus-within:hidden"></div>
          
          {/* Glowing element ONLY on the right-side icon side */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            {showClear && onClear && (
              <button 
                type="button"
                onClick={onClear}
                className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-colors z-20"
              >
                <Filter className="hidden" /> {/* Temp hidden to avoid import issues but use standard lucide search logic  */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
            
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-200/50 rounded-lg border border-gray-200 z-20">
              <span className="text-[10px] font-bold text-gray-500 tracking-tighter">⌘K</span>
            </div>

            <div className="relative flex items-center group/filter z-20 ml-1">
              <div id="pink-mask" className="pointer-events-none w-[30px] h-[20px] absolute bg-[#cf30aa] top-1/2 -translate-y-1/2 -left-[5px] blur-2xl opacity-40 transition-all duration-2000 group-hover/filter:opacity-80"></div>
              
              {/* The spinning glowing border effect */}
              <div className="absolute inset-0 -m-1 rounded-lg overflow-hidden z-0
                              before:absolute before:content-[''] before:w-[200px] before:h-[200px] before:bg-no-repeat before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-90
                              before:bg-[conic-gradient(rgba(0,0,0,0),#6c3ff5,rgba(0,0,0,0)_50%,rgba(0,0,0,0)_50%,#cf30aa,rgba(0,0,0,0)_100%)]
                              before:brightness-135 before:animate-spin-slow">
              </div>
              
              <div id="filter-icon" className="relative flex items-center justify-center z-[2] h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-lg bg-white border border-gray-100 cursor-pointer shadow-sm hover:border-purple-200 transition-all">
                 <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AnimatedGlowingSearchBar.displayName = 'AnimatedGlowingSearchBar';

export default AnimatedGlowingSearchBar;
