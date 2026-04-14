// src/pages/ActivitiesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FaCalendar, FaUser, FaMapMarkerAlt, FaImage, FaUsers } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: true });

      if (activitiesError) throw activitiesError;

      console.log('Fetched activities:', activitiesData);

      if (activitiesData && activitiesData.length > 0) {
        // Fetch images for all activities
        const activityIds = activitiesData.map(a => a.id);
        
        const { data: imagesData, error: imagesError } = await supabase
          .from('activity_images')
          .select('*')
          .in('activity_id', activityIds)
          .order('display_order', { ascending: true });

        if (imagesError) {
          console.warn('Could not fetch images:', imagesError);
        }

        // Group images by activity_id
        const imagesByActivity = {};
        imagesData?.forEach(image => {
          if (!imagesByActivity[image.activity_id]) {
            imagesByActivity[image.activity_id] = [];
          }
          imagesByActivity[image.activity_id].push(image);
        });

        // Combine activities with their images
        const processedActivities = activitiesData.map(activity => ({
          ...activity,
          images: imagesByActivity[activity.id] || [],
          primaryImage: imagesByActivity[activity.id]?.find(img => img.is_primary) || imagesByActivity[activity.id]?.[0]
        }));

        setActivities(processedActivities);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLearnMore = (activityId) => {
    console.log('Navigating to activity:', activityId);
    // Ensure we're passing the ID as a string
    navigate(`/activities/${String(activityId)}`);
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Error Loading Activities</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchActivities} 
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <h1 className="text-4xl font-bold text-center mb-4">Club Activities</h1>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Join us in our exciting events and activities. Learn, code, and have fun!
      </p>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-500 text-lg">No activities scheduled yet. Check back soon!</p>
          <p className="text-gray-400 text-sm mt-2">New activities will appear here once announced.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity) => {
            const primaryImage = activity.primaryImage;
            const imageCount = activity.images?.length || 0;
            
            return (
              <div 
                key={activity.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => handleLearnMore(activity.id)}
              >
                {/* Image Section */}
                <div className="relative h-56 bg-gray-200 overflow-hidden">
                  {primaryImage && primaryImage.image_url ? (
                    <img 
                      src={primaryImage.image_url} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', primaryImage.image_url);
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-400 to-primary-600"><svg class="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20"><path d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 10-2 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"/></svg></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-400 to-primary-600">
                      <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Image count badge */}
                  {imageCount > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <FaImage size={10} />
                      {imageCount}
                    </div>
                  )}
                  
                  {/* Status badge */}
                  {activity.status && activity.status !== 'upcoming' && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold
                      ${activity.status === 'ongoing' ? 'bg-green-500 text-white' : 
                        activity.status === 'completed' ? 'bg-gray-500 text-white' :
                        activity.status === 'cancelled' ? 'bg-red-500 text-white' : 
                        'bg-blue-500 text-white'}`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </div>
                  )}
                </div>
                
                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-1">{activity.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 flex-1">{activity.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-primary-600 flex-shrink-0" />
                      <span>{formatDate(activity.date)}</span>
                    </div>
                    
                    {activity.location && (
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-primary-600 flex-shrink-0" />
                        <span className="line-clamp-1">{activity.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <FaUser className="text-primary-600 flex-shrink-0" />
                      <span>{activity.organizer || 'Club Organizer'}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLearnMore(activity.id);
                    }}
                    className="mt-4 w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 group"
                  >
                    Learn More
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;