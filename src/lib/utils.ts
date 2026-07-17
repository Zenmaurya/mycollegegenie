import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TOPIC_COLORS: Record<string, string> = {
  'PYQs': 'bg-mark-soft text-mark-ink border-mark-soft',
  'Syllabus': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Assignments': 'bg-amber-50 text-amber-600 border-amber-200',
  'Projects': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Lecture Notes': 'bg-cyan-50 text-cyan-600 border-cyan-200',
  'Reference Books': 'bg-violet-50 text-violet-600 border-violet-200',
  'General': 'bg-slate-50 text-slate-600 border-slate-200',
};

export function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function shortenCourse(courseName: string): string {
  const words = courseName.split(' ');
  return words.map(w => w[0]).join('').toUpperCase();
}
