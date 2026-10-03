/**
 * Minimal typed interface for Supabase auth user objects.
 * Use this instead of `any` for currentUser state in page components.
 */
export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    [key: string]: unknown;
  };
  app_metadata: {
    provider?: string;
    [key: string]: unknown;
  };
  role?: string;
  created_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  image: string;
  text: string;
  createdAt: string;
}

export type ResourceType = 'Note' | 'PYQ' | 'Playlist' | 'Book' | 'Syllabus';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  subCategory: string;
  course: string;
  subjectCode?: string;
  semester: number;
  tags: string[];
  description: string;
  link: string;
  directDownloadLink?: string;
  uploader: string;
  uploaderId?: string;
  uploaderRole?: string;
  uploadDate: string;
  ratings: number[];
  reports: { reason: string; date: string }[];
  isApproved?: boolean;
  averageRating?: number;
  uploadTimestamp?: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin' | 'faculty' | 'moderator';
  is_verified?: boolean | number;
  createdAt: string;
  college?: string;
  course?: string;
}

export interface News {
  id: string;
  title: string;
  date: string;
  summary: string;
  url: string;
  category: 'News' | 'Event';
  college: string;
  eligibility?: 'All' | 'DU Only' | 'College Specific' | 'NCWEB' | 'Girls Only' | 'DU + SOL' | 'DU + SOL + NCWEB';
  venue?: string;
  imageUrl?: string;
  description?: string;
  createdAt: any;
  isApproved?: boolean;
}

export interface NewsItem {
  id?: string;
  title: string;
  date: string;
  summary: string;
  url: string;
  category: 'News' | 'Event';
  college?: string;
  eligibility?: 'All' | 'DU Only' | 'College Specific' | 'NCWEB' | 'Girls Only' | 'DU + SOL' | 'DU + SOL + NCWEB';
  venue?: string;
  imageUrl?: string;
  description?: string;
  time?: string;
  createdAt?: string;
  submitted_by_name?: string | null;
  submitted_by_id?: string | null;
}

export interface EventPoster {
  id: number;
  title: string;
  college: string;
  image: string;
  date: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  upvotes: string[];
  downvotes: string[];
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  course: string;
  topic: string;
  createdAt: string;
  commentCount: number;
  upvotes: string[];
  downvotes: string[];
}

export interface PGListing {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  college: string;
  location: string;
  budget: string;
  gender: 'Male' | 'Female' | 'Any';
  description: string;
  images?: string[];
  socialLink: string;
  createdAt: string;
}

export interface Ad {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: 'homepage_top' | 'browse_sidebar' | 'forum_top';
  is_active: boolean;
  created_at: string;
}

export interface SiteSettings {
  [key: string]: string;
}

