import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export function BlogPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white">
            <Helmet>
        <title>Student Life Blog - Career, Internships & Tips | MyCollegeGenie</title>
        <meta name="description" content="Read our latest articles on college survival guides, internship cracking tips, career advice, and student lifestyle from MyCollegeGenie experts." />
        <meta name="keywords" content="college survival guide, how to get internship, student career advice, college lifestyle blog, interview preparation tips" />
        <link rel="canonical" href="https://mycollegegenie.in/blog" />
        
        <meta property="og:type" content="blog" />
        <meta property="og:url" content="https://mycollegegenie.in/blog" />
        <meta property="og:title" content="Student Life Blog - Career, Internships & Tips | MyCollegeGenie" />
        <meta property="og:description" content="Read our latest articles on college survival guides, internship cracking tips, career advice, and student lifestyle from MyCollegeGenie experts." />
        <meta property="og:image" content="https://mycollegegenie.in/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Student Life Blog - Career, Internships & Tips | MyCollegeGenie" />
        <meta name="twitter:description" content="Read our latest articles on college survival guides, internship cracking tips, career advice, and student lifestyle from MyCollegeGenie experts." />
        <meta name="twitter:image" content="https://mycollegegenie.in/og-image.png" />
      </Helmet>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-mark/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto z-10"
      >
        <div className="w-24 h-24 mx-auto bg-brand-surface border border-brand-primary/20 rounded-3xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform duration-300">
          <FileText className="w-10 h-10 text-brand-primary" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 tracking-tight">
          Our Blog is <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-mark">Coming Soon</span>
        </h1>
        
        <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-xl mx-auto">
          We're preparing some amazing stories, guides, and updates from the student community. Stay tuned for expert advice, college hacks, and platform news!
        </p>

        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors hover:shadow-lg"
        >
          Return to Homepage
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}

