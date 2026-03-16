import React, { useState, useEffect } from 'react';
import { membershipService } from '../../services/membership';
import { supabase } from '../../services/supabase';
import { 
  FaCheck, 
  FaTimes, 
  FaEnvelope, 
  FaFilter, 
  FaDownload,
  FaSync,
  FaUserCheck,
  FaUserTimes,
  FaEye,
  FaBell
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminMembershipApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  // Fetch all applications
  const fetchApplications = async () => {
    setRefreshing(true);
    const { data } = await membershipService.getAllApplications();
    setApplications(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchApplications();

    // Set up realtime subscription for this page
    console.log('📡 Setting up realtime subscription for applications page...');

    const applicationsChannel = supabase
      .channel('applications-page-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'membership_applications'
        },
        (payload) => {
          console.log('🔔 Applications page realtime event:', payload);
          
          // Update the applications list based on the event
          setApplications(currentApps => {
            let updatedApps;
            
            switch (payload.eventType) {
              case 'INSERT':
                // Add new application to the list
                updatedApps = [payload.new, ...currentApps];
                toast.success('New application received!', {
                  icon: '📝',
                  duration: 4000
                });
                break;
                
              case 'UPDATE':
                // Update the changed application
                updatedApps = currentApps.map(app => 
                  app.id === payload.new.id ? payload.new : app
                );
                
                // Show notification for status changes
                const oldStatus = payload.old?.status;
                const newStatus = payload.new?.status;
                if (oldStatus !== newStatus) {
                  toast.success(`Application ${newStatus}!`, {
                    icon: newStatus === 'approved' ? '✅' : newStatus === 'rejected' ? '❌' : '📝'
                  });
                  
                  // If the selected app was updated, update it
                  if (selectedApp?.id === payload.new.id) {
                    setSelectedApp(payload.new);
                  }
                }
                break;
                
              case 'DELETE':
                // Remove deleted application
                updatedApps = currentApps.filter(app => app.id !== payload.old.id);
                if (selectedApp?.id === payload.old.id) {
                  setSelectedApp(null);
                  setAdminNotes('');
                }
                toast.info('Application removed');
                break;
                
              default:
                updatedApps = currentApps;
            }
            
            return updatedApps;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Applications page channel status:', status);
        setRealtimeStatus(status);
        
        if (status === 'SUBSCRIBED') {
          toast.success('Live updates enabled', { icon: '🔔', duration: 2000 });
        } else if (status === 'CHANNEL_ERROR') {
          toast.error('Live updates failed - will poll manually');
        }
      });

    // Also listen for members changes (when approved members are added)
    const membersChannel = supabase
      .channel('members-page-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'members'
        },
        (payload) => {
          console.log('🔔 New member added from application:', payload);
          // You could refresh the applications list or show notification
          if (payload.new?.email) {
            // Find the application that was approved
            const approvedApp = applications.find(
              app => app.email === payload.new.email && app.status === 'approved'
            );
            
            if (approvedApp) {
              toast.success(`${approvedApp.full_name} is now a member!`, {
                icon: '🎉',
                duration: 5000
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up applications page subscriptions...');
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [selectedApp]); // Add selectedApp to dependency array for the UPDATE case

  const handleStatusUpdate = async (id, status) => {
    try {
      const { error } = await membershipService.updateStatus(id, status, adminNotes);
      if (error) throw error;
      
      // No need to manually fetch - realtime will update
      toast.success(`Application ${status} successfully!`);
      
      // Clear selection if application was approved/rejected
      if (status !== 'pending') {
        setSelectedApp(null);
        setAdminNotes('');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Update error:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceBadge = (level) => {
    const colors = {
      'none': 'bg-gray-100 text-gray-800',
      'beginner': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-purple-100 text-purple-800',
      'advanced': 'bg-orange-100 text-orange-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'School', 'Grade', 'Age', 'Experience', 'Status', 'Applied Date', 'Reason'];
    const csvData = applications.map(app => [
      app.full_name,
      app.email,
      app.phone || '',
      app.school || '',
      app.grade || '',
      app.age || '',
      app.experience_level,
      app.status,
      formatDate(app.created_at),
      app.reason?.replace(/,/g, ';') || ''
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membership-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export started');
  };

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Membership Applications</h1>
            {realtimeStatus === 'SUBSCRIBED' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
            {realtimeStatus === 'CHANNEL_ERROR' && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                Offline
              </span>
            )}
          </div>
          <p className="text-gray-600">Review and manage club membership requests</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchApplications}
            className="btn-secondary flex items-center gap-2"
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards with real-time updates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-sm text-gray-500">Total Applications</div>
          <div className="text-2xl font-bold">{applications.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow hover:shadow-md transition relative">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">
            {applications.filter(a => a.status === 'pending').length}
          </div>
          {applications.filter(a => a.status === 'pending').length > 0 && (
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></span>
          )}
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-sm text-green-600">Approved</div>
          <div className="text-2xl font-bold text-green-700">
            {applications.filter(a => a.status === 'approved').length}
          </div>
          <p className="text-xs text-green-500 mt-1">Auto-added to Members</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow hover:shadow-md transition">
          <div className="text-sm text-red-600">Rejected</div>
          <div className="text-2xl font-bold text-red-700">
            {applications.filter(a => a.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <FaFilter className="text-gray-400" />
          <span className="text-sm font-medium mr-2">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All ({applications.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Pending ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Approved ({applications.filter(a => a.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition relative ${
                    selectedApp?.id === app.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  }`}
                >
                  {app.status === 'pending' && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  )}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{app.full_name}</h3>
                      <p className="text-sm text-gray-600">{app.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(app.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs ${getExperienceBadge(app.experience_level)}`}>
                      {app.experience_level}
                    </span>
                    {app.school && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {app.school}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No applications found
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          {selectedApp ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedApp.full_name}</h2>
                  <p className="text-gray-600">Applied on {formatDate(selectedApp.created_at)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClass(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Contact Information</label>
                  <p className="font-medium mt-2">{selectedApp.email}</p>
                  {selectedApp.phone && <p className="text-gray-600">{selectedApp.phone}</p>}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Education</label>
                  {selectedApp.school && <p className="font-medium mt-2">{selectedApp.school}</p>}
                  {selectedApp.grade && <p className="text-gray-600">Grade: {selectedApp.grade}</p>}
                  {selectedApp.age && <p className="text-gray-600">Age: {selectedApp.age}</p>}
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Experience Level</label>
                  <p className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getExperienceBadge(selectedApp.experience_level)}`}>
                      {selectedApp.experience_level}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Why they want to join</label>
                  <p className="mt-2 whitespace-pre-wrap">{selectedApp.reason}</p>
                </div>
              </div>

              {selectedApp.status === 'approved' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <FaUserCheck />
                    <span className="font-medium">This applicant has been added to club members</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application (optional)..."
                  className="input-field"
                  rows="3"
                />
              </div>

              {selectedApp.admin_notes && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Previous Notes</label>
                  <p className="mt-2">{selectedApp.admin_notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                {selectedApp.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaCheck />
                      Approve & Add to Members
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </>
                )}
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FaEnvelope />
                  Send Email
                </a>
              </div>

              {selectedApp.status === 'approved' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <FaEye className="inline mr-2" />
                    This member has been added to the Members list. You can view them in the Members section.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FaUserCheck className="text-5xl mx-auto mb-4 text-gray-400" />
              <p>Select an application to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMembershipApplications;
