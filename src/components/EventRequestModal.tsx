/**
 * EventRequestModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * "Publish Your Event" request modal.
 * Previously inlined in App.tsx lines 2328–2490.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Calendar, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitEvent } from '../services/newsService';

interface EventRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_EVENT = { college: '', title: '', date: '', description: '', contact: '' };

export function EventRequestModal({ isOpen, onClose }: EventRequestModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_EVENT);

  const handleClose = () => {
    setFormData(INITIAL_EVENT);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await submitEvent({
        title: formData.title,
        college: formData.college,
        date: formData.date,
        venue: '',
        eligibility: 'All',
        description: `${formData.description}\n\nContact: ${formData.contact}`,
      });
      toast.success('Event request submitted! Our team will review it shortly.');
      handleClose();
    } catch (err) {
      console.error('[EventRequestModal] submit error:', err);
      toast.error('Failed to submit event. Please try again.');
    }
  };

  const inputClass =
    'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
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
            className="relative w-full max-w-xl bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-fuchsia-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Publish Your Event</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reach the entire Student Community</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <form id="event-request-form" onSubmit={handleSubmit} className="p-6 space-y-4">
                {!user ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium">
                        You need to be signed in to publish an event.
                      </p>
                    </div>
                    <Link to="/login" className="w-full sm:w-auto px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-fuchsia-600/20 block text-center">
                      Sign In to Continue
                    </Link>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">College Name</label>
                      <input required type="text" placeholder="e.g. Hansraj College"
                        className={inputClass} value={formData.college}
                        onChange={e => setFormData({ ...formData, college: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Title</label>
                      <input required type="text" placeholder="e.g. Annual Cultural Fest 2026"
                        className={inputClass} value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Event Date</label>
                      <input required type="date"
                        className={inputClass} value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea required rows={3} placeholder="Briefly describe your event…"
                        className={`${inputClass} resize-none`} value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email/Phone</label>
                      <input required type="text" placeholder="Where can we reach you?"
                        className={inputClass} value={formData.contact}
                        onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Sticky footer */}
            {user && (
              <div className="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" form="event-request-form"
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-2">
                  Submit Request
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
