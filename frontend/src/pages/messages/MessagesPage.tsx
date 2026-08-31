import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Search,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  User,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { messagesApi } from '../../api/services';
import { Message, Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryPartner = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<string>(queryPartner || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = async () => {
    if (!user?.name) return;
    try {
      const data = await messagesApi.getConversations(user.name);
      if (Array.isArray(data)) {
        setConversations(data);
        if (!activePartner && data.length > 0 && !queryPartner) {
          setActivePartner(data[0].partner);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // If query param arrives, set active partner
  useEffect(() => {
    if (queryPartner) {
      setActivePartner(queryPartner);
    }
  }, [queryPartner]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Load chat history when active partner changes
  const loadChatHistory = async () => {
    if (!user?.name || !activePartner) return;
    try {
      const history = await messagesApi.getHistory(user.name, activePartner);
      if (Array.isArray(history)) {
        setMessages(history);
        // Mark as read
        await messagesApi.markRead({ sender: activePartner, recipient: user.name });
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadChatHistory();
    const interval = setInterval(loadChatHistory, 3500); // live polling
    return () => clearInterval(interval);
  }, [user, activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user?.name || !activePartner) return;

    const messageText = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const tempMsg: Message = {
      _id: Math.random().toString(),
      sender: user.name,
      recipient: activePartner,
      text: messageText,
      is_read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await messagesApi.send({
        sender: user.name,
        recipient: activePartner,
        text: messageText,
      });
      loadConversations();
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.partner?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] min-h-[550px] bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-fade-in">
      
      {/* 1. Conversations List (Left Sidebar) */}
      <div className="md:col-span-4 lg:col-span-4 border-r border-sand-200 dark:border-neutral-800 flex flex-col h-full bg-sand-50/40 dark:bg-neutral-900/40">
        
        {/* Top Search & Filter */}
        <div className="p-4 border-b border-sand-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-terracotta-600 dark:text-gold-400" />
              Direct Chats
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* If active partner from query is not in conversations list yet, show it */}
          {activePartner && !conversations.some((c) => c.partner === activePartner) && (
            <div
              onClick={() => setActivePartner(activePartner)}
              className="p-3 rounded-2xl bg-terracotta-100 dark:bg-terracotta-950/60 text-terracotta-900 dark:text-white font-bold text-xs flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-terracotta-600 text-white font-bold flex items-center justify-center">
                {activePartner.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{activePartner}</p>
                <span className="text-[10px] text-terracotta-600 dark:text-gold-400 font-normal">New conversation</span>
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && !activePartner ? (
            <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
              <p>No conversations yet. Visit the Mentors directory to start a chat!</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.partner === activePartner;

              return (
                <div
                  key={conv.partner}
                  onClick={() => setActivePartner(conv.partner)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-terracotta-600 dark:bg-burgundy-800 text-white shadow-sm'
                      : 'hover:bg-sand-100 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-gold-500 text-charcoal-900'
                        : 'bg-terracotta-600 text-white'
                    }`}
                  >
                    {conv.partner?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate">
                        {conv.partner}
                      </h4>
                      {conv.timestamp && (
                        <span className={`text-[10px] ${isActive ? 'text-sand-200' : 'text-neutral-400'}`}>
                          {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isActive ? 'text-sand-100' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {conv.lastMessage || 'Say hello...'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && !isActive && (
                    <span className="w-5 h-5 rounded-full bg-gold-500 text-charcoal-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Active Chat Stream & Input (Right Pane) */}
      <div className="md:col-span-8 lg:col-span-8 flex flex-col h-full bg-white dark:bg-neutral-900">
        {activePartner ? (
          <>
            {/* Chat Header */}
            <div className="p-4 sm:px-6 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between bg-sand-50/20 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terracotta-600 text-white font-bold text-sm flex items-center justify-center">
                  {activePartner.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {activePartner}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online & Available
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Starting video guidance room with ${activePartner}...`)}
                  className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Start Video Guidance"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => alert(`Initiating audio call with ${activePartner}...`)}
                  className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Audio Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-sand-50/20 dark:bg-neutral-950/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-gold-500" />
                  <h4 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                    Beginning of conversation with {activePartner}
                  </h4>
                  <p className="text-xs max-w-sm">
                    Ask questions regarding Yoga routines, study plans, or seek personalized spiritual recommendations.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.name;

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? 'bg-terracotta-600 text-white rounded-br-none shadow-sm'
                            : 'bg-sand-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-none border border-sand-200 dark:border-neutral-700'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1 px-1">
                        <span>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-sand-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => alert('Attachments support: PDF, Image, Audio snippet.')}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activePartner}...`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 font-bold disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-sand-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
              Select a conversation
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              Choose an existing chat from the left or connect with a mentor to exchange messages.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
