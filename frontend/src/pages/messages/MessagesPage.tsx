import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Search,
  CheckCheck,
  Sparkles,
  MessageSquare,
  Users,
  UserRound,
} from 'lucide-react';
import { messagesApi } from '../../api/services';
import { Message, Conversation, CourseGroup } from '../../types';
import { useAuth } from '../../context/AuthContext';

type ChatMode = 'group' | 'direct';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPartner = searchParams.get('user');
  const queryCourse = searchParams.get('course');

  const [mode, setMode] = useState<ChatMode>(queryPartner ? 'direct' : 'group');
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>(queryCourse || '');
  const [activePartner, setActivePartner] = useState<string>(queryPartner || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /** Load both chat lists; groups drive the default selection. */
  const loadThreads = useCallback(async () => {
    if (!user?.name) return;

    const [groupResult, directResult] = await Promise.allSettled([
      messagesApi.getGroups(),
      messagesApi.getConversations(user.name),
    ]);

    if (groupResult.status === 'fulfilled') {
      setGroups(groupResult.value);
      setActiveGroupId((current) => current || (groupResult.value[0] ? String(groupResult.value[0].course_id) : ''));
    }
    if (directResult.status === 'fulfilled') {
      setConversations(directResult.value);
      setActivePartner((current) => current || (directResult.value[0]?.partner ?? ''));
    }
  }, [user?.name]);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 15000);
    return () => clearInterval(interval);
  }, [loadThreads]);

  /** Poll the open thread so new messages arrive without a refresh. */
  const loadMessages = useCallback(async () => {
    if (!user?.name) return;

    try {
      if (mode === 'group') {
        if (!activeGroupId) {
          setMessages([]);
          return;
        }
        setMessages(await messagesApi.getGroupHistory(activeGroupId));
      } else {
        if (!activePartner) {
          setMessages([]);
          return;
        }
        const history = await messagesApi.getHistory(user.name, activePartner);
        setMessages(history);
        await messagesApi.markRead({ sender: activePartner, recipient: user.name });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [mode, activeGroupId, activePartner, user?.name]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !user?.name || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic bubble, replaced by the server copy on the next poll
    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: user.name,
      recipient: mode === 'direct' ? activePartner : null,
      text,
      is_read: false,
      createdAt: new Date().toISOString(),
    } as Message;
    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (mode === 'group') {
        await messagesApi.sendGroup({ course_id: activeGroupId, text });
      } else {
        await messagesApi.send({ sender: user.name, recipient: activePartner, text });
      }
      await loadMessages();
      loadThreads();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const selectGroup = (courseId: number) => {
    setMode('group');
    setActiveGroupId(String(courseId));
    setMessages([]);
    setSearchParams({ course: String(courseId) });
  };

  const selectPartner = (partner: string) => {
    setMode('direct');
    setActivePartner(partner);
    setMessages([]);
    setSearchParams({ user: partner });
  };

  const activeGroup = groups.find((g) => String(g.course_id) === activeGroupId);
  const headerTitle = mode === 'group' ? activeGroup?.name || 'Course chat' : activePartner;
  const headerSubtitle =
    mode === 'group'
      ? `${activeGroup?.member_count ?? 0} member${activeGroup?.member_count === 1 ? '' : 's'}`
      : 'Direct message';

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredConversations = conversations.filter((c) =>
    c.partner?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const hasActiveThread = mode === 'group' ? !!activeGroupId : !!activePartner;

  return (
    <div className="h-[calc(100vh-9rem)] min-h-[520px] bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-fade-in">
      {/* Thread list */}
      <div
        className={`md:col-span-4 border-r border-sand-200 dark:border-neutral-800 flex-col h-full bg-sand-50/40 dark:bg-neutral-900/40 ${
          hasActiveThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-3 sm:p-4 border-b border-sand-200 dark:border-neutral-800 space-y-3">
          {/* Group vs direct switch */}
          <div className="flex items-center gap-1 bg-sand-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setMode('group')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'group'
                  ? 'bg-white dark:bg-neutral-700 shadow-xs text-terracotta-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Course Groups
            </button>
            <button
              onClick={() => setMode('direct')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'direct'
                  ? 'bg-white dark:bg-neutral-700 shadow-xs text-terracotta-700 dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <UserRound className="w-4 h-4" />
              Personal
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={mode === 'group' ? 'Search course chats…' : 'Search conversations…'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {mode === 'group' ? (
            filteredGroups.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-neutral-300" />
                <p>No course groups yet. Every course you join gets its own chat.</p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const isActive = String(group.course_id) === activeGroupId;
                return (
                  <button
                    key={group.course_id}
                    onClick={() => selectGroup(group.course_id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? 'bg-terracotta-600 dark:bg-burgundy-800 text-white shadow-sm'
                        : 'hover:bg-sand-100 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-gold-500 text-charcoal-900' : 'bg-forest-600 text-white'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs truncate">{group.name}</h4>
                        {group.timestamp && (
                          <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-sand-200' : 'text-neutral-400'}`}>
                            {new Date(group.timestamp.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-sand-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {group.lastMessage
                          ? `${group.lastSender ? `${group.lastSender.split(' ')[0]}: ` : ''}${group.lastMessage}`
                          : `${group.member_count} members · say hello`}
                      </p>
                    </div>

                    {group.unreadCount > 0 && !isActive && (
                      <span className="w-5 h-5 rounded-full bg-gold-500 text-charcoal-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {group.unreadCount > 9 ? '9+' : group.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
              <p>No conversations yet. Visit the Mentors directory to start one.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.partner === activePartner;
              return (
                <button
                  key={conv.partner}
                  onClick={() => selectPartner(conv.partner)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? 'bg-terracotta-600 dark:bg-burgundy-800 text-white shadow-sm'
                      : 'hover:bg-sand-100 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-gold-500 text-charcoal-900' : 'bg-terracotta-600 text-white'
                    }`}
                  >
                    {conv.partner?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate">{conv.partner}</h4>
                      {conv.timestamp && (
                        <span className={`text-[10px] flex-shrink-0 ${isActive ? 'text-sand-200' : 'text-neutral-400'}`}>
                          {new Date(conv.timestamp.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-sand-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {conv.lastMessage || 'Say hello…'}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && !isActive && (
                    <span className="w-5 h-5 rounded-full bg-gold-500 text-charcoal-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active thread */}
      <div className={`md:col-span-8 flex-col h-full bg-white dark:bg-neutral-900 ${hasActiveThread ? 'flex' : 'hidden md:flex'}`}>
        {hasActiveThread ? (
          <>
            <div className="p-3 sm:px-6 sm:py-4 border-b border-sand-200 dark:border-neutral-800 flex items-center gap-3">
              <button
                onClick={() => (mode === 'group' ? setActiveGroupId('') : setActivePartner(''))}
                className="md:hidden p-1.5 -ml-1 rounded-lg text-neutral-500 hover:bg-sand-100 dark:hover:bg-neutral-800 cursor-pointer"
                aria-label="Back to conversations"
              >
                &larr;
              </button>

              <div className={`w-10 h-10 rounded-${mode === 'group' ? 'xl' : 'full'} bg-terracotta-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0`}>
                {mode === 'group' ? <Users className="w-5 h-5" /> : headerTitle?.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{headerTitle}</h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{headerSubtitle}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-sand-50/20 dark:bg-neutral-950/20">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-gold-500" />
                  <h4 className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                    {mode === 'group' ? `Start the conversation in ${headerTitle}` : `Beginning of your chat with ${headerTitle}`}
                  </h4>
                  <p className="text-xs max-w-sm">
                    {mode === 'group'
                      ? 'Share notes, ask about the next session, or check in with your cohort.'
                      : 'Ask about routines, study plans, or personal guidance.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.name;
                  return (
                    <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Group chats need the sender's name on incoming bubbles */}
                      {mode === 'group' && !isMe && (
                        <span className="text-[10px] font-bold text-terracotta-700 dark:text-gold-400 mb-0.5 px-1">
                          {msg.sender}
                          {msg.sender_role && msg.sender_role !== 'Student' && (
                            <span className="ml-1 text-neutral-400 font-semibold">· {msg.sender_role}</span>
                          )}
                        </span>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-md p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words ${
                          isMe
                            ? 'bg-terracotta-600 text-white rounded-br-none shadow-sm'
                            : 'bg-sand-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 rounded-bl-none border border-sand-200 dark:border-neutral-700'
                        }`}
                      >
                        <p>{msg.text}</p>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1 px-1">
                        <span>
                          {msg.createdAt
                            ? new Date(msg.createdAt.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                        {isMe && mode === 'direct' && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-sand-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === 'group' ? `Message ${headerTitle}…` : `Message ${headerTitle}…`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-terracotta-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 font-bold disabled:opacity-50 transition-all cursor-pointer flex-shrink-0"
                aria-label="Send message"
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
            <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">Select a conversation</h3>
            <p className="text-xs text-neutral-500 max-w-sm">
              Pick a course group to talk with your whole cohort, or a person for a private chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
