import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaLock, FaEye, FaEyeSlash, FaTimes, FaKey, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      setVerifying(false);
    }
  }, [searchParams]);

  const verifyToken = async (token) => {
    setVerifying(true);
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('email, expires_at, used, user_id')
        .eq('token', token)
        .single();

      if (error || !data) {
        setValidToken(false);
        setVerifying(false);
        return;
      }

      if (data.used) {
        toast.error('This link has already been used');
        setValidToken(false);
        setVerifying(false);
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        toast.error('This link has expired. Please request a new one.');
        setValidToken(false);
        setVerifying(false);
        return;
      }

      setEmail(data.email);
      setUserId(data.user_id);
      console.log('Verified token for user:', { email: data.email, user_id: data.user_id });
      setValidToken(true);
      setVerifying(false);
    } catch (error) {
      console.error('Token verification error:', error);
      setValidToken(false);
      setVerifying(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    
    console.log('Form submitted', { password: password ? '***' : 'empty', confirmPassword: confirmPassword ? '***' : 'empty', userId });
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!userId) {
      toast.error('User ID not found. Please request a new reset link.');
      return;
    }

    setLoading(true);
    try {
      // Prepare the request body
      const requestBody = {
        user_id: userId,
        password: password
      };
      
      console.log('Sending request to edge function:', requestBody);
      
      // Call Supabase Edge Function with explicit fetch
      const response = await fetch('https://fzurwgdbzawswtnjsgwe.supabase.co/functions/v1/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXJ3Z2RiemF3c3d0bmpzZ3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODU2NTIsImV4cCI6MjA4OTE2MTY1Mn0.4pNkhF4Wl34qgL_j-qVUMHfIFyQoN-Z7kQhqO6GXj8g'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Edge function response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      // Mark token as used
      await supabase
        .from('password_reset_requests')
        .update({ used: true })
        .eq('token', token);

      toast.success('Password reset successfully! Please login with your new password.');
      setTimeout(() => {
        navigate('/student/login');
      }, 2000);
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaTimes className="text-red-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/student/login" className="btn-primary inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaKey className="text-green-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Password</h2>
          <p className="text-gray-600 mt-2">
            Enter your new password for <strong className="text-primary-600">{email}</strong>
          </p>
        </div>

        <form onSubmit={resetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field pl-10 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field pl-10 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Resetting...
              </div>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-center">
            <Link to="/student/login" className="text-primary-600 hover:text-primary-500 text-sm flex items-center justify-center gap-1">
              <FaArrowLeft className="text-xs" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
