import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaKey, FaSpinner, FaShieldAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { membersService } from '../../services/members';
import { supabase } from '../../services/supabase';
import Loader from '../../components/common/Loader';
import MemberForm from '../../components/members/MemberForm';
import toast from 'react-hot-toast';

// ── All available permissions ─────────────────────────────────────────────────
// Add new ones here in the future and they'll appear automatically in the UI
const ALL_PERMISSIONS = [
  {
    key: 'gallery_upload',
    label: 'Gallery Manager',
    description: 'Can upload and delete images/videos in the Gallery',
    icon: '🖼️',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Can post and edit club announcements',
    icon: '📢',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    key: 'curriculum_edit',
    label: 'Curriculum Editor',
    description: 'Can create and edit curriculum lessons',
    icon: '📚',
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  {
    key: 'challenges_edit',
    label: 'Challenge Editor',
    description: 'Can create and manage coding challenges',
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
];

// ── Permission badge shown in the members table ───────────────────────────────
const PermissionBadge = ({ permKey }) => {
  const p = ALL_PERMISSIONS.find(p => p.key === permKey);
  if (!p) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${p.color}`}>
      {p.icon} {p.label}
    </span>
  );
};

// ── Permissions modal ─────────────────────────────────────────────────────────
const PermissionsModal = ({ member, onClose, onSaved }) => {
  const current = Array.isArray(member.permissions) ? member.permissions : [];
  const [selected, setSelected] = useState(new Set(current));
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('members')
      .update({ permissions: Array.from(selected) })
      .eq('id', member.id);

    if (error) {
      toast.error('Failed to save permissions');
      console.error(error);
    } else {
      toast.success(`Permissions updated for ${member.name}`);
      onSaved(member.id, Array.from(selected));
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            {member.photo_url ? (
              <img src={member.photo_url} alt={member.name}
                className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold">{member.name?.charAt(0)}</span>
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{member.name}</h3>
              <p className="text-xs text-gray-500">{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        {/* Permission toggles */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Toggle the permissions you want to grant to this member. They will take effect immediately after saving.
          </p>
          {ALL_PERMISSIONS.map(p => {
            const active = selected.has(p.key);
            return (
              <button key={p.key} onClick={() => toggle(p.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left
                  ${active ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                {/* Toggle dot */}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition
                  ${active ? 'bg-primary-600' : 'bg-gray-200'}`}>
                  {active && <FaCheck size={10} className="text-white" />}
                </div>
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${active ? 'text-primary-700' : 'text-gray-700'}`}>
                    {p.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50">
            {saving ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheck /> Save Permissions</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main AdminMembers ─────────────────────────────────────────────────────────
const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [permissionsMember, setPermissionsMember] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [search, setSearch] = useState('');

  const getBaseUrl = () =>
    process.env.NODE_ENV === 'production'
      ? 'https://feza-programming-club.vercel.app'
      : window.location.origin;

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('display_order', { ascending: true });
    setMembers(data || []);
    setLoading(false);
  };

  const handleEdit = (member) => { setEditingMember(member); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    const { error } = await membersService.delete(id);
    if (!error) { toast.success('Member deleted'); fetchMembers(); }
  };

  const handleResetPassword = async (member) => {
    if (!member.email) { toast.error('No email found for this member'); return; }
    setSendingEmail(member.id);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(member.email, {
        redirectTo: `${getBaseUrl()}/update-password`,
      });
      if (error) throw error;
      toast.success(`Password reset email sent to ${member.name}`);
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setSendingEmail(null);
    }
  };

  // Update permissions in local state after save (no full refetch needed)
  const handlePermissionsSaved = (memberId, newPerms) => {
    setMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, permissions: newPerms } : m
    ));
  };

  const handleCloseForm = () => { setShowForm(false); setEditingMember(null); fetchMembers(); };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Members</h1>
          <p className="text-gray-600">Add, edit, remove members and manage their permissions</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <FaPlus /> Add Member
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input-field max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((member) => {
                const perms = Array.isArray(member.permissions) ? member.permissions : [];
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {/* Member info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-bold text-sm">{member.name?.charAt(0) || '?'}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4 text-sm text-gray-500">{member.role || 'Member'}</td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                        {member.status || 'active'}
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="px-4 py-4">
                      {perms.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {perms.map(p => <PermissionBadge key={p} permKey={p} />)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No special permissions</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* Permissions */}
                        <button onClick={() => setPermissionsMember(member)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition"
                          title="Manage Permissions">
                          <FaShieldAlt size={15} />
                        </button>
                        {/* Reset password */}
                        <button onClick={() => handleResetPassword(member)}
                          disabled={sendingEmail === member.id}
                          className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded transition disabled:opacity-50"
                          title="Send Password Reset Email">
                          {sendingEmail === member.id
                            ? <FaSpinner className="animate-spin" size={15} />
                            : <FaKey size={15} />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => handleEdit(member)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition"
                          title="Edit Member">
                          <FaEdit size={15} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => handleDelete(member.id)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition"
                          title="Delete Member">
                          <FaTrash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{search ? 'No members match your search' : 'No members found'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700">
                Add your first member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Member form modal */}
      {showForm && (
        <MemberForm member={editingMember} onClose={handleCloseForm} />
      )}

      {/* Permissions modal */}
      {permissionsMember && (
        <PermissionsModal
          member={permissionsMember}
          onClose={() => setPermissionsMember(null)}
          onSaved={handlePermissionsSaved}
        />
      )}
    </div>
  );
};

export default AdminMembers;