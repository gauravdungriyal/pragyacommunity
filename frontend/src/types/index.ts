export type UserRole = 'student' | 'Student' | 'mentor' | 'Mentor' | 'admin' | 'Admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  expertise?: string;
  availability?: string;
  rating?: number;
  phone?: string;
  title?: string;
  organization?: string;
  skills?: string[];
  badges?: string[];
  createdAt?: string;
}

export interface AuthResponse {
  status: boolean;
  message: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  uid?: string;
  name?: string;
  user?: User;
}

export interface UserProfileData {
  id: string;
  username?: string;
  warning?: number;
  profile?: string;
  fullname?: string;
  fname?: string;
  lname?: string;
  wallet_balance?: string;
  amount_expire?: string;
  chinese_name?: string;
  dob?: string;
  dob_month?: string;
  dob_date?: string;
  gender?: string;
  email: string;
  phone?: string;
  hongkong_id?: string;
  hkdf?: string;
  street?: string;
  city?: string;
  address_state?: string;
  country?: string;
  pincode?: string;
  enroll_date?: string;
  notify_whatsapp?: number | string;
  notify_email?: number | string;
  notify_push?: number | string;
  bookings?: string | number;
  noshow_strikes?: number;
  late_checkin_strikes?: number;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  photo?: string;
  name: string;
  relation: string;
  phone: string;
}

export interface WalletHistoryItem {
  amount: string;
  type: boolean; // true = credit (+), false = debit (-)
  comments: string;
  date: string;
}

export interface WalletResponse {
  status: boolean;
  balance: string;
  history: WalletHistoryItem[];
}

export interface Comment {
  _id: string;
  post_id: string;
  user_id: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  } | string;
  comment_text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments?: Comment[];
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Mentor {
  _id: string;
  name: string;
  email: string;
  role: string;
  expertise?: string;
  bio?: string;
  rating?: number;
  availability?: string;
  avatar?: string;
  experience?: string;
  sessionCount?: number;
}

export interface EventSchedule {
  id: string;
  title: string;
  timing?: string;
  duration?: string;
  book_cost?: number;
  book_cost_apply?: string;
  book_limit?: number;
  spots_left?: number | null;
  is_full?: boolean;
  description?: string;
  video?: string;
  levels?: string;
  instructor?: string;
  scheduled?: string;
  event_date?: string;
}

export interface EventPackage {
  id: string;
  title: string;
  amount: string | number;
  description?: string;
  is_featured?: number | boolean;
  classes_limit?: string;
  validity?: string;
}

export interface Event {
  _id: string;
  id?: string;
  title: string;
  name?: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category?: string;
  image?: string;
  amount?: number;
  is_free?: number | boolean;
  starts_at?: string;
  ends_at?: string;
  is_favorite?: boolean;
  likes_count?: number;
  schedules?: EventSchedule[];
  packages?: EventPackage[];
  created_by?: {
    _id: string;
    name: string;
  } | string;
  attendeesCount?: number;
  isRegistered?: boolean;
  createdAt?: string;
}

export interface MessageAttachment {
  name: string;
  url: string;
  fileType: string;
  size: number;
}

export interface MessageReaction {
  user: string;
  emoji: string;
}

export interface Message {
  _id: string;
  sender: string;
  recipient: string;
  text: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_read: boolean;
  pinned?: boolean;
  starred?: boolean;
  reply_to?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  partner: string;
  partnerName?: string;
  partnerRole?: string;
  partnerAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  pinned?: boolean;
  starred?: boolean;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  file_url: string;
  uploaded_by: string;
  category?: string;
  fileType?: string;
  downloads?: number;
  size?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type?: 'mentorship' | 'community' | 'event' | 'system' | 'message';
  is_read: boolean;
  link?: string;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  posts: number;
  comments: number;
  events: number;
}

export interface DailyQuote {
  quote: string;
  author: string;
  source?: string;
}
