// src/pages/admin/AdminActivities.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { FaEdit, FaTrash, FaPlus, FaUsers, FaImage } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import ActivityForm from '../../components/activities/ActivityForm';
import { formatDate } from '../../utils/helpers';

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          activity_images (
            id,
            image_url,
            is_primary
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        // First delete associated images from storage
        const { data: images } = await supabase
          .from('activity_images')
          .select('image_url')
          .eq('activity_id', id);

        if (images && images.length > 0) {
          // Extract file paths from URLs
          const filePaths = images.map(img => {
            const urlParts = img.image_url.split('/');
            return urlParts.slice(urlParts.indexOf('activity-images')).join('/');
          });
          
          // Delete from storage
          await supabase.storage
            .from('activities')
            .remove(filePaths);
        }

        // Delete activity (cascade will delete image records)
        const { error } = await supabase
          .from('activities')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        await fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity');
      }
    }
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingActivity(null);
    fetchActivities(); // Refresh list
  };

  const handleViewRegistrations = (activityId) => {
    navigate(`/admin/activities/${activityId}/registrations`);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Activities</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          Add Activity
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Images
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organizer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registrations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => {
              const primaryImage = activity.activity_images?.find(img => img.is_primary) || activity.activity_images?.[0];
              
              return (
                <tr key={activity.id}>
                  <td className="px-6 py-4">
                    <div className="relative">
                      {primaryImage ? (
                        <img
                          src={primaryImage.image_url}
                          alt={activity.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <FaImage className="text-gray-400" />
                        </div>
                      )}
                      {activity.activity_images && activity.activity_images.length > 1 && (
                        <div className="absolute -bottom-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {activity.activity_images.length}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{activity.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(activity.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {activity.organizer || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewRegistrations(activity.id)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <FaUsers />
                      <span>View</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No activities found</p>
          </div>
        )}
      </div>

      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onClose={handleCloseForm}
          onSuccess={fetchActivities}
        />
      )}
    </div>
  );
};

export default AdminActivities;