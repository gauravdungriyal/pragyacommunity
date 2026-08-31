import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Shield,
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-l border-sand-200 dark:border-neutral-800 transition-colors">
          {/* Drawer Header */}
          <div className="p-6 border-b border-sand-200 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-forest-900 dark:text-forest-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-500" />
              Account Hub
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Card */}
          <div className="p-6 bg-sand-50 dark:bg-neutral-800/40 border-b border-sand-200 dark:border-neutral-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-600 to-forest-800 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold-100 dark:bg-gold-950/60 text-gold-800 dark:text-gold-300 border border-gold-300 dark:border-gold-800">
                    {user?.role || 'Member'}
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors font-medium text-sm"
            >
              <User className="w-4 h-4 text-forest-600 dark:text-forest-400" />
              <span>My Profile & Achievements</span>
            </Link>

            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors font-medium text-sm"
            >
              <Settings className="w-4 h-4 text-forest-600 dark:text-forest-400" />
              <span>Account & Security Settings</span>
            </Link>

            <Link
              to="/help"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors font-medium text-sm"
            >
              <HelpCircle className="w-4 h-4 text-forest-600 dark:text-forest-400" />
              <span>Help Center & FAQ</span>
            </Link>

            {/* Theme Toggle Inside Drawer */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors font-medium text-sm"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-gold-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span>Theme Mode</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sand-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Platform Badges Preview */}
            <div className="p-4 mt-4 rounded-2xl bg-forest-50 dark:bg-forest-950/30 border border-forest-100 dark:border-forest-900/40">
              <div className="flex items-center gap-2 text-forest-800 dark:text-forest-200 font-bold text-xs">
                <Award className="w-4 h-4 text-gold-500" />
                <span>Prakriti Member Level 1</span>
              </div>
              <p className="text-[11px] text-forest-600 dark:text-forest-400 mt-1">
                Participate in discussions and attend live sessions to unlock the Guru Tier badge!
              </p>
            </div>
          </div>

          {/* Drawer Footer / Logout */}
          <div className="p-6 border-t border-sand-200 dark:border-neutral-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
