import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, ArrowLeft, CheckCircle2, AlertCircle, MapPin, Globe, Users, Instagram, Linkedin, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate sending
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-24">
      <Helmet>
        <title>Contact Us | MyCollegeGenie - DU Student Platform</title>
        <meta name="description" content="Get in touch with the MyCollegeGenie team. Report issues, suggest features or partner with us to help Delhi University students." />
        <link rel="canonical" href="https://mycollegegenie.in/contact" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-purple-600 font-bold mb-8 hover:gap-3 transition-all text-sm sm:text-base px-2 sm:px-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center lg:text-left"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 mx-auto lg:mx-0">
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
              Get in Touch <br className="hidden sm:block" />
              <span className="text-purple-600">With Our Team</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 font-medium mb-10 sm:mb-12 leading-relaxed px-2 sm:px-0">
              Have a question about a resource? Want to join our moderation team? Or just want to say hi? We're always here to help.
            </p>

            <div className="space-y-6 sm:space-y-8 text-left max-w-md mx-auto lg:mx-0">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Our Location</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm">North Campus, Delhi University, New Delhi, India</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Social Media</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm mb-3">Follow us @MyCollegeGenie</p>
                  <div className="flex gap-3">
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#E4405F] hover:bg-[#E4405F]/5 transition-all group shadow-sm"
                      title="Instagram"
                      aria-label="Follow us on Instagram"
                    >
                      <Instagram className="w-4 h-4 text-[#E4405F]" />
                    </a>
                    <a 
                      href="https://twitter.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#1DA1F2] hover:bg-[#1DA1F2]/5 transition-all group shadow-sm"
                      title="Twitter"
                      aria-label="Follow us on Twitter"
                    >
                      <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    </a>
                    <a 
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#0077B5] hover:bg-[#0077B5]/5 transition-all group shadow-sm"
                      title="LinkedIn"
                      aria-label="Follow us on LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Community</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm mb-3">Join our servers for real-time updates</p>
                  <div className="flex gap-3">
                    <a 
                      href="https://discord.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#5865F2] hover:bg-[#5865F2]/5 transition-all group shadow-sm"
                      title="Discord"
                      aria-label="Join our Discord server"
                    >
                      <svg className="w-4 h-4 fill-current text-[#5865F2]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://reddit.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#FF4500] hover:bg-[#FF4500]/5 transition-all group shadow-sm"
                      title="Reddit"
                      aria-label="Join our Reddit community"
                    >
                      <svg className="w-4 h-4 fill-current text-[#FF4500]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.057 1.597.047.253.075.512.075.77 0 2.461-2.851 4.46-6.358 4.46-3.506 0-6.358-1.999-6.358-4.46 0-.258.028-.517.075-.77a1.756 1.756 0 0 1-1.057-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.174-.87 2.81-1.44 4.617-1.523l.71-3.326 2.456.519c-.098.192-.16.409-.16.639 0 .688.562 1.25 1.25 1.25zM9.03 13.003c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm5.94 0c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm-5.956 3.387c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128zm3.96 0c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/40 backdrop-blur-md border border-gray-100 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-2xl shadow-purple-900/5 relative overflow-hidden"
          >
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <form onSubmit={handleSubmit} className="relative z-10 space-y-5 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                <select 
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option>General Inquiry</option>
                  <option>Resource Issue</option>
                  <option>Join the Team</option>
                  <option>Feedback</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Message</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-medium resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button 
                type="submit"
                disabled={status === 'sending' || status === 'success'}
                className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  status === 'success' 
                    ? 'bg-green-500 text-white shadow-green-500/20' 
                    : 'bg-purple-600 text-white shadow-purple-600/20 hover:bg-purple-700 hover:scale-[1.02]'
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
              </button>

              {status === 'success' && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm font-bold text-green-600"
                >
                  Thank you! We'll get back to you within 24-48 hours.
                </motion.p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
