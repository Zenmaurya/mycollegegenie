import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { reportResource } from '../services/resourceService';
import type { Resource, SupabaseAuthUser } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  user: SupabaseAuthUser | null;
  onReported?: (resourceId: string, reason: string) => void;
}

export function ReportModal({ isOpen, onClose, resource, user, onReported }: ReportModalProps) {
  const [reportReason, setReportReason] = useState('');

  const handleClose = () => {
    setReportReason('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resource || !reportReason.trim()) return;

    try {
      await reportResource(resource.id, reportReason.trim());
      toast.success('Resource reported. Thank you for keeping the hub safe.');
      onReported?.(resource.id, reportReason.trim());
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-rose-600">
              <Flag className="w-5 h-5" /> Report Resource
            </h2>
            <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!user ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                  <p className="text-gray-500 font-medium">You need to be signed in to report a resource.</p>
                </div>
                <Link to="/login" className="w-full sm:w-auto px-8 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-rose-600/20 block text-center">
                  Sign In to Continue
                </Link>
              </div>
            ) : (
              <>
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-rose-600 leading-relaxed">
                    Please provide a reason for reporting this resource. Our team will review it for inappropriate content or inaccuracies.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Report</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe the issue (e.g., wrong subject, offensive content, spam)..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium resize-none"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all">
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!reportReason.trim()}
                    className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Flag className="w-4 h-4" /> Submit Report
                  </motion.button>
                </div>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
