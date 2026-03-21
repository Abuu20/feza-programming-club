import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { FaKey, FaCopy, FaEnvelope, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ResetLinkGenerator = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [showLink, setShowLink] = useState(false);

  const generateResetLink = async () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Store token in database
      const { error: tokenError } = await supabase
        .from('password_reset_requests')
        .insert({
          email: email,
          token: token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

      if (tokenError) throw tokenError;

      // Create reset link
      const link = `${window.location.origin}/reset-password?token=${token}`;
      setResetLink(link);
      setShowLink(true);
      toast.success('Reset link generated!');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate reset link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetLink);
    toast.success('Link copied to clipboard!');
  };

  const openEmailClient = () => {
    const subject = encodeURIComponent('Password Reset - Feza Programming Club');
    const body = encodeURIComponent(`
Hello,

Click the link below to reset your password:

${resetLink}

This link expires in 24 hours.

If you didn't request this, ignore this email.

Best regards,
Feza Programming Club
    `);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Password Reset Link Generator</h1>
        <p className="text-gray-600 mb-6">
          Use this tool to generate password reset links for students.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="student@email.com"
          />
        </div>

        <button
          onClick={generateResetLink}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaKey />}
          {loading ? 'Generating...' : 'Generate Reset Link'}
        </button>

        {showLink && resetLink && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Reset Link Generated:</h3>
            <p className="text-sm text-gray-600 break-all mb-3">{resetLink}</p>
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <FaCopy />
                Copy Link
              </button>
              <button
                onClick={openEmailClient}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaEnvelope />
                Send Email
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">Link expires in 24 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetLinkGenerator;
