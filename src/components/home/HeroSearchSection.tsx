import React from 'react';
import { Search, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroSearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  courses: string[];
}

export function HeroSearchSection({ searchQuery, setSearchQuery, courses }: HeroSearchSectionProps) {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/browse');
    } else {
      navigate('/browse');
    }
  };

  return (
    <div className="relative pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-brand-primary/20/30 rounded-full blur-[80px] sm:blur-[120px] -z-10" />

      <div className="max-w-3xl w-full text-center relative z-10">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-3 sm:mb-4">
          What are you <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-mark">studying today?</span>
        </h1>
        <p className="text-gray-500 font-medium text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
          Find notes, previous year question papers, and study materials tailored to your course.
        </p>

        <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects, notes, or courses..."
            className="w-full pl-12 sm:pl-14 pr-24 sm:pr-32 py-4 sm:py-5 bg-white/90 backdrop-blur-md border-2 border-white/40 rounded-2xl shadow-xl shadow-brand-dark/5 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 transition-all text-base sm:text-lg font-medium text-gray-900 outline-none"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 bg-brand-primary hover:bg-brand-primary text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center text-sm sm:text-base"
          >
            Search
          </button>
        </form>

        {/* Quick Links */}
        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
          {courses.filter(c => c !== 'All Courses').slice(0, 4).map((course, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchQuery(course);
                navigate('/browse');
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/70 hover:bg-white border border-white/50 hover:border-brand-primary/20 rounded-full text-xs sm:text-sm font-bold text-gray-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-brand-primary" />
              {course}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
