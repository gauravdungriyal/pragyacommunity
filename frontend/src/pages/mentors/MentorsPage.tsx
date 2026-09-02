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
import { mentorsApi, messagesApi } from '../../api/services';
import { Mentor } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const MentorsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');

  const [failedAvatars, setFailedAvatars] = useState<Record<string, boolean>>({});

  // Filters are built from the expertise the mentors actually have on record,
  // so every option returns results.
  const expertiseList = [
    'All',
    ...Array.from(new Set(mentors.map((m) => m.expertise).filter(Boolean) as string[])).sort(),
  ];

  useEffect(() => {
    const loadMentors = async () => {
      try {
        setLoading(true);
        const data = await mentorsApi.getAll();
        if (Array.isArray(data)) {
          setMentors(data);
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

  const handleSendMessage = (mentorName: string) => {
    navigate(`/messages?user=${encodeURIComponent(mentorName)}`);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-8 w-full max-w-full">
      {/* Header Banner */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <Users className="w-3.5 h-3.5" />
            Verified Experts
          </div>
          <h1 className="font-display font-extrabold text-xl sm:text-3xl">
            Mentors & Gurus
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
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-forest-600 to-forest-800 text-white font-bold text-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    {mentor.avatar && !failedAvatars[mentor._id] ? (
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={() => setFailedAvatars((prev) => ({ ...prev, [mentor._id]: true }))}
                      />
                    ) : (
                      mentor.name?.charAt(0).toUpperCase() || 'M'
                    )}
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
                    {mentor.rating ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {Number(mentor.rating).toFixed(1)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                  {mentor.bio}
                </p>

                {/* Availability, as recorded on the mentor's profile */}
                {mentor.availability && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mentor.availability}
                    </span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-5 mt-5 border-t border-sand-200 dark:border-neutral-800">
                <button
                  onClick={() => handleSendMessage(mentor.name)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
