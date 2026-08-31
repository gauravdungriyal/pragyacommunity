import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserDrawer } from './UserDrawer';
import { NotificationDrawer } from './NotificationDrawer';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-[#0c1410] text-neutral-800 dark:text-neutral-200 transition-colors w-full overflow-x-hidden relative">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div
        className={`min-h-screen flex flex-col w-full min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Topbar */}
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
          onUserDrawerClick={() => setUserDrawerOpen(true)}
        />

        {/* Dynamic Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          <Outlet />
        </main>

        {/* Global Drawers */}
        <UserDrawer
          isOpen={userDrawerOpen}
          onClose={() => setUserDrawerOpen(false)}
        />
        <NotificationDrawer />
      </div>
    </div>
  );
};
