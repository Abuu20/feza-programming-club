import React, { useState } from 'react';
import { FaFire, FaStar, FaNewspaper, FaTimes } from 'react-icons/fa';

const FeatureBadge = ({ feature, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const icons = {
    curriculum: '📚',
    profile: '👤',
    challenges: '🏆',
    python: '🐍',
    default: '✨'
  };

  const colors = {
    curriculum: 'from-green-500 to-emerald-600',
    profile: 'from-blue-500 to-indigo-600',
    challenges: 'from-orange-500 to-red-600',
    python: 'from-purple-500 to-pink-600',
    default: 'from-primary-500 to-secondary-500'
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative group">
      <div className={`absolute inset-0 bg-gradient-to-r ${colors[feature.type] || colors.default} rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse`}></div>
      <div className="relative bg-white rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105">
        <span className="text-xl animate-bounce">{icons[feature.type] || icons.default}</span>
        <span className="text-sm font-semibold text-gray-800">{feature.title}</span>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 ml-1"
        >
          <FaTimes size={10} />
        </button>
      </div>
    </div>
  );
};

export default FeatureBadge;
