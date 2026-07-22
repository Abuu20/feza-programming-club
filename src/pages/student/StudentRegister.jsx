import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
  FaEnvelope, FaLock, FaUser, FaGraduationCap,
  FaSchool, FaPhone, FaCode, FaPaperPlane
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const StudentRegister = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    grade: '',
    phone: '',
    reason: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ── Validation ────────────────────────────────────────────────
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // ── Check for existing registration request ───────────────────
      const { data: existing } = await supabase
        .from('registration_requests')
        .select('id, status')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('You already have a pending request. Please wait for approval.');
        }
        if (existing.status === 'approved') {
          throw new Error('This email is already approved. Please login instead.');
        }
        if (existing.status === 'rejected') {
          throw new Error('Your previous request was rejected. Please contact the club admin.');
        }
      }

      // ── Check members table for duplicate email ───────────────────
      const { data: existingMember } = await supabase
        .from('members')
        .select('id, status')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingMember) {
        if (existingMember.status === 'active') {
          throw new Error('This email is already a club member. Please login instead.');
        }
        if (existingMember.status === 'inactive') {
          throw new Error('This email was removed from the club. Please contact the admin.');
        }
      }

      // ── Create auth account (pending until admin approves) ────────
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            school: formData.school,
            grade: formData.grade,
            phone: formData.phone,
            role: 'student',
          },
        },
      });

      if (authError) throw authError;

      // ── Add to members table as pending ──────────────────────────
      if (authData.user) {
        await supabase.from('members').insert([{
          user_id: authData.user.id,
          name: formData.fullName,
          email: formData.email.trim(),
          school: formData.school || null,
          grade: formData.grade || null,
          phone: formData.phone || null,
          role: 'Student',
          status: 'pending', // blocked until admin approves
          bio: `Joined Feza Programming Club on ${new Date().toLocaleDateString()}`,
          joined_date: new Date().toISOString(),
          display_order: 999,
        }]);
      }

      // ── Insert registration request for admin to review ───────────
      const { error: requestError } = await supabase
        .from('registration_requests')
        .insert([{
          full_name: formData.fullName,
          email: formData.email.trim(),
          school: formData.school,
          grade: formData.grade,
          phone: formData.phone,
          reason: formData.reason,
          status: 'pending',
        }]);

      if (requestError && requestError.code !== '23505') throw requestError;

      // ── Sign out immediately — they can't access until approved ──
      await supabase.auth.signOut();

      setSubmitted(true);
      toast.success('Request submitted! You can log in once an admin approves your account.');

    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPaperPlane className="text-green-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-3">
            Your account has been created and is <strong>pending admin approval</strong>.
            You will be able to log in once your request is reviewed.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            This usually takes 1–2 business days.
          </p>
          <Link to="/student/login"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-xl hover:bg-primary-700 transition font-semibold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCode className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Join the Club</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Create your account — you can log in once an admin approves your request.
          </p>
        </div>

        {/* Pending notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> All registrations require admin approval before you can access the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="fullName" value={formData.fullName}
                  onChange={handleChange} required
                  className="input-field pl-10" placeholder="John Doe" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-gray-400" />
                </div>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} required
                  className="input-field pl-10" placeholder="student@example.com" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-400" />
                </div>
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} required
                  className="input-field pl-10" placeholder="At least 6 characters" />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-gray-400" />
                </div>
                <input type="password" name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} required
                  className="input-field pl-10" placeholder="Repeat your password" />
              </div>
            </div>

            {/* School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSchool className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="school" value={formData.school}
                  onChange={handleChange}
                  className="input-field pl-10" placeholder="Your school name" />
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Class</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGraduationCap className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" name="grade" value={formData.grade}
                  onChange={handleChange}
                  className="input-field pl-10" placeholder="e.g. Form 3" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-4 w-4 text-gray-400" />
                </div>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange}
                  className="input-field pl-10" placeholder="+255 XXX XXX XXX" />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why do you want to join? *
              </label>
              <textarea name="reason" value={formData.reason}
                onChange={handleChange} required rows={3}
                className="input-field resize-none"
                placeholder="Tell us why you're interested in programming..." />
            </div>

          </div>

          <p className="text-xs text-gray-400">* Required fields</p>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
            {loading ? 'Submitting...' : 'Submit Registration Request'}
          </button>

          <div className="text-center">
            <Link to="/student/login"
              className="text-primary-600 hover:text-primary-500 font-medium text-sm">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentRegister;