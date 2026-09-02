import { apiClient, apiPhpPost } from './client';
import {
  pragyaAuth,
  pragyaProfile,
  pragyaEvents,
  pragyaTeachers,
  pragyaClasses,
  pragyaMisc,
} from './pragyaServices';
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
  ResourceCategory,
  Course,
  CourseGroup,
  DashboardSummary,
  Notification,
  AdminStats,
  DailyQuote,
} from '../types';

// ==================== AUTH API ====================

/** Which system authenticated the current session. */
export type AuthSource = 'pragya' | 'local';

const AUTH_SOURCE_KEY = 'auth_source';

/** Reads which system issued the stored session; defaults to the live API. */
export const getAuthSource = (): AuthSource =>
  (localStorage.getItem(AUTH_SOURCE_KEY) as AuthSource) || 'pragya';

export const setAuthSource = (source: AuthSource): void => {
  localStorage.setItem(AUTH_SOURCE_KEY, source);
};

/** True when the session came from the live Pragya Yog API. */
export const isLiveSession = (): boolean => getAuthSource() === 'pragya';

export const authApi = {
  /**
   * Sign in against the live Pragya Yog API first, falling back to the local
   * backend. Live accounts carry no role, so the staff-only tools (community
   * feed moderation, courses, admin) stay behind local accounts.
   */
  login: async (
    credentials: { email: string; password: string }
  ): Promise<AuthResponse & { source: AuthSource }> => {
    try {
      const live = await pragyaAuth.login(credentials);
      if (live.status) {
        return { ...live, source: 'pragya' };
      }
      // Fall through so a staff account can still be tried locally
    } catch (err) {
      console.warn('Live API sign-in unavailable, trying the local backend:', err);
    }

    const local = await authApi.loginLocal(credentials);
    return { ...local, source: 'local' };
  },

  /**
   * Action: login (local backend)
   * Purpose: Authenticate user & issue access_token (24h) + refresh_token (300d)
   */
  loginLocal: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiPhpPost<AuthResponse>('login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (res.status) {
      const token = res.access_token || res.token;
      const apiUser = res.user as any;
      const normalizedUser: User = {
        id: String(res.uid || apiUser?.id || apiUser?._id || ''),
        _id: String(res.uid || apiUser?.id || apiUser?._id || ''),
        // The API returns the member's full name; it keys notifications and chat
        name: apiUser?.name || res.name || 'User',
        email: apiUser?.email || credentials.email,
        role: apiUser?.role || 'Student',
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
    const call = getAuthSource() === 'pragya' ? pragyaAuth.checkToken : (t?: string, r?: string) =>
      apiPhpPost('check-token', { token: t || undefined, refresh_token: r || undefined });
    return await call(token, refresh_token);
  },

  /**
   * Action: reset-password
   * Purpose: Send password-reset link to registered email
   */
  resetPassword: async (email: string): Promise<{ status: boolean; message: string }> => {
    try {
      const res = await pragyaAuth.resetPassword(email);
      if (res?.status) return res;
    } catch {
      // Fall back to the local backend below
    }
    return await apiPhpPost('reset-password', { email: email.trim() });
  },

  /**
   * Action: passwrod_change (spelling preserved as published by the API)
   * Purpose: Change authenticated user password
   */
  changePassword: async (data: {
    old_pass: string;
    password: string;
    confirmpassword: string;
  }): Promise<{ status: boolean; message: string }> => {
    if (getAuthSource() === 'pragya') {
      return await pragyaAuth.changePassword(data);
    }
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
};

// ==================== POSTS / FEED API ====================
export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const res = await apiClient.get<Post[]>('/posts');
    return res.data;
  },
  create: async (data: { user_id?: string; content: string; image?: string; category?: string }): Promise<Post> => {
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
  /**
   * Toggle this member's like. The server enforces one like per person and
   * returns the authoritative count.
   */
  toggleLike: async (id: string): Promise<{ likes: number; isLiked: boolean; liked_by_me: boolean }> => {
    const res = await apiClient.put(`/posts/like/${id}`);
    return res.data;
  },
  addComment: async (data: { post_id: string; user_id?: string; comment_text: string }): Promise<Comment> => {
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
  /** Instructors come from the live `teachers` action, which is public. */
  getAll: async (): Promise<Mentor[]> => {
    try {
      const live = await pragyaTeachers.list();
      if (live.length) return live;
    } catch (err) {
      console.warn('Live teachers unavailable, falling back to the local backend:', err);
    }

    try {
      const res = await apiClient.get<Mentor[]>('/mentors');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
};

// ==================== EVENTS API ====================
export type EventScope = 'upcoming' | 'today' | 'past' | 'mine' | 'favorites' | 'all';

/** Is this ISO-ish date string today? */
const isToday = (value?: string): boolean => {
  if (!value) return false;
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return false;
  return d.toDateString() === new Date().toDateString();
};

const isPast = (value?: string): boolean => {
  if (!value) return false;
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return false;
  return d < new Date(new Date().toDateString());
};

export const eventsApi = {
  /**
   * Events come from the live Pragya Yog API. That endpoint returns the
   * upcoming list in one call, so the scopes are narrowed here rather than
   * by a query parameter.
   */
  getEvents: async (scope: EventScope = 'upcoming', limit?: number, offset?: number): Promise<Event[]> => {
    try {
      if (scope === 'favorites') {
        return await pragyaEvents.favorites();
      }

      const all = await pragyaEvents.list();
      let list = all;

      if (scope === 'today') list = all.filter((e) => isToday(e.starts_at || e.date));
      else if (scope === 'past') list = all.filter((e) => isPast(e.starts_at || e.date));
      else if (scope === 'upcoming') list = all.filter((e) => !isPast(e.starts_at || e.date));
      else if (scope === 'mine') {
        // The live API has no "my events" list; favourites are the closest signal
        list = await pragyaEvents.favorites();
      }

      if (limit !== undefined) {
        const start = offset || 0;
        list = list.slice(start, start + limit);
      }
      return list;
    } catch (err) {
      console.warn('Live events unavailable, falling back to the local backend:', err);
      const params: Record<string, any> = { scope };
      if (limit !== undefined) params.limit = limit;
      if (offset !== undefined) params.offset = offset;
      try {
        const res = await apiClient.get<Event[]>('/events', { params });
        return Array.isArray(res.data) ? res.data : [];
      } catch {
        return [];
      }
    }
  },

  /** Upcoming sessions (default landing scope). */
  getUpcomingEvents: async (): Promise<Event[]> => eventsApi.getEvents('upcoming'),

  /** Sessions the member has booked. */
  getMyRegistrations: async (): Promise<Event[]> => {
    const res = await apiClient.get<Event[]>('/events/my-registrations');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** One event, for its own page. */
  getEventDetail: async (eventId: string | number): Promise<Event | null> => {
    try {
      const live = await pragyaEvents.detail(eventId);
      if (live) return live;
    } catch (err) {
      console.warn('Live event detail unavailable, trying the local backend:', err);
    }

    try {
      const res = await apiClient.get<Event>(`/events/${eventId}`);
      return res.data || null;
    } catch {
      return null;
    }
  },

  /** Action: event-toggle-favorite */
  toggleFavorite: async (
    eventId: string | number
  ): Promise<{ status: boolean; favorited?: boolean; likes_count?: number; message?: string }> => {
    if (isLiveSession()) {
      return await pragyaEvents.toggleFavorite(eventId);
    }
    return await apiPhpPost('event-toggle-favorite', { event_id: eventId });
  },

  getFavorites: async (): Promise<Event[]> => eventsApi.getEvents('favorites'),

  /** Alias kept for older call sites. */
  getAll: async (): Promise<Event[]> => eventsApi.getEvents('upcoming'),

  create: async (data: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category?: string;
    course_id?: number | null;
    amount?: number;
    is_free?: number;
  }): Promise<{ message: string; event: Event }> => {
    const res = await apiClient.post<{ message: string; event: Event }>('/events/create', data);
    return res.data;
  },

  register: async (eventId: string | number): Promise<{
    status: boolean;
    already_registered: boolean;
    message: string;
  }> => {
    const res = await apiClient.post('/events/register', { event_id: eventId });
    return res.data;
  },

  cancelRegistration: async (eventId: string | number): Promise<{ status: boolean; message: string }> => {
    const res = await apiClient.delete(`/events/register/${eventId}`);
    return res.data;
  },

  delete: async (eventId: string | number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/events/${eventId}`);
    return res.data;
  },
};

// ==================== COURSES API ====================
export const coursesApi = {
  getAll: async (): Promise<Course[]> => {
    const res = await apiClient.get<Course[]>('/courses');
    return Array.isArray(res.data) ? res.data : [];
  },

  getMine: async (): Promise<Course[]> => {
    const res = await apiClient.get<Course[]>('/courses/mine');
    return Array.isArray(res.data) ? res.data : [];
  },

  create: async (data: { name: string; description?: string; mentor_id?: number }): Promise<Course> => {
    const res = await apiClient.post<Course>('/courses/create', data);
    return res.data;
  },

  toggleEnrollment: async (courseId: number | string): Promise<{ enrolled: boolean; message: string }> => {
    const res = await apiClient.put(`/courses/${courseId}/enroll`);
    return res.data;
  },

  getMembers: async (courseId: number | string): Promise<User[]> => {
    const res = await apiClient.get<User[]>(`/courses/${courseId}/members`);
    return Array.isArray(res.data) ? res.data : [];
  },

  delete: async (courseId: number | string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/courses/${courseId}`);
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

  /** Course group chats the member belongs to. */
  getGroups: async (): Promise<CourseGroup[]> => {
    const res = await apiClient.get<CourseGroup[]>('/messages/groups');
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Full history for one course group chat. */
  getGroupHistory: async (courseId: number | string): Promise<Message[]> => {
    const res = await apiClient.get<Message[]>(`/messages/group/${courseId}`);
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Post into a course group chat. */
  sendGroup: async (data: { course_id: number | string; text: string }): Promise<Message> => {
    const res = await apiClient.post<Message>('/messages/group/send', data);
    return res.data;
  },
};

// ==================== RESOURCES API ====================
export const resourcesApi = {
  getAll: async (filters?: { course_id?: number | string; category?: string; search?: string }): Promise<Resource[]> => {
    const res = await apiClient.get<Resource[]>('/resources', { params: filters });
    return Array.isArray(res.data) ? res.data : [];
  },
  create: async (data: {
    title: string;
    description: string;
    file_url: string;
    category?: string;
    course_id?: number | null;
  }): Promise<{ message: string; resource: Resource }> => {
    const res = await apiClient.post('/resources/create', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Resource>): Promise<Resource> => {
    const res = await apiClient.put<Resource>(`/resources/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/resources/${id}`);
    return res.data;
  },

  /** Library filters, managed by admins. */
  getCategories: async (): Promise<ResourceCategory[]> => {
    const res = await apiClient.get<ResourceCategory[]>('/resources/categories');
    return Array.isArray(res.data) ? res.data : [];
  },
  createCategory: async (name: string): Promise<ResourceCategory> => {
    const res = await apiClient.post<ResourceCategory>('/resources/categories', { name });
    return res.data;
  },
  deleteCategory: async (id: number | string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/resources/categories/${id}`);
    return res.data;
  },
};

// ==================== NOTIFICATIONS API ====================
export const notificationsApi = {
  getAll: async (user: string): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>('/notifications', {
      params: { user },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Mentors notify only the members enrolled on one of their courses. */
  sendToCourse: async (data: {
    course_id: number | string;
    title: string;
    message: string;
    link?: string;
  }): Promise<{ status: boolean; message: string; recipients: number }> => {
    const res = await apiClient.post('/notifications/course', data);
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
    // A live session reads its profile from the Pragya Yog API
    if (isLiveSession()) {
      const live = await pragyaProfile.get();
      if (live) return live;
    }

    try {
      const res = await apiPhpPost<{ status: boolean; data: UserProfileData & { role?: string } }>('get-profile');
      if (res.status && res.data) {
        const d = res.data;
        const mappedUser: User & UserProfileData = {
          ...d,
          id: String(d.id || id || ''),
          _id: String(d.id || id || ''),
          name: d.fullname || `${d.fname || ''} ${d.lname || ''}`.trim() || 'User',
          email: d.email,
          // The role must come from the API — it decides admin and mentor access
          role: (d.role as any) || 'Student',
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
    if (isLiveSession()) {
      // The live API requires fname, lname and chinese_name on every save
      const [first = '', ...rest] = String(data.name || '').trim().split(' ');
      await pragyaProfile.update({
        fname: data.fname || first || 'Member',
        lname: data.lname || rest.join(' ') || '-',
        chinese_name: data.chinese_name || data.name || first || '-',
        email: data.email,
        phone: data.phone,
        dob_month: data.dob_month,
        dob_date: data.dob_date,
      });
      return {
        id,
        _id: id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'Student',
        ...data,
      } as User;
    }

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
    if (isLiveSession()) {
      return await pragyaProfile.updateNotificationSettings(settings);
    }
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

  /**
   * Action: welcome-seen
   * Purpose: Record that the one-time welcome popup has been shown, so it
   * stays dismissed across refreshes and devices.
   */
  markWelcomeSeen: async (): Promise<{ status: boolean }> => {
    return await apiPhpPost('welcome-seen');
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
  /**
   * Announcements reach either every member (`target: 'all'`) or one
   * individual (`target: 'user'` with a `user_id`).
   */
  broadcast: async (data: {
    title: string;
    message: string;
    target?: 'all' | 'user';
    user_id?: string | number;
  }): Promise<{ status: boolean; message: string; recipients: number }> => {
    const res = await apiClient.post('/admin/broadcast', data);
    return res.data;
  },
};

// ==================== DASHBOARD API ====================
export const dashboardApi = {
  /** The live `get-daily-quote` action, with the local backend as backup. */
  getDailyQuote: async (): Promise<DailyQuote> => {
    try {
      const live = await pragyaMisc.dailyQuote();
      if (live?.quote) return live;
    } catch {
      // Fall through to the local backend
    }

    try {
      const res = await apiClient.get<DailyQuote>('/dashboard/quote');
      return res.data;
    } catch {
      return {
        quote: 'Yoga is the journey of the self, through the self, to the self.',
        author: 'The Bhagavad Gita',
      };
    }
  },

  /** Today's timetable from the live `today-class` action (public). */
  getTodaySchedule: async () => {
    try {
      return await pragyaClasses.today();
    } catch {
      return { today: '', classes: [] };
    }
  },

  /**
   * Everything the dashboard renders, in one request: today's booked classes,
   * enrolled courses, recent activity and personal counters.
   */
  getSummary: async (): Promise<DashboardSummary | null> => {
    try {
      const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
      return res.data || null;
    } catch {
      return null;
    }
  },
};
