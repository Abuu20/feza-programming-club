import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaKey, FaSpinner, FaGithub, FaLinkedin, FaTwitter, FaGlobe } from 'react-icons/fa';
import { membersService } from '../../services/members';
import { supabase } from '../../services/supabase';
import Loader from '../../components/common/Loader';
import MemberForm from '../../components/members/MemberForm';
import toast from 'react-hot-toast';

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await membersService.getAll();
    setMembers(data || []);
    setLoading(false);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      const { error } = await membersService.delete(id);
      if (!error) {
        toast.success('Member deleted successfully');
        fetchMembers();
      }
    }
  };

  const handleResetPassword = async (member) => {
    if (!member.email) {
      toast.error('No email address found for this member');
      return;
    }

    setSendingEmail(member.id);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${member.name}! Check their inbox/spam folder.`);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
    fetchMembers();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Members</h1>
          <p className="text-gray-600">Add, edit, or remove club members</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <FaPlus />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{member.name?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    {member.github && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <FaGithub size={10} /> GitHub
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{member.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{member.role || 'Member'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={sendingEmail === member.id}
                        className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                        title="Send Password Reset Email"
                      >
                        {sendingEmail === member.id ? <FaSpinner className="animate-spin" /> : <FaKey size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-900 transition"
                        title="Edit Member"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900 transition"
                        title="Delete Member"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No members found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Add your first member
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <MemberForm
          member={editingMember}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default AdminMembers;
