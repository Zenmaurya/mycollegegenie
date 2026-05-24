/**
 * ResourceUploadModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Upload modal for Notes, PYQs, Books and Playlists.
 * Previously inlined in App.tsx lines 1560–1852.
 *
 * Uses useAuth() for auth state and useResources() to prepend the
 * newly created resource to the shared list immediately.
 */
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import {
  Upload, X, CheckCircle2, AlertCircle, ChevronDown, Globe,
  Search, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import { uploadResource, uploadFile } from '../services/resourceService';
import { fetchWithAuth } from '../lib/apiClient';
import { College_COURSES, COURSE_METADATA } from '../constants';

interface ResourceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** true when opened from the Playlist page — forces type = "Playlist" */
  isPlaylistContext: boolean;
}

const extractYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|list=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2] ? match[2] : null;
};

const INITIAL_FORM = {
  title: '',
  course: '',
  subjectCode: '',
  semester: '1',
  type: '' as 'Note' | 'PYQ' | 'Book' | 'Playlist' | '',
  subCategory: '',
  tags: '',
  description: '',
  link: '',
  file: null as File | null,
};

export function ResourceUploadModal({ isOpen, onClose, isPlaylistContext }: ResourceUploadModalProps) {
  const { user } = useAuth();
  const { resources, setResources } = useResources();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [duplicateWarningResource, setDuplicateWarningResource] = useState<any | null>(null);
  const [duplicateWarningAcknowledged, setDuplicateWarningAcknowledged] = useState(false);
  const [uploadCourseOpen, setUploadCourseOpen] = useState(false);
  const [uploadCourseSearch, setUploadCourseSearch] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const MAX_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('📦 File too large! Maximum 15 MB.', {
          duration: 6000,
          description: 'Try ilovepdf.com or smallpdf.com to compress your PDF.',
        });
        return;
      }
      setFormData(prev => ({ ...prev, file }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    maxSize: 15 * 1024 * 1024,
    onDropRejected: fileRejections => {
      const err = fileRejections[0]?.errors[0];
      if (err?.code === 'file-too-large') {
        toast.error('📦 File too large! Maximum 15 MB.', {
          duration: 6000,
          description: 'Please compress your file first.',
        });
      } else {
        toast.error('Invalid file type. Please upload a PDF or image file (PNG, JPG, WebP, GIF).');
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
  } as any);

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setUploadStatus('idle');
    setDuplicateWarningResource(null);
    setDuplicateWarningAcknowledged(false);
    setUploadCourseOpen(false);
    setUploadCourseSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to upload resources.'); return; }

    let currentType = formData.type;

    if (isPlaylistContext) {
      currentType = 'Playlist';
      if (!duplicateWarningAcknowledged) {
        const ytId = extractYouTubeId(formData.link);
        if (ytId) {
          const existing = resources.find(
            r => r.type === 'Playlist' && r.link && extractYouTubeId(r.link) === ytId,
          );
          if (existing) {
            setDuplicateWarningResource(existing);
            return;
          }
        }
      }
    }

    if (!isPlaylistContext) {
      if (!formData.title.trim()) { toast.error('Please enter a resource title.'); return; }
      if (!formData.type) { toast.error('Please select a resource type (Note, PYQ, or Book).'); return; }
      if (!formData.course.trim()) { toast.error('Please select a course.'); return; }
      if (!formData.file && !formData.link.trim()) { toast.error('Please upload a file or provide a direct link.'); return; }
    } else {
      if (!formData.link.trim()) { toast.error('Please provide a YouTube playlist link.'); return; }
    }

    setUploadStatus('uploading');

    try {
      let finalLink = formData.link;

      if (formData.file) {
        // ── Pre-flight: check storage is configured ──
        // NOTE: We intentionally do NOT block on health check failure (including 401).
        // If the user is logged in and the upload itself fails, they'll get a clear
        // error from the actual upload request. Health check is best-effort only.
        try {
          const health = await fetchWithAuth('/api/resources/upload/health');
          if (health?.r2 !== 'configured') {
            // R2 is explicitly not configured — warn but still allow Google Drive link
            console.warn('[Upload] R2 not configured on server. File upload may fail.');
            // Only hard-block if user has NO link fallback
            if (!formData.link?.trim()) {
              throw new Error('File storage is not configured on the server. Please use a Google Drive link instead, or contact admin.');
            }
          }
        } catch (healthErr: any) {
          // IMPORTANT: 401 / network errors on health check should NOT block the upload.
          // The actual upload request will show the real error if something is wrong.
          if (healthErr.message?.includes('not configured on the server')) throw healthErr;
          // Anything else (401, timeout, network) — log and continue
          console.warn('[Upload] Health check failed (ignoring):', healthErr.message);
        }

        let folder: 'pyqs' | 'books' | 'notes' | 'resources' = 'resources';
        if (currentType === 'PYQ') folder = 'pyqs';
        if (currentType === 'Book') folder = 'books';
        if (currentType === 'Note') folder = 'notes';
        const toastId = toast.loading('Uploading file (0%)… Please wait.');
        try {
          finalLink = await uploadFile(
            formData.file,
            folder,
            { course: formData.course, subject: formData.title, subjectCode: formData.subjectCode },
            percent => { toast.loading(`Uploading file (${percent}%)… Please wait.`, { id: toastId }); },
          );
          toast.dismiss(toastId);
        } catch (uploadErr) {
          toast.dismiss(toastId);
          throw uploadErr;
        }
      }

      let autoSubCategory = 'Lecture Notes';
      if (currentType === 'PYQ') autoSubCategory = 'PYQs';
      if (currentType === 'Book') autoSubCategory = 'Reference Books';

      const resourceData: any = {
        title: formData.title,
        course: formData.course,
        subjectCode: formData.subjectCode,
        subCategory: autoSubCategory,
        semester: parseInt(formData.semester),
        type: currentType,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        description: formData.description,
        link: finalLink || '',
        uploader: (user as any).user_metadata?.full_name || (user as any).email?.split('@')[0] || 'Anonymous',
        uploaderId: user.id,
        isApproved: false,
      };

      if (isPlaylistContext && duplicateWarningAcknowledged) {
        resourceData.tags.push('Duplicate Flagged');
        resourceData.description = `⚠️ System Flag: A playlist with this URL already exists.\n\n${resourceData.description}`;
      }

      const directExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
      const isDirectLink = formData.link && directExtensions.some(ext => formData.link.toLowerCase().endsWith(ext));
      if (formData.file) resourceData.directDownloadLink = finalLink;
      else if (isDirectLink) resourceData.directDownloadLink = formData.link;

      const newResourceId = await uploadResource(resourceData);
      const newResource = {
        id: newResourceId,
        ...resourceData,
        uploadDate: new Date().toISOString().split('T')[0],
        ratings: [],
      };

      setResources(prev => [newResource as any, ...prev]);
      setUploadStatus('success');
      toast.success('Resource uploaded! It will be visible after admin approval.');

      setTimeout(() => { handleClose(); }, 2000);
    } catch (error) {
      console.error('[Upload] Full error details:', error);
      setUploadStatus('idle');
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // Map common technical messages to user-friendly text
      if (msg.toLowerCase().includes('timed out') || msg.toLowerCase().includes('timeout')) {
        toast.error('Upload timed out. Please check your internet connection and try again.', { duration: 8000 });
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        toast.error('Network error. Make sure you are connected to the internet.', { duration: 8000 });
      } else if (
        msg.toLowerCase().includes('not authenticated') ||
        (msg.toLowerCase().includes('sign in') && !msg.toLowerCase().includes('storage'))
      ) {
        // Session expired — give user a reload option
        toast.error(
          'Session expired. Please refresh the page and sign in again.',
          {
            duration: 10000,
            action: { label: 'Refresh', onClick: () => window.location.reload() },
          }
        );
      } else if (msg.toLowerCase().includes('r2 not configured') || msg.toLowerCase().includes('storage not configured')) {
        toast.error('File storage not set up on the server. Please use a Google Drive link instead or contact admin.', { duration: 10000 });
      } else if (msg.toLowerCase().includes('invalid token') || msg.toLowerCase().includes('expired token') || msg.includes('401')) {
        toast.error(
          'Authentication error. Please refresh the page.',
          {
            duration: 10000,
            action: { label: 'Refresh', onClick: () => window.location.reload() },
          }
        );
      } else {
        toast.error(msg || 'Upload failed. Please try again.', { duration: 8000 });
      }
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', inset: 0 }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-2xl mx-4 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upload Material</h2>
                  <p className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Share your knowledge</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUpload} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar">
              {uploadStatus === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
                  <p className="text-gray-600">Your resource has been added to the community library.</p>
                </motion.div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                    <p className="text-gray-500 font-medium">You need to be signed in to upload a resource.</p>
                  </div>
                  <Link to="/login" className="w-full sm:w-auto px-8 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20 block text-center">
                    Sign In to Continue
                  </Link>
                </div>
              ) : (
                <>
                  {/* Row 1: Title + Course */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title <span className="text-red-400">*</span></label>
                      <input
                        required type="text" placeholder="e.g. Microeconomics Unit 1 Notes"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Course <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => { setUploadCourseOpen(p => !p); setUploadCourseSearch(''); }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm font-medium transition-all text-left ${uploadCourseOpen ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white' : 'border-gray-200'} ${!formData.course ? 'text-gray-300' : 'text-gray-800'}`}
                        >
                          <span className="truncate">{formData.course || 'Select Course'}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${uploadCourseOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <input type="text" required readOnly value={formData.course} tabIndex={-1} className="absolute inset-0 opacity-0 pointer-events-none" />
                        <AnimatePresence>
                          {uploadCourseOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                            >
                              <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                  <input
                                    autoFocus type="text" placeholder="Search course…"
                                    value={uploadCourseSearch} onChange={e => setUploadCourseSearch(e.target.value)}
                                    className="w-full pl-7 pr-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-100 rounded-lg outline-none focus:border-purple-400 text-gray-800 placeholder:text-gray-300"
                                  />
                                </div>
                              </div>
                              <div className="overflow-y-auto max-h-40">
                                {College_COURSES.filter(c => c.toLowerCase().includes(uploadCourseSearch.toLowerCase())).map(course => (
                                  <button key={course} type="button"
                                    onClick={() => { setFormData(d => ({ ...d, course })); setUploadCourseOpen(false); setUploadCourseSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between gap-2 transition-colors ${formData.course === course ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    <span className="truncate">{course}</span>
                                    {formData.course === course && <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />}
                                  </button>
                                ))}
                                {College_COURSES.filter(c => c.toLowerCase().includes(uploadCourseSearch.toLowerCase())).length === 0 && (
                                  <div className="px-3 py-4 text-center text-xs text-gray-400">No courses found</div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Type + Subject Code */}
                  {!isPlaylistContext && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type <span className="text-red-400">*</span></label>
                        <div className="flex flex-wrap gap-2">
                          {(['Note', 'PYQ', 'Book', 'Playlist'] as const).map(t => (
                            <button key={t} type="button"
                              onClick={() => setFormData(d => ({ ...d, type: t }))}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.type === t ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <input type="text" required readOnly value={formData.type} tabIndex={-1} className="sr-only" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Code <span className="text-gray-300">(optional)</span></label>
                        <input type="text" placeholder="e.g. 11017502"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.subjectCode} onChange={e => setFormData({ ...formData, subjectCode: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Semester pills */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semester <span className="text-red-400">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: COURSE_METADATA[formData.course]?.semesters || 8 }, (_, i) => i + 1).map(sem => (
                        <button key={sem} type="button"
                          onClick={() => setFormData(d => ({ ...d, semester: String(sem) }))}
                          className={`w-10 h-9 rounded-xl text-xs font-black border transition-all ${formData.semester === String(sem) ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300 hover:text-purple-700'}`}
                        >
                          {sem}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link / File */}
                  {isPlaylistContext ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">YouTube Playlist Link <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input required type="url" placeholder="https://youtube.com/playlist?list=…"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource Link</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input required={!formData.file} type="url" placeholder="https://drive.google.com/…"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                            value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload File</label>
                        <div
                          {...getRootProps()}
                          className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2 ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'}`}
                        >
                          <input {...getInputProps()} />
                          {formData.file ? (
                            <div className="flex items-center gap-2 w-full">
                              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              <span className="text-xs font-bold text-gray-700 truncate flex-1">{formData.file.name}</span>
                              <button type="button" onClick={e => { e.stopPropagation(); setFormData(p => ({ ...p, file: null })); }} className="text-red-400 hover:text-red-600 font-black text-[10px] uppercase tracking-wider shrink-0">✕</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Upload className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-medium">PDF, JPG · Max 15MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags + Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags <span className="text-gray-300">(comma separated)</span></label>
                    <input type="text" placeholder="e.g. economics, micro, unit1"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                      value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description <span className="text-gray-300">(optional)</span></label>
                    <textarea rows={3} placeholder="Tell students what this resource covers…"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium resize-none"
                      value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Duplicate warning */}
                  {duplicateWarningResource && !duplicateWarningAcknowledged && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-orange-800">Possible Duplicate Playlist</h4>
                          <p className="text-xs text-orange-700 mt-1 font-medium leading-relaxed">
                            We found an existing playlist matching this YouTube link:<br />
                            <span className="font-bold text-orange-900 mt-1 inline-block">"{duplicateWarningResource.title}"</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <button type="button" onClick={() => setDuplicateWarningResource(null)} className="px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-100 rounded-lg transition-colors">
                          Cancel Upload
                        </button>
                        <button type="button" onClick={() => setDuplicateWarningAcknowledged(true)} className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md transition-colors">
                          Upload Anyway
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={uploadStatus === 'uploading'}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {uploadStatus === 'uploading'
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><CheckCircle2 className="w-4 h-4" /> Publish Resource</>}
                  </motion.button>
                </>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
