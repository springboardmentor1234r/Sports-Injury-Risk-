import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Check, CheckCheck, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useChatSocket } from '@/hooks/useChatSocket';

interface Contact {
  id: number;
  full_name: string;
  profile_picture_url?: string;
}

interface ChatWidgetProps {
  token: string;
  role: string;
  userId: number | string | undefined;
}

export function ChatWidget({ token, role, userId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContactId = selectedContact?.id ?? null;

  const { messages, isConnected, sendMessage, unreadCounts, totalUnread } = useChatSocket(token, isOpen ? activeContactId : null);

  // Fetch contacts when widget opens
  useEffect(() => {
    if (!isOpen) return;
    if (role === 'coach' && !contacts.length) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const athletes = Array.isArray(data) ? data : data.athletes || [];
          setContacts(athletes);
        })
        .catch(err => console.error('Failed to fetch athletes', err));
    } else if (role === 'athlete' && !selectedContact) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/my-coach`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setSelectedContact({ id: data.id, full_name: data.full_name || 'Coach' });
          }
        })
        .catch(err => console.error('Failed to fetch coach', err));
    }
  }, [isOpen, role, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && activeContactId) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const renderTicks = (status: string) => {
    if (status === 'sending') return <Check className="w-3 h-3 text-slate-300 ml-1" />;
    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-slate-300 ml-1" />;
    if (status === 'read') return <CheckCheck className="w-3 h-3 text-blue-300 ml-1" />;
    return null;
  };

  const chatPanel = isOpen ? (
    <div
      style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, width: '384px', height: '500px' }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden"
    >
          {/* Header */}
          <div className="bg-[#004ccd] text-white p-4 flex justify-between items-center shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              {role === 'coach' && selectedContact && (
                <button
                  onClick={() => setSelectedContact(null)}
                  className="hover:bg-white/20 p-1 rounded-full transition-colors"
                  title="Back to athletes"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="font-bold text-sm truncate max-w-[200px]">
                {role === 'coach' && !selectedContact ? 'Select Athlete' : selectedContact?.full_name || 'Chat'}
              </h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-slate-200 transition-colors flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Coach: Athlete list */}
          {role === 'coach' && !selectedContact ? (
            <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950">
              {contacts.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">No athletes assigned yet.</div>
              ) : (
                contacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl mb-2 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {contact.profile_picture_url ? (
                        <img src={contact.profile_picture_url} alt={contact.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0 flex items-center justify-between">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{contact.full_name}</p>
                      {unreadCounts[contact.id] > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-2">
                          {unreadCounts[contact.id]}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Chat Interface */
            <>
              {!isConnected && (
                <div className="bg-amber-100 text-amber-800 text-xs text-center py-1 flex-shrink-0">Reconnecting...</div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#faf8ff] dark:bg-slate-950 flex flex-col gap-3">
                {!activeContactId ? (
                  <div className="text-center text-slate-500 text-sm mt-10">No contact selected.</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-10">Say hi! No messages yet.</div>
                ) : (
                  messages.map((msg: any, idx: number) => {
                    const isMine = msg.sender_id === -1 || parseInt(String(msg.sender_id)) === parseInt(String(userId));
                    const timeStr = new Date(msg.created_at.endsWith('Z') ? msg.created_at : msg.created_at + 'Z')
                      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={msg._id || msg.temp_id || idx}
                        className={`flex flex-col max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div className={`p-3 rounded-2xl ${isMine
                          ? 'bg-[#004ccd] text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                        }`}>
                          <p className="text-sm break-words">{msg.message_text}</p>
                          <div className="flex justify-end items-center mt-1 gap-0.5">
                            <span className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {timeStr}
                            </span>
                            {isMine && renderTicks(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004ccd] dark:text-white"
                  disabled={!activeContactId || !isConnected}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || !activeContactId || !isConnected}
                  className="w-10 h-10 rounded-full bg-[#004ccd] text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </>
          )}
        </div>
  ) : null;

  return (
    <>
      {/* Trigger button — renders inline wherever ChatWidget is placed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8] transition-colors"
        title="Chat"
      >
        <MessageCircle className="w-5 h-5" />
        {totalUnread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {/* Portal: renders the panel at document.body, escaping all CSS containing blocks */}
      {typeof document !== 'undefined' && createPortal(chatPanel, document.body)}
    </>
  );
}
