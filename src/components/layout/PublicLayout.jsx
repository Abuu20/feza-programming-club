import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import AnnouncementBanner from '../common/AnnouncementBanner';

// Pages that need full viewport height with no footer
const FULL_HEIGHT_ROUTES = ['/chat', '/python-practice', '/student/files'];

const PublicLayout = () => {
  const { pathname } = useLocation();
  const isFullHeight = FULL_HEIGHT_ROUTES.includes(pathname);

  if (isFullHeight) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <AnnouncementBanner />
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        {/* No footer on full-height pages like chat */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AnnouncementBanner />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;