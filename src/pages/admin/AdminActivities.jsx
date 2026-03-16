import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../hooks/useActivities';
import { FaEdit, FaTrash, FaPlus, FaUsers } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import ActivityForm from '../../components/activities/ActivityForm';
import { formatDate } from '../../utils/helpers';

const AdminActivities = () => {
  const { activities, loading, deleteActivity } = useActivities();
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const navigate = useNavigate();

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      await deleteActivity(id);
    }
  };

  const handleViewRegistrations = (activityId) => {
    navigate(`/admin/activities/${activityId}/registrations`);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingActivity(null);
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
                Image
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
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td className="px-6 py-4">
                  {activity.image_url ? (
                    <img
                      src={activity.image_url}
                      alt={activity.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                  )}
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
                    onClick={() => handleDelete(activity.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
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
        />
      )}
    </div>
  );
};

export default AdminActivities;
