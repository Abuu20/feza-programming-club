// src/pages/ActivityDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FaCalendar, FaUser, FaMapMarkerAlt, FaUsers, FaArrowLeft, FaImage, FaChevronLeft, FaChevronRight, FaSpinner, FaExpand, FaCompress } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const ActivityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    console.log('Activity ID from params:', id);
    
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      setError('No activity ID provided. Please go back and select an activity.');
      setLoading(false);
      return;
    }
    
    fetchActivityDetails();
  }, [id]);

  const fetchActivityDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (activityError) {
        throw new Error(`Failed to load activity: ${activityError.message}`);
      }

      if (!activityData) {
        const { data: allActivities } = await supabase
          .from('activities')
          .select('*');
        
        const found = allActivities?.find(a => String(a.id) === String(id));
        
        if (found) {
          setActivity(found);
          
          const { data: imagesData } = await supabase
            .from('activity_images')
            .select('*')
            .eq('activity_id', found.id)
            .order('display_order', { ascending: true });
          
          setImages(imagesData || []);
          setLoading(false);
          return;
        }
        
        throw new Error('Activity not found. It may have been deleted.');
      }

      setActivity(activityData);

      const { data: imagesData, error: imagesError } = await supabase
        .from('activity_images')
        .select('*')
        .eq('activity_id', activityData.id)
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.warn('Could not fetch images:', imagesError.message);
      }
      
      setImages(imagesData || []);

    } catch (error) {
      console.error('Error in fetchActivityDetails:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (index) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading activity details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Activity</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/activities')} 
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            ← Back to Activities
          </button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-gray-400 text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Activity Not Found</h2>
          <p className="text-gray-500 mb-6">The activity you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/activities')} 
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            ← Back to Activities
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section - Fixed image display */}
        <div className="relative bg-gray-900">
          {images.length > 0 ? (
            <div className="relative">
              {/* Main Image - Fixed sizing */}
              <div className="relative w-full bg-gray-900 flex items-center justify-center">
                <img
                  src={images[selectedImageIndex]?.image_url}
                  alt={activity.title}
                  className="w-full max-h-[500px] object-contain bg-gray-900"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('Image failed to load:', images[selectedImageIndex]?.image_url);
                    e.target.src = 'https://via.placeholder.com/1200x500?text=Image+Not+Available';
                  }}
                />
                
                {/* Image counter badge */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm z-10">
                  {selectedImageIndex + 1} / {images.length}
                </div>
                
                {/* Expand button */}
                <button
                  onClick={() => openImageModal(selectedImageIndex)}
                  className="absolute bottom-4 left-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition z-10"
                  title="View fullscreen"
                >
                  <FaExpand size={16} />
                </button>
              </div>
              
              {/* Thumbnail gallery - Fixed spacing and sizing */}
              {images.length > 1 && (
                <div className="bg-gray-800 py-3 px-4 overflow-x-auto">
                  <div className="flex gap-2 justify-center flex-wrap">
                    {images.map((image, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          idx === selectedImageIndex 
                            ? 'border-primary-500 scale-105 shadow-lg' 
                            : 'border-gray-600 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={image.image_url} 
                          alt={`Thumbnail ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80?text=Error';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-r from-primary-600 to-primary-800 flex items-center justify-center">
              <div className="text-center">
                <FaImage className="text-5xl mx-auto mb-3 opacity-50 text-white" />
                <p className="text-white text-lg">No images available for this event</p>
              </div>
            </div>
          )}
          
          {/* Back button */}
          <button
            onClick={() => navigate('/activities')}
            className="absolute top-4 left-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition z-10"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Content Section */}
        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{activity.title}</h1>
              {activity.status && activity.status !== 'upcoming' && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
                  ${activity.status === 'ongoing' ? 'bg-green-100 text-green-700' : 
                    activity.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    activity.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                    'bg-blue-100 text-blue-700'}`}
                >
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </span>
              )}
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaCalendar className="text-primary-600 text-xl flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Date</div>
                      <div>{formatDate(activity.date)}</div>
                    </div>
                  </div>
                  
                  {activity.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaMapMarkerAlt className="text-primary-600 text-xl flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Location</div>
                        <div>{activity.location}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaUser className="text-primary-600 text-xl flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Organizer</div>
                      <div>{activity.organizer || 'Club Organizer'}</div>
                    </div>
                  </div>
                  
                  {activity.max_participants && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaUsers className="text-primary-600 text-xl flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Capacity</div>
                        <div>Maximum {activity.max_participants} participants</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {activity.description && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{activity.description}</p>
                </div>
              </div>
            )}

            {/* Requirements */}
            {activity.requirements && (
              <div className="mb-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <h2 className="text-xl font-bold mb-3 text-yellow-800">📋 Requirements</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{activity.requirements}</p>
              </div>
            )}

            {/* Agenda */}
            {activity.agenda && (
              <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h2 className="text-xl font-bold mb-3 text-blue-800">📅 Agenda</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{activity.agenda}</p>
              </div>
            )}

            {/* Image Gallery Grid - Better layout */}
            {images.length > 1 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Event Gallery ({images.length} photos)</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, idx) => (
                    <div
                      key={idx}
                      className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                      onClick={() => openImageModal(idx)}
                    >
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={image.image_url}
                          alt={`Event ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                          <FaExpand className="text-white text-2xl opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Register Button */}
            <button
              onClick={() => toast.success('Registration feature coming soon!')}
              className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Register for Event
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal - Better display */}
      {isModalOpen && images[selectedImageIndex] && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition z-10"
            >
              ✕
            </button>
            
            {/* Image */}
            <div className="max-w-7xl max-h-screen flex items-center justify-center">
              <img
                src={images[selectedImageIndex].image_url}
                alt="Full size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                }}
              />
            </div>
            
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition"
                >
                  <FaChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition"
                >
                  <FaChevronRight size={24} />
                </button>
              </>
            )}
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>
            
            {/* Caption if available */}
            {images[selectedImageIndex].caption && (
              <div className="absolute bottom-20 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-2 mx-auto max-w-md rounded-lg">
                {images[selectedImageIndex].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ActivityDetailPage;