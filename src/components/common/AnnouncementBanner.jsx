import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaStar, FaRocket, FaGraduationCap, FaCode, FaTrophy } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Check if banner was dismissed
  useEffect(() => {
    const bannerDismissed = localStorage.getItem('announcement_banner_dismissed');
    if (bannerDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem('announcement_banner_dismissed', 'true');
  };

  if (!isVisible || dismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 animate-gradient-x">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-300 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300 rounded-full filter blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Animated sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="container-custom relative py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white/20 backdrop-blur-sm p-2 rounded-full">
                <FaBell className="text-white text-xl animate-bounce" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  <FaStar className="text-xs" />
                  NEW
                </span>
                <span className="inline-flex items-center gap-1 bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  <FaRocket className="text-xs" />
                  UPDATED
                </span>
                <span className="text-white text-sm font-medium">🎉 Exciting Updates!</span>
              </div>
              
              <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                New Learning Path & Features Available! 
                <span className="inline-block animate-wiggle ml-2">✨</span>
              </h3>
              
              <p className="text-white/90 text-sm sm:text-base">
                We've launched our complete Python curriculum! Check out the new learning path, challenges, and member profiles.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/curriculum"
              className="group relative overflow-hidden bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FaGraduationCap />
                View Curriculum
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            <Link
              to="/student/login"
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/30 transition-all duration-300 hover:scale-105 border border-white/30"
            >
              Login to Start
            </Link>
            
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 rounded-full transition hover:bg-white/20"
              aria-label="Dismiss"
            >
              <FaTimes />
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
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;
