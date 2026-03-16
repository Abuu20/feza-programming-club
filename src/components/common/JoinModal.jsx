import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaSpinner, FaUserPlus } from 'react-icons/fa';
import { HiAcademicCap } from 'react-icons/hi';
import { membershipService } from '../../services/membership';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const JoinModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    school: '',
    grade: '',
    age: '',
    experience_level: 'beginner',
    reason: ''
  });

  // Check if email already applied
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && formData.email.includes('@')) {
        setChecking(true);
        const { data } = await membershipService.checkExistingApplication(formData.email);
        setExistingApplication(data);
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (existingApplication) {
      toast.error('You have already submitted an application. We will contact you soon!');
      return;
    }

    setLoading(true);

    try {
      const applicationData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        status: 'pending'
      };

      const { error } = await membershipService.apply(applicationData);
      
      if (error) throw error;
      
      toast.success('Application submitted successfully! We will contact you soon.');
      
      if (onSuccess) {
        onSuccess(formData.email);
      }
      
      onClose();
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-full">
              <HiAcademicCap className="text-primary-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-primary-500">Join the Club</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-primary-50 rounded-lg border-l-4 border-primary-500">
            <p className="text-primary-700 flex items-start gap-2">
              <span className="text-primary-500 font-bold">📋</span>
              <span>Fill out this form to become a member of Feza Programming Club. We'll review your application and get back to you soon!</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`input-field pr-10 ${
                      existingApplication ? 'border-yellow-500' : 
                      formData.email && !checking && formData.email.includes('@') ? 'border-green-500' : ''
                    }`}
                    placeholder="your@email.com"
                  />
                  {checking && (
                    <FaSpinner className="absolute right-3 top-3 text-gray-400 animate-spin" />
                  )}
                  {!checking && existingApplication && (
                    <div className="absolute right-3 top-3 text-yellow-500" title="Already applied">
                      <FaCheck />
                    </div>
                  )}
                </div>
                {existingApplication && (
                  <p className="text-xs text-yellow-600 mt-1">
                    You've already applied. We'll contact you soon!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School/Institution
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your school name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade/Class
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Form 3, Year 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="5"
                  max="100"
                  className="input-field"
                  placeholder="Your age"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programming Experience *
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="none">No experience - I'm a beginner</option>
                <option value="beginner">Beginner - I know some basics</option>
                <option value="intermediate">Intermediate - I can write simple programs</option>
                <option value="advanced">Advanced - I'm comfortable with coding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Why do you want to join? *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows="4"
                className="input-field"
                placeholder="Tell us why you're interested in programming and what you hope to learn..."
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary-500">📋</span>
                What happens next?
              </h3>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>We'll review your application within 2-3 days</li>
                <li>You'll receive an email with next steps</li>
                <li>Attend a welcome orientation session</li>
                <li>Start coding with the club!</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || existingApplication}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinModal;
