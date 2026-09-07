import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FaEnvelope } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  const SUPABASE_URL = 'https://fzurwgdbzawswtnjsgwe.supabase.co';
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXJ3Z2RiemF3c3d0bmpzZ3dlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU4NTY1MiwiZXhwIjoyMDg5MTYxNjUyfQ.G7uuuBrLxQRw80zmBi16ZKKd4aJDi60agsxqNdnplFE';

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      toast.error('No reset token found');
      navigate('/student/login');
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('email, expires_at, used')
        .eq('token', token)
        .single();

      if (error) {
        console.error('Token error:', error);
        toast.error('Invalid reset link');
        navigate('/student/login');
        return;
      }

      if (data.used) {
        toast.error('This link has already been used');
        navigate('/student/login');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error('This link has expired');
        navigate('/student/login');
        return;
      }

      setEmail(data.email);
      setValidToken(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Invalid reset link');
      navigate('/student/login');
    }
  };

  const sendResetEmail = async () => {
    setLoading(true);
    try {
      // First, get the user ID from email
      const { data: userData, error: userError } = await supabase
        .from('members')
        .select('user_id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Send password reset using admin API with service role key
      const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.user_id}/reset_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }

      // Mark token as used
      await supabase
        .from('password_reset_requests')
        .update({ used: true })
        .eq('token', token);

      toast.success('Password reset email sent! Check your inbox/spam folder.');
      setTimeout(() => navigate('/student/login'), 3000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
          <p>Please request a new password reset link from the admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-primary-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          <p className="text-gray-600 mb-6">
            Click the button below to receive a password reset email for <strong>{email}</strong>
          </p>
          
          <button
            onClick={sendResetEmail}
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
