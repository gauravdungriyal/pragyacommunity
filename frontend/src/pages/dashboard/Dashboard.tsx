import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  Quote,
  GraduationCap,
  CalendarCheck,
  Activity,
  Bell,
  CheckCircle,
  MessageCircle,
  Upload,
  Ticket,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/services';
import { DailyQuote, DashboardSummary } from '../../types';
import { SkeletonBlock } from '../../components/common/PageLoader';

/** Icon for each kind of row in the recent activity trail. */
const activityIcon = (type: string) => {
  switch (type) {
    case 'booking':
      return <Ticket className="w-4 h-4 text-gold-600 dark:text-gold-400" />;
    case 'post':
      return <MessageCircle className="w-4 h-4 text-purple-500" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'resource':
      return <Upload className="w-4 h-4 text-brandTeal-600 dark:text-brandTeal-300" />;
    case 'course':
      return <UserPlus className="w-4 h-4 text-emerald-500" />;
    case 'event':
      return <Calendar className="w-4 h-4 text-terracotta-600 dark:text-terracotta-300" />;
    default:
      return <Activity className="w-4 h-4 text-forest-600 dark:text-forest-300" />;
  }
};

/** "3 hours ago" style label for activity timestamps. */
const relativeTime = (iso: string): string => {
  const then = new Date(iso.replace(' ', 'T')).getTime();
  if (Number.isNaN(then)) return '';

  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [quoteResult, summaryResult] = await Promise.allSettled([
        dashboardApi.getDailyQuote(),
        dashboardApi.getSummary(),
      ]);

      if (!active) return;

      if (quoteResult.status === 'fulfilled' && quoteResult.value?.quote) {
        setDailyQuote(quoteResult.value);
      }
      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setSummary(summaryResult.value);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = summary?.stats;
  const todayClasses = summary?.today_classes ?? [];
  const upcomingClasses = summary?.upcoming_classes ?? [];
  const myCourses = summary?.courses ?? [];
  const recentActivity = summary?.recent_activity ?? [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Welcome & Daily Wisdom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-7 bg-gradient-to-br from-forest-600 via-forest-700 to-forest-800 text-white rounded-3xl p-5 sm:p-8 relative overflow-hidden shadow-xl shadow-forest-900/10 flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-gold-400/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Seeker'}
            </div>
            <h1 className="font-display font-extrabold text-xl sm:text-3xl lg:text-4xl text-white">
              Your practice, at a glance
            </h1>
            <p className="text-sand-100/90 text-xs sm:text-sm max-w-lg leading-relaxed pt-1">
              Today's sessions, your enrolled courses, and everything you have been working on — all in one place.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/20 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              to="/events?tab=mine"
              className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all inline-flex items-center gap-2"
            >
              My Bookings
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/resources"
              className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-gold-400" />
              Course Material
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-8 border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 flex items-center gap-1.5">
              <Quote className="w-4 h-4" /> Daily Sutra
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 whitespace-nowrap">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {dailyQuote ? (
            <>
              <blockquote className="my-auto font-display text-sm sm:text-lg text-neutral-800 dark:text-neutral-100 italic leading-relaxed">
                "{dailyQuote.quote}"
              </blockquote>
              <div className="mt-5 sm:mt-6 pt-4 border-t border-sand-200 dark:border-neutral-800">
                <span className="font-bold text-xs text-forest-700 dark:text-gold-400">
                  — {dailyQuote.author}
                </span>
              </div>
            </>
          ) : (
            <SkeletonBlock className="h-24 my-auto" />
          )}
        </div>
      </div>

      {/* 2. Personal counters, all supplied by the dashboard API */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { label: 'Enrolled Courses', value: stats?.courses, icon: GraduationCap, to: '/resources', tone: 'text-forest-700 dark:text-forest-300', bg: 'bg-forest-100 dark:bg-forest-950/60' },
          { label: 'Sessions Booked', value: stats?.bookings, icon: CalendarCheck, to: '/events?tab=mine', tone: 'text-gold-700 dark:text-gold-300', bg: 'bg-gold-100 dark:bg-gold-950/60' },
          { label: 'Study Materials', value: stats?.resources, icon: BookOpen, to: '/resources', tone: 'text-brandTeal-600 dark:text-brandTeal-300', bg: 'bg-brandTeal-50 dark:bg-brandTeal-950/60' },
          { label: 'Unread Alerts', value: stats?.unread_notifications, icon: Bell, to: '/notifications', tone: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950/60' },
        ].map(({ label, value, icon: Icon, to, tone, bg }) => (
          <Link
            key={label}
            to={to}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${bg} ${tone} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${tone} group-hover:translate-x-1 transition-transform`}>&rarr;</span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">{label}</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
              {loading ? '—' : value ?? 0}
            </h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left column: today's classes and enrolled courses */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Class — the member's own booked sessions for today */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-terracotta-600 dark:text-gold-400" />
                  Today's Class
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Sessions you personally booked for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Link to="/events?tab=today" className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline whitespace-nowrap">
                All today &rarr;
              </Link>
            </div>

            {loading ? (
              <SkeletonBlock className="h-28" />
            ) : todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((cls) => (
                  <Link
                    key={cls._id}
                    to={`/events/${cls.id}`}
                    className="block p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover hover:border-terracotta-300 dark:hover:border-gold-500/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                      <div className="flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 px-3 py-2 sm:py-3 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/50 border border-terracotta-200 dark:border-terracotta-800/60 sm:w-24 flex-shrink-0">
                        <Clock className="w-4 h-4 text-terracotta-600 dark:text-gold-400 sm:mb-1" />
                        <span className="font-bold text-xs sm:text-sm text-terracotta-800 dark:text-gold-300 whitespace-nowrap">
                          {cls.time}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-snug">
                          {cls.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gold-500" />
                            {cls.location}
                          </span>
                          <span>with {cls.instructor_name}</span>
                          {cls.course_name && (
                            <span className="px-2 py-0.5 rounded-full bg-sand-100 dark:bg-neutral-800 font-semibold text-neutral-600 dark:text-neutral-300">
                              {cls.course_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-bold text-forest-700 dark:text-gold-400 whitespace-nowrap self-start sm:self-center">
                        View details &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-sand-200 dark:border-neutral-800">
                <CalendarCheck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  No classes booked for today
                </p>
                <Link to="/events" className="text-xs text-forest-700 dark:text-gold-400 underline mt-1 inline-block">
                  Browse upcoming sessions
                </Link>
              </div>
            )}
          </section>

          {/* Next booked sessions */}
          {upcomingClasses.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                Coming up next
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {upcomingClasses.map((cls) => (
                  <Link
                    key={cls._id}
                    to={`/events/${cls.id}`}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                      {new Date(cls.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {cls.time}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white mt-1.5 line-clamp-2">
                      {cls.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">{cls.location}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Enrolled courses */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-forest-600 dark:text-gold-400" />
                My Courses
              </h3>
              <Link to="/resources" className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline whitespace-nowrap">
                Open library &rarr;
              </Link>
            </div>

            {loading ? (
              <SkeletonBlock className="h-20" />
            ) : myCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/resources?course=${course.id}`}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white leading-snug">
                        {course.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                        {course.mentor_name}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-300 whitespace-nowrap flex-shrink-0">
                      {course.resource_count ?? 0} files
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800">
                You are not enrolled on a course yet. Ask your mentor to add you, or browse the open library.
              </p>
            )}
          </section>
        </div>

        {/* Right column: recent activity */}
        <div className="lg:col-span-4">
          <section className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-gold-500" />
                Recent Activity
              </h3>
              {stats && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sand-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {stats.attended} attended
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
            ) : recentActivity.length > 0 ? (
              <ol className="space-y-1">
                {recentActivity.map((item, index) => (
                  <li key={item.id} className="relative pl-8 pb-4 last:pb-0">
                    {/* Timeline rail */}
                    {index !== recentActivity.length - 1 && (
                      <span className="absolute left-[13px] top-7 bottom-0 w-px bg-sand-200 dark:bg-neutral-800" aria-hidden="true" />
                    )}
                    <span className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 flex items-center justify-center">
                      {activityIcon(item.type)}
                    </span>

                    {item.link ? (
                      <Link to={item.link} className="block group">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-forest-700 dark:group-hover:text-gold-400 leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-neutral-400">{relativeTime(item.createdAt)}</span>
                      </Link>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[10px] text-neutral-400">{relativeTime(item.createdAt)}</span>
                      </>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle className="w-7 h-7 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Nothing here yet. Book a session or upload a reflection and it will appear in this trail.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
