import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activitiesService } from '../services/activities';
import { registrationsService } from '../services/registrations';
import { FaCalendar, FaUser, FaArrowLeft, FaShare, FaDownload, FaCheckCircle } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import RegistrationModal from '../components/activities/RegistrationModal';
import toast from 'react-hot-toast';

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedActivities, setRelatedActivities] = useState([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const { data, error } = await activitiesService.getById(id);
      if (error) throw error;
      setActivity(data);
      
      // Fetch related activities
      const { data: allActivities } = await activitiesService.getAll();
      const related = allActivities
        ?.filter(a => a.id !== id)
        .slice(0, 3);
      setRelatedActivities(related || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load activity');
      navigate('/activities');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchRegistrationsCount = useCallback(async () => {
    const { data } = await registrationsService.getActivityRegistrations(id);
    setRegistrationsCount(data?.length || 0);
  }, [id]);

  useEffect(() => {
    fetchActivity();
    fetchRegistrationsCount();
  }, [fetchActivity, fetchRegistrationsCount]);

  useEffect(() => {
    // Check if current user is registered
    const checkRegistration = async () => {
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail && activity) {
        const { data } = await registrationsService.checkRegistration(id, savedEmail);
        setAlreadyRegistered(!!data);
      }
    };
    checkRegistration();
  }, [activity, id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleDownloadImage = () => {
    if (activity?.image_url) {
      const link = document.createElement('a');
      link.href = activity.image_url;
      link.download = `${activity.title}-image.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRegisterSuccess = (email) => {
    fetchRegistrationsCount();
    setAlreadyRegistered(true);
    if (email) {
      localStorage.setItem('userEmail', email);
    }
  };

  if (loading) return <Loader />;
  if (!activity) return <div>Activity not found</div>;

  return (
    <div className="container-custom py-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/activities')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition"
      >
        <FaArrowLeft />
        <span>Back to Activities</span>
      </button>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image */}
        {activity.image_url ? (
          <div className="relative h-96">
            <img
              src={activity.image_url}
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShare}
                className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                title="Share"
              >
                <FaShare className="text-primary-600" />
              </button>
              {activity.image_url && (
                <button
                  onClick={handleDownloadImage}
                  className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
                  title="Download Image"
                >
                  <FaDownload className="text-primary-600" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
            <FaCalendar className="text-8xl text-white opacity-50" />
          </div>
        )}

        {/* Details */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-4xl font-bold">{activity.title}</h1>
            <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
              {registrationsCount} Registered
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 mb-6 text-gray-600">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-primary-600" />
              <span>{formatDate(activity.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUser className="text-primary-600" />
              <span>Organized by: {activity.organizer || 'Club Organizer'}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mb-4">About this Activity</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {activity.description}
            </p>
          </div>

          {/* Registration Status */}
          {alreadyRegistered ? (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <div>
                <h3 className="font-semibold text-green-700">You're registered!</h3>
                <p className="text-sm text-green-600">
                  Check your email for confirmation and event details.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowRegistration(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Register for this Activity
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Limited spots available. Register now to secure your place!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Activities */}
      {relatedActivities.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More Activities You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedActivities.map((related) => (
              <div
                key={related.id}
                onClick={() => navigate(`/activities/${related.id}`)}
                className="card cursor-pointer hover:shadow-lg transition"
              >
                {related.image_url ? (
                  <img
                    src={related.image_url}
                    alt={related.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-primary-100 flex items-center justify-center">
                    <FaCalendar className="text-4xl text-primary-400" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{related.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {related.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(related.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationModal
          activity={activity}
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
};

export default ActivityDetailPage;
