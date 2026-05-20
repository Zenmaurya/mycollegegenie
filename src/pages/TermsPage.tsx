import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Scale, FileText, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent pt-6 sm:pt-8 pb-24">
      <Helmet>
        <title>Terms of Service | MyCollegeGenie</title>
        <meta name="description" content="Read MyCollegeGenie's terms of service and usage guidelines for India's biggest student platform." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://mycollegegenie.in/terms" />
      </Helmet>

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-40 -right-24 w-80 h-80 bg-orange-200/25 rounded-full blur-3xl" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-1/4 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ← Back */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-purple-600 font-black uppercase tracking-widest mb-10 hover:gap-3 transition-all text-[10px] sm:text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-purple-50 flex items-center justify-center mb-8">
            <Scale className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
            Terms of <span className="text-purple-600">Service</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-widest">
            Last updated: March 25, 2026
          </p>
        </motion.div>

        <div className="space-y-8">

          {/* Section 1 — Acceptance */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
          >
            <div className="flex items-start gap-4 sm:gap-5 mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Acceptance of Terms
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest border border-teal-200 flex-shrink-0">
                    Required to Use
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
              By accessing or using My College Genie, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service. These terms apply to all visitors, users, and others who access or use the platform.
            </p>
          </motion.section>

          {/* Section 2 — User Conduct */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
          >
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              User Conduct &amp; Content
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-6">
              When using our platform, you agree to:
            </p>
            <ul className="space-y-4">
              {[
                'Only upload resources that you have the right to share.',
                'Not upload any content that is infringing, defamatory, or otherwise unlawful.',
                'Respect the academic integrity of University and your respective colleges.',
                'Not use the platform for any commercial solicitation or spam.',
              ].map(text => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-orange-600" strokeWidth={3} />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Section 3 — Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-lg shadow-purple-900/5"
          >
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6 flex items-center gap-4 tracking-tight">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              Disclaimer of Warranties
            </h2>
            {/* Student-friendly callout */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6">
              <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
              <p className="text-sm font-bold text-amber-800">
                My College Genie is a <em>student-led initiative</em>. We provide resources "as is" and do not guarantee the accuracy, completeness, or usefulness of any content.
              </p>
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
              Use of the resources is at your own risk. We are not responsible for any academic decisions made solely based on content found on this platform. Always verify with your official college or university sources.
            </p>
          </motion.section>

          {/* Section 4 — Intellectual Property */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-xl shadow-purple-900/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                Intellectual Property
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest border border-purple-200 flex-shrink-0">
                <GraduationCap className="w-3.5 h-3.5" />
                Student-Led Initiative
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed relative z-10">
              The platform design, logo, and original content are the property of My College Genie. User-uploaded resources remain the property of their respective creators, but by uploading, you grant us a license to display and distribute them within the platform for educational purposes.
            </p>
          </motion.section>

        </div>
      </div>
    </div>
  );
};
