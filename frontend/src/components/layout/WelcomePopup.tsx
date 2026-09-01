import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, GraduationCap, CalendarCheck, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Shown once per member. The "seen" flag lives on the member's settings row,
 * so dismissing it survives a refresh, a new session, and another device.
 */
export const WelcomePopup: React.FC = () => {
  const { user, welcomeSeen, dismissWelcome } = useAuth();

  // `null` means the profile has not been read yet — stay quiet until it is
  if (!user || welcomeSeen !== false) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={dismissWelcome} />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-sand-200 dark:border-neutral-800 z-10 overflow-hidden">
        <div className="relative p-6 sm:p-7 bg-gradient-to-br from-forest-600 via-forest-700 to-forest-800 text-white">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 rounded-full bg-gold-400/20 blur-2xl pointer-events-none" />

          <button
            onClick={dismissWelcome}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
            aria-label="Close welcome message"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-[1] space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-400/20 text-gold-300 border border-gold-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome
            </div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl">
              Namaste, {user.name?.split(' ')[0]}
            </h2>
            <p className="text-sand-100/90 text-xs sm:text-sm leading-relaxed">
              This is your Pragya Connect home. Here is what you can do from here.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {[
            { icon: CalendarCheck, title: 'Book your classes', body: 'Browse upcoming sessions and reserve your place in a tap.' },
            { icon: GraduationCap, title: 'Open your course material', body: 'Everything your mentor uploads for your courses sits in the library.' },
            { icon: Bell, title: 'Stay in the loop', body: 'Announcements and course updates arrive in your notifications.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-300 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">{title}</h3>
                <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={dismissWelcome}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all cursor-pointer"
            >
              Start exploring
            </button>
            <Link
              to="/events"
              onClick={dismissWelcome}
              className="px-4 py-3 rounded-xl font-bold text-sm bg-sand-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-sand-200 dark:hover:bg-neutral-700 transition-all whitespace-nowrap"
            >
              See events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
