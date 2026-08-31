import { apiClient, apiPhpPost } from './client';
import {
  AuthResponse,
  User,
  UserProfileData,
  EmergencyContact,
  WalletResponse,
  Post,
  Comment,
  Mentor,
  Event,
  Message,
  Conversation,
  Resource,
  Notification,
  AdminStats,
  DailyQuote,
} from '../types';

// ==================== AUTH API ====================
export const authApi = {
  /**
   * Action: login
   * Purpose: Authenticate user & issue access_token (24h) + refresh_token (300d)
   */
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiPhpPost<AuthResponse>('login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (res.status) {
      const token = res.access_token || res.token;
      const normalizedUser: User = {
        id: String(res.uid || (res.user as any)?.id || (res.user as any)?._id || ''),
        _id: String(res.uid || (res.user as any)?.id || (res.user as any)?._id || ''),
        name: res.name || (res.user as any)?.name || 'User',
        email: credentials.email,
        role: (res.user as any)?.role || 'Student',
      };

      return {
        status: true,
        message: res.message || 'Login successful',
        access_token: token,
        token: token,
        refresh_token: res.refresh_token,
        uid: res.uid,
        name: res.name,
        user: normalizedUser,
      };
    }
    return res;
  },

  /**
   * Action: check-token
   * Purpose: Validate access token or mint new token via refresh_token
   */
  checkToken: async (token?: string, refresh_token?: string): Promise<{
    status: boolean;
    message: boolean | string;
    access_token?: string;
    refresh_token?: string;
  }> => {
    return await apiPhpPost('check-token', {
      token: token || undefined,
      refresh_token: refresh_token || undefined,
    });
  },

  /**
   * Action: reset-password
   * Purpose: Send password-reset link to registered email
   */
  resetPassword: async (email: string): Promise<{ status: boolean; message: string }> => {
    return await apiPhpPost('reset-password', { email: email.trim() });
  },

  /**
   * Action: passwrod_change (typo preserved as in backend API)
   * Purpose: Change authenticated user password
   */
  changePassword: async (data: {
    old_pass: string;
    password: string;
    confirmpassword: string;
  }): Promise<{ status: boolean; message: string }> => {
    return await apiPhpPost('passwrod_change', data);
  },

  /**
   * Action: register-device-token
   * Purpose: Register FCM device push token
   */
  registerDeviceToken: async (data: {
    fcm_token: string;
    platform?: 'android' | 'ios';
  }): Promise<{ status: boolean; message: string }> => {
    return await apiPhpPost('register-device-token', {
      fcm_token: data.fcm_token,
      platform: data.platform || 'android',
    });
  },

  /**
   * Action: unregister-device-token
   * Purpose: Remove FCM device token on logout
   */
  unregisterDeviceToken: async (fcm_token: string): Promise<{ status: boolean; message: string }> => {
    return await apiPhpPost('unregister-device-token', { fcm_token });
  },

  /**
   * Register new user
   */
  register: async (userData: { name: string; email: string; password: string; role?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', userData);
    return res.data;
  },
};

// ==================== POSTS / FEED API ====================
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/posts');
    return res.data;
  },
  create: async (data: { user_id: string; content: string; image?: string; category?: string }): Promise<Post> => {
    const res = await apiClient.post<Post>('/posts/create', data);
    return res.data;
  },
  edit: async (id: string, data: { content: string; image?: string }): Promise<Post> => {
    const res = await apiClient.put<Post>(`/posts/edit/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<string> => {
    const res = await apiClient.delete<string>(`/posts/delete/${id}`);
    return res.data;
  },
  toggleLike: async (id: string, action?: 'like' | 'unlike'): Promise<{ likes: number; isLiked: boolean }> => {
    const res = await apiClient.put<{ likes: number; isLiked: boolean }>(`/posts/like/${id}`, { action });
    return res.data;
  },
  addComment: async (data: { post_id: string; user_id: string; comment_text: string }): Promise<Comment> => {
    const res = await apiClient.post<Comment>('/posts/comment', data);
    return res.data;
  },
  deleteComment: async (commentId: string): Promise<string> => {
    const res = await apiClient.delete<string>(`/posts/comment/${commentId}`);
    return res.data;
  },
};

// ==================== MENTORS API ====================
export const mentorsApi = {
  getAll: async (): Promise<Mentor[]> => {
    const res = await apiClient.get<Mentor[]>('/mentors');
    return res.data;
  },
};

// ==================== EVENTS API ====================
export const eventsApi = {
  /**
   * Action: upcoming-events
   * Purpose: List all currently-running/future "upcoming events" (workshops/special events), decorated for the app.
   */
  getUpcomingEvents: async (): Promise<Event[]> => {
    try {
      const res = await apiPhpPost<{ status: boolean; data: Event[] }>('upcoming-events');
      if (res.status && Array.isArray(res.data)) {
        return res.data.map((evt) => ({
          ...evt,
          _id: String(evt.id || (evt as any)._id),
          id: String(evt.id || (evt as any)._id),
          date: evt.starts_at ? evt.starts_at.split(' ')[0] : evt.date || '',
          time: evt.starts_at ? (evt.starts_at.split(' ')[1]?.slice(0, 5) || '') : evt.time || '',
        }));
      }
    } catch {
      // Fallback to legacy REST endpoint
    }

    try {
      const res = await apiClient.get<Event[]>('/events/calendar');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * Action: upcoming-event-detail
   * Purpose: Detail of one upcoming event. Free events return schedules; paid events return packages.
   */
  getEventDetail: async (eventId: string | number): Promise<Event | null> => {
    try {
      const res = await apiPhpPost<{ status: boolean; data: Event }>('upcoming-event-detail', {
        event_id: eventId,
      });
      if (res.status && res.data) {
        const evt = res.data;
        return {
          ...evt,
          _id: String(evt.id || (evt as any)._id),
          id: String(evt.id || (evt as any)._id),
          date: evt.starts_at ? evt.starts_at.split(' ')[0] : evt.date || '',
          time: evt.starts_at ? (evt.starts_at.split(' ')[1]?.slice(0, 5) || '') : evt.time || '',
        };
      }
    } catch (err) {
      console.warn('Failed to load event detail:', err);
    }
    return null;
  },

  /**
   * Action: event-toggle-favorite
   * Purpose: Toggle the authenticated user's favorite status for an upcoming event.
   */
  toggleFavorite: async (
    eventId: string | number
  ): Promise<{ status: boolean; favorited?: boolean; likes_count?: number; message?: string }> => {
    return await apiPhpPost('event-toggle-favorite', {
      event_id: eventId,
    });
  },

  /**
   * Action: event-favorites
   * Purpose: List the authenticated user's favorited upcoming events (decorated).
   */
  getFavorites: async (): Promise<Event[]> => {
    const res = await apiPhpPost<{ status: boolean; data: Event[] }>('event-favorites');
    if (res.status && Array.isArray(res.data)) {
      return res.data.map((evt) => ({
        ...evt,
        _id: String(evt.id || (evt as any)._id),
        id: String(evt.id || (evt as any)._id),
        date: evt.starts_at ? evt.starts_at.split(' ')[0] : evt.date || '',
        time: evt.starts_at ? (evt.starts_at.split(' ')[1]?.slice(0, 5) || '') : evt.time || '',
      }));
    }
    return [];
  },

  /** Alias for backward compatibility */
  getAll: async (): Promise<Event[]> => {
    return await eventsApi.getUpcomingEvents();
  },

  create: async (data: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    created_by: string;
    category?: string;
    amount?: number;
    is_free?: number;
  }): Promise<string> => {
    const res = await apiClient.post<string>('/events/create', data);
    return res.data;
  },

  register: async (data: { event_id: string; user_id: string }): Promise<string> => {
    const res = await apiClient.post<string>('/events/register', data);
    return res.data;
  },
};

// ==================== MESSAGES / CHAT API ====================
export const messagesApi = {
  getConversations: async (user: string): Promise<Conversation[]> => {
    const res = await apiClient.get<Conversation[]>('/messages/conversations', {
      params: { user },
    });
    return res.data;
  },
  getHistory: async (user1: string, user2: string): Promise<Message[]> => {
    const res = await apiClient.get<Message[]>('/messages/history', {
      params: { user1, user2 },
    });
    return res.data;
  },
  send: async (data: {
    sender: string;
    recipient: string;
    text: string;
    attachments?: any[];
    reply_to?: string;
  }): Promise<Message> => {
    const res = await apiClient.post<Message>('/messages/send', data);
    return res.data;
  },
  markRead: async (data: { sender: string; recipient: string }): Promise<string> => {
    const res = await apiClient.put<string>('/messages/read', data);
    return res.data;
  },
};

// ==================== RESOURCES API ====================
export const resourcesApi = {
  getAll: async (): Promise<Resource[]> => {
    const res = await apiClient.get<Resource[]>('/resources');
    return res.data;
  },
  create: async (data: {
    title: string;
    description: string;
    file_url: string;
    uploaded_by: string;
    category?: string;
  }): Promise<string> => {
    const res = await apiClient.post<string>('/resources/create', data);
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/resources/${id}`);
    return res.data;
  },
};

// ==================== NOTIFICATIONS API ====================
export const notificationsApi = {
  getAll: async (user: string): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>('/notifications', {
      params: { user },
    });
    return res.data;
  },
  markAllRead: async (user: string): Promise<string> => {
    const res = await apiClient.put<string>('/notifications/read-all', { user });
    return res.data;
  },
  markRead: async (id: string): Promise<Notification> => {
    const res = await apiClient.put<Notification>(`/notifications/read/${id}`);
    return res.data;
  },
  clearAll: async (user: string): Promise<string> => {
    const res = await apiClient.delete<string>('/notifications/clear-all', {
      params: { user },
    });
    return res.data;
  },
};

// ==================== PROFILE & EXTENDED USER API ====================
export const profileApi = {
  /**
   * Action: get-profile
   * Purpose: Return authenticated user profile, booking counts, strikes, wallet, etc.
   */
  getProfile: async (id?: string): Promise<User & UserProfileData> => {
    try {
      const res = await apiPhpPost<{ status: boolean; data: UserProfileData }>('get-profile');
      if (res.status && res.data) {
        const d = res.data;
        const mappedUser: User & UserProfileData = {
          ...d,
          id: String(d.id || id || ''),
          _id: String(d.id || id || ''),
          name: d.fullname || `${d.fname || ''} ${d.lname || ''}`.trim() || 'User',
          email: d.email,
          role: 'Student',
          avatar: d.profile,
          phone: d.phone,
        };
        return mappedUser;
      }
    } catch {
      // Fallback to REST endpoint if id provided
    }

    if (id) {
      const res = await apiClient.get<User>(`/profile/${id}`);
      return res.data as User & UserProfileData;
    }
    throw new Error('Could not fetch profile');
  },

  /**
   * Action: edit_user_details
   * Purpose: Update profile info, address, notification preferences, or upload avatar
   */
  editUserDetails: async (data: FormData | Record<string, any>): Promise<{ status: boolean; message?: string }> => {
    return await apiPhpPost('edit_user_details', data);
  },

  /**
   * Generic profile updater
   */
  updateProfile: async (id: string, data: Partial<User & UserProfileData>): Promise<User> => {
    try {
      await apiPhpPost('edit_user_details', {
        fname: data.fname || (data.name ? data.name.split(' ')[0] : undefined),
        lname: data.lname || (data.name ? data.name.split(' ').slice(1).join(' ') : undefined),
        chinese_name: data.chinese_name || data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        expertise: data.expertise,
        skills: data.skills,
      });
      return {
        id,
        _id: id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'Student',
        ...data,
      };
    } catch {
      const res = await apiClient.put<User>(`/profile/${id}`, data);
      return res.data;
    }
  },

  /**
   * Action: update-notification-settings
   * Purpose: Update notification preference flags (notify_whatsapp, notify_email, notify_push)
   */
  updateNotificationSettings: async (settings: {
    notify_whatsapp?: number;
    notify_email?: number;
    notify_push?: number;
  }): Promise<{ status: boolean; message: string }> => {
    return await apiPhpPost('update-notification-settings', settings);
  },

  /**
   * Action: get-notification
   * Purpose: Return up-to-10 unseen notifications
   */
  getUnseenNotifications: async (): Promise<{ status: boolean; data: any[] }> => {
    return await apiPhpPost('get-notification');
  },

  /**
   * Action: del-notification
   * Purpose: Soft-dismiss / mark seen a single notification
   */
  delNotification: async (id: string | number): Promise<{ status: boolean }> => {
    return await apiPhpPost('del-notification', { id });
  },

  /**
   * Action: emergency-contact
   * Purpose: Get, add, or delete emergency contacts
   */
  emergencyContact: {
    get: async (): Promise<{ status: boolean; data: EmergencyContact[] }> => {
      return await apiPhpPost('emergency-contact', { action_type: 'get' });
    },
    add: async (contact: { name: string; relationship: string; phone: string }): Promise<{ status: boolean; message: string }> => {
      return await apiPhpPost('emergency-contact', {
        action_type: 'add',
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
      });
    },
    delete: async (contact_id: string | number): Promise<{ status: boolean; message: string }> => {
      return await apiPhpPost('emergency-contact', {
        action_type: 'delete',
        contact_id,
      });
    },
  },

  /**
   * Action: wallet
   * Purpose: Return wallet balance and transaction history
   */
  getWallet: async (): Promise<WalletResponse> => {
    return await apiPhpPost<WalletResponse>('wallet');
  },
};

// ==================== ADMIN API ====================
export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/admin/users');
    return res.data;
  },
  deleteUser: async (id: string): Promise<string> => {
    const res = await apiClient.delete<string>(`/admin/user/${id}`);
    return res.data;
  },
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get<AdminStats>('/admin/stats');
    return res.data;
  },
  getReports: async (): Promise<any> => {
    const res = await apiClient.get<any>('/admin/reports');
    return res.data;
  },
  deletePost: async (id: string): Promise<string> => {
    const res = await apiClient.delete<string>(`/admin/post/${id}`);
    return res.data;
  },
  deleteComment: async (id: string): Promise<string> => {
    const res = await apiClient.delete<string>(`/admin/comment/${id}`);
    return res.data;
  },
  broadcast: async (data: { title: string; message: string }): Promise<{ status: boolean; message: string }> => {
    const res = await apiClient.post<{ status: boolean; message: string }>('/admin/broadcast', data);
    return res.data;
  },
};

// ==================== DASHBOARD API ====================
export const dashboardApi = {
  getDailyQuote: async (): Promise<DailyQuote> => {
    try {
      const res = await apiClient.get<DailyQuote>('/dashboard/quote');
      return res.data;
    } catch {
      // Fallback inspirational quote
      return {
        quote: "Yoga is the journey of the self, through the self, to the self.",
        author: "The Bhagavad Gita",
      };
    }
  },
};
