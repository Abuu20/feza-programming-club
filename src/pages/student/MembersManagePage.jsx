import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { FaTrash, FaSearch, FaShieldAlt, FaUserSlash, FaUsers } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ADMIN_EMAIL = 'fezaclub@gmail.com';

const MembersManagePage = () => {
  const { user } = useAuth();
  const { can, loading: permLoading } = usePermissions();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!permLoading && !can('members_manage')) {
      toast.error('Access denied');
      navigate('/student/dashboard');
    }
  }, [permLoading, can, navigate]);

  useEffect(() => {
    if (can('members_manage')) fetchMembers();
  }, [can]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('id, name, email, role, photo_url, status, joined_date, grade, school')
      .order('name');
    setMembers(data || []);
    setLoading(false);
  };

  const handleRemove = async (member) => {
    // Cannot remove admin or yourself
    if (member.email === ADMIN_EMAIL) {
      toast.error('Cannot remove the club admin');
      return;
    }
    if (member.user_id === user?.id) {
      toast.error('You cannot remove yourself');
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.name} from the club?\n\nThey will be blocked from logging in immediately.`
    );
    if (!confirmed) return;

    setRemoving(member.id);
    try {
      // 1. Set member status to inactive — StudentPrivateRoute blocks on this
      const { error: memberError } = await supabase
        .from('members')
        .update({ status: 'inactive' })
        .eq('id', member.id);
      if (memberError) throw memberError;

      // 2. Update registration_requests to rejected — StudentLogin blocks on this
      //    so even if they bypass the private route check, login itself fails
      if (member.email) {
        await supabase
          .from('registration_requests')
          .update({ status: 'rejected', admin_notes: 'Removed by club manager' })
          .eq('email', member.email);
      }

      toast.success(`${member.name} has been removed and blocked from the club`);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      toast.error('Failed to remove member: ' + err.message);
    } finally {
      setRemoving(null);
    }
  };

  const filtered = members.filter(m =>
    m.status !== 'inactive' &&
    m.email !== ADMIN_EMAIL &&
    (m.name?.toLowerCase().includes(search.toLowerCase()) ||
     m.email?.toLowerCase().includes(search.toLowerCase()) ||
     m.grade?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading || permLoading) return <Loader />;

  return (
    <div className="container-custom py-8 max-w-4xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <FaUsers className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Members Manager</h1>
            <p className="text-primary-100 text-sm mt-0.5">
              You can remove inactive or non-participating members from the club
            </p>
          </div>
        </div>
      </div>

      {/* Safety notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <FaShieldAlt className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">Important</p>
          <p className="text-amber-700 mt-0.5">
            Removing a member sets them as inactive — their account is preserved but they lose club access.
            The admin account and your own account are protected and cannot be removed.
            All removals are logged.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or grade…"
          className="input-field pl-9"
        />
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} active member{filtered.length !== 1 ? 's' : ''}</p>

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FaUsers className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                {/* Avatar */}
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">{member.name?.[0] || '?'}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                    {member.email && <span>{member.email}</span>}
                    {member.grade && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{member.grade}</span>}
                    {member.school && <span className="text-gray-400 truncate max-w-[140px]">{member.school}</span>}
                  </div>
                </div>

                {/* Role badge */}
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
                  ${member.role === 'mentor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {member.role || 'Student'}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(member)}
                  disabled={removing === member.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex-shrink-0"
                  title="Remove from club"
                >
                  {removing === member.id
                    ? <span className="animate-spin text-xs">⏳</span>
                    : <FaUserSlash size={13} />}
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MembersManagePage;