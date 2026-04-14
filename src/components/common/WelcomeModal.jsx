// src/components/WelcomeModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaGraduationCap, FaCode, FaTrophy, FaUserPlus, FaArrowRight, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const WelcomeModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_modal_seen');
    if (!hasSeenWelcome) {
      setTimeout(() => setIsVisible(true), 2000);
    }
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('welcome_modal_seen', 'true');
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl transform transition-all animate-scale-in mx-auto">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-500 p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-yellow-300 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full mb-2 animate-pulse">
                  🎉 WELCOME!
                </span>
                <h2 className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">What's New at Feza Code Club</h2>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white p-1">
                <FaTimes className="text-sm sm:text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Features List - Responsive grid on mobile */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg hover:shadow-md transition">
            <div className="bg-green-500 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <FaGraduationCap className="text-white text-sm sm:text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-green-800 text-sm sm:text-base">Complete Python Curriculum</h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">
                {isMobile ? '100+ lessons from beginner to advanced!' : '100+ lessons from beginner to advanced. Track your progress!'}
              </p>
              <Link to="/curriculum" onClick={handleClose} className="text-xs text-green-600 hover:text-green-700 mt-1 inline-block">
                Explore Curriculum <FaChevronRight className="inline text-xs" />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg hover:shadow-md transition">
            <div className="bg-purple-500 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <FaCode className="text-white text-sm sm:text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-purple-800 text-sm sm:text-base">Enhanced Python Editor</h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">
                {isMobile ? 'Write code with syntax highlighting!' : 'Write and save your code with syntax highlighting and auto-completion.'}
              </p>
              <Link to="/python-practice" onClick={handleClose} className="text-xs text-purple-600 hover:text-purple-700 mt-1 inline-block">
                Try it Now <FaChevronRight className="inline text-xs" />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg hover:shadow-md transition">
            <div className="bg-orange-500 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <FaTrophy className="text-white text-sm sm:text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-orange-800 text-sm sm:text-base">Coding Challenges</h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">
                {isMobile ? 'Solve problems & earn points!' : 'Solve problems, earn points, and climb the leaderboard!'}
              </p>
              <Link to="/challenges" onClick={handleClose} className="text-xs text-orange-600 hover:text-orange-700 mt-1 inline-block">
                View Challenges <FaChevronRight className="inline text-xs" />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg hover:shadow-md transition">
            <div className="bg-blue-500 p-1.5 sm:p-2 rounded-full flex-shrink-0">
              <FaUserPlus className="text-white text-sm sm:text-base" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-800 text-sm sm:text-base">Member Profiles</h3>
              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-none">
                {isMobile ? 'Upload your photo!' : 'Upload your photo and connect your social accounts!'}
              </p>
              <Link to="/student/dashboard" onClick={handleClose} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                Edit Profile <FaChevronRight className="inline text-xs" />
              </Link>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 sm:p-6 pt-0 sm:pt-0">
          <button
            onClick={handleClose}
            className="w-full bg-primary-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>Start Learning</span>
            <FaArrowRight className="text-xs sm:text-sm" />
          </button>
          <p className="text-[10px] sm:text-xs text-gray-400 text-center mt-2 sm:mt-3">
            You can always access these features from the navigation menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;