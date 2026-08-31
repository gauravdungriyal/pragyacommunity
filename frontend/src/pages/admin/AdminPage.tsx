import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  TrendingUp,
  Send
} from 'lucide-react';
import { adminApi, postsApi } from '../../api/services';
import { AdminStats, User, Post } from '../../types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    posts: 0,
    comments: 0,
    events: 0,
  });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'broadcast'>('users');
  const [userSearch, setUserSearch] = useState('');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, postsData] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        postsApi.getAll(),
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
      }
      if (usersData.status === 'fulfilled' && Array.isArray(usersData.value)) {
        setUsersList(usersData.value);
      }
      if (postsData.status === 'fulfilled' && Array.isArray(postsData.value)) {
        setPostsList(postsData.value);
      }
    } catch (err) {
      console.error('Failed to load admin portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      await adminApi.deleteUser(id);
      setUsersList((prev) => prev.filter((u) => (u.id || u._id) !== id));
      setStats((prev) => ({ ...prev, users: Math.max(0, prev.users - 1) }));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to moderate/delete this post?')) return;
    try {
      await adminApi.deletePost(id);
      setPostsList((prev) => prev.filter((p) => p._id !== id));
      setStats((prev) => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await adminApi.broadcast({ title: broadcastTitle, message: broadcastMessage });
      setBroadcastSent(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSent(false), 3000);
    } catch (err) {
      alert('Failed to send broadcast notification.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-900 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Shield className="w-3.5 h-3.5" />
            Administrative Command
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Pragya Admin Portal
          </h1>
          <p className="text-forest-100/80 text-xs sm:text-sm">
            Monitor platform metrics, moderate community discussions, and manage user memberships.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-950 text-forest-700 dark:text-forest-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold text-neutral-500">Total Registered</p>
          <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {stats.users || usersList.length || 0}
          </h3>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950 text-gold-700 dark:text-gold-300 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <Sparkles className="w-4 h-4 text-gold-500" />
          </div>
          <p className="text-xs font-semibold text-neutral-500">Community Posts</p>
          <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {stats.posts || postsList.length || 0}
          </h3>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xs font-semibold text-neutral-500">Discussions / Comments</p>
          <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {stats.comments || 0}
          </h3>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <Sparkles className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-xs font-semibold text-neutral-500">Workshops / Events</p>
          <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {stats.events || 0}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-sand-200 dark:border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-forest-600 dark:border-gold-500 text-forest-700 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          User Registry ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'posts'
              ? 'border-forest-600 dark:border-gold-500 text-forest-700 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          Post Moderation ({postsList.length})
        </button>
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'broadcast'
              ? 'border-forest-600 dark:border-gold-500 text-forest-700 dark:text-gold-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          System Announcement
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-sand-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
              Registered Accounts
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter by name or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 dark:bg-neutral-800/60 text-neutral-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 dark:divide-neutral-800">
                {filteredUsers.map((u) => {
                  const id = u.id || u._id || '';
                  return (
                    <tr key={id} className="hover:bg-sand-50/50 dark:hover:bg-neutral-800/40">
                      <td className="p-4 font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-forest-600 text-white font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        {u.name}
                      </td>
                      <td className="p-4 text-neutral-600 dark:text-neutral-300">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {u.role || 'Student'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(id, u.name)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Content Moderation */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-6 space-y-4">
          <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
            Community Post Moderation
          </h3>

          <div className="space-y-3">
            {postsList.map((p) => (
              <div
                key={p._id}
                className="p-4 rounded-2xl bg-sand-50 dark:bg-neutral-800/40 border border-sand-200 dark:border-neutral-700 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-neutral-900 dark:text-white">
                      {p.user_id?.name || 'Member'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">
                    {p.content}
                  </p>
                </div>

                <button
                  onClick={() => handleDeletePost(p._id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: System Broadcast */}
      {activeTab === 'broadcast' && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-6 sm:p-8 space-y-5 max-w-xl">
          <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
            Send Platform Broadcast Notification
          </h3>

          {broadcastSent && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Broadcast transmitted to all active users!
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="E.g., Special International Yoga Day Webinar Announced"
                className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                Message Body
              </label>
              <textarea
                rows={4}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter the notification text to be delivered to all member inboxes..."
                className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-forest-900 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Broadcast Notification
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
