import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  UserCircle,
  Settings,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, isAdmin } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/feed', label: 'Community Feed', icon: Flame },
    { to: '/mentors', label: 'Mentors & Gurus', icon: Users },
    { to: '/events', label: 'Events & Workshops', icon: Calendar },
    { to: '/resources', label: 'Resource Library', icon: BookOpen },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin Portal', icon: ShieldCheck });
  }

  const secondaryLinks = [
    { to: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white dark:bg-neutral-900 text-charcoal-800 dark:text-neutral-200 transition-all duration-300 ease-in-out border-r border-sand-200 dark:border-neutral-800 shadow-xs
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between h-20 px-3.5 border-b border-sand-200 dark:border-neutral-800">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden text-left flex-1 min-w-0"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-white dark:bg-neutral-800 border border-sand-200 dark:border-neutral-700 flex items-center justify-center shadow-xs p-1 flex-shrink-0 group-hover:scale-105 transition-transform">
              <img src={logoImg} alt="Pragya Connect" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-display font-extrabold text-[15px] text-forest-900 dark:text-white tracking-tight flex items-center gap-1 leading-tight truncate">
                  PRAGYA <span className="text-gold-600 dark:text-gold-400">CONNECT</span>
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-normal whitespace-nowrap mt-0.5">
                  Holistic Mentorship
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-sand-100 hover:bg-sand-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors flex-shrink-0 cursor-pointer ml-1"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
          {!collapsed && (
            <p className="px-3 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
              Main Menu
            </p>
          )}

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? 'bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-gold-400 font-bold border border-forest-200 dark:border-forest-800 shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 hover:text-forest-800 dark:hover:text-gold-300'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}

          <div className="pt-4 mt-4 border-t border-sand-200 dark:border-neutral-800">
            {!collapsed && (
              <p className="px-3 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
                Support
              </p>
            )}
            {secondaryLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                      isActive
                        ? 'bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-gold-400 font-bold border border-forest-200 dark:border-forest-800 shadow-xs'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-sand-100 dark:hover:bg-neutral-800 hover:text-forest-800 dark:hover:text-gold-300'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Footer Role Badge */}
        {!collapsed && user && (
          <div className="p-3 m-3 rounded-2xl bg-sand-50 dark:bg-neutral-800/80 border border-sand-200 dark:border-neutral-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-forest-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{user.name}</p>
                <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-semibold rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-800 dark:text-forest-200 border border-forest-200 dark:border-forest-800">
                  {user.role || 'Member'}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
