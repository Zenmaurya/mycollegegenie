/**
 * AppFooter.tsx
 * ─────────────────────────────────────────────────────────────────
 * Site-wide footer. Previously inlined in App.tsx lines 1476–1558.
 * Reads admin role from useAuth() context.
 */
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronRight, Linkedin, Instagram, LayoutGrid, ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AppFooterProps {
  /** Called when the user clicks the "Upload" link in the footer */
  onOpenUpload: () => void;
}

export function AppFooter({ onOpenUpload }: AppFooterProps) {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  // Show NEW badge for Campus Exchange — same 5-second window logic lives in NavBar,
  // but footer renders independently. Use a stable check: if still within first 5 s
  // of page load, show it.
  const pageLoadTime = (window as any).__pageLoadTime ?? ((window as any).__pageLoadTime = Date.now());
  const showNewBadge = Date.now() - pageLoadTime < 5000;

  return (
    <footer className="pt-8 lg:pt-16 pb-24 md:pb-8 lg:pb-8 px-4 bg-[#0B0914] border-t border-white/5 shrink-0 relative text-gray-400">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-8 lg:gap-12 mb-8 lg:mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-5 lg:col-span-4 pr-0 lg:pr-8 flex flex-col items-start text-left">
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-block mb-4 lg:mb-6 relative h-10 md:h-12 w-full flex items-end"
            >
              <img
                src="/logo.webp"
                alt="My College Genie"
                className="absolute left-0 -bottom-6 md:-bottom-10 h-28 md:h-36 lg:h-40 w-auto object-contain object-left filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:scale-110 origin-bottom-left transition-all"
              />
            </Link>
            <p className="text-[12px] lg:text-[13px] text-gray-400 leading-relaxed mb-4 lg:mb-6 w-full">
              Ek student ki asli zaroorat kya hoti hai? Sahi resources, sahi log, aur sahi direction.{' '}
              <strong className="text-gray-200 font-semibold">My College Genie</strong> ye teeno deta hai —{' '}
              <motion.span
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                whileInView={{ clipPath: 'inset(0 0 0 0)' }}
                transition={{ duration: 2, ease: 'linear' }}
                viewport={{ once: true }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold inline-block"
              >
                Notes se Naukri Tak.
              </motion.span>
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://www.linkedin.com/company/my-college-genie/" target="_blank" rel="noopener noreferrer" title="LinkedIn"
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group hover:-translate-y-1">
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a href="https://www.instagram.com/mycollegegenie.in" target="_blank" rel="noopener noreferrer" title="Instagram"
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-pink-500/50 hover:bg-pink-500/10 transition-all group hover:-translate-y-1">
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
              </a>
              <a href="https://www.reddit.com/r/AskMyCollegeGenie" target="_blank" rel="noopener noreferrer" title="Reddit"
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/50 hover:bg-orange-500/10 transition-all group hover:-translate-y-1">
                <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-orange-400 transition-colors" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.057 1.597.047.253.075.512.075.77 0 2.461-2.851 4.46-6.358 4.46-3.506 0-6.358-1.999-6.358-4.46 0-.258.028-.517.075-.77a1.756 1.756 0 0 1-1.057-1.597c0-.968.786-1.754 1.754-1.754.463 0 .875.18 1.183.479 1.174-.87 2.81-1.44 4.617-1.523l.71-3.326 2.456.519c-.098.192-.16.409-.16.639 0 .688.562 1.25 1.25 1.25zM9.03 13.003c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm5.94 0c-.629 0-1.139.51-1.139 1.139s.51 1.139 1.139 1.139c.629 0 1.139-.51 1.139-1.139s-.51-1.139-1.139-1.139zm-5.956 3.387c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128zm3.96 0c-.114 0-.227.044-.312.128a.438.438 0 0 0 0 .62c.712.712 2.03.712 2.74 0a.438.438 0 0 0 0-.62.438.438 0 0 0-.312-.128z"/>
                </svg>
              </a>
              <a href="https://discord.gg/JAjYHHUVg3" target="_blank" rel="noopener noreferrer" title="Discord"
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group hover:-translate-y-1">
                <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Academic Hub */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Academic Hub</h4>
            <ul className="space-y-4 font-medium text-[13px]">
              <li>
                <Link to="/" onClick={() => window.scrollTo(0, 0)} className="hover:text-purple-400 transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-purple-500" /> Home
                </Link>
              </li>
              <li>
                <button
                  onClick={() => { navigate('/browse'); }}
                  className="hover:text-purple-400 transition-colors flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 text-purple-500" /> Browse
                </button>
              </li>
              <li>
                <Link to="/playlists" className="hover:text-purple-400 transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-purple-500" /> Playlists
                </Link>
              </li>
              <li>
                <button onClick={onOpenUpload} className="hover:text-purple-400 transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-purple-500" /> Upload
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Life */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3">
            <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Campus Life</h4>
            <ul className="space-y-4 font-medium text-[13px]">
              <li><Link to="/find-pg" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Find PG</Link></li>
              <li>
                <Link to="/campus-exchange" className="hover:text-purple-400 transition-colors flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-purple-500" />
                  <ShoppingBag className="w-3 h-3" /> Campus Exchange
                  {showNewBadge && <span className="bg-[#FF0080] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">NEW</span>}
                </Link>
              </li>
              <li><Link to="/forum" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Student Forums</Link></li>
              <li><Link to="/news" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Official News</Link></li>
              <li><Link to="/events" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> College Events</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="col-span-2 md:col-span-3 lg:col-span-3">
            <h4 className="text-white font-bold mb-4 lg:mb-6 text-sm">Support &amp; Legal</h4>
            <ul className="space-y-4 font-medium text-[13px]">
              <li><Link to="/contact" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Contact Us</Link></li>
              <li><Link to="/blog" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Blog</Link></li>
              <li><Link to="/contributors" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Our Team &amp; Contributors</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Terms of Service</Link></li>
              {appUser?.role === 'admin' && (
                <li className="pt-2">
                  <Link to="/admin" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-bold bg-purple-500/10 px-3 py-2 rounded-lg inline-flex border border-purple-500/20">
                    <LayoutGrid className="w-4 h-4" /> Admin Panel
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium">
            © {new Date().getFullYear()} My College Genie. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5">
            Built with <span className="text-purple-400 animate-pulse">💜</span> for college students
          </div>
        </div>
      </div>
    </footer>
  );
}
