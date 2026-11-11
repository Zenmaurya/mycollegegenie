import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Calendar, Clock, ArrowRight, ArrowLeft, Share2,
  CheckCircle2, Sparkles, BookOpen, Bookmark, User, Compass,
  TrendingUp, Copy, Check, ChevronRight, MessageSquare,
  ThumbsUp, Lightbulb, AlertTriangle, Quote, Send, Layers, Tag
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from '../data/blogData';

export function BlogPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  // Scroll to top on route/slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Active post when URL has :slug
  const activePost = useMemo(() => {
    if (!slug) return null;
    return BLOG_POSTS.find((p) => p.slug === slug) || null;
  }, [slug]);

  // Filters for the blog index view
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'inspiring' | null>(null);

  // Reading progress for article view
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (!activePost) return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, current)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activePost]);

  // Filtered posts for listing
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All Articles' || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.subtitle.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q)) ||
        post.author.name.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Featured post for hero
  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  }, []);

  // Related posts for article view
  const relatedPosts = useMemo(() => {
    if (!activePost) return [];
    return BLOG_POSTS.filter((p) => p.id !== activePost.id && (p.category === activePost.category || p.trending)).slice(0, 3);
  }, [activePost]);

  const handleCopyLink = (targetSlug?: string) => {
    const url = targetSlug
      ? `${window.location.origin}/blog/${targetSlug}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubscribing(true);
    setTimeout(() => {
      setIsSubscribing(false);
      setNewsletterEmail('');
      toast.success('Welcome aboard! You are now subscribed to the student digest.');
    }, 600);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SINGLE ARTICLE DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (slug) {
    if (!activePost) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-[#FAFAFB]">
          <Helmet>
            <title>Article Not Found | MyCollegeGenie Blog</title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-500 max-w-md mb-6 text-sm">
            The article you are looking for may have been moved or updated. Browse our library of student guides below.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-md shadow-purple-600/20 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>
        </div>
      );
    }

    const shareUrl = `https://mycollegegenie.in/blog/${activePost.slug}`;
    const shareText = encodeURIComponent(`${activePost.title} — via MyCollegeGenie Blog`);

    // Schema.org BlogPosting Structured Data
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': shareUrl,
      },
      headline: activePost.title,
      description: activePost.seo.description,
      image: [activePost.coverImage],
      datePublished: activePost.publishedDate,
      dateModified: activePost.publishedDate,
      author: {
        '@type': 'Person',
        name: activePost.author.name,
        jobTitle: activePost.author.role,
      },
      publisher: {
        '@type': 'Organization',
        name: 'MyCollegeGenie',
        logo: {
          '@type': 'ImageObject',
          url: 'https://mycollegegenie.in/logo.webp',
        },
      },
      keywords: activePost.seo.keywords.join(', '),
    };

    return (
      <div className="min-h-screen bg-[#FAFAFB] text-gray-900 selection:bg-purple-100 selection:text-purple-900 pb-20">
        {/* Dynamic SEO Tags */}
        <Helmet>
          <title>{`${activePost.seo.title} | MyCollegeGenie`}</title>
          <meta name="description" content={activePost.seo.description} />
          <meta name="keywords" content={activePost.seo.keywords.join(', ')} />
          <link rel="canonical" href={shareUrl} />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="MyCollegeGenie" />
          <meta property="og:url" content={shareUrl} />
          <meta property="og:title" content={`${activePost.title} | MyCollegeGenie Blog`} />
          <meta property="og:description" content={activePost.seo.description} />
          <meta property="og:image" content={activePost.coverImage} />
          <meta property="article:published_time" content={activePost.publishedDate} />
          <meta property="article:section" content={activePost.category} />
          {activePost.tags.map((tag) => (
            <meta property="article:tag" content={tag} key={tag} />
          ))}

          {/* Twitter Cards */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@MyCollegeGenie" />
          <meta name="twitter:title" content={`${activePost.title} | MyCollegeGenie`} />
          <meta name="twitter:description" content={activePost.seo.description} />
          <meta name="twitter:image" content={activePost.coverImage} />

          {/* JSON-LD Schema.org Structured Data */}
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        </Helmet>

        {/* Reading Progress Indicator */}
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 z-[120] transition-all duration-100"
          style={{ width: `${readingProgress}%` }}
        />

        {/* Header Breadcrumbs & Back Navigation */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-gray-500 truncate">
              <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <Link to="/blog" className="hover:text-purple-600 transition-colors">Blog</Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-900 font-medium truncate">{activePost.category}</span>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Guides
            </Link>
          </div>
        </div>

        {/* Article Main Content Container */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 md:pt-14">
          {/* Category Tag & Reading Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${activePost.categoryColor}`}>
              {activePost.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{activePost.readTime}</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <time dateTime={activePost.publishedDate}>{activePost.formattedDate}</time>
            </div>
          </div>

          {/* Article Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-[1.18] mb-6">
            {activePost.title}
          </h1>

          {/* Subtitle / Lead Paragraph */}
          <p className="text-lg sm:text-xl text-gray-600 font-normal leading-relaxed mb-8 border-l-2 border-purple-500 pl-4 py-1">
            {activePost.subtitle}
          </p>

          {/* Author Block & Social Share Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 border-y border-gray-200/80 mb-8 bg-white/60 rounded-2xl px-5">
            <div className="flex items-center gap-3">
              <img
                src={activePost.author.avatar}
                alt={activePost.author.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/20"
                loading="eager"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">{activePost.author.name}</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                    Author
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {activePost.author.role} • {activePost.author.college}
                </p>
              </div>
            </div>

            {/* Quick Share Actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium mr-1 hidden sm:inline">Share:</span>
              <button
                onClick={() => handleCopyLink()}
                title="Copy Link"
                className="p-2 text-gray-600 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on WhatsApp"
                className="p-2 text-gray-600 hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 rounded-xl transition-colors text-xs font-semibold"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on LinkedIn"
                className="p-2 text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded-xl transition-colors text-xs font-semibold"
              >
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on X"
                className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-xs font-semibold"
              >
                X
              </a>
            </div>
          </div>

          {/* Cover Image */}
          <div className="relative mb-10 overflow-hidden rounded-3xl shadow-sm border border-gray-100 bg-gray-100 aspect-[16/9] max-h-[460px]">
            <img
              src={activePost.coverImage}
              alt={activePost.coverAlt}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Apple-style "Key Takeaways" / Executive Summary Box */}
          <div className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/50 border border-purple-100 rounded-3xl p-6 sm:p-8 mb-10 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shadow-purple-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Key Takeaways &amp; Executive Summary</h2>
            </div>
            <ul className="space-y-3">
              {activePost.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Table of Contents */}
          <div className="bg-white border border-gray-200/70 rounded-2xl p-5 sm:p-6 mb-12">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Table of Contents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePost.tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm font-semibold text-gray-600 hover:text-purple-600 hover:translate-x-1 transition-all py-1"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>

          {/* Article Body Sections */}
          <div className="prose prose-lg max-w-none space-y-12 text-gray-800">
            {activePost.sections.map((section) => (
              <section key={section.sectionId} id={section.sectionId} className="scroll-mt-20">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
                  {section.heading}
                </h2>

                <div className="space-y-4">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} className="text-[17px] leading-[1.8] text-gray-700 whitespace-pre-line font-normal">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Callout Box if present */}
                {section.callout && (
                  <div
                    className={`mt-6 p-5 sm:p-6 rounded-2xl border text-sm sm:text-base leading-relaxed ${
                      section.callout.type === 'tip'
                        ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                        : section.callout.type === 'warning'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : section.callout.type === 'quote'
                        ? 'bg-gray-50 border-gray-200 text-gray-900 font-mono text-xs sm:text-sm'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {section.callout.type === 'tip' && <Lightbulb className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />}
                      {section.callout.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                      {section.callout.type === 'quote' && <Quote className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />}
                      {section.callout.type === 'stats' && <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                      <div>
                        {section.callout.title && (
                          <div className="font-bold mb-1 text-sm">{section.callout.title}</div>
                        )}
                        <div className="whitespace-pre-line">{section.callout.text}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checklist / Milestone breakdown if present */}
                {section.checklist && (
                  <div className="mt-6 bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{section.checklist.title}</h4>
                    <div className="space-y-3">
                      {section.checklist.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <strong className="text-gray-900">{item.title}:</strong>{' '}
                            <span className="text-gray-600">{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Tags Cloud */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 mr-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {activePost.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Reader Feedback Strip */}
          <div className="mt-10 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-sm">
            <div>
              <h4 className="font-bold text-gray-900 text-base sm:text-lg">Was this guide helpful for your college journey?</h4>
              <p className="text-xs sm:text-sm text-gray-500">Your feedback helps our community authors write even deeper guides.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setFeedbackGiven('helpful');
                  toast.success('Thank you for your feedback! Glad it was helpful.');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  feedbackGiven === 'helpful'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful
              </button>
              <button
                onClick={() => {
                  setFeedbackGiven('inspiring');
                  toast.success('Awesome! Keep building and learning.');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  feedbackGiven === 'inspiring'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                Inspiring
              </button>
            </div>
          </div>

          {/* Author Bio Card */}
          <div className="mt-10 bg-gradient-to-br from-gray-50 to-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <img
              src={activePost.author.avatar}
              alt={activePost.author.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/20 shadow-md shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-black text-gray-900">{activePost.author.name}</span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {activePost.author.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">{activePost.author.college}</p>
              <p className="text-sm text-gray-600 leading-relaxed pt-1">{activePost.author.bio}</p>
            </div>
          </div>

          {/* Related Articles Strip */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Up Next: Recommended Guides</h3>
                  <p className="text-sm text-gray-500">More practical insights from the MyCollegeGenie student community.</p>
                </div>
                <Link
                  to="/blog"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group"
                >
                  View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all flex flex-col"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-gray-100 relative">
                      <img
                        src={post.coverImage}
                        alt={post.coverAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${post.categoryColor}`}>
                        {post.category}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium pt-3 border-t border-gray-100">
                        <span>{post.readTime}</span>
                        <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN BLOG DIRECTORY / INDEX HUB VIEW (Apple Newsroom / Google The Keyword)
  // ─────────────────────────────────────────────────────────────────────────────
  const blogListSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'MyCollegeGenie Blog',
    description: 'Expert college survival guides, off-campus placement strategies, semester exam hacks, PG accommodation tips, and student lifestyle insights.',
    url: 'https://mycollegegenie.in/blog',
    publisher: {
      '@type': 'Organization',
      name: 'MyCollegeGenie',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mycollegegenie.in/logo.webp',
      },
    },
    blogPost: BLOG_POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://mycollegegenie.in/blog/${post.slug}`,
      datePublished: post.publishedDate,
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-gray-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Primary SEO Tags */}
      <Helmet>
        <title>Student Life, Career &amp; Tech Blog | MyCollegeGenie</title>
        <meta
          name="description"
          content="Explore expert off-campus placement roadmaps, 15-day semester exam strategies, PG survival tips, and student guides on MyCollegeGenie Blog."
        />
        <meta
          name="keywords"
          content="college blog, off-campus placement tips, semester exam strategy, engineering student roadmap, find pg tips, college student hacks, MyCollegeGenie"
        />
        <link rel="canonical" href="https://mycollegegenie.in/blog" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MyCollegeGenie" />
        <meta property="og:url" content="https://mycollegegenie.in/blog" />
        <meta property="og:title" content="Student Life, Career & Tech Blog | MyCollegeGenie" />
        <meta
          property="og:description"
          content="Explore expert off-campus placement roadmaps, 15-day semester exam strategies, PG survival tips, and student guides on MyCollegeGenie Blog."
        />
        <meta property="og:image" content="https://mycollegegenie.in/og-image.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MyCollegeGenie" />
        <meta name="twitter:title" content="Student Life, Career & Tech Blog | MyCollegeGenie" />
        <meta
          name="twitter:description"
          content="Explore expert off-campus placement roadmaps, 15-day semester exam strategies, PG survival tips, and student guides on MyCollegeGenie Blog."
        />
        <meta name="twitter:image" content="https://mycollegegenie.in/og-image.png" />

        {/* JSON-LD Schema.org Structured Data */}
        <script type="application/ld+json">{JSON.stringify(blogListSchema)}</script>
      </Helmet>

      {/* Hero Header Section */}
      <header className="relative pt-12 pb-14 md:pt-20 md:pb-20 overflow-hidden bg-white border-b border-gray-100">
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-purple-500/8 blur-[120px] rounded-full" />
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-pink-500/8 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-xs font-bold tracking-wide uppercase mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            The MyCollegeGenie Journal
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6"
          >
            Playbooks, Insights &amp; Real Stories for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600">
              Indian Students
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 font-normal"
          >
            Handcrafted guides on cracking off-campus tech placements, scoring 9+ SGPA without burnout, surviving PG life, and mastering high-yield engineering skills.
          </motion.p>

          {/* Quick Stats Trust Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs sm:text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>50,000+ Student Readers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>100% Free Peer Knowledge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span>Written by Alumni &amp; Toppers</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Featured Story Spotlight (Apple Newsroom Style Hero Card) */}
        {featuredPost && searchQuery === '' && selectedCategory === 'All Articles' && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700">
                <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
              </div>
            </div>

            <Link
              to={`/blog/${featuredPost.slug}`}
              className="group block bg-white rounded-3xl border border-gray-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-purple-300 transition-all duration-300 overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Left Visual */}
                <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto overflow-hidden bg-gray-100 min-h-[300px] lg:min-h-[420px]">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.coverAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border backdrop-blur-md bg-white/90 shadow-sm ${featuredPost.categoryColor}`}>
                      {featuredPost.category}
                    </span>
                  </div>
                </div>

                {/* Right Editorial Copy */}
                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-3">
                      <span>{featuredPost.formattedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-purple-600 transition-colors tracking-tight leading-[1.22] mb-4">
                      {featuredPost.title}
                    </h2>

                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3 mb-6">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900">{featuredPost.author.name}</div>
                        <div className="text-[11px] text-gray-400">{featuredPost.author.role}</div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                      Read Blueprint <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Filter Bar & Minimal Search (Sticky Google/Apple Filter Strip) */}
        <div className="sticky top-16 z-30 bg-[#FAFAFB]/90 backdrop-blur-xl py-4 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-gray-200/60">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {BLOG_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                    }}
                    className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Clean Minimal Search Input */}
            <div className="relative min-w-[260px] md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, topics, skills..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter if filtering */}
        {(selectedCategory !== 'All Articles' || searchQuery !== '') && (
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-6">
            <span>
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
              {selectedCategory !== 'All Articles' && ` in "${selectedCategory}"`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <button
              onClick={() => {
                setSelectedCategory('All Articles');
                setSearchQuery('');
              }}
              className="text-purple-600 hover:text-purple-700 font-bold"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Blog Post Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-lg mx-auto my-12">
            <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No articles found</h3>
            <p className="text-xs text-gray-500 mb-6">
              Try adjusting your search keyword or selecting a different category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All Articles');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-white rounded-3xl border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
              >
                {/* Card Visual Header */}
                <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={post.coverImage}
                    alt={post.coverAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md bg-white/90 shadow-sm ${post.categoryColor}`}>
                      {post.category}
                    </span>
                    {post.trending && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Trending
                      </span>
                    )}
                  </div>
                </Link>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-2.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{post.formattedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {post.readTime}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-purple-600 transition-colors tracking-tight leading-snug mb-3">
                      <Link to={`/blog/${post.slug}`} className="focus:outline-none">
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2 mb-6">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Card Footer: Author & Read Action */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-200"
                      />
                      <span className="text-xs font-bold text-gray-800 truncate max-w-[120px]">
                        {post.author.name}
                      </span>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 group-hover:translate-x-0.5 transition-transform"
                    >
                      Read Guide <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Student Weekly Digest / Newsletter Box (Apple-style frosted block) */}
        <section className="mt-20 bg-gradient-to-br from-gray-900 via-[#181628] to-gray-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block mb-4">
              Weekly Student Dispatch
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-4">
              Get Off-Campus Hiring Leads &amp; Exam Cheatsheets Every Sunday
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8">
              Join 50,000+ engineering and university students who receive our weekly curated recap of internship openings, semester exam hacks, and community notes. No spam, ever.
            </p>

            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your college or personal email"
                className="flex-1 px-4 py-3 text-sm bg-white/10 border border-white/15 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all backdrop-blur-md"
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe Free'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[11px] text-gray-400 mt-3">Free forever. Unsubscribe with one click anytime.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
export default BlogPage;
