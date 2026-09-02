import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Heart,
  CheckCircle,
  AlertCircle,
  Ticket,
  GraduationCap,
  Share2,
  Trash2,
} from 'lucide-react';
import { eventsApi } from '../../api/services';
import { Event } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/common/PageLoader';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isStaff } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [shareLabel, setShareLabel] = useState('Share');

  const loadEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await eventsApi.getEventDetail(eventId);
      if (data) {
        setEvent(data);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /** Booking state is owned by the API — the button reflects what the server says. */
  const handleBooking = async () => {
    if (!event || !eventId) return;

    setBooking(true);
    setMessage(null);
    try {
      if (event.is_registered) {
        const res = await eventsApi.cancelRegistration(eventId);
        setEvent({ ...event, is_registered: false, attendeesCount: Math.max(0, (event.attendeesCount || 1) - 1) });
        setMessage({ kind: 'ok', text: res.message || 'Booking cancelled.' });
      } else {
        const res = await eventsApi.register(eventId);
        setEvent({ ...event, is_registered: true, attendeesCount: (event.attendeesCount || 0) + 1 });
        setMessage({
          kind: 'ok',
          text: res.already_registered
            ? 'You were already booked on this session.'
            : 'Your place is confirmed. A confirmation is in your notifications.',
        });
      }
    } catch (err: any) {
      setMessage({
        kind: 'error',
        text: err?.response?.data?.message || 'Could not update your booking. Please try again.',
      });
    } finally {
      setBooking(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!event || !eventId) return;
    const nextFav = !event.is_favorite;
    setEvent({ ...event, is_favorite: nextFav });

    try {
      const res = await eventsApi.toggleFavorite(eventId);
      if (res.status) {
        setEvent((prev) => (prev ? { ...prev, is_favorite: !!res.favorited, likes_count: res.likes_count ?? prev.likes_count } : prev));
      }
    } catch {
      setEvent((prev) => (prev ? { ...prev, is_favorite: !nextFav } : prev));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: event?.title || 'Pragya Connect event', text: event?.description || '', url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // The person dismissed the sheet; fall through to copying
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Link copied');
      setTimeout(() => setShareLabel('Share'), 2000);
    } catch {
      setShareLabel('Copy failed');
      setTimeout(() => setShareLabel('Share'), 2000);
    }
  };

  const handleDelete = async () => {
    if (!eventId || !confirm('Delete this event for everyone?')) return;
    try {
      await eventsApi.delete(eventId);
      navigate('/events');
    } catch {
      setMessage({ kind: 'error', text: 'Could not delete this event.' });
    }
  };

  if (loading) return <PageLoader label="Loading event…" />;

  if (notFound || !event) {
    return (
      <div className="max-w-xl mx-auto p-8 sm:p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
        <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">Event not found</h2>
        <p className="text-xs text-neutral-500 mt-1">
          This session may have been removed from the schedule.
        </p>
        <Link
          to="/events"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-terracotta-600 dark:bg-gold-500 text-white dark:text-charcoal-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
      </div>
    );
  }

  const isFreeEvent = Number(event.is_free) === 1 || event.is_free === true;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date(new Date().toDateString());

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in pb-8">
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-forest-700 dark:hover:text-gold-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all events
      </Link>

      {/* Hero */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 border border-white/20">
            {event.category || 'Workshop'}
          </span>
          {isFreeEvent ? (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/25 text-emerald-100 border border-emerald-300/30">
              Free Session
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gold-500/25 text-gold-100 border border-gold-300/30">
              ₹{event.amount} · Paid
            </span>
          )}
          {event.is_registered && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-terracotta-700 inline-flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Booked
            </span>
          )}
          {isPast && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/25 border border-white/20">
              Past session
            </span>
          )}
        </div>

        <h1 className="font-display font-extrabold text-xl sm:text-3xl lg:text-4xl leading-tight">
          {event.title}
        </h1>

        <p className="text-sand-100/90 text-xs sm:text-sm leading-relaxed max-w-2xl">
          {event.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleToggleFavorite}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer ${
              event.is_favorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            <Heart className={`w-4 h-4 ${event.is_favorite ? 'fill-white' : ''}`} />
            {event.is_favorite ? 'Saved' : 'Save'} · {event.likes_count || 0}
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {shareLabel}
          </button>

          {isStaff && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-black/20 hover:bg-black/30 text-white border border-white/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm font-semibold ${
            message.kind === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          {message.kind === 'ok' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Details + booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white">Session details</h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: CalendarIcon, label: 'Date', value: eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
              { icon: Clock, label: 'Time', value: event.time },
              { icon: MapPin, label: 'Location', value: event.location },
              { icon: Users, label: 'Booked so far', value: `${event.attendeesCount || 0} member${event.attendeesCount === 1 ? '' : 's'}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700/60">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center text-terracotta-600 dark:text-gold-400 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</dt>
                  <dd className="text-xs font-bold text-neutral-900 dark:text-white break-words">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {event.course_name && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-forest-50 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-800/60">
              <GraduationCap className="w-5 h-5 text-forest-700 dark:text-forest-300 flex-shrink-0" />
              <p className="text-xs text-forest-900 dark:text-forest-200">
                Part of the <strong>{event.course_name}</strong> course.{' '}
                <Link to="/resources" className="underline font-bold">See course material</Link>
              </p>
            </div>
          )}

          {/* Difficulty and what to bring, as published on the live event */}
          {(event.difficulty_tags?.length || event.what_to_bring?.length || event.benefits?.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {event.difficulty_tags?.length ? (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Level</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {event.difficulty_tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {event.what_to_bring?.length ? (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">What to bring</h3>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-0.5">
                    {event.what_to_bring.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {event.benefits?.length ? (
                <div className="sm:col-span-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">You will gain</h3>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-0.5">
                    {event.benefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Instructor, when the live event names one */}
          {event.instructor?.name ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/60 border border-sand-200 dark:border-neutral-700/60">
              {event.instructor.image ? (
                <img
                  src={event.instructor.image}
                  alt={event.instructor.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-forest-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {event.instructor.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                  {event.instructor.name}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                  {[event.instructor.post, event.instructor.rating_text].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
              Organised by {event.creator_name || 'Pragya Faculty'}
            </p>
          )}
        </div>

        {/* Booking panel */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card p-5 sm:p-6 space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="text-center">
            {isFreeEvent ? (
              <>
                <p className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">Free</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">Open to all members</p>
              </>
            ) : (
              <>
                <p className="font-display font-extrabold text-2xl text-neutral-900 dark:text-white">
                  ₹{Number(event.amount).toLocaleString('en-IN')}
                </p>
                {event.discount_active && event.original_amount && event.original_amount > Number(event.amount) ? (
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    <s>₹{event.original_amount.toLocaleString('en-IN')}</s> · save ₹
                    {(event.original_amount - Number(event.amount)).toLocaleString('en-IN')}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 mt-0.5">per participant</p>
                )}
              </>
            )}

            {/* Live booking pressure, when the API reports it */}
            {event.social_proof?.spots_label ? (
              <p className="text-[11px] font-semibold text-terracotta-700 dark:text-gold-400 mt-2">
                {event.social_proof.spots_label}
              </p>
            ) : event.social_proof?.bookings_count ? (
              <p className="text-[11px] text-neutral-500 mt-2">
                {event.social_proof.bookings_count} already booked
              </p>
            ) : null}
          </div>

          <button
            onClick={handleBooking}
            disabled={booking || (isPast && !event.is_registered)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
              event.is_registered
                ? 'bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-sand-300 dark:border-neutral-700'
                : 'bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md'
            }`}
          >
            {booking ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : event.is_registered ? (
              'Cancel my booking'
            ) : isPast ? (
              'Booking closed'
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Book my place
              </>
            )}
          </button>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
            {event.is_registered
              ? 'You are on the list. Cancel any time before the session starts.'
              : 'Your booking is confirmed instantly and appears in My Bookings.'}
          </p>
        </div>
      </div>
    </div>
  );
};
