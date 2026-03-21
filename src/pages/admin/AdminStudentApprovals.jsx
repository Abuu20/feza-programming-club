import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FaCheck, FaTimes, FaEnvelope, FaUserPlus, FaFilter, FaSpinner, FaCopy } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminStudentApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [tempCredentials, setTempCredentials] = useState({ email: '', password: '' });

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    let query = supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to fetch requests');
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const generateWelcomeEmail = (email, name, password) => {
    const subject = encodeURIComponent('Welcome to Feza Programming Club - Your Account Details');
    const body = encodeURIComponent(`
Hello ${name},

Congratulations! Your membership request for Feza Programming Club has been approved.

Here are your login credentials:

Email: ${email}
Password: ${password}

IMPORTANT: Please change your password after first login for security.

Login here: ${window.location.origin}/student/login

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

  const handleApprove = async (request) => {
    setProcessing(true);
    const defaultPassword = 'TempPass123!';

    try {
      // Step 1: Create auth user via secure backend API
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          password: defaultPassword,
          full_name: request.full_name
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      const authUser = result.user;

      // Step 2: Add to members table with user_id
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: authUser.id,
          name: request.full_name,
          email: request.email,
          school: request.school,
          grade: request.grade,
          phone: request.phone,
          role: 'Member',
          bio: request.reason,
          status: 'active',
          joined_date: new Date()
        });

      if (memberError) throw memberError;

      // Step 3: Update registration request status
      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({
          status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date(),
          admin_notes: adminNotes || `Approved. Default password: ${defaultPassword}`
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Step 4: Show credentials for copying
      setTempCredentials({ email: request.email, password: defaultPassword });
      setShowCredentials(true);

      // Step 5: Open email client with pre-filled welcome message
      const mailtoLink = generateWelcomeEmail(request.email, request.full_name, defaultPassword);
      window.open(mailtoLink);

      toast.success(`Student ${request.full_name} approved! Email client opened.`);
      fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve student');
    } finally {
      setProcessing(false);
    }
  };

  const handleResendCredentials = async (request) => {
    const defaultPassword = 'TempPass123!';
    
    try {
      // Open email client with credentials
      const mailtoLink = generateWelcomeEmail(request.email, request.full_name, defaultPassword);
      window.open(mailtoLink);
      toast.success(`Credentials resent to ${request.full_name}`);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend credentials');
    }
  };

  const handleSendPasswordReset = async (request) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${request.full_name}`);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to send reset email');
    }
  };

  const handleReject = async (request) => {
    try {
      const { error } = await supabase
        .from('registration_requests')
        .update({
          status: 'rejected',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date(),
          admin_notes: adminNotes
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success(`Request rejected`);
      fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Student Registration Requests</h1>
          <p className="text-gray-600">Review and approve student registrations</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Requests</div>
          <div className="text-2xl font-bold">{requests.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-700">
            {requests.filter(r => r.status === 'pending').length}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <div className="text-sm text-green-600">Approved</div>
          <div className="text-2xl font-bold text-green-700">
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <p className="text-xs text-green-500 mt-1">Auth accounts created</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <div className="text-sm text-red-600">Rejected</div>
          <div className="text-2xl font-bold text-red-700">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedRequest?.id === request.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{request.full_name}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  {request.school && (
                    <p className="text-xs text-gray-500 mt-2">{request.school}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No requests found
              </div>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          {selectedRequest ? (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRequest.full_name}</h2>
                  <p className="text-gray-600">Applied on {new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="font-medium break-all">{selectedRequest.email}</p>
                </div>
                {selectedRequest.phone && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Phone</label>
                    <p className="font-medium">{selectedRequest.phone}</p>
                  </div>
                )}
                {selectedRequest.school && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">School</label>
                    <p className="font-medium">{selectedRequest.school}</p>
                  </div>
                )}
                {selectedRequest.grade && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Grade</label>
                    <p className="font-medium">{selectedRequest.grade}</p>
                  </div>
                )}
                {selectedRequest.age && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Age</label>
                    <p className="font-medium">{selectedRequest.age}</p>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs text-gray-500">Experience Level</label>
                  <p className="font-medium capitalize">{selectedRequest.experience_level}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700">Why they want to join</label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={processing}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Approve & Create Account
                      </>
                    )}
                  </button>
                )}
                
                {selectedRequest.status === 'approved' && (
                  <>
                    <button
                      onClick={() => handleResendCredentials(selectedRequest)}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                    >
                      <FaEnvelope />
                      Resend Credentials
                    </button>
                    <button
                      onClick={() => handleSendPasswordReset(selectedRequest)}
                      className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                    >
                      <FaEnvelope />
                      Send Reset Link
                    </button>
                  </>
                )}
                
                {selectedRequest.status === 'pending' && (
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <FaTimes />
                    Reject
                  </button>
                )}
              </div>

              {selectedRequest.status === 'approved' && selectedRequest.admin_notes && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ Account created! Default password: <strong>TempPass123!</strong>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Student can login and change password. Use "Resend Credentials" if needed.
                  </p>
                </div>
              )}

              {selectedRequest.admin_notes && selectedRequest.status !== 'pending' && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Previous Notes:</strong> {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FaUserPlus className="text-5xl mx-auto mb-4 text-gray-400" />
              <p>Select a request to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Student Account Created</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-medium">Email:</p>
              <p className="text-sm mb-2">{tempCredentials.email}</p>
              <p className="text-sm font-medium">Default Password:</p>
              <p className="text-sm font-mono bg-gray-200 p-1 rounded">{tempCredentials.password}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(`${tempCredentials.email}\n${tempCredentials.password}`)}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <FaCopy />
                Copy Credentials
              </button>
              <button
                onClick={() => setShowCredentials(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentApprovals;
