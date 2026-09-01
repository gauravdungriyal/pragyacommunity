import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Notification } from '../types';
import { notificationsApi } from '../api/services';
import { useAuth } from './AuthContext';

type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  /** Browser push status, and a way to ask for permission. */
  pushPermission: PushPermission;
  requestPushPermission: () => Promise<PushPermission>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const readPermission = (): PushPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission as PushPermission;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<PushPermission>(readPermission);

  // Ids already delivered as a desktop push, so nothing is announced twice
  const pushedIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  /**
   * Raise a desktop/system notification. This is the "push" channel — the
   * in-app drawer is the "web" channel, and both are fed by the same data.
   */
  const sendPush = useCallback((items: Notification[]) => {
    if (readPermission() !== 'granted' || items.length === 0) return;

    // Announce at most three at once so a backlog cannot spam the desktop
    items.slice(0, 3).forEach((item) => {
      try {
        const push = new window.Notification(item.title, {
          body: item.message || item.content || '',
          tag: `pragya-${item._id}`,
          icon: '/assets/logo.png',
        });
        push.onclick = () => {
          window.focus();
          if (item.link) window.location.href = item.link;
        };
      } catch {
        // Some browsers refuse constructor-based notifications; the in-app
        // drawer still shows everything.
      }
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.name) return;
    try {
      const data = await notificationsApi.getAll(user.name);
      if (!Array.isArray(data)) return;

      const unread = data.filter((n) => !n.is_read);

      if (!primed.current) {
        // First load only records what exists; it does not replay history
        unread.forEach((n) => pushedIds.current.add(n._id));
        primed.current = true;
      } else {
        const fresh = unread.filter((n) => !pushedIds.current.has(n._id));
        fresh.forEach((n) => pushedIds.current.add(n._id));
        sendPush(fresh);
      }

      setNotifications(data);
    } catch {
      // Ignore if the user has no notifications yet
    }
  }, [isAuthenticated, user, sendPush]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // A new sign-in starts a fresh push baseline
  useEffect(() => {
    primed.current = false;
    pushedIds.current.clear();
  }, [user?.id]);

  const requestPushPermission = useCallback(async (): Promise<PushPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = (await window.Notification.requestPermission()) as PushPermission;
      setPushPermission(result);
      return result;
    } catch {
      return readPermission();
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllAsRead = async () => {
    if (!user?.name) return;
    try {
      await notificationsApi.markAllRead(user.name);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const clearAll = async () => {
    if (!user?.name) return;
    try {
      await notificationsApi.clearAll(user.name);
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
        fetchNotifications,
        markAllAsRead,
        markAsRead,
        clearAll,
        pushPermission,
        requestPushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
