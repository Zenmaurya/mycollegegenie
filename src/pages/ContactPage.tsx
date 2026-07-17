import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
  Mail, MessageSquare, Send, ArrowLeft, CheckCircle2,
  MapPin, Globe, Users, Instagram, Linkedin, Twitter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Resource Issue',
  'Join the Team',
  'Feedback',
  'Report a Bug',
  'Other',
];

// Discord SVG path (lucide doesn't include it)
const DiscordIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
  </svg>
);

const RedditIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.057 1.597.047.253.075.512.075.77 0 2.461-2.851 4.46-6.358 4.46-3.506 0-6.358-1.999-6.358-4.46 0-.258.028-.517.075-.77a1.756 1.756 0 0 1-1.057-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.174-.87 2.81-1.44 4.617-1.523l.71-3.326 2.456.519c-.098.192-.16.409-.16.639 0 .688.562 1.25 1.25 1.25zM9.03 13.003c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm5.94 0c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139z"/>
  </svg>
);

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Send to backend or mailto fallback
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch {
      // Fallback to mailto if backend not available
      const mailto = `mailto:support@mycollegegenie.in?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
      window.location.href = mailto;
      setStatus('success');
    }
    setTimeout(() => setStatus('idle'), 6000);
  };

  const inputClass =
    'w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-5 py-3.5 sm:py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-medium placeholder:text-gray-400';
  const labelClass = 'block text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1';

  return (
    <div className="min-h-screen bg-transparent pt-6 sm:pt-8 pb-24 md:pb-8">
            <Helmet>
        <title>Contact Us | MyCollegeGenie</title>
        <meta name="description" content="Get in touch with the MyCollegeGenie team. We are here to help you with any queries, suggestions, or feedback." />
        <link rel="canonical" href="https://mycollegegenie.in/contact" />
      </Helmet>

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-24 -left-20 w-80 h-80 bg-brand-primary/20/30 rounded-full blur-3xl" />
        <div className="absolute top-60 right-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ← Back (shares same left edge as columns) */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-primary font-black uppercase tracking-widest mb-10 hover:gap-3 transition-all text-[10px] sm:text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 items-start">

          {/* ── LEFT COLUMN — Info panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            {/* Icon + heading */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-brand-surface flex items-center justify-center mb-6 sm:mb-8 mx-auto lg:mx-0">
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-brand-primary" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
              Get in Touch{' '}
              <br className="hidden sm:block" />
              <span className="text-brand-primary">With Our Team</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium mb-10 sm:mb-12 leading-relaxed max-w-md mx-auto lg:mx-0">
              Have a question about a resource? Want to join our moderation team? Or just want to say hi? We're always here to help.
            </p>

            {/* Info rows */}
            <div className="space-y-7 text-left max-w-sm mx-auto lg:mx-0">

              {/* Location */}
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-0.5 text-sm sm:text-base">Our Location</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm leading-relaxed">
                    North Zone, University<br />New Delhi, India
                  </p>
                </div>
              </div>

              {/* Social media */}
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-0.5 text-sm sm:text-base">Social Media</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm mb-3">Follow us @MyCollegeGenie</p>
                  <div className="flex gap-2">
                    {[
                      { href: 'https://instagram.com', icon: <Instagram className="w-4 h-4" />, color: '#E4405F', label: 'Instagram' },
                      { href: 'https://twitter.com',  icon: <Twitter   className="w-4 h-4" />, color: '#1DA1F2', label: 'Twitter'   },
                      { href: 'https://linkedin.com', icon: <Linkedin  className="w-4 h-4" />, color: '#0077B5', label: 'LinkedIn'  },
                    ].map(s => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Follow us on ${s.label}`}
                        className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                        style={{ color: s.color }}
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Community */}
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-0.5 text-sm sm:text-base">Community</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm mb-3">Join our servers for real-time updates</p>
                  <div className="flex gap-2">
                    <a
                      href="https://discord.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Join our Discord server"
                      className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all text-[#5865F2]"
                    >
                      <DiscordIcon />
                    </a>
                    <a
                      href="https://www.reddit.com/r/AskMyCollegeGenie"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Join our Reddit community"
                      className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all text-[#FF4500]"
                    >
                      <RedditIcon />
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-surface flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-0.5 text-sm sm:text-base">Email Us Directly</h3>
                  <a
                    href="mailto:support@mycollegegenie.in"
                    className="text-brand-primary font-semibold text-xs sm:text-sm hover:underline underline-offset-2"
                  >
                    support@mycollegegenie.in
                  </a>
                </div>
              </div>

            </div>
          </motion.div>

          {/* ── RIGHT COLUMN — Contact form ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-7 sm:p-10 shadow-2xl shadow-brand-dark/5 relative overflow-hidden"
          >
            {/* Decorative blob inside card */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/20/50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

            <form ref={formRef} onSubmit={handleSubmit} className="relative z-10 space-y-5 sm:space-y-6">
              {/* Name + Email row */}
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                <div>
                  <label htmlFor="name" className={labelClass}>Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Rahul Yadav"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="rahul@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Subject — pill chips */}
              <div>
                <label className={labelClass}>Subject</label>
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, subject: opt }))}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-all ${
                        formData.subject === opt
                          ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-brand-primary/20 hover:bg-brand-surface hover:text-brand-primary'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className={labelClass}>Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`${inputClass} resize-none`}
                  placeholder="How can we help you?"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className={`w-full py-4 sm:py-5 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wide shadow-lg transition-all flex items-center justify-center gap-3 ${
                  status === 'success'
                    ? 'bg-green-500 text-white shadow-green-500/25 cursor-default'
                    : status === 'error'
                    ? 'bg-red-500 text-white shadow-red-500/25'
                    : 'bg-brand-primary text-white shadow-brand-primary/25 hover:bg-brand-primary hover:shadow-brand-primary/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {status === 'idle' && (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
                {status === 'sending' && (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {status === 'success' && (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Message Sent!
                  </>
                )}
                {status === 'error' && 'Failed — try email directly'}
              </button>

              {status === 'success' && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm font-bold text-green-600"
                >
                  🎉 Thank you! We'll get back to you within 24–48 hours.
                </motion.p>
              )}

              {/* Fallback note */}
              <p className="text-center text-[10px] sm:text-xs text-gray-400 font-medium pt-1">
                Or email us directly at{' '}
                <a href="mailto:support@mycollegegenie.in" className="text-brand-primary hover:underline font-bold">
                  support@mycollegegenie.in
                </a>
                <br className="hidden sm:block" />
                <span className="sm:inline block mt-1 sm:mt-0">
                  {' '}You can also ask for help on our{' '}
                  <a href="https://www.reddit.com/r/AskMyCollegeGenie" target="_blank" rel="noopener noreferrer" className="text-[#FF4500] hover:underline font-bold">
                    Reddit Community
                  </a>
                </span>
              </p>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

