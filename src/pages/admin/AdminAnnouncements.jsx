import React, { useState, useEffect } from 'react';
import { announcementsService } from '../../services/announcements';
import { FaEdit, FaTrash, FaPlus, FaBullhorn } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import AnnouncementForm from '../../components/announcements/AnnouncementForm';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getAll();
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const { error } = await announcementsService.delete(id);
      if (!error) {
        toast.success('Announcement deleted');
        fetchAnnouncements();
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Announcements</h1>
          <p className="text-gray-600">Create and manage club announcements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FaPlus />
          New Announcement
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {announcements.map((announcement) => (
              <tr key={announcement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium">{announcement.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 line-clamp-2">
                    {announcement.content}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(announcement.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {announcements.length === 0 && (
          <div className="text-center py-12">
            <FaBullhorn className="text-5xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No announcements yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Create your first announcement
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default AdminAnnouncements;
