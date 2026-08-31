import React from 'react';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import logoImg from '../../assets/logo.png';

interface TopbarProps {
  onMenuClick: () => void;
  onUserDrawerClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick, onUserDrawerClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, toggleDrawer } = useNotifications();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 sm:h-20 px-4 sm:px-6 lg:px-8 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-sand-200 dark:border-neutral-800 transition-colors w-full min-w-0">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0 max-w-xl">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 cursor-pointer flex-shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
          <img src={logoImg} alt="Pragya Connect" className="w-7 h-7 object-contain" />
          <span className="font-display font-extrabold text-xs text-forest-900 dark:text-white tracking-tight">
            PRAGYA <span className="text-gold-600 dark:text-gold-400">CONNECT</span>
          </span>
        </div>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search mentors, events, resources, discussions..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-sand-50 dark:bg-neutral-800/80 border border-sand-200 dark:border-neutral-700 focus:outline-none focus:border-forest-600 dark:focus:border-gold-500 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Actions, Theme, Notifications & User Pill */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gold-400" />
          ) : (
            <Moon className="w-5 h-5 text-forest-700" />
          )}
        </button>

        {/* Notifications Trigger */}
        <button
          onClick={toggleDrawer}
          className="relative p-2.5 rounded-full text-neutral-600 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Credential Pill */}
        {user && (
          <button
            onClick={onUserDrawerClick}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-white dark:bg-neutral-800 border border-sand-300 dark:border-neutral-700 hover:border-gold-500 dark:hover:border-gold-500 shadow-2xs hover:shadow-xs transition-all text-left cursor-pointer flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-forest-600 dark:bg-forest-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-inner">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-neutral-900 dark:text-white leading-tight max-w-[120px] truncate">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-wider">
                {user.role || 'Student'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5 flex-shrink-0" />
          </button>
        )}
      </div>
    </header>
  );
};
