// src/components/AnnouncementBanner.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaStar, FaRocket, FaGraduationCap, FaCode, FaTrophy, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const bannerDismissed = localStorage.getItem('announcement_banner_dismissed');
    if (bannerDismissed === 'true') {
      setDismissed(true);
    }
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('announcement_banner_dismissed', 'true');
  };

  if (!isVisible || dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
      {/* Simplified background for mobile - less intensive */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full filter blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300 rounded-full filter blur-2xl"></div>
      </div>

      {/* Simple sparkles - fewer on mobile */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(isMobile ? 5 : 15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              display: isMobile && i > 3 ? 'none' : 'block'
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="container-custom relative px-4 py-3 sm:py-4">
        {/* Mobile: Stacked layout, Desktop: Row layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          
          {/* Left section - Icon and Content */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Icon - smaller on mobile */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-full">
                <FaBell className="text-white text-sm sm:text-xl animate-bounce" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Badges row - wrap on mobile */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                  <FaStar className="text-[8px] sm:text-xs" />
                  NEW
                </span>
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-green-400 text-green-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                  <FaRocket className="text-[8px] sm:text-xs" />
                  UPDATED
                </span>
                <span className="text-white/90 text-[10px] sm:text-xs font-medium">
                  🎉 Exciting Updates!
                </span>
              </div>
              
              {/* Title - responsive font sizes */}
              <h3 className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-0.5 sm:mb-1 leading-tight">
                New Learning Path & Features Available!
                <span className="inline-block animate-wiggle ml-1">✨</span>
              </h3>
              
              {/* Description - hidden on very small screens, shown on tablet+ */}
              <p className="hidden xs:block text-white/80 text-xs sm:text-sm">
                Complete Python curriculum with interactive lessons and hands-on projects.
              </p>
              {/* Shorter description for mobile */}
              <p className="block xs:hidden text-white/80 text-xs">
                New Python curriculum with projects!
              </p>
            </div>
          </div>

          {/* Right section - Action Buttons - responsive layout */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
            <Link
              to="/curriculum"
              className="group relative overflow-hidden bg-white text-purple-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 flex-1 sm:flex-initial text-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
                <FaGraduationCap className="text-xs sm:text-sm" />
                <span className="hidden xs:inline">View Curriculum</span>
                <span className="inline xs:hidden">Learn</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            <Link
              to="/student/login"
              className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/30 flex-1 sm:flex-initial text-center"
            >
              <span className="hidden xs:inline">Login to Start</span>
              <span className="inline xs:hidden">Login</span>
            </Link>
            
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1.5 sm:p-2 rounded-full transition hover:bg-white/20 flex-shrink-0"
              aria-label="Dismiss"
            >
              <FaTimes className="text-sm sm:text-base" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
          display: inline-block;
        }
        
        /* Extra small devices (phones, 480px and down) */
        @media (max-width: 480px) {
          .container-custom {
            padding-left: 12px;
            padding-right: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;