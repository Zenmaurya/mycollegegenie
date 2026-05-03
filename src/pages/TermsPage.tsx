import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Scale, FileText, CheckCircle2, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent pt-20 sm:pt-24 pb-24">
      <Helmet>
        <title>Terms of Service | MyCollegeGenie</title>
        <meta name="description" content="Read MyCollegeGenie's terms of service and usage guidelines for our Delhi University student platform." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://mycollegegenie.in/terms" />
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
            <Scale className="w-7 h-7 sm:w-10 sm:h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Terms of Service</h1>
          <p className="text-xs sm:text-lg text-gray-400 font-black uppercase tracking-widest">Last updated: March 25, 2026</p>
        </motion.div>

        <div className="space-y-12 sm:space-y-20">
          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              Acceptance of Terms
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>
                By accessing or using My College Genie, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              User Conduct & Content
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>When using our platform, you agree to:</p>
              <ul className="list-disc pl-6 space-y-3 sm:space-y-4 mt-6">
                <li>Only upload resources that you have the right to share.</li>
                <li>Not upload any content that is infringing, defamatory, or otherwise unlawful.</li>
                <li>Respect the academic integrity of Delhi University and your respective colleges.</li>
                <li>Not use the platform for any commercial solicitation or spam.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mb-6 sm:mb-8 flex items-center gap-4 tracking-tight">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              Disclaimer of Warranties
            </h2>
            <div className="prose prose-purple max-w-none text-gray-600 font-medium leading-relaxed text-sm sm:text-lg">
              <p>
                My College Genie is a student-led initiative. We provide resources "as is" and do not guarantee the accuracy, completeness, or usefulness of any content. Use of the resources is at your own risk.
              </p>
            </div>
          </section>

          <section className="bg-white/40 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 border border-gray-100 shadow-xl shadow-purple-900/5">
            <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 tracking-tight">Intellectual Property</h2>
            <p className="text-sm sm:text-lg text-gray-500 font-medium">
              The platform design, logo, and original content are the property of My College Genie. User-uploaded resources remain the property of their respective creators, but by uploading, you grant us a license to display and distribute them.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
