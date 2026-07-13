import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Message {
  id: string;
  userId: string;
  senderId: string;
  message: string;
  createdAt: string;
  senderName: string;
}

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages every 3 seconds if open and authenticated
  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get<Message[]>('/chat/messages');
        setMessages(res);
      } catch (err) {
        console.error('Failed to load chat messages', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, user]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const sent = await api.post<Message>('/chat/messages', { message: newMessage });
      setMessages((prev) => [...prev, { ...sent, senderName: user?.fullName || 'User' }]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-glow hover:bg-primary-hover hover:scale-105 transition-all flex items-center justify-center focus:outline-none"
        title="Chat with Support"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[450px] bg-white border border-muted rounded-premium shadow-premium flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-charcoal text-white px-5 py-4 border-b border-charcoal-light flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">TRIMAKI Concierge</h3>
              <p className="text-[10px] text-muted-medium mt-0.5">We typically reply in under 5 minutes</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" title="Support Online"></span>
          </div>

          {/* Chat Body */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-muted/20">
            {!user ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <span className="text-3xl">💬🔑</span>
                <h4 className="font-bold text-charcoal text-sm">Authentication Required</h4>
                <p className="text-xs text-muted-medium">Sign in to start a support chat session regarding your orders.</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-medium space-y-1">
                <span className="text-2xl">👋🍣</span>
                <p className="text-xs font-bold text-charcoal">Welcome to TRIMAKI Chat!</p>
                <p className="text-[10px]">Ask us any questions about our ingredients, culinary preparations, or active order status.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                        isOwnMessage
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white border border-muted text-charcoal rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-muted-medium px-1.5 mt-0.5">
                      {isOwnMessage ? 'You' : 'Concierge'}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          {user && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-muted bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow px-4 py-2.5 border border-muted-dark rounded-full text-xs focus:outline-none focus:border-primary placeholder-muted-medium bg-muted/10 font-sans"
              />
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="w-9 h-9 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default ChatWidget;
