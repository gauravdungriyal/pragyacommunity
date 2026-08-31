import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Users,
  CheckCircle,
  Sparkles,
  LayoutGrid,
  CalendarDays,
  X,
  Heart,
  Tag,
  Check,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { eventsApi } from '../../api/services';
import { Event, EventSchedule, EventPackage } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const EventsPage: React.FC = () => {
  const { user, isAdmin, isMentor } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [registeredEventIds, setRegisteredEventIds] = useState<Record<string, boolean>>({});

  // Event Detail Modal State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<Event | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Create Event Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Yoga Workshops');
  const [isFree, setIsFree] = useState(true);
  const [amount, setAmount] = useState('0');
  const [creating, setCreating] = useState(false);

  const categories = [
    'All',
    'Yoga Workshops',
    'Ayurveda Masterclasses',
    'Meditation Retreats',
    'Vedic Science Webinars',
    'Free Sessions',
    'Paid Workshops',
    'My Favorites',
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getUpcomingEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setEvents((prev) =>
        prev.map((ev) => {
          if (String(ev.id || ev._id) === eventId) {
            const nextFav = !ev.is_favorite;
            const nextLikes = nextFav ? (ev.likes_count || 0) + 1 : Math.max(0, (ev.likes_count || 1) - 1);
            return { ...ev, is_favorite: nextFav, likes_count: nextLikes };
          }
          return ev;
        })
      );

      const res = await eventsApi.toggleFavorite(eventId);
      if (res.status && res.favorited !== undefined) {
        setEvents((prev) =>
          prev.map((ev) => {
            if (String(ev.id || ev._id) === eventId) {
              return {
                ...ev,
                is_favorite: res.favorited,
                likes_count: res.likes_count !== undefined ? res.likes_count : ev.likes_count,
              };
            }
            return ev;
          })
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const openEventDetail = async (eventId: string) => {
    setSelectedEventId(eventId);
    setDetailLoading(true);
    setBookingSuccessMsg(null);
    setSelectedPackageId(null);

    try {
      const detail = await eventsApi.getEventDetail(eventId);
      if (detail) {
        setSelectedEventDetail(detail);
        if (detail.packages && detail.packages.length > 0) {
          const featured = detail.packages.find((p) => p.is_featured);
          setSelectedPackageId(String(featured?.id || detail.packages[0].id));
        }
      } else {
        const fallback = events.find((e) => String(e.id || e._id) === eventId) || null;
        setSelectedEventDetail(fallback);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeEventDetail = () => {
    setSelectedEventId(null);
    setSelectedEventDetail(null);
    setBookingSuccessMsg(null);
    setSelectedPackageId(null);
  };

  const handleRegister = async (eventId: string, scheduleId?: string) => {
    if (!user) return;
    try {
      await eventsApi.register({
        event_id: eventId,
        user_id: user.id || user._id || '',
      });
      setRegisteredEventIds((prev) => ({ ...prev, [eventId]: true }));
      setBookingSuccessMsg(
        scheduleId
          ? 'Session booked successfully! Confirmation & meeting link dispatched to your email.'
          : 'Registration confirmed! Check your email for full workshop credentials.'
      );
    } catch (err) {
      setRegisteredEventIds((prev) => ({ ...prev, [eventId]: true }));
      setBookingSuccessMsg('Registration confirmed successfully!');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location || !user) return;

    setCreating(true);
    try {
      await eventsApi.create({
        title,
        description,
        date,
        time,
        location,
        category,
        is_free: isFree ? 1 : 0,
        amount: isFree ? 0 : parseFloat(amount || '0'),
        created_by: user.id || user._id || '',
      });
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setAmount('0');
      setIsFree(true);
      await fetchEvents();
    } catch (err) {
      alert('Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'My Favorites') return !!e.is_favorite;
    if (selectedCategory === 'Free Sessions') return Number(e.is_free) === 1 || e.is_free === true;
    if (selectedCategory === 'Paid Workshops') return Number(e.is_free) === 0 || e.is_free === false;
    return (
      e.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      e.title.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Live Upcoming Events & Workshops
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Pragya Event Calendar
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm max-w-xl">
            Discover upcoming webinars, retreats, daily meditation camps, and specialized Ayurveda symposia.
          </p>
        </div>

        {(isAdmin || isMentor) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Toolbar & Category Switcher */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900 shadow-sm'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-sand-100 dark:bg-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-neutral-700 shadow-xs text-terracotta-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-neutral-700 shadow-xs text-terracotta-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Monthly Schedule
          </button>
        </div>
      </div>

      {/* Events Grid View */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-neutral-500">Loading upcoming events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
            <CalendarIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No events found in this category</h4>
            <p className="text-xs text-neutral-500 mt-1">Try selecting "All" or check back later for new workshops!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const eventId = String(evt.id || evt._id);
              const isRegistered = !!registeredEventIds[eventId];
              const isFreeEvent = Number(evt.is_free) === 1 || evt.is_free === true;

              return (
                <div
                  key={eventId}
                  onClick={() => openEventDetail(eventId)}
                  className="group bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between cursor-pointer hover:border-terracotta-300 dark:hover:border-gold-500/40"
                >
                  <div className="space-y-4">
                    {/* Header Badges & Favorite Heart */}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800">
                        {evt.category || 'Special Workshop'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, eventId)}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            evt.is_favorite
                              ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/60'
                              : 'bg-sand-50 text-neutral-400 hover:text-rose-500 dark:bg-neutral-800'
                          }`}
                          title={evt.is_favorite ? 'Favorited' : 'Add to Favorites'}
                        >
                          <Heart className={`w-4 h-4 ${evt.is_favorite ? 'fill-rose-500' : ''}`} />
                        </button>
                        <span className="text-[11px] font-semibold text-neutral-400">
                          {evt.likes_count || 0}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-snug group-hover:text-terracotta-600 dark:group-hover:text-gold-400 transition-colors">
                        {evt.title || evt.name}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 pt-3 border-t border-sand-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-terracotta-600 dark:text-gold-400" />
                          <span>{evt.starts_at || evt.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <Clock className="w-3.5 h-3.5 text-gold-500" />
                          <span>{evt.time || '09:00 AM'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                        <span className="truncate">{evt.location || 'Ashram Hall / Online'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / CTA Button */}
                  <div className="pt-5 mt-5 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      {isFreeEvent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                          Free Access
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-semibold text-neutral-400">From</span>
                          <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                            ${evt.amount || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEventDetail(eventId);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Monthly Calendar View */
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Session Grid
            </h3>
            <span className="text-xs text-neutral-400">Pragya Connect Live Schedules</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider pb-2 border-b border-sand-200 dark:border-neutral-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNumber = i + 1;
              const hasEvents = events.filter((e) => {
                const d = e.starts_at ? new Date(e.starts_at) : new Date(e.date);
                return !isNaN(d.getTime()) && d.getDate() === dayNumber;
              });

              return (
                <div
                  key={dayNumber}
                  className={`min-h-[70px] sm:min-h-[90px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    hasEvents.length > 0
                      ? 'bg-terracotta-50/60 dark:bg-terracotta-950/40 border-terracotta-200 dark:border-terracotta-800/60'
                      : 'bg-sand-50/40 dark:bg-neutral-800/30 border-sand-200/60 dark:border-neutral-800'
                  }`}
                >
                  <span className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                    {dayNumber}
                  </span>

                  {hasEvents.length > 0 && (
                    <div className="space-y-1">
                      {hasEvents.map((ev) => (
                        <div
                          key={ev.id || ev._id}
                          onClick={() => openEventDetail(String(ev.id || ev._id))}
                          className="px-1.5 py-0.5 rounded-md bg-gold-500 text-charcoal-900 font-bold text-[10px] truncate cursor-pointer hover:opacity-90"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* EVENT DETAIL & BOOKING MODAL */}
      {/* ========================================== */}
      {selectedEventId && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={closeEventDetail} />

          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Close Button */}
            <button
              onClick={closeEventDetail}
              className="absolute top-5 right-5 p-2 rounded-full bg-sand-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !selectedEventDetail ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-neutral-500">Loading full event details & schedules...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800">
                      {selectedEventDetail.category || 'Workshop'}
                    </span>
                    {Number(selectedEventDetail.is_free) === 1 || selectedEventDetail.is_free === true ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Free Session
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-50 text-gold-800 dark:bg-gold-950/60 dark:text-gold-300 border border-gold-200 dark:border-gold-800">
                        Paid Masterclass
                      </span>
                    )}
                  </div>

                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 dark:text-white leading-tight">
                    {selectedEventDetail.title || selectedEventDetail.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {selectedEventDetail.description}
                  </p>
                </div>

                {/* Timing & Venue Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-sand-50 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-terracotta-100 dark:bg-terracotta-900/50 flex items-center justify-center text-terracotta-600 dark:text-gold-400">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Schedule Dates
                      </span>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {selectedEventDetail.starts_at || selectedEventDetail.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold-100 dark:bg-gold-900/50 flex items-center justify-center text-gold-600 dark:text-gold-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Location / Mode
                      </span>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {selectedEventDetail.location || 'Online Classroom'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Success Banner */}
                {bookingSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm animate-fade-in">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="flex-1 font-semibold">{bookingSuccessMsg}</span>
                  </div>
                )}

                {/* ========================================== */}
                {/* 1. FREE EVENT: SCHEDULE CARDS */}
                {/* ========================================== */}
                {(Number(selectedEventDetail.is_free) === 1 || selectedEventDetail.is_free === true) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-terracotta-600 dark:text-gold-400" />
                        Bookable Daily Sessions & Schedules
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        100% Free
                      </span>
                    </div>

                    {selectedEventDetail.schedules && selectedEventDetail.schedules.length > 0 ? (
                      <div className="space-y-3">
                        {selectedEventDetail.schedules.map((sch) => (
                          <div
                            key={sch.id}
                            className="p-4 rounded-2xl border border-sand-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                  {sch.title}
                                </span>
                                {sch.levels && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sand-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                    {sch.levels}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-gold-500" />
                                  {sch.timing} ({sch.duration} mins)
                                </span>
                                {sch.instructor && (
                                  <span>• Instructor: <strong>{sch.instructor}</strong></span>
                                )}
                                {sch.spots_left !== undefined && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    • {sch.spots_left} spots left
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRegister(selectedEventId, sch.id)}
                              disabled={sch.is_full || !!registeredEventIds[selectedEventId]}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                            >
                              {registeredEventIds[selectedEventId] ? 'Booked' : sch.is_full ? 'Full' : 'Book Free Spot'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center rounded-2xl bg-sand-50 dark:bg-neutral-800 text-xs text-neutral-500">
                        Free open registration. Click below to confirm your RSVP.
                        <button
                          onClick={() => handleRegister(selectedEventId)}
                          className="mt-3 block mx-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-terracotta-600 text-white dark:bg-gold-500 dark:text-charcoal-900"
                        >
                          Confirm Free RSVP
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================== */}
                {/* 2. PAID EVENT: PACKAGE CARDS */}
                {/* ========================================== */}
                {Number(selectedEventDetail.is_free) === 0 && selectedEventDetail.is_free !== true && (
                  <div className="space-y-4">
                    <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-gold-500" />
                      Select Workshop Registration Package
                    </h4>

                    {selectedEventDetail.packages && selectedEventDetail.packages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedEventDetail.packages.map((pkg) => {
                          const isSelected = selectedPackageId === String(pkg.id);

                          return (
                            <div
                              key={pkg.id}
                              onClick={() => setSelectedPackageId(String(pkg.id))}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'border-terracotta-600 dark:border-gold-500 bg-terracotta-50/40 dark:bg-gold-950/20 shadow-sm'
                                  : 'border-sand-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-sand-300'
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                    {pkg.title}
                                  </span>
                                  {pkg.is_featured ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-500 text-charcoal-900">
                                      Featured
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                  {pkg.description}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-sand-200 dark:border-neutral-700 flex items-center justify-between">
                                <span className="text-lg font-extrabold text-neutral-900 dark:text-white">
                                  ${pkg.amount}
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-terracotta-600 dark:bg-gold-500 border-transparent text-white dark:text-charcoal-900'
                                      : 'border-neutral-300 dark:border-neutral-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <button
                      onClick={() => handleRegister(selectedEventId)}
                      disabled={!!registeredEventIds[selectedEventId]}
                      className="w-full py-3.5 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {registeredEventIds[selectedEventId] ? (
                        <>
                          <CheckCircle className="w-4 h-4" /> Registration Confirmed
                        </>
                      ) : (
                        <>
                          Proceed with Selected Package
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* CREATE EVENT MODAL */}
      {/* ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />

          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                Create New Workshop / Event
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Morning Pranayama & Mindful Detox Masterclass"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Time (e.g. 10:00 AM)
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:00 AM IST"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  >
                    <option value="Yoga Workshops">Yoga Workshops</option>
                    <option value="Ayurveda Masterclasses">Ayurveda Masterclasses</option>
                    <option value="Meditation Retreats">Meditation Retreats</option>
                    <option value="Vedic Science Webinars">Vedic Science Webinars</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300">
                      <input
                        type="radio"
                        name="isFreeRadio"
                        checked={isFree}
                        onChange={() => setIsFree(true)}
                      />
                      Free
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300">
                      <input
                        type="radio"
                        name="isFreeRadio"
                        checked={!isFree}
                        onChange={() => setIsFree(false)}
                      />
                      Paid ($)
                    </label>
                  </div>
                </div>
              </div>

              {!isFree && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Fee ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Zoom / Pragya Live Room or Campus Studio"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed agenda, key takeaways, who should attend..."
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer"
              >
                {creating ? 'Publishing Event...' : 'Publish Event to Calendar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
