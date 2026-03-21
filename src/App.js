import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import PrivateRoute from './components/common/PrivateRoute';
import StudentPrivateRoute from './components/common/StudentPrivateRoute';
import { testConnection } from './services/supabase';

// Public Pages
import HomePage from './pages/HomePage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailPage from './pages/ActivityDetailPage';
import MembersPage from './pages/MembersPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import PythonPracticePage from './pages/PythonPracticePage';
import ChallengesPage from './pages/ChallengesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CurriculumPage from './pages/CurriculumPage';
import AchievementsPage from './pages/AchievementsPage';

// Student Pages
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import StudentDashboard from './pages/student/StudentDashboard';
import RegistrationRequest from './pages/student/RegistrationRequest';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import ForcePasswordChange from './pages/ForcePasswordChange';
import MemberProfile from './pages/student/MemberProfile';




// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminActivities from './pages/admin/AdminActivities';
import AdminActivityRegistrations from './pages/admin/AdminActivityRegistrations';
import AdminMembers from './pages/admin/AdminMembers';
import AdminGallery from './pages/admin/AdminGallery';
import AdminMessages from './pages/admin/AdminMessages';
import AdminMembershipApplications from './pages/admin/AdminMembershipApplications';
import AdminChallenges from './pages/admin/AdminChallenges';
import AdminStudentApprovals from './pages/admin/AdminStudentApprovals';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminCurriculum from './pages/admin/AdminCurriculum';

function App() {
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/activities/:id" element={<ActivityDetailPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/python-practice" element={<PythonPracticePage />} />
              <Route path="/challenges" element={<ChallengesPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/curriculum" element={<CurriculumPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/force-password-change" element={<ForcePasswordChange />} />


              
              {/* Student Auth Routes */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/student/request" element={<RegistrationRequest />} />
            </Route>

            {/* Protected Student Routes */}
            <Route element={<StudentPrivateRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<MemberProfile />} />

              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/activities" element={<AdminActivities />} />
                <Route path="/admin/activities/:id/registrations" element={<AdminActivityRegistrations />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/gallery" element={<AdminGallery />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/applications" element={<AdminMembershipApplications />} />
                <Route path="/admin/challenges" element={<AdminChallenges />} />
                
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/curriculum" element={<AdminCurriculum />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
