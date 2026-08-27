import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { AuthErrorBanner } from '../../components/auth/AuthFeedback';

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMine?: boolean;
};

interface AlertChatSheetProps {
  alertId: string;
  onBack: () => void;
}

export const AlertChatSheet: React.FC<AlertChatSheetProps> = ({ alertId, onBack }) => {
  const [title, setTitle] = useState('Emergency Group');
  const [statusLabel, setStatusLabel] = useState('Online');
  const [placeholder, setPlaceholder] = useState('Type your message...');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const data = await api.getAlertMessages(alertId);
    setTitle(data.title || 'Emergency Group');
    setStatusLabel(data.statusLabel || 'Online');
    setPlaceholder(data.placeholder || 'Type your message...');
    setMessages(data.messages || []);
  };

  useEffect(() => {
    load().catch((err: unknown) => {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load chat.');
    });
    socketService.joinAlertRoom(alertId);
    const off = socketService.on('alert:messages:update', () => {
      load().catch(() => undefined);
    });
    return off;
  }, [alertId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      const data = await api.sendAlertMessage(alertId, text);
      setMessages(data.messages || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not send message.');
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-4 flex items-center gap-3 border-b border-[#E1E1E1] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="size-9 rounded-[18px] flex items-center justify-center touch-manipulation"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5 text-[#09003B]" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#09003B] truncate">{title}</p>
          <p className="text-xs text-[#00AA1D]">{statusLabel}</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AuthErrorBanner message={errorMessage} />
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                message.isMine ? 'bg-[#3A67D5] text-white' : 'bg-[#F5F5F5] text-[#09003B]'
              }`}
            >
              {!message.isMine && (
                <p className="text-[10px] font-semibold opacity-70 mb-0.5">{message.sender}</p>
              )}
              <p className="text-sm leading-5">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="p-4 flex gap-2 border-t border-[#E1E1E1]">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 rounded-full border border-[#E1E1E1] px-4 text-sm text-[#09003B] focus:outline-none focus:border-[#3A67D5]"
        />
        <button
          type="submit"
          className="size-12 rounded-full bg-[#3A67D5] text-white flex items-center justify-center touch-manipulation"
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
};
