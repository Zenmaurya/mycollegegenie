import React from 'react';

export const AuthPanel: React.FC<{ isModal?: boolean }> = ({ isModal = false }) => {
  return (
    <div className={`flex flex-col bg-[var(--brand)] text-[var(--paper)] ${isModal ? 'p-8 sm:p-10 w-full sm:w-[45%] lg:w-[400px]' : 'p-10 lg:p-14 w-full min-h-full'} shrink-0 relative overflow-hidden justify-between`}>
      {/* Background illustration */}
      <div className="absolute right-[-40px] bottom-[-20px] opacity-10 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" className="w-[300px] h-[300px]">
          <rect x="30" y="40" width="110" height="14" rx="4" fill="#EFEFE8"/>
          <rect x="30" y="64" width="140" height="14" rx="4" fill="#EFEFE8"/>
          <rect x="30" y="88" width="90" height="14" rx="4" fill="#E2A33B"/>
          <rect x="30" y="112" width="120" height="14" rx="4" fill="#EFEFE8"/>
          <circle cx="160" cy="150" r="22" stroke="#E2A33B" strokeWidth="3"/>
          <path d="M152 150l5 5 11-11" stroke="#EFEFE8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-12">
          <img src="/genie_yellow.webp" alt="Genie Logo" className="w-[30px] h-[30px] object-contain drop-shadow-md" />
          <div>
            <b className="font-['Fraunces'] text-[17px] font-semibold block leading-tight">My College Genie</b>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16261F] text-[#DCE6E0] text-[11px] font-semibold tracking-wider uppercase mb-6 border border-white/5">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M13 2 3 14h7l-1 8 11-14h-7z"/></svg>
          Built by students, for students
        </span>

        <h1 className="font-['Fraunces'] text-[32px] sm:text-[38px] font-semibold leading-[1.1] mb-4 text-white">
          Every doubt has<br />already been <em className="text-[#E2A33B] not-italic relative z-10 inline-block">asked<div className="absolute -bottom-0.5 left-0 right-0 h-[6px] bg-[#E2A33B]/30 -z-10 rounded-full" /></em> here.
        </h1>
        <p className="text-[15px] leading-relaxed text-[#DCE6E0] max-w-[340px]">
          {isModal 
            ? 'Sign in to ask, answer, and save resources to your course library.'
            : "Notes, previous-year papers and a forum where someone's probably already solved your exact problem."}
        </p>
      </div>

      <div className="relative z-10 mt-12 flex flex-col gap-5">
        <div className="flex flex-col">
          <b className="font-['Fraunces'] text-[20px] text-white">Resources</b>
          <span className="text-[13px] text-[#DCE6E0] opacity-80">Access notes and previous-year papers</span>
        </div>
        <div className="flex flex-col">
          <b className="font-['Fraunces'] text-[20px] text-white">Community</b>
          <span className="text-[13px] text-[#DCE6E0] opacity-80">Connect with students and find answers</span>
        </div>
        {!isModal && (
          <div className="flex flex-col">
            <b className="font-['Fraunces'] text-[20px] text-white">Campus Exchange</b>
            <span className="text-[13px] text-[#DCE6E0] opacity-80">Buy, sell, and find PGs near your college</span>
          </div>
        )}
      </div>
    </div>
  );
};
