import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { 
  FaTachometerAlt, 
  FaCalendarAlt, 
  FaUsers, 
  FaImages, 
  FaEnvelope,
  FaSignOutAlt,
  FaBars,
  FaBell,
  FaHome,
  FaSync,
  FaCode,
  FaTrophy,
  FaUserPlus,
  FaBullhorn
} from 'react-icons/fa';

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch pending applications count
  const fetchPendingCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('membership_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending count:', error);
        return;
      }

      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error in fetchPendingCount:', error);
    }
  }, []);

  // Fetch unread messages count
  const fetchUnreadMessages = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }

      setUnreadMessages(count || 0);
    } catch (error) {
      console.error('Error in fetchUnreadMessages:', error);
    }
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPendingCount(), fetchUnreadMessages()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    // Initial fetch
    fetchPendingCount();
    fetchUnreadMessages();

    // Subscribe to real-time changes for applications
    const applicationsSubscription = supabase
      .channel('applications-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'membership_applications' 
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    // Subscribe to real-time changes for messages
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      applicationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [fetchPendingCount, fetchUnreadMessages]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { 
      path: '/admin', 
      icon: FaTachometerAlt, 
      label: 'Dashboard',
      exact: true 
    },
    { 
      path: '/admin/announcements', 
      icon: FaBullhorn, 
      label: 'Announcements' 
    },
    { 
      path: '/admin/activities', 
      icon: FaCalendarAlt, 
      label: 'Activities' 
    },
    { 
      path: '/admin/challenges', 
      icon: FaTrophy, 
      label: 'Challenges' 
    },
    { 
      path: '/admin/members', 
      icon: FaUsers, 
      label: 'Members' 
    },
    { 
      path: '/admin/applications', 
      icon: FaUserPlus, 
      label: 'Applications',
      badge: pendingCount,
      badgeColor: 'bg-red-500'
    },
    { 
      path: '/admin/student-approvals', 
      icon: FaUserPlus, 
      label: 'Student Approvals' 
    },
    { 
      path: '/admin/gallery', 
      icon: FaImages, 
      label: 'Gallery' 
    },
    { 
      path: '/admin/messages', 
      icon: FaEnvelope, 
      label: 'Messages',
      badge: unreadMessages,
      badgeColor: 'bg-yellow-500'
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 relative flex flex-col`}
      >
        {/* Logo Area */}
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="bg-primary-600 p-2 rounded-lg">
              <FaCode className="text-white text-xl" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl">Admin Panel</span>
            )}
          </div>
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="Collapse sidebar"
            >
              <FaBars />
            </button>
          )}
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 hover:bg-gray-700 rounded-lg transition absolute -right-3 top-5 bg-gray-800 border border-gray-700"
              title="Expand sidebar"
            >
              <FaBars size={12} />
            </button>
          )}
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-lg font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const active = isActive(item.path, item.exact);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all relative group ${
                      active 
                        ? 'bg-primary-600 text-white shadow-lg' 
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <item.icon className={`text-xl ${active ? 'text-white' : 'text-gray-400'}`} />
                    
                    {sidebarOpen ? (
                      <>
                        <span className="ml-4 flex-1">{item.label}</span>
                        {item.badge > 0 && (
                          <span className={`${item.badgeColor} text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse`}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {item.badge > 0 && (
                          <span className={`absolute -top-1 -right-1 ${item.badgeColor} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse`}>
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                        {/* Tooltip */}
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                          {item.badge > 0 && ` (${item.badge})`}
                        </span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-700">
          <Link
            to="/"
            className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-700 text-gray-300 transition-all mb-2 ${
              !sidebarOpen && 'justify-center'
            }`}
            title="Visit Website"
          >
            <FaHome className="text-xl" />
            {sidebarOpen && <span className="ml-4">Visit Website</span>}
          </Link>
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all ${
              !sidebarOpen && 'justify-center'
            }`}
            title="Logout"
          >
            <FaSignOutAlt className="text-xl" />
            {sidebarOpen && <span className="ml-4">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* Notification Icons */}
            <div className="flex items-center gap-3">
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Refresh counts"
              >
                <FaSync className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Notification summary */}
              {(pendingCount > 0 || unreadMessages > 0) && (
                <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-lg">
                  <FaBell className="text-primary-600 animate-pulse" />
                  <span className="text-sm font-medium">
                    {pendingCount + unreadMessages} new
                  </span>
                </div>
              )}
              
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
