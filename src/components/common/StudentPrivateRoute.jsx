import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import Loader from './Loader';

// ── StudentPrivateRoute ───────────────────────────────────────────────────────
// Three-layer guard:
//   1. Must be logged in (has a Supabase session)
//   2. registration_requests status must be 'approved' (not pending/rejected)
//   3. members.status must be 'active' (not removed/deactivated)
//
// If any check fails the student is signed out and redirected to login.

const StudentPrivateRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | allowed | denied
  const [denyReason, setDenyReason] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus('denied');
      setDenyReason('not_logged_in');
      return;
    }

    const check = async () => {
      // Check 1: registration_requests approval
      const { data: request } = await supabase
        .from('registration_requests')
        .select('status')
        .eq('email', user.email)
        .maybeSingle();

      if (request && request.status === 'pending') {
        await supabase.auth.signOut();
        setDenyReason('pending');
        setStatus('denied');
        return;
      }

      if (request && request.status === 'rejected') {
        await supabase.auth.signOut();
        setDenyReason('rejected');
        setStatus('denied');
        return;
      }

      // Check 2: members table status (catches removed/deactivated members)
      const { data: member } = await supabase
        .from('members')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (member && member.status === 'inactive') {
        await supabase.auth.signOut();
        setDenyReason('inactive');
        setStatus('denied');
        return;
      }

      setStatus('allowed');
    };

    check();
  }, [user, authLoading]);

  if (authLoading || status === 'checking') return <Loader />;

  if (status === 'denied') {
    const messages = {
      not_logged_in: '',
      pending:  '?error=pending',
      rejected: '?error=rejected',
      inactive: '?error=inactive',
    };
    return <Navigate to={`/student/login${messages[denyReason] || ''}`} replace />;
  }

  return <Outlet />;
};

export default StudentPrivateRoute;