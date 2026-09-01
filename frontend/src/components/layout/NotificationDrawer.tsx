import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCheck,
  Users,
  MessageSquare,
  Calendar,
  Sparkles,
  Info,
  GraduationCap,
  ArrowRight,
  BellRing,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

/** How many notifications the drawer previews before "View all". */
const PREVIEW_COUNT = 3;

export const notificationIcon = (type?: string) => {
  switch (type) {
    case 'mentorship':
      return <Users className="w-4 h-4 text-emerald-500" />;
    case 'message':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'event':
      return <Calendar className="w-4 h-4 text-gold-500" />;
    case 'community':
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case 'course':
      return <GraduationCap className="w-4 h-4 text-terracotta-600 dark:text-terracotta-300" />;
    default:
      return <Info className="w-4 h-4 text-forest-600 dark:text-forest-400" />;
  }
};

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isDrawerOpen,
    closeDrawer,
    markAllAsRead,
    markAsRead,
    unreadCount,
    pushPermission,
    requestPushPermission,
  } = useNotifications();

  if (!isDrawerOpen) return null;

  // Only the newest few appear here; the full history has its own page
  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-l border-sand-200 dark:border-neutral-800">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-forest-100 dark:bg-forest-900/50 flex items-center justify-center text-forest-700 dark:text-forest-300 flex-shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-base sm:text-lg text-forest-900 dark:text-forest-100 truncate">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gold-500 text-forest-900 flex-shrink-0">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors flex-shrink-0"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Push opt-in — the second delivery channel alongside this drawer */}
          {pushPermission === 'default' && (
            <button
              onClick={requestPushPermission}
              className="mx-4 mt-4 p-3 rounded-2xl bg-gold-50 dark:bg-gold-950/40 border border-gold-200 dark:border-gold-800/60 flex items-center gap-3 text-left hover:bg-gold-100 dark:hover:bg-gold-950/60 transition-colors cursor-pointer"
            >
              <BellRing className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Turn on push notifications</p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Get class reminders and announcements even when this tab is closed.
                </p>
              </div>
            </button>
          )}

          <div className="px-4 sm:px-6 py-3 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between text-xs mt-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 font-bold text-forest-700 dark:text-forest-300 hover:text-forest-900 dark:hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
            <span className="text-neutral-400 font-semibold">
              Showing {Math.min(PREVIEW_COUNT, notifications.length)} of {notifications.length}
            </span>
          </div>

          {/* Preview list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {preview.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-12 h-12 rounded-full bg-sand-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  You're all caught up!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Session updates and announcements will appear here.
                </p>
              </div>
            ) : (
              preview.map((item) => (
                <div
                  key={item._id}
                  onClick={() => !item.is_read && markAsRead(item._id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    item.is_read
                      ? 'bg-white dark:bg-neutral-800/30 border-sand-200 dark:border-neutral-800/60 opacity-80'
                      : 'bg-forest-50/70 dark:bg-forest-950/40 border-forest-200 dark:border-forest-800/60 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xs flex-shrink-0 mt-0.5">
                      {notificationIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>

                      {/* Course notifications say which course they came from */}
                      {item.scope === 'course' && item.course_name && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-700 dark:text-terracotta-300">
                          {item.course_name}
                        </span>
                      )}

                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed break-words">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 block">
                        {item.createdAt
                          ? new Date(item.createdAt.replace(' ', 'T')).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View all */}
          <div className="p-4 border-t border-sand-200 dark:border-neutral-800">
            <Link
              to="/notifications"
              onClick={closeDrawer}
              className="w-full py-3 rounded-xl font-bold text-sm bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center justify-center gap-2"
            >
              View all notifications
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
