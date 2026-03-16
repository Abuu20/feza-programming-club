import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { FaCalendar, FaUser } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';

const ActivitiesPage = () => {
  const { activities, loading } = useActivities();
  const navigate = useNavigate();

  const handleLearnMore = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Club Activities</h1>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Join us in our exciting events and activities. Learn, code, and have fun!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="card group cursor-pointer" onClick={() => handleLearnMore(activity.id)}>
              {activity.image_url ? (
                <img 
                  src={activity.image_url} 
                  alt={activity.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center">
                  <FaCalendar className="text-6xl text-white opacity-50" />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{activity.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{activity.description}</p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-primary-600" />
                    <span>{formatDate(activity.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaUser className="text-primary-600" />
                    <span>{activity.organizer || 'Club Organizer'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLearnMore(activity.id);
                  }}
                  className="mt-4 text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 group/btn"
                >
                  Learn more 
                  <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-gray-500 text-lg">No activities scheduled yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
