import React, { useState, useEffect } from 'react';
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
  FaCopy,
  FaSpinner,
  FaKey
} from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminMembershipApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [resetLink, setResetLink] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateResetLink = async (email) => {
    try {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store token in database
      const { error: tokenError } = await supabase
        .from('password_reset_requests')
        .insert({
          email: email,
          token: token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

      if (tokenError) throw tokenError;

      // Create reset link
      const link = `${window.location.origin}/reset-password?token=${token}`;
      return link;
    } catch (error) {
      console.error('Error generating link:', error);
      return null;
    }
  };

  const generateWelcomeEmail = (email, name, resetLink) => {
    const subject = encodeURIComponent('Welcome to Feza Programming Club - Complete Your Registration');
    const body = encodeURIComponent(`
Hello ${name},

Congratulations! Your membership request for Feza Programming Club has been approved.

Click the link below to set up your password and complete your registration:

${resetLink}

This link will expire in 24 hours.

Once you set up your password, you can log in at:
${window.location.origin}/student/login

We're excited to have you join our coding community! 🚀

Best regards,
Feza Programming Club Team
    `);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleStatusUpdate = async (id, status) => {
    // Rejection — just update the status in the table, no auth account needed
    if (status === 'rejected') {
      try {
        const { error } = await supabase
          .from('registration_requests')
          .update({
            status: 'rejected',
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Application rejected');
        fetchApplications();
        setSelectedApp(null);
        setAdminNotes('');
      } catch (error) {
        toast.error('Failed to update status');
        console.error('Update error:', error);
      }
      return;
    }

    // Approval — the auth account was already created when the student submitted
    // the registration form. Just mark the request as approved so they can log in.
    if (status === 'approved') {
      try {
        const { error } = await supabase
          .from('registration_requests')
          .update({
            status: 'approved',
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) throw error;
        toast.success(`✅ ${selectedApp.full_name} approved! They can now log in.`);
        fetchApplications();
        setSelectedApp(null);
        setAdminNotes('');
      } catch (error) {
        toast.error(error.message || 'Failed to approve');
        console.error('Approve error:', error);
      }
    }
  };

  const handleGenerateResetLink = async (app) => {
    setGeneratingLink(true);
    try {
      const link = await generateResetLink(app.email);
      if (link) {
        setResetLink(link);
        setShowLinkModal(true);
      } else {
        toast.error('Failed to generate reset link');
      }
    } catch (error) {
      toast.error('Failed to generate reset link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSendSetupEmail = async (app) => {
    setSendingEmail(true);
    try {
      const link = await generateResetLink(app.email);
      if (link) {
        const mailtoLink = generateWelcomeEmail(app.email, app.full_name, link);
        window.open(mailtoLink);
        toast.success(`Setup email opened for ${app.full_name}`);
      } else {
        toast.error('Failed to generate reset link');
      }
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
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
          <h1 className="text-2xl font-bold">Membership Applications</h1>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Applications</div>
          <div className="text-2xl font-bold">{applications.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">
            {applications.filter(a => a.status === 'pending').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Approved</div>
          <div className="text-2xl font-bold text-green-700">
            {applications.filter(a => a.status === 'approved').length}
          </div>
          <p className="text-xs text-green-500 mt-1">Send setup link</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
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
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedApp?.id === app.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  }`}
                >
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
                    {app.school && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {app.school}
                      </span>
                    )}
                    {app.grade && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {app.grade}
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

              <div className="grid grid-cols-2 gap-4 mb-6">
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
                  <label className="text-xs text-gray-500 uppercase">Why they want to join</label>
                  <p className="mt-2 whitespace-pre-wrap">{selectedApp.reason}</p>
                </div>
              </div>

              {selectedApp.status === 'approved' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-1">
                    <FaUserCheck />
                    <span className="font-medium">Account created in auth.users + members table.</span>
                  </div>
                  <p className="text-sm text-green-600">
                    A password setup email was sent automatically. If the student didn't receive it,
                    use "Resend Setup Email" below.
                  </p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="input-field"
                  rows="3"
                />
              </div>

              {selectedApp.admin_notes && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                  <label className="text-xs text-gray-500 uppercase">Previous Notes</label>
                  <p className="mt-2">{selectedApp.admin_notes}</p>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {selectedApp.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                      disabled={sendingEmail}
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {sendingEmail ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                      {sendingEmail ? 'Creating account...' : 'Approve & Create Account'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </>
                )}
                
                {selectedApp.status === 'approved' && (
                  <button
                    onClick={() => handleSendSetupEmail(selectedApp)}
                    disabled={sendingEmail}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    {sendingEmail ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                    Resend Setup Email
                  </button>
                )}
                
                <a
                  href={`mailto:${selectedApp.email}`}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <FaEnvelope />
                  Compose Email
                </a>
              </div>

              {selectedApp.status === 'approved' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>What happened automatically:</strong>
                  </p>
                  <ol className="text-sm text-blue-600 mt-2 list-decimal list-inside space-y-1">
                    <li>Auth account created in Supabase (auth.users)</li>
                    <li>Profile added to the members table</li>
                    <li>Password setup email sent to the student</li>
                    <li>Student clicks the link → sets their password → can login</li>
                  </ol>
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

      {/* Reset Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Password Setup Link</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">Share this link with the student:</p>
              <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border">{resetLink}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(resetLink)}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <FaCopy />
                Copy Link
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Link expires in 24 hours.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembershipApplications;