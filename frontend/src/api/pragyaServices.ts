/**
 * Maps the live Pragya Yog API onto the models the app screens already use.
 *
 * Each function names the action it calls so the mapping back to
 * https://pragya-yog.com/docs/ stays obvious.
 */
import {
  pragyaPost,
  pragyaPostForm,
  pragyaUpload,
  htmlToText,
  splitDateTime,
} from './pragyaClient';
import { AuthResponse, DailyQuote, Event, Mentor, TodayClass, User, UserProfileData } from '../types';

// ==========================================================================
// Auth  (actions: login, check-token, reset-password, passwrod_change)
// ==========================================================================

export const pragyaAuth = {
  /**
   * action: login
   * Returns access + refresh tokens, the user id and the member's first name.
   * The API has no concept of roles, so everyone signing in this way is a
   * member; staff tools stay behind the local accounts.
   */
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await pragyaPost<{
      status: boolean;
      message: string;
      access_token?: string;
      refresh_token?: string;
      uid?: string;
      name?: string;
    }>('login', { email: credentials.email.trim(), password: credentials.password }, { auth: false });

    if (!res.status) {
      return { status: false, message: res.message || 'Invalid email or password' };
    }

    const user: User = {
      id: String(res.uid || ''),
      _id: String(res.uid || ''),
      name: res.name || 'Member',
      email: credentials.email.trim(),
      role: 'Student',
    };

    return {
      status: true,
      message: res.message || 'Login successful',
      access_token: res.access_token,
      token: res.access_token,
      refresh_token: res.refresh_token,
      uid: res.uid,
      name: res.name,
      user,
    };
  },

  /** action: check-token — validates the access token, refreshing when needed. */
  checkToken: async (token?: string, refresh_token?: string) =>
    pragyaPost<{
      status: boolean;
      message: boolean | string;
      access_token?: string;
      refresh_token?: string;
    }>('check-token', { token: token || undefined, refresh_token: refresh_token || undefined }, { auth: false }),

  /** action: reset-password */
  resetPassword: async (email: string) =>
    pragyaPost<{ status: boolean; message: string }>('reset-password', { email: email.trim() }, { auth: false }),

  /** action: passwrod_change (spelling as published by the API) */
  changePassword: async (data: { old_pass: string; password: string; confirmpassword: string }) =>
    pragyaPost<{ status: boolean; message: string }>('passwrod_change', data),
};

// ==========================================================================
// Profile  (actions: get-profile, edit_user_details, update-notification-settings)
// ==========================================================================

export const pragyaProfile = {
  /** action: get-profile */
  get: async (): Promise<(User & UserProfileData) | null> => {
    const res = await pragyaPost<{ status: boolean; data: UserProfileData }>('get-profile');
    if (!res.status || !res.data) return null;

    const d = res.data;
    return {
      ...d,
      id: String(d.id || ''),
      _id: String(d.id || ''),
      name: d.fullname || `${d.fname || ''} ${d.lname || ''}`.trim() || 'Member',
      email: d.email,
      role: 'Student',
      avatar: d.profile,
      phone: d.phone,
    };
  },

  /**
   * action: edit_user_details — multipart, and the API requires fname, lname
   * and chinese_name on every call.
   */
  update: async (
    fields: {
      fname: string;
      lname: string;
      chinese_name: string;
      email?: string;
      phone?: string;
      hongkong_id?: string;
      street?: string;
      city?: string;
      address_state?: string;
      country?: string;
      pincode?: string;
      dob_month?: string;
      dob_date?: string;
      notify_whatsapp?: number;
      notify_email?: number;
      notify_push?: number;
    },
    avatar?: File | null
  ) => pragyaPostForm<{ status: boolean; message?: string }>('edit_user_details', fields, { avatar }),

  /** action: update-notification-settings */
  updateNotificationSettings: async (settings: {
    notify_whatsapp?: number;
    notify_email?: number;
    notify_push?: number;
  }) => pragyaPost<{ status: boolean; message: string }>('update-notification-settings', settings),

  /** action: get-notification — up to 10 unseen notices. */
  getNotifications: async () =>
    pragyaPost<{
      status: boolean;
      data: Array<{
        id: string;
        user_id: string;
        title: string;
        description: string;
        user_seen: string;
        created_at: string;
      }>;
    }>('get-notification'),

  /** action: del-notification — marks one notice as seen. */
  dismissNotification: async (id: string | number) =>
    pragyaPost<{ status: boolean }>('del-notification', { id }),
};

// ==========================================================================
// Events & workshops  (actions: upcoming-events, upcoming-event-detail,
//                     event-toggle-favorite, event-favorites)
// ==========================================================================

/** Pull a usable string out of a field the API may send as a string or object. */
const textField = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value.name || value.title || value.label || '';
  return String(value);
};

/** Image blocks arrive as { url, filename, ... }; plain strings also occur. */
const imageUrl = (value: any, folder = ''): string => {
  if (!value) return '';
  if (typeof value === 'string') return pragyaUpload(value, folder);
  if (typeof value === 'object' && value.url) return value.url;
  return '';
};

const stringList = (value: any): string[] =>
  Array.isArray(value) ? value.map((v) => textField(v)).filter(Boolean) : [];

/**
 * Normalise one API event record into the app's Event model.
 *
 * The live payload is richer than the published docs: `instructor` is an
 * object, favourites come back as `is_liked`, and the artwork arrives as
 * image blocks. Everything is coerced here so no raw object ever reaches the
 * screen.
 */
const toEvent = (e: any, isFavorite?: boolean): Event => {
  const { date, time } = splitDateTime(e.starts_at);
  const instructor = e.instructor && typeof e.instructor === 'object' ? e.instructor : null;
  const instructorName = textField(e.instructor);

  return {
    _id: String(e.id),
    id: String(e.id),
    title: e.title || e.name || 'Session',
    name: e.name,
    description: htmlToText(e.description),
    date: date || '',
    time: time || '',
    location: textField(e.location) || textField(e.venue) || 'Pragya Yog School',
    category: textField(e.category) || 'Workshop',
    image: imageUrl(e.image) || imageUrl(e.square_image) || imageUrl(e.carousel_image),
    banner_url: imageUrl(e.banner_image) || imageUrl(e.carousel_image) || imageUrl(e.image),
    amount: Number(e.amount || 0),
    original_amount: Number(e.original_amount || e.amount || 0),
    discount_active: !!Number(e.discount_active || 0),
    is_free: Number(e.is_free ?? 1),
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    is_favorite:
      typeof isFavorite === 'boolean' ? isFavorite : !!(e.is_liked ?? e.is_favorite),
    likes_count: Number(e.likes_count || 0),
    creator_name: instructorName || 'Pragya Yog School',
    instructor: instructor
      ? {
          staff_id: instructor.staff_id,
          name: instructor.name || 'Pragya Faculty',
          post: instructor.post || '',
          image: imageUrl(instructor.image, 'teachers/'),
          rating: instructor.rating ? Number(instructor.rating) : undefined,
          total_reviews: instructor.total_reviews ? Number(instructor.total_reviews) : undefined,
          rating_text: instructor.rating_text || '',
        }
      : null,
    difficulty_tags: stringList(e.difficulty_tags),
    benefits: stringList(e.benefits),
    what_to_bring: stringList(e.what_to_bring),
    theme_color: typeof e.theme_color === 'string' ? e.theme_color : undefined,
    share_url: typeof e.share_url === 'string' ? e.share_url : undefined,
    countdown_label: typeof e.countdown_label === 'string' ? e.countdown_label : undefined,
    social_proof: e.social_proof && typeof e.social_proof === 'object'
      ? {
          bookings_count: Number(e.social_proof.bookings_count || 0),
          spots_remaining:
            e.social_proof.spots_remaining === null || e.social_proof.spots_remaining === undefined
              ? null
              : Number(e.social_proof.spots_remaining),
          spots_label: e.social_proof.spots_label ?? null,
        }
      : undefined,
    attendeesCount: Number(e?.social_proof?.bookings_count || 0),
    schedules: Array.isArray(e.schedules) && e.schedules.length
      ? e.schedules.map((s: any) => ({
          id: String(s.id),
          title: s.title || 'Session',
          timing: s.timing,
          duration: s.duration,
          book_cost: Number(s.book_cost || 0),
          book_cost_apply: s.book_cost_apply,
          book_limit: Number(s.book_limit || 0),
          spots_left: s.spots_left === null || s.spots_left === undefined ? null : Number(s.spots_left),
          is_full: !!s.is_full,
          description: htmlToText(s.description),
          levels: textField(s.levels),
          instructor: textField(s.instructor),
          event_date: s.event_date,
        }))
      : undefined,
    packages: Array.isArray(e.packages) && e.packages.length
      ? e.packages.map((p: any) => {
          const amount = Number(p.amount || 0);
          const discount = Number(p.discount || 0);
          const payable =
            p.discount_type === 'fix' && discount > 0 ? Math.max(0, amount - discount) : amount;
          return {
            id: String(p.id),
            title: p.title || 'Package',
            amount: payable,
            original_amount: payable !== amount ? amount : undefined,
            description: htmlToText(p.description || p.discount_remarks),
            is_featured: Array.isArray(e.featured_package_ids)
              ? e.featured_package_ids.map(String).includes(String(p.id))
              : !!p.is_featured,
            classes_limit: p.classes_limit ? String(p.classes_limit) : undefined,
            validity: p.validity ? String(p.validity) : undefined,
          };
        })
      : undefined,
  };
};

export const pragyaEvents = {
  /** action: upcoming-events — the token is optional and adds favourite state. */
  list: async (): Promise<Event[]> => {
    const res = await pragyaPost<{ status: boolean; data: any[] }>('upcoming-events');
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data.map((e) => toEvent(e));
  },

  /** action: upcoming-event-detail — free events carry schedules, paid ones packages. */
  detail: async (eventId: string | number): Promise<Event | null> => {
    const res = await pragyaPost<{ status: boolean; data: any }>('upcoming-event-detail', {
      event_id: Number(eventId),
    });
    if (!res.status || !res.data) return null;
    return toEvent(res.data);
  },

  /** action: event-toggle-favorite */
  toggleFavorite: async (eventId: string | number) =>
    pragyaPost<{ status: boolean; favorited?: boolean; likes_count?: number; message?: string }>(
      'event-toggle-favorite',
      { event_id: Number(eventId) }
    ),

  /** action: event-favorites */
  favorites: async (): Promise<Event[]> => {
    const res = await pragyaPost<{ status: boolean; data: any[] }>('event-favorites');
    if (!res.status || !Array.isArray(res.data)) return [];
    return res.data.map((e) => toEvent(e, true));
  },
};

// ==========================================================================
// Teachers  (action: teachers)
// ==========================================================================

export const pragyaTeachers = {
  /** action: teachers — public directory of instructors. */
  list: async (): Promise<Mentor[]> => {
    const res = await pragyaPost<{ status: boolean; data: any[] }>('teachers', {}, { auth: false });
    if (!res.status || !Array.isArray(res.data)) return [];

    return res.data.map((t) => ({
      _id: String(t.staff_id),
      name: textField(t.name) || 'Instructor',
      email: '',
      role: 'Teacher',
      expertise: textField(t.post) || 'Yoga Instructor',
      bio: htmlToText(t.description),
      avatar: imageUrl(t.image, 'teachers/'),
      rating: t.rating ? Number(t.rating) : undefined,
      sessionCount: t.total_reviews ? Number(t.total_reviews) : undefined,
      availability: textField(t.availability) || undefined,
    }));
  },
};

// ==========================================================================
// Classes & schedule  (actions: today-class, get-booked-classes)
// ==========================================================================

export const pragyaClasses = {
  /**
   * action: today-class — public. Despite the name the API returns the next
   * five active schedules, so the caller filters to the current day itself.
   */
  today: async (): Promise<{ today: string; classes: TodayClass[] }> => {
    const res = await pragyaPost<{
      status: boolean;
      today: string;
      todaySchedules: any[];
    }>('today-class', {}, { auth: false });

    if (!res.status || !Array.isArray(res.todaySchedules)) {
      return { today: '', classes: [] };
    }

    return {
      today: res.today,
      classes: res.todaySchedules.map((s) => ({
        id: Number(s.id),
        _id: String(s.id),
        title: textField(s.title) || 'Class',
        time: s.timing || '',
        date: s.date || res.today || '',
        location: textField(s.location) || 'Pragya Yog School',
        category: textField(s.type) || undefined,
        course_name: null,
        instructor_name: textField(s.instructor) || 'Pragya Faculty',
      })),
    };
  },

  /** action: get-booked-classes — the member's own bookings. */
  booked: async (payload: { from?: string; to?: string } = {}) =>
    pragyaPost<{ status: boolean; data: any[] }>('get-booked-classes', payload),
};

// ==========================================================================
// Daily quote  (action: get-daily-quote)
// ==========================================================================

export const pragyaMisc = {
  /** action: get-daily-quote — returns a single-element array. */
  dailyQuote: async (): Promise<DailyQuote | null> => {
    const res = await pragyaPost<{ status: boolean; data: Array<{ q: string; a: string; h?: string }> }>(
      'get-daily-quote',
      {},
      { auth: false }
    );
    const first = res?.data?.[0];
    if (!res?.status || !first) return null;
    return { quote: first.q, author: first.a };
  },

  /** action: app-version */
  appVersion: async () =>
    pragyaPost<{ latest_version: string; force_update: boolean }>('app-version', {}, { auth: false }),
};

// ==========================================================================
// Support content  (actions: faqs, policies)
// ==========================================================================

/** Policy documents are addressed by a fixed id. */
export const POLICY_IDS = {
  booking: 1,
  terms: 2,
  privacy: 3,
  about: 4,
} as const;

export const pragyaSupport = {
  /** action: faqs — the school's published questions and answers. */
  getFaqs: async (): Promise<Array<{ q: string; a: string }>> => {
    const res = await pragyaPost<{ status: boolean; data: Array<{ question: string; answer: string }> }>(
      'faqs',
      {},
      { auth: false }
    );
    if (!res?.status || !Array.isArray(res.data)) return [];
    return res.data
      .map((f) => ({ q: htmlToText(f.question), a: htmlToText(f.answer) }))
      .filter((f) => f.q && f.a);
  },

  /**
   * action: policies — one document per id. The API sends an empty body when
   * the row is missing, which the client surfaces as an error, so this is
   * wrapped to return null instead.
   */
  getPolicy: async (id: number): Promise<{ title: string; body: string } | null> => {
    try {
      const res = await pragyaPost<{ status: boolean; data: Record<string, any> }>(
        'policies',
        { id },
        { auth: false }
      );
      const row = res?.data;
      if (!res?.status || !row) return null;

      // Column names vary; take the longest text field as the body
      const body = Object.entries(row)
        .filter(([key, v]) => typeof v === 'string' && key !== 'title' && v.length > 40)
        .map(([, v]) => String(v))
        .sort((a, b) => b.length - a.length)[0];

      return { title: row.title || 'Policy', body: htmlToText(body || '') };
    } catch {
      return null;
    }
  },
};
