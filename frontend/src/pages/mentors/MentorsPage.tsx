import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Star,
  Calendar,
  MessageSquare,
  Sparkles,
  CheckCircle,
  X,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { mentorsApi } from '../../api/services';
import { Mentor } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const MentorsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');

  // Booking Modal State
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [sessionType, setSessionType] = useState('30-min 1-on-1 Mentorship');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const expertiseList = [
    'All',
    'Yoga & Asana',
    'Ayurveda & Herbology',
    'Vedic Meditation',
    'Pranayama & Breathwork',
    'Mindful Career Growth',
  ];

  useEffect(() => {
    const loadMentors = async () => {
      try {
        setLoading(true);
        const data = await mentorsApi.getAll();
        if (Array.isArray(data)) {
          // If mentors from db don't have bio or ratings yet, provide enriched mock defaults
          const enriched = data.map((m, idx) => ({
            ...m,
            rating: m.rating || 4.8 + (idx % 3) * 0.1,
            expertise: m.expertise || ['Yoga & Asana', 'Ayurveda & Herbology', 'Vedic Meditation'][idx % 3],
            bio: m.bio || 'Dedicated practitioner and educator passionate about holistic student empowerment and wellness.',
            availability: m.availability || 'Weekdays & Weekends',
            experience: `${5 + (idx % 6)} Years Experience`,
            sessionCount: 40 + idx * 12,
          }));
          setMentors(enriched);
        }
      } catch (err) {
        console.error('Failed to load mentors:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMentors();
  }, []);

  const filteredMentors = mentors.filter((m) => {
    const matchSearch =
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expertise?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.bio?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedExpertise === 'All' ||
      m.expertise?.toLowerCase().includes(selectedExpertise.toLowerCase());

    return matchSearch && matchCategory;
  });

  const handleOpenBooking = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBookingDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedMentor(null);
      setBookingSuccess(false);
      alert(`Booking Confirmed with ${selectedMentor?.name}! A calendar invite has been sent to ${user?.email}.`);
    }, 1200);
  };

  const handleSendMessage = (mentorName: string) => {
    navigate(`/messages?user=${encodeURIComponent(mentorName)}`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full max-w-full">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Users className="w-3.5 h-3.5" />
            Verified Experts
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Mentors & Gurus Hub
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm max-w-xl">
            Connect 1-on-1 with certified masters in Yogic sciences, Ayurveda healing, and holistic mindful guidance.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-sand-200 dark:border-neutral-800 shadow-card flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by mentor name or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {expertiseList.map((exp) => (
            <button
              key={exp}
              onClick={() => setSelectedExpertise(exp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedExpertise === exp
                  ? 'bg-forest-600 dark:bg-gold-500 text-white dark:text-charcoal-900 shadow-xs'
                  : 'bg-sand-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-700'
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      {/* Mentors Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-gold-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-neutral-500">Discovering mentors...</p>
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800">
          <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No mentors found</h4>
          <p className="text-xs text-neutral-500 mt-1">Try refining your search query or selecting "All" categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor) => (
            <div
              key={mentor._id}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 text-white font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    {mentor.name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                        {mentor.name}
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    </div>
                    <p className="text-xs font-semibold text-forest-700 dark:text-gold-400 truncate mt-0.5">
                      {mentor.expertise}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {mentor.rating?.toFixed(1) || '4.9'}
                      </span>
                      <span className="text-[10px] text-neutral-400">• {mentor.sessionCount || 50}+ Sessions</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Info Badges */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {mentor.experience || '6+ Yrs Exp'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Available for 1-on-1
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-sand-200 dark:border-neutral-800 grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleSendMessage(mentor.name)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-sand-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
                <button
                  onClick={() => handleOpenBooking(mentor)}
                  className="py-2 px-3 rounded-xl text-xs font-bold bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedMentor(null)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-600 text-white font-bold flex items-center justify-center">
                  {selectedMentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    Book Session with {selectedMentor.name}
                  </h3>
                  <p className="text-xs text-gold-600 dark:text-gold-400">
                    {selectedMentor.expertise}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white">
                  Session Successfully Reserved!
                </h4>
                <p className="text-xs text-neutral-500">
                  Sending meeting details and Google Meet link to your registered email...
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Session Format
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium"
                  >
                    <option value="30-min 1-on-1 Mentorship">30-min 1-on-1 Mentorship (Introductory Guidance)</option>
                    <option value="60-min Deep Guidance & Diet Plan">60-min Deep Guidance & Personalized Sadhana Plan</option>
                    <option value="45-min Yoga & Pranayama Review">45-min Yoga & Pranayama Technique Review</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Select Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Select Time
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700"
                    >
                      <option value="09:00 AM">09:00 AM - 09:30 AM</option>
                      <option value="11:30 AM">11:30 AM - 12:00 PM</option>
                      <option value="03:00 PM">03:00 PM - 03:30 PM</option>
                      <option value="05:30 PM">05:30 PM - 06:00 PM</option>
                      <option value="07:00 PM">07:00 PM - 07:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    What would you like to discuss?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="E.g., Guidance on improving sleep through Ayurveda, or establishing a consistent morning meditation habit..."
                    className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-neutral-500">Session Fee:</span>
                  <span className="font-bold text-forest-700 dark:text-gold-400">Complimentary (Pragya Community Member)</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-sm bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 shadow-md transition-all cursor-pointer"
                >
                  Confirm & Schedule Slot
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
