import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { addTestimonial } from '../services/testimonialService';

interface TestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestimonialModal: React.FC<TestimonialModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [image, setImage] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      await addTestimonial({
        name: name.trim(),
        handle: handle.trim(),
        image: image.trim(),
        text: text.trim().substring(0, 300)
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setName('');
        setHandle('');
        setImage('');
        setText('');
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 relative z-10 shadow-2xl border border-gray-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-500">Your testimonial has been submitted.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-purple-600" />
                Share your thought
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!auth.currentUser ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Sign in Required</h3>
                      <p className="text-gray-500 font-medium text-sm">
                        You need to be signed in to submit a testimonial. Join the community and share your thoughts!
                      </p>
                    </div>
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-purple-600/20 block text-center"
                    >
                      Sign In to Continue
                    </Link>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Kumar"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Social Handle (Optional)
                      </label>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="e.g. @rahul_123"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Profile Picture URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Testimonial *
                      </label>
                      <textarea
                        required
                        rows={4}
                        maxLength={300}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="How has MyCollegeGenie helped you?"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none text-sm font-medium resize-none"
                      />
                      <div className="text-right mt-1 text-[10px] sm:text-xs text-gray-400 font-bold">
                        {text.length}/300 characters
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!name.trim() || !text.trim() || isSubmitting}
                      className="w-full mt-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
                    </button>
                  </>
                )}
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
