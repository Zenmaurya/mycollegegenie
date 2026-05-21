/**
 * VerificationApplyModal.tsx
 * Paid verification application modal for PG & Exchange listings.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, CreditCard, Phone, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { toast } from 'sonner';

interface VerificationApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingType: 'pg' | 'exchange';
  listingId: string;
  listingTitle: string;
}

const VERIFICATION_FEE = 99; // ₹99

export const VerificationApplyModal: React.FC<VerificationApplyModalProps> = ({
  isOpen,
  onClose,
  listingType,
  listingId,
  listingTitle,
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    user_phone: '',
    payment_ref: '',
    notes: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://api.mycollegegenie.in';

  const handleSubmit = async () => {
    if (!form.payment_ref.trim()) {
      toast.error('Please enter your payment reference / UTR number');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please sign in first'); return; }

      const res = await fetch(`${API_URL}/api/verification/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          listing_type: listingType,
          listing_id: listingId,
          listing_title: listingTitle,
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit');
        return;
      }
      setStep('success');
      toast.success('Verification request submitted!');
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setForm({ user_phone: '', payment_ref: '', notes: '' });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', inset: 0 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl z-10"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 p-6 sm:p-8">
              <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-xl hover:bg-white/40 transition-all">
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Get Verified</h2>
                  <p className="text-amber-900/80 text-xs font-bold uppercase tracking-widest">
                    {listingType === 'pg' ? 'PG Listing' : 'Exchange Listing'} Verification
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {step === 'info' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {[
                      { icon: '🏅', text: 'Gold Verified badge on your listing' },
                      { icon: '📈', text: 'Higher visibility & more inquiries' },
                      { icon: '🔒', text: 'Identity & details verified by our team' },
                      { icon: '✉️', text: 'Faster response from serious buyers/tenants' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                        <span className="text-lg">{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-black text-amber-900">Verification Fee</span>
                    <span className="text-2xl font-black text-amber-600">₹{VERIFICATION_FEE}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Your Phone (for contact)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.user_phone}
                      onChange={e => setForm(f => ({ ...f, user_phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setStep('payment')}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-400/30 hover:scale-[1.02] transition-all text-sm"
                  >
                    Proceed to Payment →
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center space-y-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pay via UPI</p>
                    <p className="text-2xl font-black text-gray-900 font-mono tracking-wider">mycollegegenie@upi</p>
                    <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5" />
                      ₹{VERIFICATION_FEE} — Verification Fee
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 font-medium">After payment, enter your UTR/transaction ID below. Our team will verify within 24 hours.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Payment Reference / UTR No. *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 425123456789"
                      value={form.payment_ref}
                      onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Additional Notes (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Any extra info for our team..."
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('info')} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-gray-50 transition-all">
                      ← Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-2 flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-400/30 hover:scale-[1.02] transition-all text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request ✓'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center space-y-5 py-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Request Submitted!</h3>
                    <p className="text-sm text-gray-500 mt-2 font-medium">
                      Our team will verify your listing within <b>24 hours</b>. You'll receive an email confirmation.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default VerificationApplyModal;
