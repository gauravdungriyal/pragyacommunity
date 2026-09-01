import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Trash2,
  CheckCircle,
  Search,
  Sparkles,
  TrendingUp,
  Send,
  GraduationCap,
  Plus,
  Globe,
  UserRound,
  AlertCircle,
} from 'lucide-react';
import { adminApi, coursesApi, notificationsApi, postsApi } from '../../api/services';
import { AdminStats, User, Post, Course } from '../../types';

type TabKey = 'users' | 'posts' | 'courses' | 'announce';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({ users: 0, posts: 0, comments: 0, events: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Announcement composer
  const [announceTarget, setAnnounceTarget] = useState<'all' | 'user' | 'course'>('all');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMessage, setAnnounceMessage] = useState('');
  const [announceUserId, setAnnounceUserId] = useState('');
  const [announceCourseId, setAnnounceCourseId] = useState('');
  const [announceResult, setAnnounceResult] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Course creation
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseMentorId, setCourseMentorId] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, postsData, coursesData] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getUsers(),
        postsApi.getAll(),
        coursesApi.getAll(),
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) setStats(statsData.value);
      if (usersData.status === 'fulfilled' && Array.isArray(usersData.value)) setUsersList(usersData.value);
      if (postsData.status === 'fulfilled' && Array.isArray(postsData.value)) setPostsList(postsData.value);
      if (coursesData.status === 'fulfilled' && Array.isArray(coursesData.value)) setCourses(coursesData.value);
    } catch (err) {
      setError('Failed to load the admin portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete the account for "${name}"? This removes their posts and bookings too.`)) return;
    try {
      await adminApi.deleteUser(id);
      setUsersList((prev) => prev.filter((u) => (u.id || u._id) !== id));
      setStats((prev) => ({ ...prev, users: Math.max(0, prev.users - 1) }));
    } catch {
      setError('Failed to delete that member.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Remove this post from the community feed?')) return;
    try {
      await adminApi.deletePost(id);
      setPostsList((prev) => prev.filter((p) => p._id !== id));
      setStats((prev) => ({ ...prev, posts: Math.max(0, prev.posts - 1) }));
    } catch {
      setError('Failed to remove that post.');
    }
  };

  /**
   * Announcements go to everyone, to one member, or to the students on a
   * single course.
   */
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle || !announceMessage) return;

    setSending(true);
    setAnnounceResult(null);
    setError(null);

    try {
      let message: string;

      if (announceTarget === 'course') {
        if (!announceCourseId) {
          setError('Choose a course first.');
          setSending(false);
          return;
        }
        const res = await notificationsApi.sendToCourse({
          course_id: announceCourseId,
          title: announceTitle,
          message: announceMessage,
        });
        message = res.message;
      } else {
        if (announceTarget === 'user' && !announceUserId) {
          setError('Choose a member first.');
          setSending(false);
          return;
        }
        const res = await adminApi.broadcast({
          title: announceTitle,
          message: announceMessage,
          target: announceTarget,
          user_id: announceTarget === 'user' ? announceUserId : undefined,
        });
        message = res.message;
      }

      setAnnounceResult(message);
      setAnnounceTitle('');
      setAnnounceMessage('');
      setTimeout(() => setAnnounceResult(null), 6000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send the announcement.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    setCreatingCourse(true);
    setError(null);
    try {
      const created = await coursesApi.create({
        name: courseName.trim(),
        description: courseDescription.trim(),
        mentor_id: courseMentorId ? Number(courseMentorId) : undefined,
      });
      setCourses((prev) => [...prev, created]);
      setCourseName('');
      setCourseDescription('');
      setCourseMentorId('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create the course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: number, name: string) => {
    if (!confirm(`Delete the course "${name}"? Its group chat and enrolments go with it.`)) return;
    try {
      await coursesApi.delete(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Failed to delete that course.');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      String(u.role || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const mentors = usersList.filter((u) => ['mentor', 'teacher', 'admin'].includes(String(u.role).toLowerCase()));

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'users', label: `Members (${usersList.length})` },
    { key: 'posts', label: `Moderation (${postsList.length})` },
    { key: 'courses', label: `Courses (${courses.length})` },
    { key: 'announce', label: 'Announcements' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Shield className="w-3.5 h-3.5" />
            Administration
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl">Admin Portal</h1>
          <p className="text-forest-100/80 text-xs sm:text-sm">
            Manage members and courses, moderate the feed, and send announcements.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="font-bold underline whitespace-nowrap">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Registered Members', value: stats.users || usersList.length, icon: Users, tone: 'text-forest-700 dark:text-forest-300', bg: 'bg-forest-100 dark:bg-forest-950', accent: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: 'Community Posts', value: stats.posts || postsList.length, icon: MessageSquare, tone: 'text-gold-700 dark:text-gold-300', bg: 'bg-gold-100 dark:bg-gold-950', accent: <Sparkles className="w-4 h-4 text-gold-500" /> },
          { label: 'Comments', value: stats.comments, icon: FileText, tone: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950', accent: <TrendingUp className="w-4 h-4 text-purple-500" /> },
          { label: 'Events', value: stats.events, icon: Calendar, tone: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-950', accent: <Sparkles className="w-4 h-4 text-teal-500" /> },
        ].map(({ label, value, icon: Icon, tone, bg, accent }) => (
          <div key={label} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} ${tone} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              {accent}
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-neutral-500">{label}</p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">{value || 0}</h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 sm:gap-3 border-b border-sand-200 dark:border-neutral-800 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 px-2 sm:px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'border-forest-600 dark:border-gold-500 text-forest-700 dark:text-gold-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-gold-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {/* Members */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-sand-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">Member Registry</h3>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filter by name, email or role…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead className="bg-sand-50 dark:bg-neutral-800/60 text-neutral-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-4">Member</th>
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
                          <td className="p-4 font-bold text-neutral-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-forest-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                              <span className="truncate">{u.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-neutral-600 dark:text-neutral-300 truncate">{u.email}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {u.role || 'Student'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(id, u.name)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete member"
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

          {/* Moderation */}
          {activeTab === 'posts' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">Post Moderation</h3>

              {postsList.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">Nothing has been posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {postsList.map((p) => (
                    <div
                      key={p._id}
                      className="p-4 rounded-2xl bg-sand-50 dark:bg-neutral-800/40 border border-sand-200 dark:border-neutral-700 flex flex-col sm:flex-row items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white">
                            {p.user_id?.name || 'Member'}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(p.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2 break-words">
                          {p.content}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeletePost(p._id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors flex items-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-6 space-y-4">
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-forest-600 dark:text-gold-400" />
                  Create a Course
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Each course gets its own resource shelf and group chat automatically.
                </p>

                <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Course name"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <textarea
                    rows={3}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="What this course covers…"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none text-neutral-900 dark:text-white"
                  />
                  <select
                    value={courseMentorId}
                    onChange={(e) => setCourseMentorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  >
                    <option value="">Assign a mentor (optional)</option>
                    {mentors.map((m) => (
                      <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={creatingCourse}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creatingCourse ? 'Creating…' : 'Create Course'}
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-6 space-y-3">
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-forest-600 dark:text-gold-400" />
                  Existing Courses
                </h3>

                {courses.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-4 text-center">No courses yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {courses.map((c) => (
                      <li
                        key={c.id}
                        className="p-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/50 border border-sand-200 dark:border-neutral-700 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">{c.name}</h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {c.mentor_name || 'No mentor assigned'} · {c.member_count ?? 0} enrolled
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Announcements */}
          {activeTab === 'announce' && (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-8 space-y-5 max-w-2xl">
              <div>
                <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                  Send an Announcement
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Reach everyone, one individual member, or the students on a single course.
                </p>
              </div>

              {announceResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {announceResult}
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="space-y-4 text-xs">
                {/* Audience picker */}
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
                    Audience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'all' as const, label: 'Everyone', icon: Globe, hint: 'All members' },
                      { key: 'user' as const, label: 'One member', icon: UserRound, hint: 'Individual' },
                      { key: 'course' as const, label: 'A course', icon: GraduationCap, hint: 'Enrolled students' },
                    ].map(({ key, label, icon: Icon, hint }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAnnounceTarget(key)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          announceTarget === key
                            ? 'border-forest-600 dark:border-gold-500 bg-forest-50 dark:bg-gold-950/20'
                            : 'border-sand-200 dark:border-neutral-700 bg-sand-50 dark:bg-neutral-800 hover:border-sand-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${announceTarget === key ? 'text-forest-700 dark:text-gold-400' : 'text-neutral-400'}`} />
                        <p className="font-bold text-neutral-900 dark:text-white">{label}</p>
                        <p className="text-[10px] text-neutral-500">{hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {announceTarget === 'user' && (
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Member
                    </label>
                    <select
                      value={announceUserId}
                      onChange={(e) => setAnnounceUserId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                    >
                      <option value="">Choose a member…</option>
                      {usersList.map((u) => (
                        <option key={u.id || u._id} value={u.id || u._id}>
                          {u.name} — {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {announceTarget === 'course' && (
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                      Course
                    </label>
                    <select
                      value={announceCourseId}
                      onChange={(e) => setAnnounceCourseId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                    >
                      <option value="">Choose a course…</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.member_count ?? 0} enrolled)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={announceTitle}
                    onChange={(e) => setAnnounceTitle(e.target.value)}
                    placeholder="Studio closed on Friday"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={announceMessage}
                    onChange={(e) => setAnnounceMessage(e.target.value)}
                    placeholder="What do you want them to know?"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium resize-none text-neutral-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending…' : 'Send Announcement'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
