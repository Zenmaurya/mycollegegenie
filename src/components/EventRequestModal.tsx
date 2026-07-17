/**
 * EventRequestModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * "Publish Your Event" request modal.
 * Previously inlined in App.tsx lines 2328–2490.
 */
import React, { useState, useEffect } from 'react';
import { ForumService } from '../services/forumService';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Calendar, X, AlertCircle, Plus, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitEvent, submitNews } from '../services/newsService';
import { uploadResource } from '../services/resourceService';
import { createPGListing } from '../services/pgService';
import { createExchangeItem } from '../services/exchangeService';
import { fetchWithAuth } from '../lib/apiClient';

interface EventRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subTitle?: string;
  signInText?: string;
}

export function EventRequestModal({ isOpen, onClose, title = 'Publish Your Event', subTitle = 'Reach the entire Student Community', signInText = 'You must be signed in to submit.' }: EventRequestModalProps) {
  const { user, appUser, openAuthModal } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guilds, setGuilds] = useState<any[]>([]);

  useEffect(() => {
    ForumService.getGuilds()
      .then(data => {
        if (Array.isArray(data)) {
          setGuilds(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(false);

    try {
      if (title === 'Ask a Question') {
        await ForumService.createPost({
          title: formData.forumTitle,
          content: formData.forumContent,
          topic: formData.forumTopic || 'General',
          course: formData.forumCourse === 'All' ? '' : formData.forumCourse || '',
          authorId: user.id,
          authorName: user.email ? user.email.split('@')[0] : 'Anonymous'
        });
        toast.success('Guild thread published successfully!');
        handleClose();
        // Refresh the feed
        window.location.reload();
      } else if (title === 'Add a Playlist') {
        await uploadResource({
          title: formData.playlistTitle,
          description: formData.description || '',
          type: 'Playlist',
          course: formData.course || '',
          semester: Number(formData.semester) || 1,
          subCategory: '',
          subjectCode: formData.subjectCode || '',
          tags: [],
          link: formData.playlistLink,
          directDownloadLink: '',
          uploader: user.email || 'Anonymous',
          uploaderId: user.id || '',
        });
        toast.success('Playlist added successfully!');
        handleClose();
        window.location.reload();
      } else if (title === 'Post a Listing') {
        await createPGListing({
          college: formData.college || '',
          location: formData.pgName || '',
          budget: formData.budget || '',
          gender: (formData.pgType || 'Any') as any,
          description: formData.description || '',
          socialLink: formData.contactDetails || '',
          images: [],
        });
        toast.success('PG listing posted successfully!');
        handleClose();
        window.location.reload();
      } else if (title === 'Post an Ad') {
        await createExchangeItem({
          title: formData.itemTitle,
          category: formData.category || 'Books',
          type: formData.transactionType || 'sell',
          price: formData.transactionType === 'sell' ? Number(formData.price) || 0 : 0,
          description: formData.description || '',
          college: appUser?.college || 'St. Stephen\'s College',
          contact_phone: formData.contactDetails || '',
          is_active: true,
        });
        toast.success('Exchange ad posted successfully!');
        handleClose();
        window.location.reload();
      } else if (title === 'Contribute Resource') {
        await uploadResource({
          title: formData.resourceTitle,
          description: formData.description || '',
          type: (formData.resourceType || 'Note') as any,
          course: formData.course || '',
          semester: Number(formData.semester) || 1,
          subCategory: '',
          subjectCode: '',
          tags: [],
          link: formData.fileLink,
          directDownloadLink: '',
          uploader: user.email || 'Anonymous',
          uploaderId: user.id || '',
        });
        toast.success('Resource contributed successfully!');
        handleClose();
        window.location.reload();
      } else if (title === 'Post News') {
        await submitNews({
          title: formData.newsTitle,
          college: formData.college || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          summary: formData.summary || '',
          url: formData.referenceUrl || '',
        });
        toast.success('News update submitted for review!');
        handleClose();
        window.location.reload();
      } else {
        // Default: Post Event
        await submitEvent({
          title: formData.eventTitle,
          college: formData.college || '',
          date: formData.date || '',
          venue: formData.venue || '',
          eligibility: formData.eligibility || 'All',
          description: formData.description || '',
          imageUrl: '',
        });
        toast.success('Event request submitted for review!');
        handleClose();
        window.location.reload();
      }
    } catch (err) {
      console.error('[EventRequestModal] submit error:', err);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-[var(--paper)] border border-transparent rounded-xl px-4 py-3 text-[var(--ink)] placeholder-[var(--ink-soft)] focus:outline-none focus:bg-white focus:border-[var(--brand)] transition-all text-sm';

  const labelClass =
    'block text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider mb-1.5';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-transparent"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-['Fraunces'] font-bold text-gray-900 leading-tight">{title}</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">{subTitle}</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <form id="dynamic-request-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                {!user ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-[var(--brand-soft)] flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-[var(--brand)]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sign in Required</h3>
                    <p className="text-xs text-gray-500 mb-6 max-w-sm">
                      {signInText}
                    </p>
                    <button type="button" onClick={() => openAuthModal(signInText)} className="bg-[var(--brand)] hover:bg-[var(--brand-ink)] text-white w-full max-w-xs py-3 rounded-2xl font-bold transition-all">
                      Sign In to Continue
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Render different forms based on modal Title */}
                    {title === 'Ask a Question' && (
                      <>
                        <div>
                          <label className={labelClass}>Select Target Guild</label>
                          <select 
                            value={formData.forumTopic || 'General'}
                            onChange={e => setFormData({ ...formData, forumTopic: e.target.value })}
                            className={inputClass}
                          >
                            <option value="General">General Discussions</option>
                            {guilds.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Title / Topic Name</label>
                          <input required type="text" placeholder="What is this thread about?"
                            className={inputClass} value={formData.forumTitle || ''}
                            onChange={e => setFormData({ ...formData, forumTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Course Tag (Optional)</label>
                          <select
                            value={formData.forumCourse || 'All'}
                            onChange={e => setFormData({ ...formData, forumCourse: e.target.value })}
                            className={inputClass}
                          >
                            <option value="All">No course tag</option>
                            <option value="B.A. Economics">B.A. Economics</option>
                            <option value="B.A. English">B.A. English</option>
                            <option value="B.A. Hindi">B.A. Hindi</option>
                            <option value="B.A. Geography">B.A. Geography</option>
                            <option value="B.Com">B.Com</option>
                            <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Description / Body Content</label>
                          <textarea required rows={5} placeholder="Share details, questions, links, or opinions..."
                            className={`${inputClass} resize-none`} value={formData.forumContent || ''}
                            onChange={e => setFormData({ ...formData, forumContent: e.target.value })} />
                        </div>
                      </>
                    )}

                    {title === 'Add a Playlist' && (
                      <>
                        <div>
                          <label className={labelClass}>Playlist Title</label>
                          <input required type="text" placeholder="e.g. Master Econometrics in 10 Days"
                            className={inputClass} value={formData.playlistTitle || ''}
                            onChange={e => setFormData({ ...formData, playlistTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Course/Subject Name</label>
                          <input required type="text" placeholder="e.g. Introductory Econometrics"
                            className={inputClass} value={formData.course || ''}
                            onChange={e => setFormData({ ...formData, course: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Semester</label>
                            <select
                              value={formData.semester || '1'}
                              onChange={e => setFormData({ ...formData, semester: e.target.value })}
                              className={inputClass}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Subject Code (Optional)</label>
                            <input type="text" placeholder="e.g. ECON201"
                              className={inputClass} value={formData.subjectCode || ''}
                              onChange={e => setFormData({ ...formData, subjectCode: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>YouTube Playlist or Resource Link</label>
                          <input required type="url" placeholder="https://youtube.com/playlist?list=..."
                            className={inputClass} value={formData.playlistLink || ''}
                            onChange={e => setFormData({ ...formData, playlistLink: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Description / Summary</label>
                          <textarea required rows={3} placeholder="Describe the topics covered in this playlist..."
                            className={`${inputClass} resize-none`} value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                      </>
                    )}

                    {title === 'Post a Listing' && (
                      <>
                        <div>
                          <label className={labelClass}>PG Name / Location Description</label>
                          <input required type="text" placeholder="e.g. Sunny Girls PG, 5 min walk from SRCC"
                            className={inputClass} value={formData.pgName || ''}
                            onChange={e => setFormData({ ...formData, pgName: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Nearby College</label>
                          <input required type="text" placeholder="e.g. Shri Ram College of Commerce"
                            className={inputClass} value={formData.college || ''}
                            onChange={e => setFormData({ ...formData, college: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Rent / Budget (per month)</label>
                            <input required type="text" placeholder="e.g. Rs. 12,000"
                              className={inputClass} value={formData.budget || ''}
                              onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Preferred Gender</label>
                            <select
                              value={formData.pgType || 'Any'}
                              onChange={e => setFormData({ ...formData, pgType: e.target.value })}
                              className={inputClass}
                            >
                              <option value="Any">Any / Co-ed</option>
                              <option value="Male">Boys Only</option>
                              <option value="Female">Girls Only</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Amenities & Description</label>
                          <textarea required rows={4} placeholder="e.g. Single room, attached washroom, Wi-Fi, Food included, no curfew..."
                            className={`${inputClass} resize-none`} value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Contact Email/Phone/Instagram</label>
                          <input required type="text" placeholder="Where can students contact you?"
                            className={inputClass} value={formData.contactDetails || ''}
                            onChange={e => setFormData({ ...formData, contactDetails: e.target.value })} />
                        </div>
                      </>
                    )}

                    {title === 'Post an Ad' && (
                      <>
                        <div>
                          <label className={labelClass}>Item / Book Title</label>
                          <input required type="text" placeholder="e.g. Principles of Economics by Mankiw"
                            className={inputClass} value={formData.itemTitle || ''}
                            onChange={e => setFormData({ ...formData, itemTitle: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Category</label>
                            <select
                              value={formData.category || 'Books'}
                              onChange={e => setFormData({ ...formData, category: e.target.value })}
                              className={inputClass}
                            >
                              <option value="Books">Books</option>
                              <option value="Gadgets">Gadgets</option>
                              <option value="Fashion">Fashion</option>
                              <option value="Bicycle">Bicycle</option>
                              <option value="Others">Others</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Ad Type</label>
                            <select
                              value={formData.transactionType || 'sell'}
                              onChange={e => setFormData({ ...formData, transactionType: e.target.value })}
                              className={inputClass}
                            >
                              <option value="sell">Sell</option>
                              <option value="exchange">Exchange</option>
                              <option value="donate">Donate/Free</option>
                            </select>
                          </div>
                        </div>
                        {formData.transactionType === 'sell' && (
                          <div>
                            <label className={labelClass}>Price (in Rs.)</label>
                            <input required type="number" placeholder="e.g. 350"
                              className={inputClass} value={formData.price || ''}
                              onChange={e => setFormData({ ...formData, price: e.target.value })} />
                          </div>
                        )}
                        <div>
                          <label className={labelClass}>Item Description & Condition</label>
                          <textarea required rows={3} placeholder="Describe the item condition, usage details..."
                            className={`${inputClass} resize-none`} value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Contact Phone / Instagram / Email</label>
                          <input required type="text" placeholder="How can buyers reach you?"
                            className={inputClass} value={formData.contactDetails || ''}
                            onChange={e => setFormData({ ...formData, contactDetails: e.target.value })} />
                        </div>
                      </>
                    )}

                    {title === 'Contribute Resource' && (
                      <>
                        <div>
                          <label className={labelClass}>Resource Title</label>
                          <input required type="text" placeholder="e.g. Microeconomics Class Notes Unit 2"
                            className={inputClass} value={formData.resourceTitle || ''}
                            onChange={e => setFormData({ ...formData, resourceTitle: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Course Name</label>
                            <input required type="text" placeholder="e.g. B.A. Economics"
                              className={inputClass} value={formData.course || ''}
                              onChange={e => setFormData({ ...formData, course: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Resource Type</label>
                            <select
                              value={formData.resourceType || 'Note'}
                              onChange={e => setFormData({ ...formData, resourceType: e.target.value })}
                              className={inputClass}
                            >
                              <option value="Note">Note</option>
                              <option value="Book">Book</option>
                              <option value="Syllabus">Syllabus</option>
                              <option value="PYQ">PYQ / Question Paper</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Semester</label>
                          <select
                            value={formData.semester || '1'}
                            onChange={e => setFormData({ ...formData, semester: e.target.value })}
                            className={inputClass}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Google Drive / DropBox File URL</label>
                          <input required type="url" placeholder="https://drive.google.com/file/d/..."
                            className={inputClass} value={formData.fileLink || ''}
                            onChange={e => setFormData({ ...formData, fileLink: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Brief Description (Optional)</label>
                          <textarea rows={2} placeholder="Add any details or instructions for this resource..."
                            className={`${inputClass} resize-none`} value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                      </>
                    )}

                    {title === 'Post News' && (
                      <>
                        <div>
                          <label className={labelClass}>News Title</label>
                          <input required type="text" placeholder="e.g. DU SOL Notice: Exam Schedules Released"
                            className={inputClass} value={formData.newsTitle || ''}
                            onChange={e => setFormData({ ...formData, newsTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>College / Campus</label>
                          <input required type="text" placeholder="e.g. DU SOL"
                            className={inputClass} value={formData.college || ''}
                            onChange={e => setFormData({ ...formData, college: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Publish Date</label>
                            <input required type="date"
                              className={inputClass} value={formData.date || ''}
                              onChange={e => setFormData({ ...formData, date: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Reference URL / Source link</label>
                            <input type="url" placeholder="e.g. https://sol.du.ac.in/..."
                              className={inputClass} value={formData.referenceUrl || ''}
                              onChange={e => setFormData({ ...formData, referenceUrl: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>News Body / Summary</label>
                          <textarea required rows={4} placeholder="Summarize the announcement details here..."
                            className={`${inputClass} resize-none`} value={formData.summary || ''}
                            onChange={e => setFormData({ ...formData, summary: e.target.value })} />
                        </div>
                      </>
                    )}

                    {(title === 'Publish Your Event' || title === 'Post Event') && (
                      <>
                        <div>
                          <label className={labelClass}>Event Title</label>
                          <input required type="text" placeholder="e.g. Tarang 2026 - LSR Annual Cultural Fest"
                            className={inputClass} value={formData.eventTitle || ''}
                            onChange={e => setFormData({ ...formData, eventTitle: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Organizing College</label>
                          <input required type="text" placeholder="e.g. Lady Shri Ram College"
                            className={inputClass} value={formData.college || ''}
                            onChange={e => setFormData({ ...formData, college: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Event Date</label>
                            <input required type="date"
                              className={inputClass} value={formData.date || ''}
                              onChange={e => setFormData({ ...formData, date: e.target.value })} />
                          </div>
                          <div>
                            <label className={labelClass}>Venue</label>
                            <input required type="text" placeholder="e.g. College Auditorium"
                              className={inputClass} value={formData.venue || ''}
                              onChange={e => setFormData({ ...formData, venue: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Eligibility / Allowed Students</label>
                          <input required type="text" placeholder="e.g. All undergraduate students"
                            className={inputClass} value={formData.eligibility || 'All'}
                            onChange={e => setFormData({ ...formData, eligibility: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelClass}>Description / Schedule Details</label>
                          <textarea required rows={4} placeholder="Describe the event events, performers, registers details..."
                            className={`${inputClass} resize-none`} value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </form>
            </div>

            {/* Sticky footer */}
            {user && (
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  type="submit" form="dynamic-request-form"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--brand)] hover:bg-[var(--brand-ink)] text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-md">
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
