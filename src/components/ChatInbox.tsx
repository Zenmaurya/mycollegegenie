import React, { useState, useEffect } from 'react';
import { ChatService, ChatSession } from '../services/chatService';

interface ChatInboxProps {
  onClose: () => void;
  onOpenSession: (sessionId: string, otherUserName: string) => void;
}

export const ChatInbox: React.FC<ChatInboxProps> = ({ onClose, onOpenSession }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ChatService.getSessions()
      .then(data => {
        setSessions(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load inbox', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-[400px] h-full shadow-2xl flex flex-col translate-x-0 transition-transform"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[var(--brand)] text-white p-5 flex justify-between items-center shrink-0">
          <h2 className="font-['Fraunces'] font-semibold text-xl" style={{ color: '#E2A33B' }}>Inbox</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors" aria-label="Close inbox">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-[var(--brand)]/60 text-sm">Loading chats...</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--brand)" strokeWidth="1" className="opacity-20 mb-3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <p className="text-[var(--brand)]/60 text-[14px]">Your inbox is empty.<br/>Start a chat from an exchange listing or PG.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--brand)]/10">
              {sessions.map(s => (
                <div 
                  key={s.id}
                  onClick={() => onOpenSession(s.id, s.other_user_name || 'Anonymous')}
                  className="p-4 flex gap-4 items-center hover:bg-[var(--paper)] cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] shrink-0 overflow-hidden border border-[var(--brand)]/10">
                    {s.other_user_avatar ? (
                      <img src={s.other_user_avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-lg">{(s.other_user_name || 'A')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-[var(--brand)] truncate">{s.other_user_name}</h4>
                      {s.last_message_time && (
                        <span className="text-[11px] text-[var(--brand)]/50 shrink-0 ml-2">
                          {new Date(s.last_message_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[var(--brand)]/70 truncate">
                      {s.last_message || 'Start chatting...'}
                    </p>
                    {s.status === 'anonymous' && (
                      <span className="inline-block mt-1 bg-[#E2A33B]/20 text-[var(--brand)] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Anonymous
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
