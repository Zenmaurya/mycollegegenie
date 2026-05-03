import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-24">
      <Helmet>
        <title>Privacy Policy | MyCollegeGenie</title>
        <meta name="description" content="Read MyCollegeGenie's privacy policy. Learn how we collect, use and protect your data." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://mycollegegenie.in/privacy" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-purple-600 font-black uppercase tracking-widest mb-8 sm:mb-12 hover:gap-3 transition-all text-[10px] sm:text-xs px-2 sm:px-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 sm:mb-20"
        >
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-purple-50 flex items-center justify-center mb-6 sm:mb-10">
            <Shield className="w-7 h-7 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Privacy Policy</h1>
          <p className="text-xs sm:text-lg text-gray-400 font-black uppercase tracking-widest">Last updated: March 25, 2026</p>
        </motion.div>

        <div className="space-y-12 sm:space-y-20">
          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              Information We Collect
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>
                At My College Genie, we collect minimal information to provide you with the best possible experience. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-3 sm:space-y-4 mt-6">
                <li><strong className="text-gray-900">Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.</li>
                <li><strong className="text-gray-900">Usage Data:</strong> We collect information about which resources you view, save, and rate to improve our recommendations.</li>
                <li><strong className="text-gray-900">Uploaded Content:</strong> Any resources you upload, including titles, descriptions, and links, are stored on our secure servers.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              How We Use Your Data
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>Your data is used solely for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-3 sm:space-y-4 mt-6">
                <li>To personalize your experience and show relevant academic resources.</li>
                <li>To maintain the integrity of our community through moderation and reporting systems.</li>
                <li>To provide you with updates about new features or important campus news.</li>
                <li>We <strong className="text-gray-900">never</strong> sell your personal information to third parties.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              Data Security
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>
                We use industry-standard security measures provided by Google Firebase to protect your data. This includes encryption in transit and at rest. Access to sensitive data is strictly controlled through server-side security rules.
              </p>
            </div>
          </section>

          <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 border border-gray-100 shadow-xl shadow-purple-900/5">
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 tracking-tight">Questions or Concerns?</h2>
            <p className="text-sm sm:text-lg text-gray-500 font-medium mb-8 sm:mb-10">
              If you have any questions about our privacy practices or would like to request the deletion of your data, please contact our student moderation team.
            </p>
            <a 
              href="mailto:support@mycollegegenie.com" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 transition-all shadow-sm w-full sm:w-auto"
            >
              Contact Support
              <ChevronRight className="w-4 h-4" />
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};
