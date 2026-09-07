import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaKey, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Get the base URL (works for both localhost and production)
  const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://feza-programming-club.vercel.app'\;
    }
    return window.location.origin;
  };

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
        .select('email, expires_at, used')
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
      setValidToken(true);
      setVerifying(false);
    } catch (error) {
      console.error('Token verification error:', error);
      setValidToken(false);
      setVerifying(false);
    }
  };

  const sendResetEmail = async () => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      
      // Send password reset email via Supabase with correct redirect URL
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/update-password`,
      });

      if (error) throw error;

      // Mark token as used
      await supabase
        .from('password_reset_requests')
        .update({ used: true })
        .eq('token', token);

      setResetSent(true);
      toast.success('Password reset email sent! Check your inbox/spam folder.');
      setTimeout(() => navigate('/student/login'), 3000);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to send reset email');
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
            <FaKey className="text-red-600 text-3xl" />
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

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPaperPlane className="text-green-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
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
          <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="text-primary-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">
            Click the button below to receive a password reset email for <strong>{email}</strong>
          </p>
        </div>

        <button
          onClick={sendResetEmail}
          disabled={loading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Sending...
            </>
          ) : (
            <>
              <FaPaperPlane />
              Send Reset Email
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <Link to="/student/login" className="text-primary-600 hover:text-primary-500 text-sm flex items-center justify-center gap-1">
            <FaArrowLeft className="text-xs" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
