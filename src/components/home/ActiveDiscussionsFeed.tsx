import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export function ActiveDiscussionsFeed() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center bg-brand-dark rounded-2xl sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-mark/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 text-center lg:text-left">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-primary/30 flex items-center justify-center mb-4 sm:mb-6 backdrop-blur-xl border border-brand-primary/30 mx-auto lg:mx-0">
            <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-5 tracking-tight leading-tight">
            Active <br className="hidden sm:block" />
            <span className="text-brand-primary/20">Discussions</span>
          </h2>
          <p className="text-sm sm:text-base text-brand-primary/20/80 mb-6 sm:mb-8 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 px-1 sm:px-0">
            Connect with fellow students, ask questions about courses, and discuss exam strategies.
          </p>
          <Link 
            to="/forum"
            className="inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white text-brand-dark rounded-2xl font-black text-sm sm:text-base hover:bg-brand-surface transition-all shadow-2xl shadow-black/20 group w-full sm:w-auto"
          >
            Go to Forum
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="relative z-10 grid gap-3 sm:gap-4 mt-6 lg:mt-0">
          {[
            { title: 'How to prepare for Microeconomics?', author: 'Rahul S.', replies: 12, time: '2h ago' },
            { title: 'Best books for Corporate Accounting?', author: 'Priya M.', replies: 8, time: '5h ago' },
            { title: 'Internal Assessment dates for Hansraj?', author: 'Amit K.', replies: 15, time: '1d ago' }
          ].map((post, i) => (
            <motion.div 
              key={i}
              whileHover={{ x: 6 }}
              className="bg-white/10 backdrop-blur-md border border-white/10 p-4 sm:p-5 rounded-2xl hover:bg-white/20 transition-all cursor-pointer group flex flex-col gap-2"
            >
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-primary/20 transition-colors line-clamp-1">{post.title}</h3>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-brand-primary/20/70">
                <div className="flex items-center gap-3">
                  <span>{post.author}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.replies}
                  </span>
                </div>
                <span>{post.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
