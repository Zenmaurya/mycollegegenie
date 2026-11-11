import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Plus, Edit3, Trash2, Search, Loader2, Save, X,
  RefreshCw, Upload, Eye, ExternalLink, Sparkles, TrendingUp,
  CheckCircle2, Globe, Tag, FileText, User, ChevronDown, ChevronUp,
  Lightbulb, AlertTriangle, Quote, ArrowUp, ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { BLOG_CATEGORIES, BlogSection } from '../../data/blogData';
import {
  AdminBlogPost,
  getAllBlogs,
  saveBlogPost,
  deleteBlogPost,
  uploadBlogImage,
  generateSlug,
  getCategoryColor,
} from '../../services/blogService';

interface AdminBlogsProps {
  defaultAuthorName?: string;
}

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AUTHOR_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

export const AdminBlogs: React.FC<AdminBlogsProps> = ({ defaultAuthorName = 'MyCollegeGenie Editorial' }) => {
  const [blogs, setBlogs] = useState<AdminBlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Articles');

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editorTab, setEditorTab] = useState<'content' | 'seo' | 'preview'>('content');

  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<AdminBlogPost | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<AdminBlogPost['category']>('Placements & Career');
  const [coverImage, setCoverImage] = useState(DEFAULT_COVER_IMAGE);
  const [coverAlt, setCoverAlt] = useState('');
  const [readTime, setReadTime] = useState('5 min read');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Author
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorRole, setAuthorRole] = useState('Community Editor');
  const [authorCollege, setAuthorCollege] = useState('MyCollegeGenie');
  const [authorAvatar, setAuthorAvatar] = useState(DEFAULT_AUTHOR_AVATAR);
  const [authorBio, setAuthorBio] = useState('Helping Indian college students navigate academics, internships, and campus life.');

  // Lists
  const [tagsInput, setTagsInput] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(['']);
  const [sections, setSections] = useState<
    Array<{
      sectionId: string;
      heading: string;
      bodyText: string;
      calloutType: 'none' | 'tip' | 'warning' | 'quote' | 'stats';
      calloutTitle: string;
      calloutText: string;
    }>
  >([
    {
      sectionId: 'introduction',
      heading: '1. Introduction & Core Context',
      bodyText: '',
      calloutType: 'none',
      calloutTitle: '',
      calloutText: '',
    },
  ]);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywordsInput, setSeoKeywordsInput] = useState('');

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBlogs(true);
      setBlogs(data);
    } catch {
      toast.error('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-calculate estimated read time whenever sections change
  const estimatedReadTime = useMemo(() => {
    const wordCount = [
      title,
      subtitle,
      excerpt,
      ...keyTakeaways,
      ...sections.map((s) => `${s.heading} ${s.bodyText} ${s.calloutText}`),
    ]
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const mins = Math.max(2, Math.ceil(wordCount / 180));
    return `${mins} min read`;
  }, [title, subtitle, excerpt, keyTakeaways, sections]);

  const openNewEditor = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setSlugManuallyEdited(false);
    setSubtitle('');
    setExcerpt('');
    setCategory('Placements & Career');
    setCoverImage(DEFAULT_COVER_IMAGE);
    setCoverAlt('');
    setReadTime('5 min read');
    setFeatured(false);
    setTrending(false);
    setIsPublished(true);
    setAuthorName(defaultAuthorName);
    setAuthorRole('Community Editor');
    setAuthorCollege('MyCollegeGenie');
    setAuthorAvatar(DEFAULT_AUTHOR_AVATAR);
    setAuthorBio('Helping Indian college students navigate academics, internships, and campus life.');
    setTagsInput('College Guide, Student Tips');
    setKeyTakeaways(['']);
    setSections([
      {
        sectionId: 'section-1',
        heading: '1. Overview & Key Strategy',
        bodyText: '',
        calloutType: 'none',
        calloutTitle: '',
        calloutText: '',
      },
    ]);
    setSeoTitle('');
    setSeoDescription('');
    setSeoKeywordsInput('');
    setEditorTab('content');
    setIsEditorOpen(true);
  };

  const openEditEditor = (post: AdminBlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setSlugManuallyEdited(true);
    setSubtitle(post.subtitle || '');
    setExcerpt(post.excerpt || '');
    setCategory(post.category);
    setCoverImage(post.coverImage || DEFAULT_COVER_IMAGE);
    setCoverAlt(post.coverAlt || post.title);
    setReadTime(post.readTime || '5 min read');
    setFeatured(Boolean(post.featured));
    setTrending(Boolean(post.trending));
    setIsPublished(post.isPublished !== false);

    setAuthorName(post.author?.name || defaultAuthorName);
    setAuthorRole(post.author?.role || 'Editor');
    setAuthorCollege(post.author?.college || 'MyCollegeGenie');
    setAuthorAvatar(post.author?.avatar || DEFAULT_AUTHOR_AVATAR);
    setAuthorBio(post.author?.bio || '');

    setTagsInput((post.tags || []).join(', '));
    setKeyTakeaways(post.keyTakeaways?.length ? [...post.keyTakeaways] : ['']);
    setSections(
      post.sections?.length
        ? post.sections.map((s) => ({
            sectionId: s.sectionId || generateSlug(s.heading || 'section'),
            heading: s.heading || '',
            bodyText: (s.paragraphs || []).join('\n\n'),
            calloutType: s.callout?.type || 'none',
            calloutTitle: s.callout?.title || '',
            calloutText: s.callout?.text || '',
          }))
        : [
            {
              sectionId: 'section-1',
              heading: '1. Overview',
              bodyText: '',
              calloutType: 'none',
              calloutTitle: '',
              calloutText: '',
            },
          ]
    );
    setSeoTitle(post.seo?.title || post.title);
    setSeoDescription(post.seo?.description || post.excerpt || '');
    setSeoKeywordsInput((post.seo?.keywords || []).join(', '));
    setEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(val));
    }
    if (!seoTitle) {
      setSeoTitle(val.slice(0, 65));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      setCoverImage(url);
      toast.success('Cover image uploaded!');
    } catch (err: any) {
      toast.error(err?.message || 'Cover image upload failed');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadBlogImage(file);
      setAuthorAvatar(url);
      toast.success('Author avatar uploaded!');
    } catch (err: any) {
      toast.error(err?.message || 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addTakeaway = () => setKeyTakeaways((prev) => [...prev, '']);
  const updateTakeaway = (idx: number, val: string) => {
    setKeyTakeaways((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };
  const removeTakeaway = (idx: number) => {
    setKeyTakeaways((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        sectionId: `section-${prev.length + 1}`,
        heading: `${prev.length + 1}. Next Section Title`,
        bodyText: '',
        calloutType: 'none',
        calloutTitle: '',
        calloutText: '',
      },
    ]);
  };

  const updateSection = (idx: number, field: string, val: string) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== idx) return sec;
        const next = { ...sec, [field]: val };
        if (field === 'heading') {
          next.sectionId = generateSlug(val) || `section-${idx + 1}`;
        }
        return next;
      })
    );
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) {
      toast.error('At least one content section is required');
      return;
    }
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPostPayload = (): AdminBlogPost => {
    const now = new Date();
    const cleanedTakeaways = keyTakeaways.map((t) => t.trim()).filter(Boolean);
    const parsedSections: BlogSection[] = sections.map((s, idx) => {
      const secId = s.sectionId || generateSlug(s.heading) || `section-${idx + 1}`;
      const paragraphs = s.bodyText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const sectionObj: BlogSection = {
        sectionId: secId,
        heading: s.heading.trim() || `Section ${idx + 1}`,
        paragraphs: paragraphs.length ? paragraphs : [s.bodyText.trim()].filter(Boolean),
      };

      if (s.calloutType !== 'none' && s.calloutText.trim()) {
        sectionObj.callout = {
          type: s.calloutType,
          ...(s.calloutTitle.trim() ? { title: s.calloutTitle.trim() } : {}),
          text: s.calloutText.trim(),
        };
      }
      return sectionObj;
    });

    const tableOfContents = parsedSections.map((s) => ({
      id: s.sectionId,
      title: s.heading,
    }));

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const seoKeywords = seoKeywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const finalExcerpt =
      excerpt.trim() ||
      subtitle.trim() ||
      (parsedSections[0]?.paragraphs[0]?.slice(0, 180) ?? '');

    return {
      id: editingPost?.id || `post-${Date.now()}`,
      slug: generateSlug(slug || title),
      title: title.trim(),
      subtitle: subtitle.trim() || finalExcerpt,
      excerpt: finalExcerpt,
      category,
      categoryColor: getCategoryColor(category),
      coverImage: coverImage.trim() || DEFAULT_COVER_IMAGE,
      coverAlt: coverAlt.trim() || title.trim(),
      publishedDate: editingPost?.publishedDate || now.toISOString(),
      formattedDate:
        editingPost?.formattedDate ||
        now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: readTime.trim() || estimatedReadTime,
      author: {
        name: authorName.trim() || defaultAuthorName,
        role: authorRole.trim() || 'Editor',
        college: authorCollege.trim() || 'MyCollegeGenie',
        avatar: authorAvatar.trim() || DEFAULT_AUTHOR_AVATAR,
        bio: authorBio.trim(),
      },
      featured,
      trending,
      tags: tags.length ? tags : [category],
      keyTakeaways: cleanedTakeaways.length
        ? cleanedTakeaways
        : [finalExcerpt],
      tableOfContents,
      sections: parsedSections,
      seo: {
        title: (seoTitle || title).trim(),
        description: (seoDescription || finalExcerpt).trim().slice(0, 165),
        keywords: seoKeywords.length ? seoKeywords : tags,
      },
      isPublished,
      isBuiltIn: editingPost?.isBuiltIn,
    };
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a blog title');
      return;
    }
    if (!sections.some((s) => s.bodyText.trim().length > 0)) {
      toast.error('Please add content to at least one section');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPostPayload();
      const saved = await saveBlogPost(payload, Boolean(editingPost));
      toast.success(
        isPublished
          ? `Blog "${saved.title}" published live!`
          : `Draft "${saved.title}" saved!`
      );
      setIsEditorOpen(false);
      await loadBlogs();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickToggle = async (
    post: AdminBlogPost,
    field: 'isPublished' | 'featured' | 'trending'
  ) => {
    const updated: AdminBlogPost = {
      ...post,
      [field]: field === 'isPublished' ? !(post.isPublished !== false) : !post[field],
    };
    try {
      await saveBlogPost(updated, true);
      setBlogs((prev) => prev.map((b) => (b.id === post.id ? updated : b)));
      toast.success('Blog updated');
    } catch {
      toast.error('Failed to update blog status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteBlogPost(postToDelete);
      setBlogs((prev) => prev.filter((b) => b.id !== postToDelete.id));
      toast.success('Blog article removed');
    } catch {
      toast.error('Failed to delete blog article');
    } finally {
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchCat = categoryFilter === 'All Articles' || b.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.author?.name?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [blogs, categoryFilter, searchQuery]);

  const stats = useMemo(
    () => ({
      total: blogs.length,
      published: blogs.filter((b) => b.isPublished !== false).length,
      drafts: blogs.filter((b) => b.isPublished === false).length,
      featured: blogs.filter((b) => b.featured).length,
    }),
    [blogs]
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <BookOpen className="w-7 h-7 text-purple-600" />
            Blog Publishing CMS
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Create, edit, optimize SEO, and publish articles directly to{' '}
            <a href="/blog" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold hover:underline">
              /blog
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBlogs}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
            title="Refresh Blogs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openNewEditor}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Write New Article
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Articles', value: stats.total, color: 'text-gray-900 bg-white' },
          { label: 'Published Live', value: stats.published, color: 'text-emerald-700 bg-emerald-50/70 border-emerald-100' },
          { label: 'Saved Drafts', value: stats.drafts, color: 'text-amber-700 bg-amber-50/70 border-amber-100' },
          { label: 'Featured Spotlights', value: stats.featured, color: 'text-purple-700 bg-purple-50/70 border-purple-100' },
        ].map((st) => (
          <div key={st.label} className={`p-4 rounded-2xl border border-gray-100 shadow-sm ${st.color}`}>
            <div className="text-2xl font-black">{st.value}</div>
            <div className="text-xs font-bold opacity-70 uppercase tracking-wider mt-0.5">{st.label}</div>
          </div>
        ))}
      </div>

      {/* Editor Modal / Panel */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-white rounded-[2rem] border border-purple-100 shadow-xl overflow-hidden"
          >
            {/* Editor Top Bar */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-white to-indigo-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
                  {editingPost ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {editingPost ? `Editing: ${editingPost.title.slice(0, 45)}...` : 'Publish New SEO Article'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    URL Preview: <span className="font-mono text-purple-600">/blog/{slug || 'your-article-slug'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(['content', 'seo', 'preview'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setEditorTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      editorTab === tab
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {tab === 'seo' ? 'SEO & Tags' : tab}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-8">
              {/* TAB 1: CONTENT EDITOR */}
              {editorTab === 'content' && (
                <div className="space-y-6">
                  {/* Headline & Category Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-8 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Article Headline *
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g., How to Crack Off-Campus Internships in Your 2nd Year"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            URL Slug (SEO Friendly)
                          </label>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                              setSlugManuallyEdited(true);
                              setSlug(generateSlug(e.target.value));
                            }}
                            placeholder="how-to-crack-internships"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Category *
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as AdminBlogPost['category'])}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                          >
                            {BLOG_CATEGORIES.filter((c) => c !== 'All Articles').map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Subtitle / Lead Hook
                        </label>
                        <textarea
                          rows={2}
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="A punchy 1-2 sentence summary shown below the headline..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Card Excerpt (2 lines on blog grid)
                        </label>
                        <textarea
                          rows={2}
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Short summary for the blog directory card..."
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Right Column: Cover Image + Publish Toggles */}
                    <div className="lg:col-span-4 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                          Cover Image
                        </label>
                        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-2 relative">
                          <img
                            src={coverImage || DEFAULT_COVER_IMAGE}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          {isUploadingCover && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading...
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                          />
                          <label className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold cursor-pointer hover:bg-purple-100 flex items-center gap-1.5 shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            Upload
                            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Read Time
                          </label>
                          <input
                            type="text"
                            value={readTime}
                            onChange={(e) => setReadTime(e.target.value)}
                            placeholder={estimatedReadTime}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setReadTime(estimatedReadTime)}
                            className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[11px] font-bold text-gray-700"
                          >
                            Auto ({estimatedReadTime})
                          </button>
                        </div>
                      </div>

                      {/* Visibility Toggles */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-2.5">
                        <label className="flex items-center justify-between text-xs font-bold text-gray-800 cursor-pointer">
                          <span>Publish Live Immediately</span>
                          <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(e) => setIsPublished(e.target.checked)}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-800 cursor-pointer">
                          <span>Featured Hero Spotlight</span>
                          <input
                            type="checkbox"
                            checked={featured}
                            onChange={(e) => setFeatured(e.target.checked)}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-800 cursor-pointer">
                          <span>Mark as Trending</span>
                          <input
                            type="checkbox"
                            checked={trending}
                            onChange={(e) => setTrending(e.target.checked)}
                            className="w-4 h-4 accent-purple-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Key Takeaways Builder */}
                  <div className="p-5 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Key Takeaways (Executive Summary Box)
                      </h4>
                      <button
                        type="button"
                        onClick={addTakeaway}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-purple-200"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Point
                      </button>
                    </div>
                    <div className="space-y-2">
                      {keyTakeaways.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <input
                            type="text"
                            value={point}
                            onChange={(e) => updateTakeaway(idx, e.target.value)}
                            placeholder={`Key takeaway #${idx + 1}...`}
                            className="flex-1 px-3 py-2 bg-white border border-purple-200/70 rounded-xl text-xs"
                          />
                          {keyTakeaways.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTakeaway(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sections Builder */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        Article Content Sections
                      </h4>
                      <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Section
                      </button>
                    </div>

                    {sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-black text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                            Section {idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSection(idx, -1)}
                              disabled={idx === 0}
                              className="p-1.5 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(idx, 1)}
                              disabled={idx === sections.length - 1}
                              className="p-1.5 text-gray-500 hover:bg-white rounded-lg disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSection(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg ml-1"
                              title="Delete Section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={sec.heading}
                          onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                          placeholder="Section Heading (e.g., 1. Building Your Foundation)"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold"
                        />

                        <textarea
                          rows={5}
                          value={sec.bodyText}
                          onChange={(e) => updateSection(idx, 'bodyText', e.target.value)}
                          placeholder="Write your paragraphs here. Leave an empty line between paragraphs for clean spacing..."
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm leading-relaxed"
                        />

                        {/* Optional Callout Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-200/60">
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                              Optional Callout Box
                            </label>
                            <select
                              value={sec.calloutType}
                              onChange={(e) => updateSection(idx, 'calloutType', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                            >
                              <option value="none">No Callout</option>
                              <option value="tip">💡 Pro Tip</option>
                              <option value="stats">📈 Stat / Fact</option>
                              <option value="quote">💬 Quote / Script</option>
                              <option value="warning">⚠️ Warning</option>
                            </select>
                          </div>
                          {sec.calloutType !== 'none' && (
                            <>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                  Callout Title
                                </label>
                                <input
                                  type="text"
                                  value={sec.calloutTitle}
                                  onChange={(e) => updateSection(idx, 'calloutTitle', e.target.value)}
                                  placeholder="e.g., Pro Tip"
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                                />
                              </div>
                              <div className="sm:col-span-6">
                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                                  Callout Content
                                </label>
                                <input
                                  type="text"
                                  value={sec.calloutText}
                                  onChange={(e) => updateSection(idx, 'calloutText', e.target.value)}
                                  placeholder="Highlight insight or template text..."
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Author Details */}
                  <div className="p-5 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      Author Attribution
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Author Name</label>
                        <input
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Role / Credential</label>
                        <input
                          type="text"
                          value={authorRole}
                          onChange={(e) => setAuthorRole(e.target.value)}
                          placeholder="e.g., SDE Intern @ Google"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">College / Organization</label>
                        <input
                          type="text"
                          value={authorCollege}
                          onChange={(e) => setAuthorCollege(e.target.value)}
                          placeholder="e.g., Delhi University"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <img
                          src={authorAvatar || DEFAULT_AUTHOR_AVATAR}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <input
                          type="url"
                          value={authorAvatar}
                          onChange={(e) => setAuthorAvatar(e.target.value)}
                          placeholder="Avatar URL"
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                        />
                        <label className="px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-gray-100 shrink-0">
                          {isUploadingAvatar ? '...' : 'Upload'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          value={authorBio}
                          onChange={(e) => setAuthorBio(e.target.value)}
                          placeholder="Short author bio shown at end of article..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SEO & TAGS */}
              {editorTab === 'seo' && (
                <div className="space-y-5 max-w-3xl">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Google Search Snippet Preview
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-1">
                      <div className="text-xs text-gray-500">https://mycollegegenie.in › blog › {slug || 'article-slug'}</div>
                      <div className="text-lg font-bold text-blue-700 leading-snug">
                        {(seoTitle || title || 'Your SEO Article Title').slice(0, 65)} | MyCollegeGenie
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {(seoDescription || excerpt || subtitle || 'Write a compelling meta description to maximize search click-through rates...').slice(0, 160)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Title</label>
                      <span className={`text-[11px] font-bold ${(seoTitle || title).length > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(seoTitle || title).length} / 60 recommended
                      </span>
                    </div>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={title || 'Optimized title for Google search results'}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">SEO Meta Description</label>
                      <span className={`text-[11px] font-bold ${(seoDescription || excerpt).length > 160 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(seoDescription || excerpt).length} / 160 recommended
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Concise 150-160 character summary for search engines & social previews..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Article Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Placements, Resume Tips, DSA Roadmap"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Target SEO Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      value={seoKeywordsInput}
                      onChange={(e) => setSeoKeywordsInput(e.target.value)}
                      placeholder="how to crack internships india, college placement roadmap 2026"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Cover Image Alt Text (SEO & Accessibility)
                    </label>
                    <input
                      type="text"
                      value={coverAlt}
                      onChange={(e) => setCoverAlt(e.target.value)}
                      placeholder="Describe the cover image clearly..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW */}
              {editorTab === 'preview' && (
                <div className="bg-[#FAFAFB] p-6 rounded-3xl border border-gray-200/70 max-w-3xl mx-auto space-y-6">
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <h1 className="text-3xl font-black text-gray-900 leading-tight">{title || 'Untitled Article'}</h1>
                  <p className="text-base text-gray-600 border-l-2 border-purple-500 pl-4">{subtitle || excerpt}</p>
                  <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
                    <img src={coverImage || DEFAULT_COVER_IMAGE} alt={coverAlt || title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-6">
                    {sections.map((s, idx) => (
                      <div key={idx} className="space-y-2">
                        <h2 className="text-xl font-extrabold text-gray-900">{s.heading}</h2>
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{s.bodyText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Footer Actions */}
              <div className="pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-7 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSubmitting
                      ? 'Saving...'
                      : editingPost
                      ? 'Save & Update Article'
                      : isPublished
                      ? 'Publish Article Live'
                      : 'Save Draft'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, slug, or author..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
        >
          {BLOG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-gray-100 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No articles match your filter</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">Write a new SEO article or reset your search filter.</p>
          <button
            onClick={openNewEditor}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
          >
            Write First Article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBlogs.map((post) => (
            <div
              key={post.id}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200/70 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <img
                  src={post.coverImage || DEFAULT_COVER_IMAGE}
                  alt={post.coverAlt}
                  className="w-24 h-16 sm:w-28 sm:h-20 rounded-2xl object-cover shrink-0 bg-gray-100 border border-gray-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${post.categoryColor || getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.isPublished !== false
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {post.isPublished !== false ? 'Published' : 'Draft'}
                    </span>
                    {post.featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Featured
                      </span>
                    )}
                    {post.trending && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Trending
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                    By {post.author?.name} • {post.formattedDate} • {post.readTime} •{' '}
                    <span className="font-mono text-gray-500">/blog/{post.slug}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                <button
                  onClick={() => handleQuickToggle(post, 'featured')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    post.featured
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                  title="Toggle Featured Hero"
                >
                  ★ Featured
                </button>
                <button
                  onClick={() => handleQuickToggle(post, 'isPublished')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                    post.isPublished !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {post.isPublished !== false ? 'Unpublish' : 'Publish'}
                </button>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors"
                  title="View Live Article"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => openEditEditor(post)}
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  title="Edit Article"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setPostToDelete(post);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                  title="Delete Article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Blog Article?"
        message={`Are you sure you want to remove "${postToDelete?.title}"? This will hide/remove the article from the public Blog page.`}
        confirmText="Delete Article"
        type="danger"
      />
    </motion.div>
  );
};

