import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Users,
  MessageSquare,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isDrawerOpen,
    closeDrawer,
    markAllAsRead,
    markAsRead,
    clearAll,
    unreadCount,
  } = useNotifications();

  if (!isDrawerOpen) return null;

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'mentorship':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-gold-500" />;
      case 'community':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-forest-600 dark:text-forest-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-l border-sand-200 dark:border-neutral-800 transition-colors">
          {/* Header */}
          <div className="p-6 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-100 dark:bg-forest-900/50 flex items-center justify-center text-forest-700 dark:text-forest-300">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="font-display font-bold text-lg text-forest-900 dark:text-forest-100">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gold-500 text-forest-900">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="px-6 py-3 bg-sand-50 dark:bg-neutral-800/40 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 font-bold text-forest-700 dark:text-forest-300 hover:text-forest-900 dark:hover:text-white disabled:opacity-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              disabled={notifications.length === 0}
              className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-12 h-12 rounded-full bg-sand-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  You're all caught up!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  No notifications to show right now. Check back later for session updates and community activities.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
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
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 block">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
