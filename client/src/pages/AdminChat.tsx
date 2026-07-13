import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface Message {
  id: string;
  userId: string;
  senderId: string;
  message: string;
  createdAt: string;
  senderName: string;
}

export const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll conversation list every 5 seconds
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get<Conversation[]>('/chat/conversations');
        setConversations(res);
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages for active user every 3 seconds
  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await api.get<Message[]>(`/chat/messages?userId=${activeUserId}`);
        setMessages(res);
      } catch (err) {
        console.error('Failed to load conversation messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeUserId || loading) return;

    setLoading(true);
    try {
      const sent = await api.post<Message>('/chat/messages', {
        message: replyMessage,
        userId: activeUserId,
      });

      setMessages((prev) => [...prev, { ...sent, senderName: user?.fullName || 'Admin' }]);
      setReplyMessage('');

      // Optimistically update conversation snippet in list
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === activeUserId
            ? { ...c, lastMessage: replyMessage, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setLoading(false);
    }
  };

  const activeUser = conversations.find((c) => c.userId === activeUserId);

  return (
    <div className="bg-white border border-muted rounded-premium shadow-card h-[calc(100vh-140px)] flex overflow-hidden font-sans">
      {/* Conversations List Panel (Left) */}
      <div className="w-80 border-r border-muted flex flex-col h-full bg-muted/10">
        <div className="p-4 border-b border-muted bg-white">
          <h3 className="font-extrabold text-charcoal text-sm font-sans flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Support Conversations</span>
          </h3>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-muted">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-medium space-y-1 py-12">
              <span className="text-3xl block">📭</span>
              <p className="font-bold text-charcoal">No Conversations Yet</p>
              <p>Customer support requests will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.userId === activeUserId;
              const formattedTime = new Date(conv.lastMessageAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <button
                  key={conv.userId}
                  onClick={() => setActiveUserId(conv.userId)}
                  className={`w-full text-left p-4 hover:bg-muted/30 transition-colors flex flex-col gap-1 focus:outline-none ${
                    isActive ? 'bg-primary/5 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-xs text-charcoal truncate max-w-[70%]">
                      {conv.userName}
                    </span>
                    <span className="text-[9px] text-muted-medium whitespace-nowrap">
                      {formattedTime}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-medium truncate block w-full">
                    {conv.userEmail}
                  </span>
                  <p className="text-[11px] text-charcoal/70 line-clamp-1 mt-1">
                    {conv.lastMessage}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Messages Dialog Panel (Right) */}
      <div className="flex-grow flex flex-col h-full bg-muted/5">
        {activeUserId && activeUser ? (
          <>
            {/* Header info */}
            <div className="bg-white px-6 py-4 border-b border-muted flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-charcoal text-sm font-sans">{activeUser.userName}</h4>
                <p className="text-[10px] text-muted-medium mt-0.5">{activeUser.userEmail}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-muted-dark text-muted-medium text-[9px] font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Conversation ID: {activeUser.userId.slice(0, 8)}</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => {
                const isUserMessage = msg.senderId === activeUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUserMessage ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isUserMessage
                          ? 'bg-white border border-muted text-charcoal rounded-tl-none'
                          : 'bg-primary text-white rounded-tr-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-muted-medium px-1.5 mt-0.5">
                      {isUserMessage ? activeUser.userName : 'You (Admin)'}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-muted bg-white flex gap-3">
              <input
                type="text"
                placeholder={`Type a reply to ${activeUser.userName}...`}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="flex-grow px-4 py-3 border border-muted-dark rounded-full text-xs focus:outline-none focus:border-primary placeholder-muted-medium bg-muted/10 font-sans"
              />
              <button
                type="submit"
                disabled={loading || !replyMessage.trim()}
                className="px-5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded-full text-xs flex items-center justify-center gap-1.5 transition-colors shadow-glow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <span className="text-5xl">💬🛎️</span>
            <h4 className="font-extrabold text-charcoal text-base font-sans">No Conversation Selected</h4>
            <p className="text-xs text-muted-medium max-w-sm">
              Click on a customer conversation on the left sidebar to open the chat window and compose a response.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminChat;
