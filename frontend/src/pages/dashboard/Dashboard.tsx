import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  Quote,
  Flame,
  Zap,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, eventsApi, mentorsApi, postsApi, resourcesApi } from '../../api/services';
import { DailyQuote, Event, Mentor, Post } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dailyQuote, setDailyQuote] = useState<DailyQuote>({
    quote: "Yoga is the journey of the self, through the self, to the self.",
    author: "The Bhagavad Gita"
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Daily Mindful Checklist State
  const [habits, setHabits] = useState([
    { id: 1, text: 'Morning Pranayama (15 mins)', done: true },
    { id: 2, text: 'Read 1 Chapter from Ayurveda Archives', done: false },
    { id: 3, text: 'Connect with a Mentor / Peer', done: false },
  ]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [quoteData, eventsData, mentorsData, postsData] = await Promise.allSettled([
          dashboardApi.getDailyQuote(),
          eventsApi.getAll(),
          mentorsApi.getAll(),
          postsApi.getAll(),
        ]);

        if (quoteData.status === 'fulfilled' && quoteData.value?.quote) {
          setDailyQuote(quoteData.value);
        }
        if (eventsData.status === 'fulfilled' && Array.isArray(eventsData.value)) {
          setEvents(eventsData.value.slice(0, 3));
        }
        if (mentorsData.status === 'fulfilled' && Array.isArray(mentorsData.value)) {
          setMentors(mentorsData.value.slice(0, 3));
        }
        if (postsData.status === 'fulfilled' && Array.isArray(postsData.value)) {
          setRecentPosts(postsData.value.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const toggleHabit = (id: number) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Top Welcome Banner & Daily Wisdom Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-forest-600 via-forest-700 to-forest-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-forest-900/10 flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-gold-400/15 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Seeker'}
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white">
              Cultivate Wisdom & Elevate Your Journey
            </h1>
            <p className="text-sand-100/90 text-sm max-w-lg leading-relaxed pt-1">
              Explore ancient principles blended with modern growth. Join interactive live workshops, book 1-on-1 mentorship, and share reflections.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-3">
            <Link
              to="/mentors"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all inline-flex items-center gap-2"
            >
              Book Guidance Session
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/feed"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all inline-flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-gold-400" />
              Join Community Discussion
            </Link>
          </div>
        </div>

        {/* Daily Quote / Wisdom Card */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 flex items-center gap-1.5">
              <Quote className="w-4 h-4" /> Daily Sutra & Inspiration
            </span>
            <span className="text-[11px] font-semibold text-neutral-400">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <blockquote className="my-auto font-display text-base sm:text-lg text-neutral-800 dark:text-neutral-100 italic leading-relaxed">
            "{dailyQuote.quote}"
          </blockquote>

          <div className="mt-6 pt-4 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-bold text-xs text-forest-700 dark:text-gold-400">
              — {dailyQuote.author}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Daily Reflection
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Navigation Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <Link
          to="/mentors"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 dark:bg-forest-950/60 text-forest-700 dark:text-forest-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-forest-700 dark:text-forest-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Gurus & Mentors</p>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {mentors.length > 0 ? `${mentors.length}+ Active` : 'Top Mentors'}
          </h3>
        </Link>

        <Link
          to="/events"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/60 text-gold-700 dark:text-gold-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gold-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Live Workshops</p>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
            {events.length > 0 ? `${events.length} Upcoming` : 'Events Hub'}
          </h3>
        </Link>

        <Link
          to="/resources"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-brandTeal-50 dark:bg-brandTeal-950/60 text-brandTeal-600 dark:text-brandTeal-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-brandTeal-600 dark:text-brandTeal-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Resource Archives</p>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
            Library & Audio
          </h3>
        </Link>

        <Link
          to="/feed"
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </div>
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Community Pulse</p>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1">
            Discussions
          </h3>
        </Link>
      </div>

      {/* 3. Main Split: Upcoming Workshops & Featured Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Upcoming Workshops */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-neutral-900 dark:text-white">
                Upcoming Events & Sessions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Join live interactive masterclasses with certified practitioners
              </p>
            </div>
            <Link
              to="/events"
              className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline flex items-center gap-1"
            >
              View Full Calendar &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.length > 0 ? (
              events.map((evt) => (
                <div
                  key={evt._id}
                  className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 border border-forest-200 dark:border-forest-800">
                        {evt.category || 'Workshop'}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {evt.time || '10:00 AM'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-neutral-900 dark:text-white leading-snug line-clamp-2">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {evt.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gold-600" />
                      {evt.location || 'Online Stream'}
                    </span>
                    <Link
                      to="/events"
                      className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline"
                    >
                      Register Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-sand-200 dark:border-neutral-800">
                <Calendar className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No events scheduled today</p>
                <Link to="/events" className="text-xs text-forest-700 dark:text-gold-400 underline mt-1 block">
                  Explore full event schedule
                </Link>
              </div>
            )}
          </div>

          {/* Recent Community Highlights */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-gold-500" />
                Trending Community Discussions
              </h3>
              <Link to="/feed" className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline">
                Open Feed &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <div
                    key={post._id}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 shadow-card flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {post.user_id?.name || 'Pragya Member'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-700 dark:text-gold-400 flex-shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      {post.likes || 0}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">No recent posts yet. Be the first to share an insight!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Daily Habit Tracker & Top Mentors Spotlight */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Daily Mindful Tracker */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-gold-500" />
                Daily Sadhana Tracker
              </h3>
              <span className="text-xs font-bold text-forest-700 dark:text-gold-400">
                {habits.filter((h) => h.done).length}/{habits.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    habit.done
                      ? 'bg-forest-50/70 dark:bg-forest-950/40 border-forest-200 dark:border-forest-800/60 text-forest-900 dark:text-forest-200'
                      : 'bg-sand-50 dark:bg-neutral-800/40 border-sand-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      habit.done
                        ? 'bg-forest-600 text-white'
                        : 'border-2 border-neutral-400 dark:border-neutral-500'
                    }`}
                  >
                    {habit.done && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-medium ${habit.done ? 'line-through opacity-75' : ''}`}>
                    {habit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Mentors Spotlight */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-600 dark:text-gold-400" />
                Featured Mentors
              </h3>
              <Link to="/mentors" className="text-xs font-bold text-forest-700 dark:text-gold-400 hover:underline">
                All &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {mentors.length > 0 ? (
                mentors.map((m) => (
                  <div
                    key={m._id}
                    className="p-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/40 border border-sand-200 dark:border-neutral-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-forest-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {m.name?.charAt(0) || 'M'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {m.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {m.expertise || 'Ayurveda & Yoga Guru'}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/mentors"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-forest-600 text-white hover:bg-forest-700 dark:bg-gold-500 dark:text-charcoal-900 transition-colors flex-shrink-0"
                    >
                      Book
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">Mentors loading...</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
