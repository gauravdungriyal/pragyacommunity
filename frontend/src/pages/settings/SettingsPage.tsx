import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  BellRing,
  Sun,
  Moon,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { authApi, profileApi } from '../../api/services';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pushPermission, requestPushPermission } = useNotifications();

  // Notification preferences are stored server-side, per member
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Load the stored preferences once
  useEffect(() => {
    let active = true;

    profileApi
      .getProfile(user?.id)
      .then((data) => {
        if (!active || !data) return;
        setNotifyEmail(Number(data.notify_email ?? 1) === 1);
        setNotifyWhatsapp(Number(data.notify_whatsapp ?? 1) === 1);
        setNotifyPush(Number(data.notify_push ?? 1) === 1);
      })
      .catch(() => {
        /* Defaults stay on if the profile cannot be read */
      })
      .finally(() => {
        if (active) setPrefsLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist one preference immediately so nothing is lost on navigation. */
  const savePreference = async (patch: {
    notify_email?: number;
    notify_whatsapp?: number;
    notify_push?: number;
  }) => {
    setPrefsError(null);
    try {
      await profileApi.updateNotificationSettings(patch);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch {
      setPrefsError('Could not save that preference. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (!newPass || newPass !== confirmPass) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPass.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await authApi.changePassword({
        old_pass: currentPass,
        password: newPass,
        confirmpassword: confirmPass,
      });

      if (res.status) {
        setPasswordSaved(true);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => setPasswordSaved(false), 4000);
      } else {
        setPasswordError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || 'Server error occurred while updating password.'
      );
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-forest-600 via-forest-700 to-forest-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
            <SettingsIcon className="w-3.5 h-3.5" />
            Preferences & Security
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Account Settings
          </h1>
          <p className="text-sand-100/90 text-xs sm:text-sm">
            Manage your account security, notification alerts, and theme preferences.
          </p>
        </div>
      </div>

      {/* 1. Theme & Appearance */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
        <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-gold-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          Interface Theme
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Choose between vibrant daytime light mode and comfortable ambient dark mode.
        </p>

        <div className="pt-2 flex items-center gap-4">
          <button
            onClick={theme === 'dark' ? toggleTheme : undefined}
            className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-forest-600 bg-forest-50 text-forest-900 shadow-xs dark:bg-forest-950/40'
                : 'border-sand-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            Daylight Sanctuary
          </button>
          <button
            onClick={theme === 'light' ? toggleTheme : undefined}
            className={`flex-1 p-4 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-gold-500 bg-neutral-800 text-white shadow-xs'
                : 'border-sand-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Moon className="w-4 h-4 text-gold-400" />
            Night Meditation (Dark)
          </button>
        </div>
      </div>

      {/* 2. Notifications Settings */}
      <div className="bg-white dark:bg-neutral-900 p-5 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-forest-600 dark:text-gold-400" />
            Notification Preferences
          </h2>
          {prefsSaved && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        {prefsError && (
          <p className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-700 dark:text-red-300">
            {prefsError}
          </p>
        )}

        <div className="space-y-3 pt-1 text-xs">
          {[
            {
              key: 'notify_email' as const,
              label: 'Email Updates',
              hint: 'Session reminders and announcements sent to your inbox',
              checked: notifyEmail,
              set: setNotifyEmail,
            },
            {
              key: 'notify_whatsapp' as const,
              label: 'WhatsApp Updates',
              hint: 'Short reminders on WhatsApp before a booked session',
              checked: notifyWhatsapp,
              set: setNotifyWhatsapp,
            },
            {
              key: 'notify_push' as const,
              label: 'Push Notifications',
              hint: 'Desktop and mobile alerts, even when the app is closed',
              checked: notifyPush,
              set: setNotifyPush,
            },
          ].map(({ key, label, hint, checked, set }) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-sand-50 dark:bg-neutral-800/40 border border-sand-200 dark:border-neutral-700 cursor-pointer"
            >
              <div className="min-w-0">
                <p className="font-bold text-neutral-900 dark:text-white">{label}</p>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-0.5">{hint}</p>
              </div>
              <input
                type="checkbox"
                disabled={prefsLoading}
                checked={checked}
                onChange={(e) => {
                  set(e.target.checked);
                  savePreference({ [key]: e.target.checked ? 1 : 0 });
                }}
                className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500 flex-shrink-0"
              />
            </label>
          ))}
        </div>

        {/* The browser has the final say on whether push can be delivered */}
        {notifyPush && pushPermission !== 'granted' && (
          <div className="p-3.5 rounded-2xl bg-gold-50 dark:bg-gold-950/40 border border-gold-200 dark:border-gold-800/60 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <BellRing className="w-4 h-4 text-gold-600 dark:text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
                {pushPermission === 'denied'
                  ? 'Your browser is blocking push notifications. Allow them in site settings to receive desktop alerts.'
                  : pushPermission === 'unsupported'
                  ? 'This browser does not support push notifications. In-app notifications still work.'
                  : 'Allow push notifications in your browser to receive desktop alerts.'}
              </p>
            </div>
            {pushPermission === 'default' && (
              <button
                onClick={requestPushPermission}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gold-500 hover:bg-gold-600 text-charcoal-900 whitespace-nowrap cursor-pointer flex-shrink-0"
              >
                Allow
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Security / Password Update */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-sand-200 dark:border-neutral-800 shadow-card space-y-4">
        <h2 className="font-display font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-forest-600 dark:text-gold-400" />
          Change Password
        </h2>

        {passwordSaved && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Password updated successfully!
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs max-w-md pt-2">
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-type new password"
              className="w-full p-2.5 rounded-xl bg-sand-50 dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-forest-600 hover:bg-forest-700 dark:bg-gold-500 dark:hover:bg-gold-600 text-white dark:text-charcoal-900 transition-all flex items-center gap-1.5 shadow-sm mt-2 cursor-pointer disabled:opacity-50"
          >
            {changingPass ? (
              <div className="w-3.5 h-3.5 border-2 border-white dark:border-charcoal-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Update Password
          </button>
        </form>
      </div>

      {/* 4. Danger Zone */}
      <div className="bg-red-50/50 dark:bg-red-950/20 p-6 sm:p-8 rounded-3xl border border-red-200 dark:border-red-900/50 space-y-3">
        <h3 className="font-display font-bold text-base text-red-700 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Deactivating your account will remove your community posts, session history, and library bookmarks.
        </p>
        <button
          onClick={() => alert('Please contact administrative support to delete your account.')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Request Account Deletion
        </button>
      </div>
    </div>
  );
};
