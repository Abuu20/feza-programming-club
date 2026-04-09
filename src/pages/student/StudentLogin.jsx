import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaLock, FaCode } from 'react-icons/fa';
import toast from 'react-hot-toast';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check registration request status BEFORE logging in
      const { data: request } = await supabase
        .from('registration_requests')
        .select('status')
        .eq('email', email)
        .maybeSingle();

      if (request && request.status === 'pending') {
        toast.error('Your account is pending admin approval. Please wait.');
        setLoading(false);
        return;
      }

      if (request && request.status === 'rejected') {
        toast.error('Your registration request was not approved. Contact the club admin.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast.success('Login successful!');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="input-field pl-10" placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="input-field pl-10" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link to="/student/request" className="text-primary-600 hover:text-primary-500 text-sm">
              Don't have an account? Request to join
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;