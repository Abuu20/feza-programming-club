import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FaCheck, FaTimes, FaEye, FaEnvelope, FaUserPlus, FaFilter } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminStudentApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filter, setFilter] = useState('pending');

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

  const handleApprove = async (request) => {
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: request.email,
        password: generateTemporaryPassword(),
        email_confirm: true,
        user_metadata: {
          full_name: request.full_name,
          school: request.school,
          grade: request.grade,
          phone: request.phone,
          role: 'student'
        }
      });

      if (authError) throw authError;

      // Create student profile
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert([{
          user_id: authData.user.id,
          full_name: request.full_name,
          email: request.email,
          school: request.school,
          grade: request.grade,
          phone: request.phone,
          status: 'approved',
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date(),
          notes: adminNotes
        }]);

      if (profileError) throw profileError;

      // Update request status
      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({ 
          status: 'approved',
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date(),
          admin_notes: adminNotes
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Add to members table
      await supabase
        .from('members')
        .insert([{
          name: request.full_name,
          email: request.email,
          school: request.school,
          grade: request.grade,
          phone: request.phone,
          role: 'Student',
          bio: `Joined on ${new Date().toLocaleDateString()}`,
          status: 'active'
        }]);

      toast.success(`Student ${request.full_name} approved!`);
      
      // Send email with credentials (implement via edge function)
      await sendApprovalEmail(request.email, authData.user.email);

      fetchRequests();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      toast.error(error.message || 'Failed to approve student');
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
      
      // Send rejection email
      await sendRejectionEmail(request.email, adminNotes);
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const generateTemporaryPassword = () => {
    return Math.random().toString(36).slice(-8) + 'Aa1!';
  };

  const sendApprovalEmail = async (email, credentials) => {
    // Implement via Supabase Edge Function
    console.log(`Approval email sent to ${email}`);
  };

  const sendRejectionEmail = async (email, reason) => {
    // Implement via Supabase Edge Function
    console.log(`Rejection email sent to ${email}: ${reason}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                        {new Date(request.created_at).toLocaleDateString()}
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
                <h2 className="text-xl font-bold">Request Details</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs text-gray-500">Full Name</label>
                  <p className="font-medium">{selectedRequest.full_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="font-medium">{selectedRequest.email}</p>
                </div>
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
                {selectedRequest.phone && (
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs text-gray-500">Phone</label>
                    <p className="font-medium">{selectedRequest.phone}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700">Reason for Joining</label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg">{selectedRequest.reason}</p>
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

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <FaCheck />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <FaTimes />
                    Reject
                  </button>
                </div>
              )}

              {selectedRequest.admin_notes && (
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
    </div>
  );
};

export default AdminStudentApprovals;
