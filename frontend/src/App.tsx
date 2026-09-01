import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

// Guards & Layout
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AdminRoute } from './components/guards/AdminRoute';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/common/PageLoader';

// Login is the entry point, so it stays in the main bundle
import { Login } from './pages/auth/Login';

// Every in-app page is split out and fetched on demand, which keeps the
// first paint of the home page small.
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const CommunityFeedPage = lazy(() => import('./pages/feed/CommunityFeedPage').then((m) => ({ default: m.CommunityFeedPage })));
const MentorsPage = lazy(() => import('./pages/mentors/MentorsPage').then((m) => ({ default: m.MentorsPage })));
const EventsPage = lazy(() => import('./pages/events/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const ResourcesPage = lazy(() => import('./pages/resources/ResourcesPage').then((m) => ({ default: m.ResourcesPage })));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
const HelpSupport = lazy(() => import('./pages/common/HelpSupport').then((m) => ({ default: m.HelpSupport })));
const Legal = lazy(() => import('./pages/common/Legal').then((m) => ({ default: m.Legal })));
const NotFound = lazy(() => import('./pages/common/NotFound').then((m) => ({ default: m.NotFound })));

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Route — accounts are created by an administrator */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Navigate to="/login" replace />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="feed" element={<CommunityFeedPage />} />
                <Route path="mentors" element={<MentorsPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:eventId" element={<EventDetailPage />} />
                <Route path="resources" element={<ResourcesPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="help" element={<HelpSupport />} />
                <Route path="legal" element={<Legal />} />

                {/* Admin-Only Route */}
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
