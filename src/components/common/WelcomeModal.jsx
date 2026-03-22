import React, { useState, useEffect } from 'react';
import { FaTimes, FaGraduationCap, FaCode, FaTrophy, FaUserPlus, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const WelcomeModal = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('welcome_modal_seen');
    if (!hasSeenWelcome) {
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('welcome_modal_seen', 'true');
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl transform transition-all animate-scale-in">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-500 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300 rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full mb-2 animate-pulse">
                  🎉 WELCOME!
                </span>
                <h2 className="text-2xl font-bold mt-2">What's New at Feza Code Club</h2>
              </div>
              <button onClick={handleClose} className="text-white/80 hover:text-white">
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg hover:shadow-md transition">
            <div className="bg-green-500 p-2 rounded-full">
              <FaGraduationCap className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Complete Python Curriculum</h3>
              <p className="text-sm text-gray-600">100+ lessons from beginner to advanced. Track your progress!</p>
              <Link to="/curriculum" onClick={handleClose} className="text-xs text-green-600 hover:text-green-700 mt-1 inline-block">
                Explore Curriculum →
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:shadow-md transition">
            <div className="bg-purple-500 p-2 rounded-full">
              <FaCode className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800">Enhanced Python Editor</h3>
              <p className="text-sm text-gray-600">Write and save your code with syntax highlighting and auto-completion.</p>
              <Link to="/python-practice" onClick={handleClose} className="text-xs text-purple-600 hover:text-purple-700 mt-1 inline-block">
                Try it Now →
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg hover:shadow-md transition">
            <div className="bg-orange-500 p-2 rounded-full">
              <FaTrophy className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-800">Coding Challenges</h3>
              <p className="text-sm text-gray-600">Solve problems, earn points, and climb the leaderboard!</p>
              <Link to="/challenges" onClick={handleClose} className="text-xs text-orange-600 hover:text-orange-700 mt-1 inline-block">
                View Challenges →
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:shadow-md transition">
            <div className="bg-blue-500 p-2 rounded-full">
              <FaUserPlus className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Member Profiles</h3>
              <p className="text-sm text-gray-600">Upload your photo and connect your social accounts!</p>
              <Link to="/student/dashboard" onClick={handleClose} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                Edit Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-6 pt-0">
          <button
            onClick={handleClose}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <span>Start Learning</span>
            <FaArrowRight />
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            You can always access these features from the navigation menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
