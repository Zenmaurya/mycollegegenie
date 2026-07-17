import React, { useState, useEffect, useRef } from 'react';
import { ChatService, ChatMessage } from '../services/chatService';
import { useAuth } from '../context/AuthContext';

interface ChatWindowProps {
  sessionId: string;
  otherUserName: string;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, otherUserName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState<'anonymous' | 'unlocked'>('anonymous');
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await ChatService.getMessages(sessionId);
      setMessages(data.messages);
      setStatus(data.status);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch chat messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 3 seconds
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempContent = newMessage;
    setNewMessage('');

    try {
      const res = await ChatService.sendMessage(sessionId, tempContent);
      if (res.injected) {
        // Refetch immediately to see the system warning
        fetchMessages();
      } else {
        // Optimistic update
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          session_id: sessionId,
          sender_id: user?.id || '',
          content: tempContent,
          is_system: 0,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      // Dummy payment logic (would integrate Razorpay here)
      await new Promise(resolve => setTimeout(resolve, 1000));
      await ChatService.unlockChat(sessionId);
      fetchMessages();
    } catch (err) {
      console.error('Unlock failed', err);
    }
    setIsUnlocking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--paper)] w-full max-w-md h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--brand)] text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-['Fraunces'] font-semibold text-lg">{otherUserName}</h3>
            {status === 'anonymous' && (
              <span className="text-xs text-[#E2A33B] font-medium">Anonymous Chat</span>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors" aria-label="Close chat window">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {/* Unlock Banner */}
        {status === 'anonymous' && (
          <div className="bg-[#E2A33B]/10 border-b border-[#E2A33B]/20 p-3 px-4 shrink-0 flex justify-between items-center gap-4">
            <p className="text-[13px] text-[var(--brand)] leading-tight flex-1">
              Contact sharing is currently disabled to ensure safe deals.
            </p>
            <button 
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="shrink-0 bg-[#E2A33B] text-[var(--brand-ink)] text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-[#d19430] transition-colors disabled:opacity-50"
            >
              {isUnlocking ? 'Unlocking...' : 'Unlock Contact (₹20)'}
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center text-[var(--brand)]/50 mt-10">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-[var(--brand)]/50 mt-10">
              No messages yet. Ask about the condition or negotiate a price!
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_id === user?.id;
              if (msg.is_system) {
                return (
                  <div key={msg.id} className="text-center my-2">
                    <span className="bg-[var(--brand)]/5 text-[var(--brand)] text-[11px] font-medium px-3 py-1 rounded-full border border-[var(--brand)]/10">
                      {msg.content}
                    </span>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-[14px] ${isMine ? 'bg-[var(--brand)] text-white rounded-tr-sm' : 'bg-white text-[var(--brand)] border border-[var(--brand)]/10 rounded-tl-sm shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[var(--brand)]/10 shrink-0 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[var(--paper)] rounded-full px-4 py-2 text-[14px] text-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-[var(--brand)] text-[#E2A33B] w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--brand-ink)] transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};
