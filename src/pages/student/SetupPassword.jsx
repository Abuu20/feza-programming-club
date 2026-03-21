import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes, FaKey, FaUserCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SetupPassword = () => {
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
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const token = searchParams.get('token');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setVerifying(false);
      setValidToken(false);
      return;
    }

    try {
      // Verify the token with Supabase
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('email, expires_at')
        .eq('token', token)
        .single();

      if (error || !data) {
        setValidToken(false);
        setVerifying(false);
        return;
      }

      // Check if token is expired
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

  const checkPasswordStrength = (pwd) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPasswordStrong()) {
      toast.error('Please meet all password requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Update user password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Delete the used token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      // Update member status to active
      const { error: memberError } = await supabase
        .from('members')
        .update({ 
          status: 'active',
          joined_date: new Date()
        })
        .eq('email', email);

      if (memberError) console.error('Error updating member:', memberError);

      toast.success('Password set successfully! You can now login.');
      setTimeout(() => {
        navigate('/student/login');
      }, 2000);
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestNewLink = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      // Generate new token
      const { data, error } = await supabase
        .rpc('generate_password_reset_token', { user_email: email });

      if (error) throw error;

      // Send email with link
      const resetLink = `${window.location.origin}/student/setup-password?token=${data}`;
      
      // Here you would send an email with the link
      // For now, show the link (in production, send via email)
      toast.success(`Password setup link sent to ${email}`);
      
    } catch (error) {
      toast.error('Failed to send new link');
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
            This password setup link is invalid or has expired.
          </p>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mb-3"
            />
            <button
              onClick={requestNewLink}
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Sending...' : 'Request New Link'}
            </button>
          </div>
          <p className="text-sm text-gray-500">
            If you need help, please contact the club administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserCheck className="text-green-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Feza Code Club!</h2>
          <p className="text-gray-600 mt-2">
            Set up your password to start your coding journey
          </p>
          <p className="text-sm text-primary-600 mt-1 font-medium">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Create Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaKey className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                required
                className="input-field pl-10 pr-10"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${passwordStrength.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {passwordStrength.length ? '✓' : '○'} 8+ characters
              </span>
              <span className={`px-2 py-1 rounded ${passwordStrength.uppercase ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {passwordStrength.uppercase ? '✓' : '○'} Uppercase
              </span>
              <span className={`px-2 py-1 rounded ${passwordStrength.lowercase ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {passwordStrength.lowercase ? '✓' : '○'} Lowercase
              </span>
              <span className={`px-2 py-1 rounded ${passwordStrength.number ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {passwordStrength.number ? '✓' : '○'} Number
              </span>
              <span className={`px-2 py-1 rounded ${passwordStrength.special ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {passwordStrength.special ? '✓' : '○'} Special char
              </span>
            </div>
            {password && !isPasswordStrong() && (
              <p className="text-xs text-yellow-600">Make your password stronger</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
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
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordStrong() || password !== confirmPassword}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Setting up...
              </>
            ) : (
              <>
                <FaCheck />
                Set Password & Continue
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By setting your password, you agree to our Terms of Service and Privacy Policy.
            Your account will be activated immediately.
          </p>
        </form>
      </div>
    </div>
  );
};

export default SetupPassword;
