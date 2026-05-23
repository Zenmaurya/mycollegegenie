import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ChevronRight, ArrowLeft, Check, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { id: 'collect', label: 'Information We Collect' },
  { id: 'use',     label: 'How We Use Your Data'  },
  { id: 'security',label: 'Data Security'          },
];

export const PrivacyPage: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-transparent pt-6 sm:pt-8 pb-24">
            <Helmet>
        <title>Privacy Policy | MyCollegeGenie</title>
        <meta name="description" content="Read our privacy policy to understand how we protect your data." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 -left-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-64 right-0 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-48 left-1/3 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ← Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-600 font-black uppercase tracking-widest mb-10 hover:gap-3 transition-all text-[10px] sm:text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 xl:gap-16 items-start">

          {/* ── Sticky ToC sidebar (desktop only) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 bg-white/40 backdrop-blur-md border border-gray-100 rounded-3xl p-6 shadow-lg shadow-purple-900/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">Contents</p>
              <nav className="space-y-1">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-all group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-purple-500 transition-colors flex-shrink-0" />
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-14"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-purple-50 flex items-center justify-center mb-8">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                Privacy <span className="text-purple-600">Policy</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-widest">
                Last updated: March 25, 2026
              </p>
            </motion.div>

            <div className="space-y-8">

              {/* Section 1 — Information We Collect */}
              <motion.section
                id="collect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
              >
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  Information We Collect
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-6">
                  At My College Genie, we collect minimal information to provide you with the best possible experience. This includes:
                </p>
                <ul className="space-y-4">
                  {[
                    { label: 'Account Information', body: 'When you sign in with Google, we receive your name, email address, and profile picture.' },
                    { label: 'Usage Data', body: 'We collect information about which resources you view, save, and rate to improve our recommendations.' },
                    { label: 'Uploaded Content', body: 'Any resources you upload, including titles, descriptions, and links, are stored on our secure servers.' },
                  ].map(item => (
                    <li key={item.label} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-teal-600" strokeWidth={3} />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
                        <strong className="text-gray-900 font-bold">{item.label}:</strong> {item.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.section>

              {/* Section 2 — How We Use Your Data */}
              <motion.section
                id="use"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
              >
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  How We Use Your Data
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-6">
                  Your data is used solely for the following purposes:
                </p>
                <ul className="space-y-4 mb-6">
                  {[
                    'To personalize your experience and show relevant academic resources.',
                    'To maintain the integrity of our community through moderation and reporting systems.',
                    'To provide you with updates about new features or important campus news.',
                  ].map(text => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">{text}</p>
                    </li>
                  ))}
                </ul>
                {/* "Never sell" callout */}
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
                  <span className="text-red-500 text-lg flex-shrink-0">🚫</span>
                  <p className="text-sm font-bold text-red-700">
                    We <em>never</em> sell your personal information to third parties. Ever.
                  </p>
                </div>
              </motion.section>

              {/* Section 3 — Data Security */}
              <motion.section
                id="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
              >
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  Data Security
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-8">
                  We use industry-standard security measures provided by Supabase and Cloudinary to protect your data. This includes encryption in transit and at rest. Access to sensitive data is strictly controlled through server-side security rules.
                </p>
                {/* Security badges */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: <Shield className="w-3.5 h-3.5" />, label: '✓ SSL Encrypted', color: 'bg-teal-50 text-teal-700 border-teal-100' },
                    { icon: <Server className="w-3.5 h-3.5" />, label: '✓ Secure Servers', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { icon: <Lock className="w-3.5 h-3.5" />, label: '✓ Data Encrypted at Rest', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                  ].map(b => (
                    <span
                      key={b.label}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${b.color}`}
                    >
                      {b.icon}{b.label}
                    </span>
                  ))}
                </div>
              </motion.section>

              {/* CTA card */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl shadow-purple-900/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-3 tracking-tight relative z-10">
                  Questions or Concerns?
                </h2>
                <p className="text-sm sm:text-base text-gray-500 font-medium mb-8 relative z-10">
                  If you have any questions about our privacy practices or would like to request the deletion of your data, please contact our student moderation team.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <a
                    href="mailto:support@mycollegegenie.in"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-purple-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-600/25 w-full sm:w-auto"
                  >
                    Email Support
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.reddit.com/r/AskMyCollegeGenie"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#FF4500] text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-[#E03D00] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#FF4500]/25 w-full sm:w-auto"
                  >
                    Ask on Reddit
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

