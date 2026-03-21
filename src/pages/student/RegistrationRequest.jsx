import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaUser, FaGraduationCap, FaSchool, FaPhone, FaCode, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

const RegistrationRequest = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    school: '',
    grade: '',
    phone: '',
    reason: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email already has a pending request
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

      // Submit registration request
      const { error } = await supabase
        .from('registration_requests')
        .insert([{
          full_name: formData.fullName,
          email: formData.email,
          school: formData.school,
          grade: formData.grade,
          phone: formData.phone,
          reason: formData.reason,
          status: 'pending'
        }]);

      if (error) throw error;

      setSubmitted(true);
      toast.success('Registration request submitted! You will receive an email when approved.');
      
      // Optionally send notification email to admin
      await notifyAdmin(formData);
      
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const notifyAdmin = async (data) => {
    // You can implement email notification here
    console.log('Notification to admin:', data);
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
            Thank you for your interest in joining Feza Programming Club. 
            Your registration request has been submitted and is pending approval.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will receive an email notification once your request is reviewed.
            This typically takes 1-2 business days.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Return to Home
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
              Submit your information for approval to become a member
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> All registrations require admin approval. 
              You will be notified via email once your account is activated.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSchool className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="Your school name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade/Class
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g., Form 3"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="+255 XXX XXX XXX"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join? *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="input-field"
                  placeholder="Tell us why you're interested in programming and what you hope to learn..."
                />
              </div>
            </div>

            <div className="text-sm text-gray-500">
              * Required fields
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? 'Submitting...' : 'Submit Registration Request'}
            </button>

            <div className="text-center">
              <Link 
                to="/student/login" 
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
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
