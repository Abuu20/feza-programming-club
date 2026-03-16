import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CodeBracketIcon,
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  PhotoIcon,
  EnvelopeIcon,
  TrophyIcon,
  BellIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Check if user is admin (based on email)
  const isAdmin = user?.email === 'fezaclub@gmail.com';

  const navLinks = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/activities', icon: CalendarIcon, label: 'Activities' },
    { path: '/members', icon: UserGroupIcon, label: 'Members' },
    { path: '/gallery', icon: PhotoIcon, label: 'Gallery' },
    { path: '/announcements', icon: BellIcon, label: 'News' },
    { path: '/challenges', icon: TrophyIcon, label: 'Challenges' },
    { path: '/python-practice', icon: CodeBracketIcon, label: 'Code Lab' },
    { path: '/contact', icon: EnvelopeIcon, label: 'Contact' },
  ];

  return (
    <nav className="bg-primary-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Shortened for better fit */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="bg-secondary-500 p-2 rounded-lg transform group-hover:rotate-12 transition">
              <CodeBracketIcon className="w-5 h-5 text-primary-500" />
            </div>
            <span className="font-bold text-lg hidden sm:block">
              Feza Code Club
            </span>
          </Link>

          {/* Desktop Navigation - Scrollable if needed */}
          <div className="hidden lg:flex items-center space-x-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-2 rounded-lg hover:bg-primary-600 transition flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            ))}

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-primary-400">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="bg-secondary-500 text-primary-500 px-4 py-2 rounded-lg hover:bg-secondary-600 transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                ) : (
                  <Link
                    to="/student/dashboard"
                    className="bg-white text-primary-500 px-4 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-primary-400">
                <Link
                  to="/student/login"
                  className="hover:bg-primary-600 px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/student/request"
                  className="bg-secondary-500 text-primary-500 px-4 py-2 rounded-lg hover:bg-secondary-600 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  <span>Join</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-primary-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-primary-400">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-primary-600 transition rounded-lg mb-1"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            
            <div className="mt-4 pt-4 border-t border-primary-400">
              {user ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-secondary-500 text-primary-500 rounded-lg mb-2"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      to="/student/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-white text-primary-500 rounded-lg mb-2"
                    >
                      <UserIcon className="w-5 h-5" />
                      <span>Student Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 text-white rounded-lg"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/student/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-white text-primary-500 rounded-lg"
                  >
                    <UserIcon className="w-5 h-5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/student/request"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-secondary-500 text-primary-500 rounded-lg"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Join Club</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
