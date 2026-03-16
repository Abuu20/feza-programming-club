import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaSpinner } from 'react-icons/fa';
import { registrationsService } from '../../services/registrations';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const RegistrationModal = ({ activity, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    school: '',
    grade: '',
    notes: ''
  });

  // Check if already registered when email changes
  useEffect(() => {
    const checkRegistration = async () => {
      if (formData.email && activity?.id) {
        setChecking(true);
        const { data } = await registrationsService.checkRegistration(
          activity.id,
          formData.email
        );
        setAlreadyRegistered(!!data);
        setChecking(false);
      }
    };
    
    const timeoutId = setTimeout(checkRegistration, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email, activity?.id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (alreadyRegistered) {
      toast.error('This email is already registered for this activity');
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        activity_id: activity.id,
        user_id: user?.id || null,
        ...formData,
        status: 'pending'
      };

      const { error } = await registrationsService.create(registrationData);
      
      if (error) throw error;
      
      toast.success('Successfully registered for the activity!');
      
      // Call onSuccess with the email
      if (onSuccess) {
        onSuccess(formData.email);
      }
      
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Register for Activity</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 p-3 bg-primary-50 rounded-lg">
            <h3 className="font-semibold text-primary-700">{activity?.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(activity?.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`input-field pr-10 ${
                    alreadyRegistered ? 'border-red-500' : 
                    formData.email && !checking ? 'border-green-500' : ''
                  }`}
                  placeholder="your@email.com"
                />
                {checking && (
                  <FaSpinner className="absolute right-3 top-3 text-gray-400 animate-spin" />
                )}
                {!checking && formData.email && alreadyRegistered && (
                  <div className="absolute right-3 top-3 text-red-500">
                    <FaTimes />
                  </div>
                )}
                {!checking && formData.email && !alreadyRegistered && formData.email.includes('@') && (
                  <div className="absolute right-3 top-3 text-green-500">
                    <FaCheck />
                  </div>
                )}
              </div>
              {alreadyRegistered && (
                <p className="text-xs text-red-500 mt-1">
                  This email is already registered for this activity
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Your school"
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
                  placeholder="e.g., Form 3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="input-field"
                placeholder="Any questions or special requirements?"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || alreadyRegistered || !formData.email}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;
