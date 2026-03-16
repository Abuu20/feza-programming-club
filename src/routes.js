import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ActivitiesPage from './pages/ActivitiesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MembersPage from './pages/MembersPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import PythonPracticePage from './pages/PythonPracticePage';
import LoginPage from './pages/auth/LoginPage';
import LogoutPage from './pages/auth/LogoutPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminActivities from './pages/admin/AdminActivities';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminMembers from './pages/admin/AdminMembers';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMessages from './pages/admin/AdminMessages';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/python-practice" element={<PythonPracticePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
      </Route>

      {/* Protected Admin Routes with AdminLayout */}
      <Route element={<PrivateRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/activities" element={<AdminActivities />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/members" element={<AdminMembers />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
