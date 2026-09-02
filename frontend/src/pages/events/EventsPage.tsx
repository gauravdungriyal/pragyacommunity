import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  X,
  Heart,
  ChevronRight,
  CheckCircle,
  Users,
} from 'lucide-react';
import { coursesApi, eventsApi, EventScope } from '../../api/services';
import { Course, Event } from '../../types';
import { useAuth } from '../../context/AuthContext';

const TABS: { key: EventScope; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'favorites', label: 'Favourites' },
  { key: 'past', label: 'Past' },
];

/** "2026-09-05 ..." -> "September 2026", used to group the list. */
const monthKey = (event: Event): string => {
  const raw = event.starts_at || event.date;
  if (!raw) return 'Dates to be confirmed';
  const d = new Date(String(raw).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return 'Dates to be confirmed';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

/** Sortable stamp for a month heading. */
const monthOrder = (event: Event): number => {
  const raw = event.starts_at || event.date;
  const d = new Date(String(raw || '').replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? Number.MAX_SAFE_INTEGER : d.getFullYear() * 12 + d.getMonth();
};

const PAGE_SIZE = 6;

export const EventsPage: React.FC = () => {
  const { isStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = (searchParams.get('tab') as EventScope) || 'upcoming';
  const [activeTab, setActiveTab] = useState<EventScope>(
    TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : 'upcoming'
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Create Event Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Yoga Workshops');
  const [courseId, setCourseId] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [amount, setAmount] = useState('0');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (scope: EventScope) => {
    setLoading(true);
    try {
      const data = await eventsApi.getEvents(scope);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchEvents(activeTab);
  }, [activeTab, fetchEvents]);

  useEffect(() => {
    if (isStaff && isCreateOpen && courses.length === 0) {
      coursesApi.getAll().then(setCourses).catch(() => setCourses([]));
    }
  }, [isStaff, isCreateOpen, courses.length]);

  const changeTab = (tab: EventScope) => {
    setActiveTab(tab);
    setSearchParams(tab === 'upcoming' ? {} : { tab });
  };

  const handleToggleFavorite = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic flip, reconciled with the server response below
    setEvents((prev) =>
      prev.map((ev) => {
        if (String(ev.id ?? ev._id) !== eventId) return ev;
        const nextFav = !ev.is_favorite;
        return {
          ...ev,
          is_favorite: nextFav,
          likes_count: nextFav ? (ev.likes_count || 0) + 1 : Math.max(0, (ev.likes_count || 1) - 1),
        };
      })
    );

    try {
      const res = await eventsApi.toggleFavorite(eventId);
      if (res.status) {
        if (activeTab === 'favorites' && res.favorited === false) {
          setEvents((prev) => prev.filter((ev) => String(ev.id ?? ev._id) !== eventId));
          return;
        }
        setEvents((prev) =>
          prev.map((ev) =>
            String(ev.id ?? ev._id) === eventId
              ? { ...ev, is_favorite: !!res.favorited, likes_count: res.likes_count ?? ev.likes_count }
              : ev
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
      fetchEvents(activeTab);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) return;

    setCreating(true);
    setCreateError(null);
    try {
      const created = await eventsApi.create({
        title,
        description,
        date,
        time,
        location,
        category,
        course_id: courseId ? Number(courseId) : null,
        is_free: isFree ? 1 : 0,
        amount: isFree ? 0 : parseFloat(amount || '0'),
      });

      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setCourseId('');
      setAmount('0');
      setIsFree(true);

      if (created?.event?.id) {
        navigate(`/events/${created.event.id}`);
      } else {
        fetchEvents(activeTab);
      }
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Failed to create the event.');
    } finally {
      setCreating(false);
    }
  };

  // Built from the categories the loaded events actually carry, so no filter
  // is ever offered that would return nothing.
  const categories = [
    'All',
    ...Array.from(new Set(events.map((e) => e.category).filter(Boolean) as string[])).sort(),
  ];

  const filteredEvents =
    selectedCategory === 'All'
      ? events
      : events.filter((e) => (e.category || '').toLowerCase() === selectedCategory.toLowerCase());

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  // Group what is on screen into months, oldest month first
  const monthGroups = Array.from(
    visibleEvents.reduce((acc, event) => {
      const key = monthKey(event);
      if (!acc.has(key)) acc.set(key, { order: monthOrder(event), events: [] as Event[] });
      acc.get(key)!.events.push(event);
      return acc;
    }, new Map<string, { order: number; events: Event[] }>())
  )
    .map(([month, { order, events: list }]) => ({ month, order, events: list }))
    .sort((a, b) => (activeTab === 'past' ? b.order - a.order : a.order - b.order));

  const emptyMessage: Record<string, string> = {
    upcoming: 'No upcoming sessions scheduled right now. Check back soon.',
    today: 'Nothing is scheduled for today.',
    favorites: 'You have not saved any sessions yet. Tap the heart on a card to save it.',
    past: 'No past sessions to show.',
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Workshops & Sessions
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl">
            Events & Workshops
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm max-w-xl">
            Workshops and retreats from the school, grouped by month.
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gold-500 hover:bg-gold-600 text-charcoal-900 shadow-md shadow-gold-500/20 transition-all flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Scope tabs — events are never all listed together */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => changeTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900 shadow-sm'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-sand-200 dark:border-neutral-800 pt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-forest-600 dark:bg-forest-700 text-white'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events grid */}
      {loading ? (
        <div className="p-12 sm:p-16 text-center">
          <div className="w-8 h-8 border-4 border-terracotta-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-500">Loading sessions…</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
          <CalendarIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
            {selectedCategory === 'All' ? emptyMessage[activeTab] : `No ${selectedCategory} sessions in this view.`}
          </h4>
        </div>
      ) : (
        <>
          {monthGroups.map(({ month, events: monthEvents }) => (
            <section key={month} className="space-y-4">
              {/* Month heading, taken from the dates the API returned */}
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-900 dark:text-white whitespace-nowrap">
                  {month}
                </h2>
                <span className="h-px flex-1 bg-sand-200 dark:bg-neutral-800" />
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sand-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                  {monthEvents.length} {monthEvents.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {monthEvents.map((evt) => {
              const eventId = String(evt.id ?? evt._id);
              const isFreeEvent = Number(evt.is_free) === 1 || evt.is_free === true;

              return (
                <Link
                  key={eventId}
                  to={`/events/${eventId}`}
                  className="group bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all p-5 sm:p-6 flex flex-col justify-between cursor-pointer hover:border-terracotta-300 dark:hover:border-gold-500/40"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200 dark:border-terracotta-800">
                          {evt.category || 'Workshop'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, eventId)}
                          aria-label={evt.is_favorite ? 'Remove from favourites' : 'Save to favourites'}
                          className={`p-1.5 rounded-full transition-all cursor-pointer ${
                            evt.is_favorite
                              ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/60'
                              : 'bg-sand-50 text-neutral-400 hover:text-rose-500 dark:bg-neutral-800'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${evt.is_favorite ? 'fill-rose-500' : ''}`} />
                        </button>
                        <span className="text-[11px] font-semibold text-neutral-400">{evt.likes_count || 0}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white leading-snug group-hover:text-terracotta-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 pt-3 border-t border-sand-200 dark:border-neutral-800">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-terracotta-600 dark:text-gold-400 flex-shrink-0" />
                          {new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 text-neutral-500 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-gold-500" />
                          {evt.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>

                      {evt.course_name && (
                        <div className="flex items-center gap-2 truncate">
                          <Users className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400 shrink-0" />
                          <span className="truncate">{evt.course_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-sand-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                    {isFreeEvent ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                        Free
                      </span>
                    ) : (
                      <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                        ₹{evt.amount || 0}
                      </span>
                    )}

                    <span className="px-3 py-2 rounded-xl text-xs font-bold bg-terracotta-600 group-hover:bg-terracotta-700 dark:bg-gold-500 dark:group-hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1 shadow-xs">
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
                })}
              </div>
            </section>
          ))}

          {visibleCount < filteredEvents.length && (
            <div className="text-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-white dark:bg-neutral-900 border border-sand-200 dark:border-neutral-800 text-forest-700 dark:text-gold-400 hover:shadow-card transition-all cursor-pointer"
              >
                Show more sessions ({filteredEvents.length - visibleCount} left)
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />

          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 dark:text-white">
                Create Workshop / Event
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <p className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
                {createError}
              </p>
            )}

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
                  placeholder="Morning Pranayama Masterclass"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Date
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
                    Time
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="07:00 AM"
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  >
                    {['Workshop', 'Yoga Workshops', 'Ayurveda Masterclasses', 'Meditation Retreats', 'Vedic Science Webinars'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                    Course (optional)
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  >
                    <option value="">Open to everyone</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300 font-semibold">
                  <input type="radio" name="isFreeRadio" checked={isFree} onChange={() => setIsFree(true)} />
                  Free
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-700 dark:text-neutral-300 font-semibold">
                  <input type="radio" name="isFreeRadio" checked={!isFree} onChange={() => setIsFree(false)} />
                  Paid
                </label>
                {!isFree && (
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                    placeholder="Fee (₹)"
                  />
                )}
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Studio One, or a Zoom link"
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
                  placeholder="Agenda, key takeaways, who should attend…"
                  className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none text-neutral-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {creating ? 'Publishing…' : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
