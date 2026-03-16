import React, { useState, useEffect } from 'react';
import { announcementsService } from '../services/announcements';
import { FaBullhorn, FaCalendar, FaUser, FaArrowLeft } from 'react-icons/fa';
import { formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import { useNavigate } from 'react-router-dom';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await announcementsService.getAll();
    setAnnouncements(data || []);
    setLoading(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="container-custom py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <FaBullhorn className="text-primary-600" />
          Club Announcements
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Stay updated with the latest news, events, and opportunities from Feza Programming Club
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Announcements List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
            <div className="p-4 bg-primary-600 text-white">
              <h2 className="font-semibold">All Announcements</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                      selectedAnnouncement?.id === announcement.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <h3 className="font-semibold mb-1">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No announcements yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Announcement Detail */}
        <div className="lg:col-span-2">
          {selectedAnnouncement ? (
            <div className="bg-white rounded-lg shadow-md p-8">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition"
              >
                <FaArrowLeft />
                <span>Back to list</span>
              </button>

              <h1 className="text-3xl font-bold mb-4">{selectedAnnouncement.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
                <span className="flex items-center gap-1">
                  <FaCalendar />
                  {formatDate(selectedAnnouncement.created_at)}
                </span>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaBullhorn className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select an Announcement
              </h3>
              <p className="text-gray-500">
                Choose an announcement from the list to read more
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
