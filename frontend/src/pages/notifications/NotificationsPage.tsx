import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Download,
  Search,
  BellRing,
  Globe,
  GraduationCap,
  UserRound,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { notificationIcon } from '../../components/layout/NotificationDrawer';
import { Notification } from '../../types';

type ScopeFilter = 'all' | 'unread' | 'announcement' | 'course' | 'personal';

const SCOPE_TABS: { key: ScopeFilter; label: string; icon?: React.ElementType }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'announcement', label: 'Announcements', icon: Globe },
  { key: 'course', label: 'Course', icon: GraduationCap },
  { key: 'personal', label: 'Personal', icon: UserRound },
];

/** Quote a value so commas and quotes inside it cannot break the CSV. */
const csvCell = (value: unknown): string => {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
};

const buildCsv = (rows: Notification[]): string => {
  const header = ['Date', 'Title', 'Message', 'Type', 'Scope', 'Course', 'From', 'Read'];
  const body = rows.map((n) =>
    [
      n.createdAt,
      n.title,
      n.message,
      n.type ?? '',
      n.scope ?? '',
      n.course_name ?? '',
      n.sender_name ?? '',
      n.is_read ? 'Read' : 'Unread',
    ]
      .map(csvCell)
      .join(',')
  );
  return [header.map(csvCell).join(','), ...body].join('\r\n');
};

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    clearAll,
    pushPermission,
    requestPushPermission,
  } = useNotifications();

  const [scope, setScope] = useState<ScopeFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return notifications.filter((n) => {
      const matchesQuery =
        !q || n.title.toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q);

      const matchesScope =
        scope === 'all' ||
        (scope === 'unread' && !n.is_read) ||
        (scope === 'announcement' && n.scope === 'all') ||
        (scope === 'course' && n.scope === 'course') ||
        (scope === 'personal' && n.scope === 'individual');

      return matchesQuery && matchesScope;
    });
  }, [notifications, query, scope]);

  /** Download the current view as a CSV file. */
  const handleDownloadCsv = () => {
    const csv = buildCsv(filtered);
    // The BOM keeps accented characters readable when opened in Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `pragya-notifications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (!confirm('Clear every notification? This cannot be undone.')) return;
    await clearAll();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-800 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
              <Bell className="w-3.5 h-3.5" />
              {unreadCount} unread
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-3xl">All Notifications</h1>
            <p className="text-sand-100/90 text-xs sm:text-sm">
              Announcements, course updates from your mentors, and your own booking confirmations.
            </p>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-charcoal-900 shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap justify-center"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Push channel opt-in */}
      {pushPermission === 'default' && (
        <button
          onClick={requestPushPermission}
          className="w-full p-4 rounded-2xl bg-gold-50 dark:bg-gold-950/40 border border-gold-200 dark:border-gold-800/60 flex items-center gap-3 text-left hover:bg-gold-100 dark:hover:bg-gold-950/60 transition-colors cursor-pointer"
        >
          <BellRing className="w-5 h-5 text-gold-600 dark:text-gold-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-900 dark:text-white">Enable push notifications</p>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
              You will still see everything here — push just adds a desktop alert.
            </p>
          </div>
        </button>
      )}

      {pushPermission === 'denied' && (
        <p className="p-3 rounded-2xl bg-sand-100 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700 text-[11px] text-neutral-600 dark:text-neutral-400">
          Push notifications are blocked in your browser settings. In-app notifications below still work normally.
        </p>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SCOPE_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                scope === key
                  ? 'bg-forest-600 dark:bg-gold-500 text-white dark:text-charcoal-900'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-2 border-t border-sand-200 dark:border-neutral-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notifications…"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500 text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-sand-50 dark:bg-neutral-800 text-forest-700 dark:text-forest-300 border border-sand-200 dark:border-neutral-700 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 disabled:opacity-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
            {notifications.length === 0 ? "You're all caught up!" : 'Nothing matches this filter'}
          </h4>
          <p className="text-xs text-neutral-500 mt-1">
            {notifications.length === 0
              ? 'Announcements and booking confirmations will appear here.'
              : 'Try a different tab or clear the search.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => (
            <li
              key={item._id}
              onClick={() => !item.is_read && markAsRead(item._id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                item.is_read
                  ? 'bg-white dark:bg-neutral-900 border-sand-200 dark:border-neutral-800'
                  : 'bg-forest-50/70 dark:bg-forest-950/40 border-forest-200 dark:border-forest-800/60 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xs flex-shrink-0 mt-0.5">
                  {notificationIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{item.title}</h3>
                    {!item.is_read && <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1.5" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {item.scope === 'all' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                        Everyone
                      </span>
                    )}
                    {item.scope === 'course' && item.course_name && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-700 dark:text-terracotta-300">
                        {item.course_name}
                      </span>
                    )}
                    {item.sender_name && (
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        from {item.sender_name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed break-words">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-neutral-400">
                      {item.createdAt
                        ? new Date(item.createdAt.replace(' ', 'T')).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-forest-700 dark:text-gold-400 hover:underline"
                      >
                        Open &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
