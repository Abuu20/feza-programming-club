import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaUsers, 
  FaImages, 
  FaEnvelope,
  FaUserPlus,
  FaClipboardList,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle
} from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import { membershipService } from '../../services/membership';
import { formatDate } from '../../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activities: 0,
    members: 0,
    gallery: 0,
    messages: 0,
    applications: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentData();
  }, []);

  const fetchStats = async () => {
    try {
      const [activities, members, gallery, messages, applications] = await Promise.all([
        supabase.from('activities').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('gallery').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        membershipService.getAllApplications()
      ]);

      const apps = applications.data || [];
      
      setStats({
        activities: activities.count || 0,
        members: members.count || 0,
        gallery: gallery.count || 0,
        messages: messages.count || 0,
        applications: {
          total: apps.length,
          pending: apps.filter(a => a.status === 'pending').length,
          approved: apps.filter(a => a.status === 'approved').length,
          rejected: apps.filter(a => a.status === 'rejected').length
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentData = async () => {
    try {
      // Get recent applications
      const { data: apps } = await membershipService.getAllApplications();
      setRecentApplications(apps?.slice(0, 5) || []);

      // Get recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentMessages(messages || []);
    } catch (error) {
      console.error('Error fetching recent data:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejected</span>;
      default:
        return null;
    }
  };

  const statCards = [
    { 
      title: 'Activities', 
      value: stats.activities, 
      icon: FaCalendarAlt, 
      color: 'bg-blue-500', 
      link: '/admin/activities' 
    },
    { 
      title: 'Members', 
      value: stats.members, 
      icon: FaUsers, 
      color: 'bg-green-500', 
      link: '/admin/members' 
    },
    { 
      title: 'Applications', 
      value: stats.applications.total, 
      icon: FaClipboardList, 
      color: 'bg-purple-500', 
      link: '/admin/applications',
      subStats: [
        { label: 'Pending', value: stats.applications.pending, icon: FaHourglassHalf, color: 'text-yellow-600' },
        { label: 'Approved', value: stats.applications.approved, icon: FaCheckCircle, color: 'text-green-600' },
        { label: 'Rejected', value: stats.applications.rejected, icon: FaTimesCircle, color: 'text-red-600' }
      ]
    },
    { 
      title: 'Gallery Images', 
      value: stats.gallery, 
      icon: FaImages, 
      color: 'bg-purple-500', 
      link: '/admin/gallery' 
    },
    { 
      title: 'Messages', 
      value: stats.messages, 
      icon: FaEnvelope, 
      color: 'bg-yellow-500', 
      link: '/admin/messages' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg text-white`}>
                <card.icon className="text-2xl" />
              </div>
              <span className="text-3xl font-bold">{card.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{card.title}</h3>
            
            {card.subStats && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                {card.subStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className={`mx-auto mb-1 ${stat.color}`} />
                    <div className="font-semibold">{stat.value}</div>
                    <div className="text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaUserPlus className="text-primary-600" />
              Recent Membership Applications
            </h2>
            <Link 
              to="/admin/applications" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentApplications.length > 0 ? (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/admin/applications`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div>
                    <div className="font-medium">{app.full_name}</div>
                    <div className="text-sm text-gray-500">{app.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {formatDate(app.created_at)}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent applications</p>
          )}
        </div>
        
        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FaEnvelope className="text-primary-600" />
              Recent Messages
            </h2>
            <Link 
              to="/admin/messages" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <Link
                  key={msg.id}
                  to="/admin/messages"
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                >
                  <div>
                    <div className="font-medium">{msg.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {msg.message.substring(0, 50)}...
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(msg.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent messages</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/applications?filter=pending"
            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition"
          >
            <FaHourglassHalf className="text-yellow-600 text-2xl" />
            <div>
              <div className="font-semibold">Review Applications</div>
              <div className="text-sm text-gray-600">{stats.applications.pending} pending</div>
            </div>
          </Link>
          
          <Link
            to="/admin/activities/new"
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <FaCalendarAlt className="text-blue-600 text-2xl" />
            <div>
              <div className="font-semibold">Create Activity</div>
              <div className="text-sm text-gray-600">Add new event</div>
            </div>
          </Link>
          
          <Link
            to="/admin/members/new"
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
          >
            <FaUsers className="text-green-600 text-2xl" />
            <div>
              <div className="font-semibold">Add Member</div>
              <div className="text-sm text-gray-600">New club member</div>
            </div>
          </Link>
          
          <Link
            to="/admin/messages"
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            <FaEnvelope className="text-purple-600 text-2xl" />
            <div>
              <div className="font-semibold">Check Messages</div>
              <div className="text-sm text-gray-600">{stats.messages} unread</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
