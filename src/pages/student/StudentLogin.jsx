import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaLock, FaCode } from 'react-icons/fa';
import toast from 'react-hot-toast';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const urlError = new URLSearchParams(location.search).get('error');
  const errorMessages = {
    pending:  'Your account is still pending admin approval. Please wait.',
    rejected: 'Your registration was not approved. Contact the club admin.',
    inactive: 'Your membership has been deactivated. Contact the club admin.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ── Step 1: Check approval BEFORE creating a session ─────────────
      const { data: request } = await supabase
        .from('registration_requests')
        .select('status')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (request) {
        if (request.status === 'pending') {
          toast.error(
            'Your account is pending admin approval. You will be notified once approved.',
            { duration: 6000 }
          );
          setLoading(false);
          return;
        }
        if (request.status === 'rejected') {
          toast.error(
            'Your registration was not approved. Please contact the club admin.',
            { duration: 6000 }
          );
          setLoading(false);
          return;
        }
      }

      // ── Step 2: Sign in ───────────────────────────────────────────────
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      // ── Step 3: Check if member was deactivated (removed by manager) ──
      const { data: member } = await supabase
        .from('members')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (member && member.status === 'inactive') {
        await supabase.auth.signOut();
        toast.error(
          'Your membership has been deactivated. Please contact the club admin.',
          { duration: 6000 }
        );
        setLoading(false);
        return;
      }

      toast.success('Welcome back! 🎉');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCode className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Student Login</h2>
          <p className="text-gray-600 mt-2">Access your coding challenges and track your progress</p>
        </div>

        {urlError && errorMessages[urlError] && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            🔒 {errorMessages[urlError]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required className="input-field pl-10" placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required className="input-field pl-10" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? 'Checking approval...' : 'Sign in'}
          </button>

          <div className="text-center space-y-2">
            <div>
              <Link to="/student/request" className="text-primary-600 hover:text-primary-500 text-sm">
                Don't have an account? Request to join
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;