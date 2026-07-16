import React, { useState, useEffect } from 'react';
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
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { FaBookOpen, FaTrophy, FaQuestionCircle } from 'react-icons/fa'; // added FaQuestionCircle
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  // Unread count logic (unchanged)
  useEffect(() => {
    const handleUnreadUpdate = (event) => {
      const total = event.detail?.total || 0;
      setChatUnread(total);
      try {
        sessionStorage.setItem('feza-chat-unread-total', total.toString());
      } catch (e) {}
    };

    window.addEventListener('feza-chat-unread', handleUnreadUpdate);

    const checkLocalStorageForUnread = () => {
      try {
        const savedCounts = localStorage.getItem('feza-unread-counts');
        if (savedCounts) {
          const counts = JSON.parse(savedCounts);
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          setChatUnread(total);
          sessionStorage.setItem('feza-chat-unread-total', total.toString());
        } else {
          const sessionTotal = sessionStorage.getItem('feza-chat-unread-total');
          if (sessionTotal) {
            setChatUnread(parseInt(sessionTotal, 10));
          }
        }
      } catch (e) {}
    };

    checkLocalStorageForUnread();

    const handleStorageChange = (e) => {
      if (e.key === 'feza-unread-counts') {
        checkLocalStorageForUnread();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const intervalId = setInterval(checkLocalStorageForUnread, 2000);

    return () => {
      window.removeEventListener('feza-chat-unread', handleUnreadUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

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
    { path: '/curriculum', icon: FaBookOpen, label: 'Curriculum' },
    { path: '/achievements', icon: FaTrophy, label: 'Hall of Fame' },
    { path: '/quiz', icon: FaQuestionCircle, label: 'Quiz' }, // fixed: added icon
  ];

  return (
    <nav className="bg-primary-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="bg-secondary-500 p-2 rounded-lg transform group-hover:rotate-12 transition">
              <CodeBracketIcon className="w-5 h-5 text-primary-500" />
            </div>
            <span className="font-bold text-lg hidden sm:block">
              Feza Code Club
            </span>
          </Link>

          {/* Desktop Navigation – Animated Boxed Panel */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="relative group">
              {/* Main "Explore" Button */}
              <button className="px-4 py-2 rounded-lg hover:bg-primary-600 transition flex items-center gap-2 text-sm font-medium">
                <span className="relative inline-flex">
                  <Bars3Icon className="w-5 h-5" />
                  {chatUnread > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md ring-2 ring-primary-500">
                      {chatUnread > 99 ? '99+' : chatUnread}
                    </span>
                  )}
                </span>
                <span>Explore</span>
              </button>

              {/* The boxed panel */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[900px] max-w-[95vw] 
                            bg-white/90 backdrop-blur-md text-gray-800 
                            rounded-2xl shadow-2xl border border-primary-200/60 
                            p-6 z-50 
                            transition-all duration-300 ease-out 
                            origin-top 
                            opacity-0 scale-95 invisible 
                            group-hover:opacity-100 group-hover:scale-100 group-hover:visible 
                            group-hover:transition-all group-hover:duration-300 group-hover:ease-out">
                
                {/* Decorative header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary-100">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-secondary-500 to-primary-500 rounded-full"></div>
                    <span className="font-bold text-primary-600 text-sm tracking-wide">
                      ✦ Explore Feza Code Club
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {navLinks.length + 1} pages
                  </span>
                </div>

                {/* 4‑column grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Chat link with badge */}
                  <Link
                    to="/chat"
                    onClick={() => {
                      setChatUnread(0);
                      try {
                        sessionStorage.setItem('feza-chat-unread-total', '0');
                      } catch (e) {}
                    }}
                    className="group/link flex items-center gap-3 px-3 py-3 rounded-xl 
                               bg-gray-50/50 hover:bg-primary-50 
                               transition-all duration-200 
                               hover:shadow-md hover:-translate-y-0.5 
                               border border-transparent hover:border-primary-200"
                  >
                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600 
                                    group-hover/link:bg-primary-200 group-hover/link:scale-110 
                                    transition-all duration-200">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm">Chat</span>
                    {chatUnread > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                        {chatUnread > 99 ? '99+' : chatUnread}
                      </span>
                    )}
                  </Link>

                  {/* All other nav links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="group/link flex items-center gap-3 px-3 py-3 rounded-xl 
                                 bg-gray-50/50 hover:bg-primary-50 
                                 transition-all duration-200 
                                 hover:shadow-md hover:-translate-y-0.5 
                                 border border-transparent hover:border-primary-200"
                    >
                      <div className="p-2 rounded-lg bg-primary-100 text-primary-600 
                                      group-hover/link:bg-primary-200 group-hover/link:scale-110 
                                      transition-all duration-200">
                        <link.icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
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
            <Link
              to="/chat"
              onClick={() => {
                setIsMenuOpen(false);
                setChatUnread(0);
                try {
                  sessionStorage.setItem('feza-chat-unread-total', '0');
                } catch (e) {}
              }}
              className="relative flex items-center gap-3 px-4 py-3 hover:bg-primary-600 transition rounded-lg mb-1"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              <span>Chat</span>
              {chatUnread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              )}
            </Link>
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