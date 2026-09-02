import React, { useEffect, useState } from 'react';
import {
  Mail,
  Award,
  Sparkles,
  Edit3,
  CheckCircle,
  Save,
  Tag,
  BookOpen,
  Shield,
  GraduationCap,
  CalendarCheck,
  MessageSquare,
  Phone,
  AlertCircle,
  IdCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, profileApi } from '../../api/services';
import { DashboardSummary } from '../../types';

export const ProfilePage: React.FC = () => {
  const { user, updateCurrentUser, refreshProfile, isAdmin, profileData } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [expertise, setExpertise] = useState(user?.expertise || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // The API returns a full URL; a bare filename means no photo was uploaded
  const rawAvatar = profileData?.profile || user?.avatar || '';
  const avatarUrl = !avatarFailed && /^https?:\/\//i.test(rawAvatar) ? rawAvatar : '';

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setExpertise(user.expertise || '');
      setSkills(user.skills || []);
    }
  }, [user]);

  // Profile counters come from the same API the dashboard uses
  useEffect(() => {
    let active = true;
    dashboardApi.getSummary().then((data) => {
      if (active) setSummary(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id && !user?._id) return;

    setSaving(true);
    setError(null);
    try {
      await profileApi.updateProfile(user.id || user._id || '', {
        name,
        phone,
        bio,
        expertise,
        skills,
      });

      updateCurrentUser({ name, phone, bio, expertise, skills });
      // Pull the saved record back so the page reflects what was stored
      await refreshProfile();

      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const stats = summary?.stats;

  /**
   * Counters shown under "About Me". A live account reports its own booking
   * figures, so those are preferred over the local dashboard summary.
   */
  const counters = [
    { label: 'Courses', value: stats?.courses, icon: GraduationCap },
    {
      label: 'Classes This Month',
      value: profileData?.bookings !== undefined ? Number(profileData.bookings) : stats?.bookings,
      icon: CalendarCheck,
    },
    { label: 'Sessions Attended', value: stats?.attended, icon: CheckCircle },
    { label: 'Posts Shared', value: stats?.posts, icon: MessageSquare },
  ];

  /** Every remaining field the profile API returned, with blanks dropped. */
  const accountRows = (
    [
      ['Username', profileData?.username],
      ['Full name', profileData?.fullname],
      ['Chinese name', profileData?.chinese_name],
      ['Email', profileData?.email],
      ['Phone', profileData?.phone],
      ['Gender', profileData?.gender],
      ['Date of birth', profileData?.dob],
      ['Member since', profileData?.enroll_date],
      ['Hong Kong ID', profileData?.hongkong_id],
      ['Street', profileData?.street],
      ['City', profileData?.city],
      ['State', profileData?.address_state],
      ['Country', profileData?.country],
      ['Postal code', profileData?.pincode],
      [
        'Wallet balance',
        profileData?.wallet_balance !== undefined && profileData?.wallet_balance !== null
          ? `₹${profileData.wallet_balance}`
          : undefined,
      ],
      ['Wallet expires', profileData?.amount_expire],
      [
        'Notifications',
        [
          Number(profileData?.notify_email) === 1 ? 'Email' : null,
          Number(profileData?.notify_whatsapp) === 1 ? 'WhatsApp' : null,
          Number(profileData?.notify_push) === 1 ? 'Push' : null,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
      ],
      [
        'Account warnings',
        profileData?.warning !== undefined ? String(profileData.warning) : undefined,
      ],
    ] as Array<[string, unknown]>
  )
    .map(([label, value]) => ({ label, value: value === null || value === undefined ? '' : String(value).trim() }))
    // Blank, zero-date and placeholder values add noise rather than information
    .filter(({ value }) => value !== '' && value !== '0000-00-00' && value !== '-');

  // Milestones are derived from real counters, not stored separately
  const milestones = [
    {
      title: 'Prakriti Initiate',
      body: 'Joined the Pragya community',
      icon: Sparkles,
      earned: true,
      tone: 'bg-terracotta-50 dark:bg-terracotta-950/40 border-terracotta-200 dark:border-terracotta-800/60',
      iconTone: 'bg-terracotta-600 text-gold-400',
    },
    {
      title: 'Enrolled Learner',
      body: 'Enrolled on your first course',
      icon: GraduationCap,
      earned: (stats?.courses ?? 0) > 0,
      tone: 'bg-forest-50 dark:bg-forest-950/40 border-forest-200 dark:border-forest-800/60',
      iconTone: 'bg-forest-600 text-white',
    },
    {
      title: 'Mindful Practitioner',
      body: 'Attended 3 or more sessions',
      icon: Award,
      earned: (stats?.attended ?? 0) >= 3,
      tone: 'bg-gold-50 dark:bg-gold-950/40 border-gold-200 dark:border-gold-800/60',
      iconTone: 'bg-gold-500 text-charcoal-900',
    },
    {
      title: 'Community Voice',
      body: 'Shared your first reflection',
      icon: MessageSquare,
      earned: (stats?.posts ?? 0) > 0,
      tone: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
      iconTone: 'bg-purple-600 text-white',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-burgundy-700 text-white p-5 sm:p-10 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-gold-400/15 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600 text-charcoal-900 font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-xl shadow-gold-500/20 border-4 border-white/20 flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || 'Profile photo'}
                className="w-full h-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-extrabold text-xl sm:text-3xl text-white break-words">
                {user?.name}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500 text-charcoal-900">
                {user?.role || 'Member'}
              </span>
              {isAdmin && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/80 text-white flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-sand-100/90">
              <span className="flex items-center justify-center sm:justify-start gap-1.5 break-all">
                <Mail className="w-4 h-4 text-gold-400 flex-shrink-0" />
                {user?.email}
              </span>
              {user?.phone && (
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="w-4 h-4 text-gold-400 flex-shrink-0" />
                  {user.phone}
                </span>
              )}
            </div>

            {bio && (
              <p className="text-xs sm:text-sm text-sand-100 max-w-xl leading-relaxed pt-1">"{bio}"</p>
            )}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <CheckCircle className="w-4 h-4" />
          Profile updated and synced.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-red-700 dark:text-red-300 text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          {isEditing ? (
            <div className="bg-white dark:bg-neutral-900 p-5 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-5">
              <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">
                Edit Personal Details
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                      Specialisation
                    </label>
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="Ashtanga Yoga, Ayurveda…"
                      className="w-full p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    About You
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about your practice…"
                    className="w-full p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium resize-none leading-relaxed text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                    Skills & Focus Tags
                  </label>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type a skill and press Enter…"
                    className="w-full p-3 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 font-medium mb-2 text-neutral-900 dark:text-white"
                  />

                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-800 dark:text-terracotta-200 border border-terracotta-200 dark:border-terracotta-800 flex items-center gap-1.5"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500 font-bold cursor-pointer"
                          aria-label={`Remove ${skill}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-terracotta-600 hover:bg-terracotta-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-3 rounded-xl font-bold text-sm bg-sand-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 p-5 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-6">
              <div>
                <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white">About Me</h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed whitespace-pre-line">
                  {bio || 'No bio yet. Use "Edit Profile" to introduce yourself to the community.'}
                </p>
              </div>

              {expertise && (
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white mb-1.5">
                    Specialisation
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{expertise}</p>
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <h3 className="font-display font-bold text-sm text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gold-500" />
                    Practices & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Counters straight from the API */}
              <div className="pt-5 border-t border-sand-200 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {counters.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 sm:p-4 rounded-2xl bg-sand-50 dark:bg-neutral-800/40">
                    <Icon className="w-4 h-4 text-terracotta-600 dark:text-gold-400 mx-auto mb-1" />
                    <p className="font-display font-bold text-xl sm:text-2xl text-terracotta-700 dark:text-gold-400">
                      {value ?? '—'}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Everything else the profile API returned */}
          {accountRows.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 p-5 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
              <div>
                <h2 className="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-gold-500" />
                  Account Details
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  As held on your Pragya Yog record.
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
                {accountRows.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 py-2.5 border-b border-sand-200 dark:border-neutral-800 last:border-0"
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 whitespace-nowrap">
                      {label}
                    </dt>
                    <dd className="text-xs font-semibold text-neutral-900 dark:text-white text-right break-words min-w-0">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Attendance record, when the API reports strikes */}
          {(profileData?.noshow_strikes !== undefined || profileData?.late_checkin_strikes !== undefined) && (
            <div className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card">
              <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-terracotta-600 dark:text-gold-400" />
                Attendance This Month
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'No-shows', value: Number(profileData?.noshow_strikes ?? 0) },
                  { label: 'Late check-ins', value: Number(profileData?.late_checkin_strikes ?? 0) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={`p-3 rounded-2xl border text-center ${
                      value > 0
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                        : 'bg-sand-50 dark:bg-neutral-800/40 border-sand-200 dark:border-neutral-700'
                    }`}
                  >
                    <p
                      className={`font-display font-bold text-xl ${
                        value > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      {value}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
            <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              Milestones
            </h2>

            <div className="space-y-3">
              {milestones.map(({ title, body, icon: Icon, earned, tone, iconTone }) => (
                <div
                  key={title}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-opacity ${tone} ${
                    earned ? '' : 'opacity-40 grayscale'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${iconTone} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-neutral-900 dark:text-white">{title}</h3>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      {earned ? body : `Locked · ${body}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-neutral-400 pt-1 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Milestones update from your real activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
