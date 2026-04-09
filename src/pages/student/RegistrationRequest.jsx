import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaUser, FaGraduationCap, FaSchool, FaPhone, FaCode, FaLock, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

const RegistrationRequest = () => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // 1. Check if a pending/approved request already exists for this email
      const { data: existing } = await supabase
        .from('registration_requests')
        .select('id, status')
        .eq('email', formData.email)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('You already have a pending request. Please wait for approval.');
        } else if (existing.status === 'approved') {
          throw new Error('This email is already approved. Please login.');
        }
      }

      // 2. Create the auth account now so the student has credentials ready.
      //    The account is created with email_confirm = false (unconfirmed) until
      //    the admin approves. We handle login gating via the registration_requests
      //    status check in StudentLogin.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
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

      // 3. Add to members table linked to their auth user
      if (authData.user) {
        await supabase.from('members').insert([{
          user_id: authData.user.id,
          name: formData.fullName,
          email: formData.email,
          school: formData.school || null,
          grade: formData.grade || null,
          phone: formData.phone || null,
          role: 'Student',
          status: 'pending', // stays pending until admin approves
          bio: `Joined Feza Programming Club on ${new Date().toLocaleDateString()}`,
          joined_date: new Date().toISOString(),
          display_order: 999,
        }]);
      }

      // 4. Insert the registration request record for admin review
      const { error: requestError } = await supabase
        .from('registration_requests')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          school: formData.school,
          grade: formData.grade,
          phone: formData.phone,
          reason: formData.reason,
          status: 'pending',
        }]);

      if (requestError) throw requestError;

      // Sign out immediately — they shouldn't be logged in until approved
      await supabase.auth.signOut();

      setSubmitted(true);
      toast.success('Request submitted! You can log in once an admin approves your account.');

    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaPaperPlane className="text-green-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created and is pending admin approval.
            You will be able to log in once your request is reviewed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This typically takes 1–2 business days.
          </p>
          <Link
            to="/student/login"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCode className="text-white text-3xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Join the Club</h2>
            <p className="text-gray-600 mt-2">
              Create your account — you can log in once an admin approves your request.
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> All registrations require admin approval before you can access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    required className="input-field pl-10" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    required className="input-field pl-10" placeholder="student@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    required className="input-field pl-10" placeholder="At least 6 characters" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    required className="input-field pl-10" placeholder="Repeat password" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSchool className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" name="school" value={formData.school} onChange={handleChange}
                    className="input-field pl-10" placeholder="Your school name" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Class</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" name="grade" value={formData.grade} onChange={handleChange}
                    className="input-field pl-10" placeholder="e.g., Form 3" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    className="input-field pl-10" placeholder="+255 XXX XXX XXX" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join? *</label>
                <textarea name="reason" value={formData.reason} onChange={handleChange}
                  required rows="3" className="input-field"
                  placeholder="Tell us why you're interested in programming..." />
              </div>
            </div>

            <p className="text-sm text-gray-500">* Required fields</p>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3">
              {loading ? 'Submitting...' : 'Submit Registration Request'}
            </button>

            <div className="text-center">
              <Link to="/student/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationRequest;