import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import PrivateRoute from './components/common/PrivateRoute';
import StudentPrivateRoute from './components/common/StudentPrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loader from './components/common/Loader';
import { testConnection } from './services/supabase';
import WelcomeModal from './components/common/WelcomeModal';

// Home loads eagerly for the fastest possible first paint (it's what most
// visitors land on). Everything else is code-split so people only download
// the editor/admin/quiz bundles when they actually visit those pages.
import HomePage from './pages/HomePage';

// Public Pages
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/ActivityDetailPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PythonPracticePage = lazy(() => import('./pages/PythonPracticePage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfUsePage = lazy(() => import('./pages/TermsOfUsePage'));

// Student Pages
const StudentLogin = lazy(() => import('./pages/student/StudentLogin'));
const StudentRegister = lazy(() => import('./pages/student/StudentRegister')); // has password + approval
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MemberProfile = lazy(() => import('./pages/student/MemberProfile'));
const MembersManagePage = lazy(() => import('./pages/student/MembersManagePage'));
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminActivities = lazy(() => import('./pages/admin/AdminActivities'));
const AdminActivityRegistrations = lazy(() => import('./pages/admin/AdminActivityRegistrations'));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminMembershipApplications = lazy(() => import('./pages/admin/AdminMembershipApplications'));
const AdminChallenges = lazy(() => import('./pages/admin/AdminChallenges'));
const AdminAnnouncements = lazy(() => import('./pages/admin/AdminAnnouncements'));
const AdminCurriculum = lazy(() => import('./pages/admin/AdminCurriculum'));
const ResetLinkGenerator = lazy(() => import('./pages/admin/ResetLinkGenerator'));
const AdminQuiz = lazy(() => import('./pages/admin/AdminQuiz'));
const AdminDailyTips = lazy(() => import('./pages/admin/AdminDailyTips'));
const AdminUsefulSites = lazy(() => import('./pages/admin/AdminUsefulSites'));


function App() {
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <WelcomeModal />
          <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/activities/:id" element={<ActivityDetailPage />} />
              <Route path="/chat" element={<ChatPage />} />
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
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-use" element={<TermsOfUsePage />} />

              {/* Student Auth — both paths go to same register page */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/student/request" element={<StudentRegister />} />
            </Route>

            {/* Protected Student Routes */}
            <Route element={<StudentPrivateRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<MemberProfile />} />
                <Route path="/student/members-manage" element={<MembersManagePage />} />
                <Route path="/student/files" element={<ErrorBoundary><FileManagerPage /></ErrorBoundary>} />
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
                <Route path="/admin/reset-link-generator" element={<ResetLinkGenerator />} />
                <Route path="/admin/quiz" element={<AdminQuiz />} />
                <Route path="/admin/tips" element={<AdminDailyTips />} />
                <Route path="/admin/useful-sites" element={<AdminUsefulSites />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
