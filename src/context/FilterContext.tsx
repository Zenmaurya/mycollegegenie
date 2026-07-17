import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { College_COURSES, SUB_CATEGORIES, COURSE_METADATA } from '../constants';

interface FilterContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearch: string;
  activeFilter: 'All' | 'Note' | 'PYQ' | 'Book' | 'Syllabus';
  setActiveFilter: (filter: 'All' | 'Note' | 'PYQ' | 'Book' | 'Syllabus') => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  selectedSemester: string;
  setSelectedSemester: (sem: string) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (subCat: string) => void;
  sortBy: 'Title' | 'Date' | 'Rating' | 'Course';
  setSortBy: (sort: 'Title' | 'Date' | 'Rating' | 'Course') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  visibleCount: number;
  setVisibleCount: (count: number) => void;
  availableSemesters: string[];
  availableSubCategories: string[];
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Note' | 'PYQ' | 'Book' | 'Syllabus'>('All');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'Title' | 'Date' | 'Rating' | 'Course'>('Date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(12);

  const availableSemesters = useMemo(() => {
    if (selectedCourse === 'All Courses') return ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
    const maxSem = COURSE_METADATA[selectedCourse]?.semesters || 8;
    return ['All Semesters', ...Array.from({ length: maxSem }, (_, i) => String(i + 1))];
  }, [selectedCourse]);

  const availableSubCategories = useMemo(() => {
    if (selectedCourse === 'All Courses') return ['All', ...SUB_CATEGORIES];
    const meta = COURSE_METADATA[selectedCourse];
    return ['All', ...(meta?.subCategories || SUB_CATEGORIES)];
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse !== 'All Courses') {
      if (!availableSemesters.includes(selectedSemester)) setSelectedSemester('All Semesters');
      if (!availableSubCategories.includes(selectedSubCategory)) setSelectedSubCategory('All');
    }
  }, [selectedCourse, availableSemesters, availableSubCategories, selectedSemester, selectedSubCategory]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setSelectedCourse('All Courses');
    setSelectedSemester('All Semesters');
    setSelectedSubCategory('All');
    setSortBy('Date');
    setVisibleCount(12);
  };

  const value = {
    searchQuery, setSearchQuery, debouncedSearch,
    activeFilter, setActiveFilter,
    selectedCourse, setSelectedCourse,
    selectedSemester, setSelectedSemester,
    selectedSubCategory, setSelectedSubCategory,
    sortBy, setSortBy,
    viewMode, setViewMode,
    visibleCount, setVisibleCount,
    availableSemesters, availableSubCategories,
    resetFilters
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
